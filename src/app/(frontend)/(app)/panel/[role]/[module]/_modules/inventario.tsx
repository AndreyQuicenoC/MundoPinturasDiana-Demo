import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage, spStr } from '@/lib/panel-ctx'
import { findAll, findPage, options } from '@/lib/panel-data'
import { InventoryModule, type KardexRow, type StockRow } from '@/components/panel/inventory-module'
import { Head, Wrap } from '@/components/panel/page-head'

const SIGN: Record<string, 1 | -1> = { entrada_compra: 1, anulacion: 1, devolucion: 1, ajuste_positivo: 1, traslado_entrada: 1, venta: -1, ajuste_negativo: -1, traslado_salida: -1, merma: -1 }
const nameOf = (v: any) => (v && typeof v === 'object' ? v.name ?? '' : '')

export default async function Module(ctx: PanelCtx) {
  const { user, overrideAccess: oa, sp } = ctx
  const tab = spStr(sp.tab, 'stock')
  const canWrite = ctx.canWrite && ctx.role !== 'empleado'
  const sede = spStr(sp.sede)
  const q = spStr(sp.q).trim()
  const shownBranches = sede ? ctx.branches.filter((b) => b.id === sede) : ctx.branches
  const empty = { page: 1, totalPages: 1, totalDocs: 0 }

  // Alerta de stock bajo (sobre las sedes visibles)
  const allStock = await findAll(user, 'inventory', { depth: 1, limit: 1000, overrideAccess: oa, where: sede ? { branch: { equals: sede } } : undefined })
  const lowRows = allStock.filter((s) => s.product && s.quantity <= (s.product.minimumStock ?? 0) && (s.product.minimumStock ?? 0) > 0)
  const low = { count: lowRows.length, names: lowRows.map((s) => `${s.product.name} (${nameOf(s.branch)})`) }

  let stock: StockRow[] = [], kardex: KardexRow[] = [], pg = empty
  if (tab === 'stock') {
    const where: any = { and: [{ status: { not_equals: 'inactivo' } }, ...(q ? [{ or: [{ name: { like: q } }, { sku: { like: q } }] }] : [])] }
    const res = await findPage(user, 'products', { depth: 0, sort: 'name', overrideAccess: oa, where, page: spPage(sp) })
    pg = { page: res.page, totalPages: res.totalPages, totalDocs: res.totalDocs }
    const inv = res.docs.length ? await findAll(user, 'inventory', { depth: 0, limit: 1000, overrideAccess: oa, where: { product: { in: res.docs.map((p) => p.id) } } }) : []
    stock = res.docs.map((p) => {
      const cells: Record<string, number> = {}
      for (const i of inv) if ((i.product?.id ?? i.product) === p.id) cells[i.branch?.id ?? i.branch] = i.quantity
      const total = shownBranches.reduce((a, b) => a + (cells[b.id] ?? 0), 0)
      return { id: p.id, name: p.name, sku: p.sku, origin: p.origin, unit: p.unit, min: p.minimumStock ?? 0, cells, total }
    })
  } else if (tab === 'kardex') {
    const and: any[] = []
    if (sede) and.push({ branch: { equals: sede } })
    const type = spStr(sp.type)
    if (type) and.push({ type: { equals: type } })
    if (spStr(sp.desde)) and.push({ createdAt: { greater_than_equal: `${spStr(sp.desde)}T00:00:00-05:00` } })
    if (spStr(sp.hasta)) and.push({ createdAt: { less_than_equal: `${spStr(sp.hasta)}T23:59:59.999-05:00` } })
    const res = await findPage(user, 'inventory-movements', { depth: 1, sort: '-createdAt', overrideAccess: oa, where: and.length ? { and } : undefined, page: spPage(sp) })
    pg = { page: res.page, totalPages: res.totalPages, totalDocs: res.totalDocs }
    kardex = res.docs.map((m) => {
      const delta = (SIGN[m.type] ?? 1) * m.quantity
      return { id: m.id, createdAt: m.createdAt, product: nameOf(m.product), branch: nameOf(m.branch), type: m.type, quantity: m.quantity, delta, before: (m.balanceAfter ?? 0) - delta, after: m.balanceAfter ?? 0, unitCost: m.unitCost, supplier: nameOf(m.supplier), reference: m.reference, reason: m.reason, actor: m.actor }
    })
  }

  const writeTab = canWrite && ['entrada', 'ajuste', 'traslado'].includes(tab)
  const products = writeTab ? (await findAll(user, 'products', { depth: 0, limit: 1000, sort: 'name', overrideAccess: oa, where: { status: { not_equals: 'inactivo' } } })).map((p) => ({ id: p.id, label: p.name, hint: `${p.sku ?? ''} · ${p.origin === 'fabricado' ? 'fabricado' : 'comprado'}`, origin: p.origin, sku: p.sku, barcode: p.barcode })) : []
  const suppliers = writeTab && tab === 'entrada' ? await options(user, 'suppliers', { active: { not_equals: false } }, oa) : []

  return (
    <Wrap head={<Head title="Inventario" blurb="Todos los productos creados aparecen aquí. Registra entradas, ajustes y traslados; cada movimiento actualiza el saldo y deja historial." />}>
      <InventoryModule tab={tab} sp={sp} stock={stock} shownBranches={shownBranches} low={low} kardex={kardex} products={products} branches={ctx.branches} suppliers={suppliers} canWrite={canWrite} pg={pg} />
    </Wrap>
  )
}
