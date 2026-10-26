import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { bust } from '@/lib/revalidate'
import { actorName, hasRole, isManager, isStaff, never } from '@/lib/access'

export const MOVEMENT_SIGN: Record<string, 1 | -1> = {
  entrada_compra: 1,
  anulacion: 1,
  devolucion: 1,
  ajuste_positivo: 1,
  traslado_entrada: 1,
  venta: -1,
  ajuste_negativo: -1,
  traslado_salida: -1,
  merma: -1,
}

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  admin: { group: 'Inventario', defaultColumns: ['product', 'branch', 'quantity'] },
  access: { read: isStaff, create: never, update: never, delete: hasRole('admin') },
  hooks: { afterChange: [({ doc }) => (bust('products'), doc)] },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'quantity', type: 'number', required: true, defaultValue: 0 },
  ],
}

const applyMovement: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw new APIError('Los movimientos de inventario no se editan.', 400)
  const sign = MOVEMENT_SIGN[data.type]
  if (!sign) throw new APIError('Tipo de movimiento inválido.', 400)
  const qty = Number(data.quantity)
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) throw new APIError('La cantidad debe ser un entero mayor a 0.', 400)

  const productId = typeof data.product === 'object' ? data.product.id : data.product
  const branchId = typeof data.branch === 'object' ? data.branch.id : data.branch
  const existing = await req.payload.find({
    collection: 'inventory',
    where: { and: [{ product: { equals: productId } }, { branch: { equals: branchId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const row = existing.docs[0]
  const next = (row?.quantity ?? 0) + sign * qty
  if (next < 0) {
    const p = await req.payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true, req })
    throw new APIError(`Stock insuficiente de "${p.name}" en la sede (disponible: ${row?.quantity ?? 0}).`, 400)
  }
  if (row) {
    await req.payload.update({ collection: 'inventory', id: row.id, data: { quantity: next }, overrideAccess: true, req })
  } else {
    await req.payload.create({ collection: 'inventory', data: { product: productId, branch: branchId, quantity: next }, overrideAccess: true, req })
  }
  data.balanceAfter = next
  data.actor = actorName(req)
  return data
}

export const InventoryMovements: CollectionConfig = {
  slug: 'inventory-movements',
  admin: { group: 'Inventario', defaultColumns: ['product', 'branch', 'type', 'quantity', 'balanceAfter', 'createdAt'] },
  access: { read: isStaff, create: isManager, update: never, delete: never },
  hooks: { beforeChange: [applyMovement] },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'type', type: 'select', required: true, options: Object.keys(MOVEMENT_SIGN) },
    { name: 'quantity', type: 'number', required: true, min: 1 },
    { name: 'unitCost', type: 'number', min: 0 },
    { name: 'supplier', type: 'relationship', relationTo: 'suppliers' },
    { name: 'reference', type: 'text', admin: { description: 'Venta, traslado, factura de compra…' } },
    { name: 'reason', type: 'text' },
    { name: 'balanceAfter', type: 'number', admin: { readOnly: true } },
    { name: 'actor', type: 'text', admin: { readOnly: true } },
  ],
}

