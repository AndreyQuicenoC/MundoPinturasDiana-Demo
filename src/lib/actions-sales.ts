'use server'
import { run, type Res } from './action-kit'

const id = (v: any) => (v && typeof v === 'object' ? v.id : v)
const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type PosSaleInput = {
  branch: string
  client?: string
  notes?: string
  lines: { product: string; quantity: number; discountPct: number; color?: string; size?: string }[]
  payments: { method: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'; bankAccount?: string; amount: number }[]
  delivery?: { name: string; phone: string; address: string; fee: number } | null
  invoice?: { buyerName: string; buyerDocument: string; buyerEmail: string } | null
}

/** Registra una venta del punto de venta. El servidor recalcula precios, descuentos y totales (hook de Sales). */
export async function createPosSale(input: PosSaleInput): Promise<Res> {
  return run('pos', async ({ payload, acc }) => {
    if (!input?.branch) throw new Error('Elige la sede.')
    if (!Array.isArray(input.lines) || !input.lines.length) throw new Error('Agrega al menos un producto.')
    const stockErr: string[] = []
    for (const l of input.lines) {
      const inv = await payload.find({ collection: 'inventory', where: { and: [{ product: { equals: l.product } }, { branch: { equals: input.branch } }] }, limit: 1, depth: 1, ...acc })
      const have = inv.docs[0]?.quantity ?? 0
      if (have < Number(l.quantity)) stockErr.push(`${(inv.docs[0]?.product as any)?.name ?? 'Producto'}: disponible ${have}`)
    }
    if (stockErr.length) throw new Error(`Stock insuficiente — ${stockErr.join('; ')}`)

    let delivery: any
    if (input.delivery) {
      const d = { name: str(input.delivery.name), phone: str(input.delivery.phone, 30), address: str(input.delivery.address, 250), fee: Math.max(0, Math.round(Number(input.delivery.fee) || 0)) }
      if (!d.name || !d.phone || !d.address) throw new Error('El domicilio requiere nombre, teléfono y dirección.')
      delivery = { enabled: true, ...d }
    }
    let electronicInvoice: any
    if (input.invoice) {
      if (!input.client) throw new Error('La factura electrónica requiere seleccionar un cliente.')
      const b = { buyerName: str(input.invoice.buyerName), buyerDocument: str(input.invoice.buyerDocument, 40), buyerEmail: str(input.invoice.buyerEmail, 120) }
      if (!b.buyerName || !b.buyerDocument) throw new Error('Indica nombre y documento del comprador para la factura electrónica.')
      if (b.buyerEmail && !EMAIL.test(b.buyerEmail)) throw new Error('El correo del comprador no es válido.')
      electronicInvoice = { requested: true, ...b }
    }
    const sale = await payload.create({
      collection: 'sales', ...acc, depth: 0,
      data: {
        branch: input.branch,
        client: input.client || undefined,
        channel: delivery ? 'domicilio' : 'mostrador',
        lines: input.lines.map((l) => ({ product: l.product, quantity: Number(l.quantity), discountPct: Number(l.discountPct) || 0, color: str(l.color, 60) || undefined, size: str(l.size, 60) || undefined })),
        payments: input.payments.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, bankAccount: p.method === 'transferencia' ? p.bankAccount || undefined : undefined, amount: Number(p.amount) })),
        notes: str(input.notes, 500) || undefined,
        delivery, electronicInvoice,
      } as any,
    })
    const extra = [delivery && 'domicilio pendiente creado', electronicInvoice && 'factura electrónica solicitada'].filter(Boolean).join(' · ')
    return { ok: true, message: `Venta #${sale.number} registrada${extra ? ` (${extra})` : ''}.`, data: { id: sale.id } }
  })
}

export async function voidSaleAction(saleId: string, reason: string): Promise<Res> {
  return run('ventas', async ({ role, payload, acc }) => {
    if (role !== 'admin' && role !== 'gerente') throw new Error('Solo gerente o administrador pueden anular.')
    if (!str(reason)) throw new Error('Indica el motivo de la anulación.')
    await payload.update({ collection: 'sales', id: saleId, ...acc, data: { status: 'anulada', voidReason: str(reason, 250) } })
    return { ok: true, message: 'Venta anulada y stock restituido.' }
  })
}

