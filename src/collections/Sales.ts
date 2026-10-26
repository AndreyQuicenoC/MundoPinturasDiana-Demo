import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { actorName, fieldNever, isStaff, never, ownOrManager, roleOf } from '@/lib/access'

const id = (v: any) => (v && typeof v === 'object' ? v.id : v)
const audit = auditHooks('Ventas', (d) => `Venta ${d.number} · $${d.total} · ${d.status}`)

export const Sales: CollectionConfig = {
  slug: 'sales',
  labels: { singular: 'Venta', plural: 'Ventas' },
  admin: { useAsTitle: 'number', group: 'Ventas', defaultColumns: ['number', 'branch', 'total', 'status', 'createdAt'] },
  access: { read: ownOrManager('seller'), create: isStaff, update: isStaff, delete: never },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const role = roleOf(req.user as any)
        if (operation === 'create') {
          const lines = Array.isArray(data.lines) ? data.lines : []
          if (!lines.length) throw new APIError('La venta necesita al menos un producto.', 400)
          let subtotal = 0
          let discountTotal = 0
          let artistic = 0
          const out = []
          for (const l of lines) {
            const qty = Number(l.quantity)
            if (!Number.isInteger(qty) || qty <= 0) throw new APIError('Cantidad inválida en una línea.', 400)
            const p = await req.payload.findByID({ collection: 'products', id: id(l.product), depth: 0, overrideAccess: true, req })
            if (p.status === 'inactivo') throw new APIError(`"${p.name}" está inactivo.`, 400)
            let affects = true
            const stId = id(p.saleType)
            if (stId) {
              const st = await req.payload.findByID({ collection: 'product-types', id: stId, depth: 0, overrideAccess: true, req }).catch(() => null)
              if (st && st.affectsDailySales === false) affects = false
            }
            const pct = Math.min(100, Math.max(0, Number(l.discountPct ?? 0)))
            if (pct > 0 && role === 'empleado' && pct > 10) throw new APIError('Un empleado puede aplicar hasta 10% de descuento.', 403)
            const gross = p.salePrice * qty
            const disc = Math.round((gross * pct) / 100)
            subtotal += gross
            discountTotal += disc
            out.push({ product: p.id, name: p.name, quantity: qty, unitPrice: p.salePrice, discountPct: pct, lineTotal: gross - disc, affectsSales: affects, color: l.color, size: l.size })
            if (!affects) artistic += gross - disc
          }
          const total = subtotal - discountTotal
          const payments = Array.isArray(data.payments) ? data.payments : []
          const paid = payments.reduce((a: number, p: any) => a + Number(p.amount || 0), 0)
          if (paid !== total) throw new APIError(`Los pagos ($${paid}) no cuadran con el total ($${total}).`, 400)
          const last = await req.payload.find({ collection: 'sales', sort: '-number', limit: 1, depth: 0, overrideAccess: true, req })
          data.number = (last.docs[0]?.number ?? 0) + 1
          data.lines = out
          data.subtotal = subtotal
          data.discountTotal = discountTotal
          data.total = total
          data.artisticTotal = artistic
          data.reportableTotal = total - artistic
          const dl = data.delivery
          if (dl?.enabled) {
            if (!String(dl.name ?? '').trim() || !String(dl.address ?? '').trim() || !String(dl.phone ?? '').trim()) throw new APIError('El domicilio requiere nombre, teléfono y dirección.', 400)
            data.channel = 'domicilio'
          } else data.delivery = { enabled: false }
          const ei = data.electronicInvoice ?? {}
          data.electronicInvoice = { requested: !!ei.requested, ...(ei.requested ? { buyerName: ei.buyerName, buyerDocument: ei.buyerDocument, buyerEmail: ei.buyerEmail || undefined } : {}) }
          if (data.electronicInvoice.requested && !id(data.client)) throw new APIError('La factura electrónica requiere seleccionar un cliente.', 400)
          data.status = 'emitida'
          data.seller = req.user?.collection === 'users' ? req.user.id : undefined
          data.sellerName = actorName(req)
          return data
        }
        // update: invoice edit / void / partial return
        if (data.status === 'anulada' && originalDoc.status !== 'anulada') {
          if (role !== 'admin' && role !== 'gerente') throw new APIError('Solo gerente o administrador pueden anular.', 403)
          if (!data.voidReason?.trim()) throw new APIError('Indica el motivo de la anulación.', 400)
        }
        if (originalDoc.status === 'anulada') throw new APIError('Una venta anulada no se puede modificar.', 400)
        const prevReturns = originalDoc.returns?.length ?? 0
        if (Array.isArray(data.returns) && data.returns.length > prevReturns) {
          const sold: Record<string, number> = {}
          for (const l of originalDoc.lines) sold[String(id(l.product))] = (sold[String(id(l.product))] ?? 0) + l.quantity
          const returned: Record<string, number> = {}
          for (const r of data.returns) {
            const k = String(id(r.product))
            returned[k] = (returned[k] ?? 0) + Number(r.quantity)
            if (returned[k] > (sold[k] ?? 0)) throw new APIError('No se puede devolver más de lo vendido.', 400)
          }
          const unit: Record<string, number> = {}
          for (const l of originalDoc.lines) unit[String(id(l.product))] = (l.lineTotal ?? 0) / (l.quantity || 1)
          data.returns = data.returns.map((r: any, i: number) => (i < prevReturns ? r : {
            ...r, at: new Date().toISOString(), by: actorName(req), value: Math.round((unit[String(id(r.product))] ?? 0) * Number(r.quantity)),
          }))
          if (data.status !== 'anulada') data.status = 'devolucion_parcial'
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const mk = (product: any, quantity: number, type: 'venta' | 'anulacion' | 'devolucion', reason: string) =>
          req.payload.create({
            collection: 'inventory-movements',
            overrideAccess: true,
            req,
            data: { product: id(product), branch: id(doc.branch), type, quantity, reference: `Venta ${doc.number}`, reason },
          })
        if (operation === 'create') {
          for (const l of doc.lines) await mk(l.product, l.quantity, 'venta', 'Venta en mostrador')
          if (doc.delivery?.enabled) {
            await req.payload.create({
              collection: 'domicilios', overrideAccess: true, req,
              data: {
                branch: id(doc.branch), sale: doc.id, saleNumber: doc.number, customerName: doc.delivery.name, phone: doc.delivery.phone,
                address: doc.delivery.address, deliveryFee: doc.delivery.fee ?? 0, status: 'pendiente', requestedAt: doc.createdAt,
              },
              context: { skipAudit: true },
            })
          }
          if (doc.electronicInvoice?.requested) {
            const cl = id(doc.client) ? await req.payload.findByID({ collection: 'clients', id: id(doc.client), depth: 0, overrideAccess: true, req }).catch(() => null) : null
            await req.payload.create({
              collection: 'electronic-invoices', overrideAccess: true, req,
              data: {
                sale: doc.id, saleNumber: doc.number, branch: id(doc.branch), total: doc.total, status: 'solicitada', requestedAt: doc.createdAt,
                buyerName: doc.electronicInvoice.buyerName || (cl as any)?.name, buyerDocument: doc.electronicInvoice.buyerDocument || (cl as any)?.document, buyerEmail: doc.electronicInvoice.buyerEmail || (cl as any)?.email,
              },
              context: { skipAudit: true },
            })
          }
        } else {
          if (doc.status === 'anulada' && previousDoc.status !== 'anulada') {
            const already: Record<string, number> = {}
            for (const r of previousDoc.returns ?? []) already[String(id(r.product))] = (already[String(id(r.product))] ?? 0) + r.quantity
            for (const l of doc.lines) {
              const q = l.quantity - (already[String(id(l.product))] ?? 0)
              if (q > 0) await mk(l.product, q, 'anulacion', `Anulación: ${doc.voidReason}`)
            }
          } else if ((doc.returns?.length ?? 0) > (previousDoc.returns?.length ?? 0)) {
            for (const r of doc.returns.slice(previousDoc.returns?.length ?? 0)) await mk(r.product, r.quantity, 'devolucion', r.reason ?? 'Devolución parcial')
          }
        }
        await audit.afterChange[0]({ doc, previousDoc, operation, req } as any)
        return doc
      },
    ],
  },
  fields: [
    { name: 'number', type: 'number', unique: true, index: true, access: { update: fieldNever }, admin: { readOnly: true } },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true, access: { update: fieldNever } },
    { name: 'client', type: 'relationship', relationTo: 'clients' },
    { name: 'seller', type: 'relationship', relationTo: 'users', index: true, access: { update: fieldNever } },
    { name: 'sellerName', type: 'text', access: { update: fieldNever } },
    { name: 'channel', type: 'select', defaultValue: 'mostrador', options: ['mostrador', 'domicilio', 'web'], access: { update: fieldNever } },
    {
      name: 'lines',
      type: 'array',
      access: { update: fieldNever },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'name', type: 'text' },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unitPrice', type: 'number' },
        { name: 'discountPct', type: 'number', defaultValue: 0, min: 0, max: 100 },
        { name: 'lineTotal', type: 'number' },
        { name: 'affectsSales', type: 'checkbox', defaultValue: true },
        { name: 'color', type: 'text' },
        { name: 'size', type: 'text' },
      ],
    },
    { name: 'subtotal', type: 'number', access: { update: fieldNever } },
    { name: 'discountTotal', type: 'number', access: { update: fieldNever } },
    { name: 'total', type: 'number', access: { update: fieldNever } },
    {
      name: 'payments',
      type: 'array',
      access: { update: fieldNever },
      fields: [
        { name: 'method', type: 'select', required: true, options: ['efectivo', 'transferencia', 'tarjeta', 'credito'] },
        { name: 'bankAccount', type: 'relationship', relationTo: 'bank-accounts' },
        { name: 'amount', type: 'number', required: true, min: 0 },
      ],
    },
    { name: 'status', type: 'select', defaultValue: 'emitida', options: ['emitida', 'devolucion_parcial', 'anulada'], index: true },
    { name: 'voidReason', type: 'text' },
    {
      name: 'returns',
      type: 'array',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'reason', type: 'text' },
        { name: 'at', type: 'date', admin: { readOnly: true } },
        { name: 'value', type: 'number', admin: { readOnly: true, description: 'Valor devuelto (precio con descuento × cantidad).' } },
        { name: 'by', type: 'text', admin: { readOnly: true } },
      ],
    },
    { name: 'notes', type: 'textarea' },
    { name: 'artisticTotal', type: 'number', defaultValue: 0, access: { update: fieldNever }, admin: { readOnly: true, description: 'Parte de la factura que no suma a las ventas (productos artísticos).' } },
    { name: 'reportableTotal', type: 'number', index: true, access: { update: fieldNever }, admin: { readOnly: true, description: 'Total que cuenta para estadísticas y totales de ventas.' } },
    {
      name: 'delivery', type: 'group', access: { update: fieldNever },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'address', type: 'text' },
        { name: 'fee', type: 'number', min: 0 },
      ],
    },
    { name: 'electronicInvoice', type: 'group', access: { update: fieldNever }, fields: [{ name: 'requested', type: 'checkbox', defaultValue: false }, { name: 'buyerName', type: 'text' }, { name: 'buyerDocument', type: 'text' }, { name: 'buyerEmail', type: 'email' }] },
  ],
}
