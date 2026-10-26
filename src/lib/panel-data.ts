import 'server-only'
import type { User } from '@/payload-types'
import { getPayloadClient } from './payload'
import type { Opt, Row } from '@/components/panel/kit'

const titleOf = (d: any) => d.name ?? d.title ?? d.email ?? String(d.number ?? d.id)

export const PAGE_SIZE = 15

type FindOpts = { sort?: string; limit?: number; depth?: number; where?: any; overrideAccess?: boolean }

export async function findAll(user: User, collection: string, opts: FindOpts = {}): Promise<Row[]> {
  const payload = await getPayloadClient()
  const r = await payload.find({ collection: collection as any, user, overrideAccess: opts.overrideAccess ?? false, depth: opts.depth ?? 1, limit: opts.limit ?? 500, sort: opts.sort, where: opts.where })
  return r.docs as unknown as Row[]
}

export type PageResult = { docs: Row[]; page: number; totalPages: number; totalDocs: number }

/** Listado paginado (15 por página). La página viaja en la URL (?page=). */
export async function findPage(user: User, collection: string, opts: FindOpts & { page?: number } = {}): Promise<PageResult> {
  const payload = await getPayloadClient()
  const r = await payload.find({
    collection: collection as any, user, overrideAccess: opts.overrideAccess ?? false, depth: opts.depth ?? 1,
    limit: opts.limit ?? PAGE_SIZE, page: Math.max(1, opts.page ?? 1), sort: opts.sort, where: opts.where,
  })
  if (r.totalPages > 0 && (opts.page ?? 1) > r.totalPages) return findPage(user, collection, { ...opts, page: r.totalPages })
  return { docs: r.docs as unknown as Row[], page: r.page ?? 1, totalPages: Math.max(1, r.totalPages), totalDocs: r.totalDocs }
}

export async function options(user: User, collection: string, where?: any, overrideAccess?: boolean): Promise<Opt[]> {
  const docs = await findAll(user, collection, { depth: 0, limit: 500, where, overrideAccess })
  return docs.map((d) => ({ id: d.id, label: titleOf(d) + (d.sku ? ` · ${d.sku}` : '') }))
}

export async function analytics(user: User, days = 14) {
  const since = new Date(Date.now() - days * 86400_000).toISOString()
  const [sales, products] = await Promise.all([
    findAll(user, 'sales', { depth: 1, limit: 1000, where: { and: [{ createdAt: { greater_than_equal: since } }, { status: { not_equals: 'anulada' } }] }, sort: 'createdAt' }),
    findAll(user, 'products', { depth: 0 }),
  ])
  const cost = new Map(products.map((p) => [p.id, p.costPrice ?? 0]))
  const byDay = new Map<string, number>(), byMethod = new Map<string, number>(), byBank = new Map<string, number>(), top = new Map<string, { qty: number; total: number }>()
  let revenue = 0, margin = 0
  for (const s of sales) {
    const day = new Date(new Date(s.createdAt).getTime() - 5 * 3600_000).toISOString().slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + s.total)
    revenue += s.total
    for (const p of s.payments ?? []) {
      byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount)
      if (p.method === 'transferencia') { const n = p.bankAccount?.name ?? 'Sin cuenta'; byBank.set(n, (byBank.get(n) ?? 0) + p.amount) }
    }
    for (const l of s.lines ?? []) {
      const id = l.product?.id ?? l.product
      margin += l.lineTotal - (cost.get(id) ?? 0) * l.quantity
      const t = top.get(l.name) ?? { qty: 0, total: 0 }
      top.set(l.name, { qty: t.qty + l.quantity, total: t.total + l.lineTotal })
    }
  }
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - 5 * 3600_000 - (days - 1 - i) * 86400_000).toISOString().slice(0, 10)
    return { day: d, total: byDay.get(d) ?? 0 }
  })
  const arr = (m: Map<string, number>) => [...m].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v)
  return { revenue, margin, count: sales.length, series, byMethod: arr(byMethod), byBank: arr(byBank), top: [...top].map(([k, v]) => ({ k, ...v })).sort((a, b) => b.total - a.total).slice(0, 6) }
}

/** Hoy en Bogotá (AAAA-MM-DD). */
export const bogotaToday = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10)

/** Estado por fechas: archivada (ya terminó), programada (aún no empieza) o vigente. */
export function dateState(start?: string | null, end?: string | null, today = bogotaToday()): 'vigente' | 'programada' | 'archivada' {
  const e = end ? String(end).slice(0, 10) : ''
  const s = start ? String(start).slice(0, 10) : ''
  if (e && e < today) return 'archivada'
  if (s && s > today) return 'programada'
  return 'vigente'
}