export async function returnSaleAction(saleId: string, product: string, quantity: number, reason: string): Promise<Res> {
  return run('ventas', async ({ role, payload, acc }) => {
    if (role !== 'admin' && role !== 'gerente') throw new Error('Solo gerente o administrador pueden registrar devoluciones.')
    const q = Number(quantity)
    if (!Number.isInteger(q) || q < 1) throw new Error('Cantidad inválida.')
    const sale = await payload.findByID({ collection: 'sales', id: saleId, depth: 0, ...acc })
    const returns = [
      ...(sale.returns ?? []).map((r: any) => ({ product: id(r.product), quantity: r.quantity, reason: r.reason, at: r.at, value: r.value, by: r.by })),
      { product, quantity: q, reason: str(reason, 250) || undefined },
    ]
    await payload.update({ collection: 'sales', id: saleId, ...acc, data: { returns } as any })
    return { ok: true, message: 'Devolución registrada.' }
  })
}

export async function updateDomicilio(domId: string, patch: { status?: string; courierRef?: string; courier?: string; courierFee?: number | null; notes?: string }): Promise<Res> {
  return run('domicilios', async ({ payload, acc }) => {
    const data: Record<string, unknown> = {}
    if (patch.status) {
      if (!['pendiente', 'en_ruta', 'entregado', 'cancelado'].includes(patch.status)) throw new Error('Estado no válido.')
      data.status = patch.status
    }
    if (patch.courierRef !== undefined) {
      if (patch.courierRef) {
        const c = await payload.findByID({ collection: 'couriers', id: patch.courierRef, depth: 0, ...acc })
        data.courierRef = c.id
        data.courier = c.name
      } else {
        data.courierRef = null
        data.courier = str(patch.courier, 120) || null
      }
    } else if (patch.courier !== undefined) data.courier = str(patch.courier, 120) || null
    if (patch.courierFee !== undefined) {
      const f = patch.courierFee === null || (patch.courierFee as any) === '' ? null : Number(patch.courierFee)
      if (f !== null && (!Number.isFinite(f) || f < 0)) throw new Error('El pago al domiciliario no es válido.')
      data.courierFee = f
    }
    if (patch.notes !== undefined) data.notes = str(patch.notes, 500)
    await payload.update({ collection: 'domicilios', id: domId, ...acc, data: data as any })
    return { ok: true, message: patch.status ? 'Estado del domicilio actualizado.' : 'Domicilio actualizado.' }
  })
}

export async function updateInvoiceData(invId: string, v: { buyerName: string; buyerDocument: string; buyerEmail: string; externalNumber: string; observations: string }): Promise<Res> {
  return run('facturacion', async ({ payload, acc }) => {
    const email = str(v.buyerEmail, 120)
    if (email && !EMAIL.test(email)) throw new Error('El correo del comprador no es válido.')
    await payload.update({
      collection: 'electronic-invoices', id: invId, ...acc,
      data: { buyerName: str(v.buyerName), buyerDocument: str(v.buyerDocument, 40), buyerEmail: email || null, externalNumber: str(v.externalNumber, 120), observations: str(v.observations, 800) } as any,
    })
    return { ok: true, message: 'Datos de la factura guardados.' }
  })
}

export async function setInvoiceStatus(invId: string, status: string, note?: string): Promise<Res> {
  return run('facturacion', async ({ payload, acc }) => {
    if (!['en_proceso', 'generada', 'rechazada'].includes(status)) throw new Error('Estado no válido.')
    const cur = await payload.findByID({ collection: 'electronic-invoices', id: invId, depth: 0, ...acc })
    const data: Record<string, unknown> = { status }
    if (status === 'rechazada' && str(note)) data.observations = [cur.observations, `Por corregir: ${str(note, 300)}`].filter(Boolean).join('\n')
    await payload.update({ collection: 'electronic-invoices', id: invId, ...acc, data: data as any })
    return { ok: true, message: status === 'generada' ? 'Factura marcada como generada.' : status === 'rechazada' ? 'Marcada como «Por corregir».' : 'Factura en proceso.' }
  })
}
