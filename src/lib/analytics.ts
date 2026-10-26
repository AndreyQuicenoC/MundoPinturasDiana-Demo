import 'server-only'
import { getPayloadClient } from './payload'
import { MONTHS_SHORT, addDays, daysInMonth, fmtDay, type Filters } from './analytics-shared'

/**
 * Agregación de la analítica. Todo se calcula en JS sobre lecturas `depth: 0` con `select` mínimo.
 * El llamador (módulo / ruta del PDF) ya verificó el permiso 'analitica'; aquí se lee con overrideAccess.
 * Ventas = solo productos normales (reportableTotal), sin anuladas y descontando devoluciones.
 */

export type Metrics = {
  ventas: number; nVentas: number; ticket: number | null
  gastos: number; entregas: number; transferencias: number; ahorros: number
  costo: number; margen: number | null; ratio: number | null
}
export type BucketRow = Metrics & { key: string; label: string; from: string; to: string; flags: string[] }
export type Rank = { k: string; v: number; extra?: number }
export type Report = {
  filters: Filters
  sedeName: string
  generatedAt: string
  buckets: BucketRow[]
  total: Metrics
  avgMonthly: number
  change: { key: string; label: string; ventas: number | null; gastos: number | null; flag: boolean }[]
  gastosByCategory: Rank[]
  unitsByCategory: Rank[]
  categoryCharts: { category: string; units: number; items: Rank[] }[]
  top: Rank[]
  bottom: Rank[]
  site: { visits: number; cart: number; promo: number; perBucket: { key: string; label: string; visits: number; cart: number; promo: number }[]; byPromo: Rank[] }
  inventory: {
    perBucket: { key: string; label: string; entradas: number; salidas: number }[]
    totalUnits: number; productsTracked: number; belowMin: number
    below: { name: string; stock: number; min: number }[]
    rotation: { name: string; sold: number; stock: number }[]
  }
  returns: { count: number; value: number; perBucket: { key: string; label: string; count: number; value: number }[]; top: Rank[] }
  artistic: { total: number; units: number; invoices: number; top: Rank[]; bottom: Rank[]; perBucket: { key: string; label: string; units: number; value: number }[] }
  events: { title: string; from: string; to: string }[]
}

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)
const bogota = (ts: string) => new Date(new Date(ts).getTime() - 5 * 3600_000).toISOString()
const dayOf = (ts: string) => bogota(ts).slice(0, 10)
const sortDesc = (m: Map<string, number>) => [...m].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v)

export function makeBuckets(f: Filters) {
  if (!f.monthly) return [{ key: 'all', label: `${fmtDay(f.desde)} – ${fmtDay(f.hasta)}`, from: f.desde, to: f.hasta }]
  const out = []
  let [y, m] = f.desde.split('-').map(Number)
  const [ey, em] = f.hasta.split('-').map(Number)
  const multiYear = y !== ey
  while (y < ey || (y === ey && m <= em)) {
    const mm = String(m).padStart(2, '0')
    const cap = MONTHS_SHORT[m - 1][0].toUpperCase() + MONTHS_SHORT[m - 1].slice(1)
    out.push({ key: `${y}-${mm}`, label: multiYear ? `${cap} ${String(y).slice(2)}` : cap, from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(daysInMonth(y, m)).padStart(2, '0')}` })
    if (++m > 12) { m = 1; y++ }
  }
  return out
}

export async function buildReport(f: Filters): Promise<Report> {
  const payload = await getPayloadClient()
  const buckets = makeBuckets(f)
  const keyOfDay = (d: string) => (f.monthly ? d.slice(0, 7) : 'all')
  const gte = `${f.desde}T05:00:00.000Z`
  const lt = `${addDays(f.hasta, 1)}T05:00:00.000Z`
  const branchW = f.sede ? [{ branch: { equals: f.sede } }] : []

  const all = async (collection: string, and: any[], select: any, sort?: string) =>
    (await payload.find({ collection: collection as any, where: and.length ? { and } : undefined, select, sort, depth: 0, pagination: false, overrideAccess: true })).docs as any[]

  const [sales, products, types, pcats, ccats, concepts, moves, deliveries, siteEv, promos, events, stockDocs, invMoves, branches] = await Promise.all([
    all('sales', [{ createdAt: { greater_than_equal: gte } }, { createdAt: { less_than: lt } }, { status: { not_equals: 'anulada' } }, ...branchW],
      { createdAt: true, status: true, reportableTotal: true, total: true, artisticTotal: true, lines: true, returns: true }),
    all('products', [], { name: true, productCategory: true, category: true, costPrice: true, saleType: true, minimumStock: true, status: true }),
    all('product-types', [], { affectsDailySales: true }),
    all('product-categories', [], { name: true }),
    all('cash-categories', [], { name: true, type: true }),
    all('cash-concepts', [], { name: true, categoryRef: true }),
    all('cash-movements', [{ date: { greater_than_equal: gte } }, { date: { less_than: lt } }, { category: { in: ['gasto', 'transferencia', 'ahorro'] } }, ...branchW],
      { date: true, category: true, categoryRef: true, concept: true, amount: true }),
    all('cash-deliveries', [{ day: { greater_than_equal: f.desde } }, { day: { less_than_equal: f.hasta } }, ...branchW], { day: true, amount: true }),
    all('site-events', [{ day: { greater_than_equal: f.desde } }, { day: { less_than_equal: f.hasta } }], { type: true, day: true, promotion: true }),
    all('promotions', [], { title: true }),
    all('events', [{ importance: { equals: 'clave' } }, { active: { not_equals: false } }], { title: true, startDate: true, endDate: true }),
    all('inventory', [...branchW], { product: true, quantity: true }),
    all('inventory-movements', [{ createdAt: { greater_than_equal: gte } }, { createdAt: { less_than: lt } }, { type: { in: ['entrada_compra', 'ajuste_positivo', 'ajuste_negativo', 'merma'] } }, ...branchW],
      { createdAt: true, type: true, quantity: true }),
    all('branches', [], { name: true }),
  ])

  const typeAffects = new Map(types.map((t) => [t.id, t.affectsDailySales !== false]))
  const catName = new Map(pcats.map((c) => [c.id, c.name as string]))
  const prod = new Map(products.map((p) => {
    const cat = p.productCategory ? catName.get(idOf(p.productCategory)) : (p.category || '')
    return [p.id, { name: p.name as string, cat: cat || 'Sin categoría', cost: p.costPrice ?? 0, min: p.minimumStock ?? 0, active: p.status !== 'inactivo', artistic: p.saleType ? typeAffects.get(idOf(p.saleType)) === false : false }]
  }))
  const ccatName = new Map(ccats.map((c) => [c.id, c.name as string]))
  const conceptInfo = new Map(concepts.map((c) => [c.id, { name: c.name as string, cat: c.categoryRef ? ccatName.get(idOf(c.categoryRef)) : undefined }]))

  type Acc = { ventas: number; n: number; gastos: number; entregas: number; transferencias: number; ahorros: number; costo: number }
  const acc = new Map<string, Acc>(buckets.map((b) => [b.key, { ventas: 0, n: 0, gastos: 0, entregas: 0, transferencias: 0, ahorros: 0, costo: 0 }]))
  const retB = new Map(buckets.map((b) => [b.key, { count: 0, value: 0 }]))
  const artB = new Map(buckets.map((b) => [b.key, { units: 0, value: 0 }]))
  const invB = new Map(buckets.map((b) => [b.key, { entradas: 0, salidas: 0 }]))
  const siteB = new Map(buckets.map((b) => [b.key, { visits: 0, cart: 0, promo: 0 }]))

  const unitsP = new Map<string, number>(), nameP = new Map<string, string>()
  const artUnits = new Map<string, number>(), artVal = new Map<string, number>()
  const retUnits = new Map<string, number>()
  let retCount = 0, retValue = 0, artTotal = 0, artInvoices = 0, artUnitsTotal = 0
  const label = (pid: any, fallback?: string) => prod.get(pid)?.name ?? fallback ?? 'Producto'

  for (const s of sales) {
    const bk = keyOfDay(dayOf(s.createdAt))
    const a = acc.get(bk)
    if (!a) continue
    const normalTotal = s.reportableTotal ?? (s.total ?? 0) - (s.artisticTotal ?? 0)
    if (normalTotal > 0) { a.ventas += normalTotal; a.n += 1 }
    const per = new Map<string, { q: number; v: number; normal: boolean }>()
    for (const l of s.lines ?? []) {
      const pid = String(idOf(l.product))
      const normal = l.affectsSales !== false
      const cur = per.get(pid) ?? { q: 0, v: 0, normal }
      cur.q += l.quantity; cur.v += l.lineTotal ?? 0
      per.set(pid, cur)
      nameP.set(pid, label(idOf(l.product), l.name))
      if (normal) {
        unitsP.set(pid, (unitsP.get(pid) ?? 0) + l.quantity)
        a.costo += (prod.get(idOf(l.product))?.cost ?? 0) * l.quantity
      } else {
        artUnits.set(pid, (artUnits.get(pid) ?? 0) + l.quantity)
        artVal.set(pid, (artVal.get(pid) ?? 0) + (l.lineTotal ?? 0))
        artUnitsTotal += l.quantity; artTotal += l.lineTotal ?? 0
        const ab = artB.get(bk)!; ab.units += l.quantity; ab.value += l.lineTotal ?? 0
      }
    }
    if ((s.artisticTotal ?? 0) > 0) artInvoices++
    for (const r of s.returns ?? []) {
      const pid = String(idOf(r.product))
      const info = per.get(pid)
      if (!info || info.q === 0) continue
      const value = Math.round((info.v / info.q) * r.quantity)
      if (info.normal) {
        a.ventas -= value
        a.costo -= (prod.get(idOf(r.product))?.cost ?? 0) * r.quantity
        unitsP.set(pid, (unitsP.get(pid) ?? 0) - r.quantity)
        retUnits.set(pid, (retUnits.get(pid) ?? 0) + r.quantity)
        const rb = retB.get(bk)!; rb.count += 1; rb.value += value
        retCount++; retValue += value
      } else {
        artUnits.set(pid, (artUnits.get(pid) ?? 0) - r.quantity)
        artVal.set(pid, (artVal.get(pid) ?? 0) - value)
        artUnitsTotal -= r.quantity; artTotal -= value
        const ab = artB.get(bk)!; ab.units -= r.quantity; ab.value -= value
      }
    }
  }

  const gastoCat = new Map<string, number>()
  for (const m of moves) {
    const a = acc.get(keyOfDay(dayOf(m.date)))
    if (!a) continue
    if (m.category === 'gasto') {
      a.gastos += m.amount
      const ci = m.concept ? conceptInfo.get(idOf(m.concept)) : undefined
      const cat = (m.categoryRef && ccatName.get(idOf(m.categoryRef))) || ci?.cat || ci?.name || 'Sin categoría'
      gastoCat.set(cat, (gastoCat.get(cat) ?? 0) + m.amount)
    } else if (m.category === 'transferencia') a.transferencias += m.amount
    else if (m.category === 'ahorro') a.ahorros += m.amount
  }
  for (const d of deliveries) { const a = acc.get(keyOfDay(d.day)); if (a) a.entregas += d.amount }

  const promoName = new Map(promos.map((p) => [p.id, p.title as string]))
  const byPromo = new Map<string, number>()
  let visits = 0, cart = 0, promo = 0
  for (const e of siteEv) {
    const sb = siteB.get(keyOfDay(e.day)); if (!sb) continue
    if (e.type === 'visit') { visits++; sb.visits++ }
    else if (e.type === 'whatsapp_cart') { cart++; sb.cart++ }
    else if (e.type === 'whatsapp_promo') {
      promo++; sb.promo++
      const n = e.promotion ? promoName.get(idOf(e.promotion)) ?? 'Promoción eliminada' : 'Sin promoción'
      byPromo.set(n, (byPromo.get(n) ?? 0) + 1)
    }
  }

  for (const m of invMoves) {
    const ib = invB.get(keyOfDay(dayOf(m.createdAt))); if (!ib) continue
    if (m.type === 'entrada_compra' || m.type === 'ajuste_positivo') ib.entradas += m.quantity
    else ib.salidas += m.quantity
  }
  for (const s of sales) {
    const ib = invB.get(keyOfDay(dayOf(s.createdAt))); if (!ib) continue
    for (const l of s.lines ?? []) if (l.affectsSales !== false) ib.salidas += l.quantity
    for (const r of s.returns ?? []) ib.salidas -= r.quantity
  }

  const stock = new Map<string, number>()
  for (const d of stockDocs) { const k = String(idOf(d.product)); stock.set(k, (stock.get(k) ?? 0) + (d.quantity ?? 0)) }
  const tracked = [...prod].filter(([, p]) => p.active && !p.artistic)
  const belowAll = tracked
    .map(([id, p]) => ({ name: p.name, stock: stock.get(String(id)) ?? 0, min: p.min }))
    .filter((x) => x.min > 0 && x.stock < x.min)
    .sort((a, b) => (b.min - b.stock) - (a.min - a.stock))
  const totalUnits = tracked.reduce((s, [id]) => s + (stock.get(String(id)) ?? 0), 0)

  // categorías y rankings (solo normales)
  const soldRows = [...unitsP].filter(([, q]) => q > 0).map(([pid, q]) => ({ pid, name: nameP.get(pid) ?? 'Producto', q, cat: prod.get(pid as any)?.cat ?? 'Sin categoría' }))
  // el Map de productos usa el id original (número o texto): resolvemos por String
  const prodByStr = new Map([...prod].map(([k, v]) => [String(k), v]))
  for (const r of soldRows) r.cat = prodByStr.get(r.pid)?.cat ?? 'Sin categoría'
  const unitsCat = new Map<string, number>()
  const catItems = new Map<string, Rank[]>()
  for (const r of soldRows) {
    unitsCat.set(r.cat, (unitsCat.get(r.cat) ?? 0) + r.q)
    ;(catItems.get(r.cat) ?? catItems.set(r.cat, []).get(r.cat)!).push({ k: r.name, v: r.q })
  }
  const unitsByCategory = sortDesc(unitsCat)
  const categoryCharts = unitsByCategory.slice(0, 6).map((c) => ({ category: c.k, units: c.v, items: catItems.get(c.k)!.sort((a, b) => b.v - a.v).slice(0, 6) }))
  const ranked = soldRows.map((r) => ({ k: r.name, v: r.q })).sort((a, b) => b.v - a.v)
  const N = 10

  const artRows = [...artUnits].filter(([, q]) => q > 0).map(([pid, q]) => ({ k: nameP.get(pid) ?? 'Producto', v: q, extra: artVal.get(pid) ?? 0 })).sort((a, b) => b.v - a.v)

  const mk = (a: Acc): Metrics => {
    const margen = a.ventas > 0 ? (a.ventas - a.costo - a.gastos) / a.ventas : null
    return { ventas: a.ventas, nVentas: a.n, ticket: a.n ? a.ventas / a.n : null, gastos: a.gastos, entregas: a.entregas, transferencias: a.transferencias, ahorros: a.ahorros, costo: a.costo, margen, ratio: a.ventas > 0 ? a.gastos / a.ventas : null }
  }
  const evs = events.map((e) => { const from = String(e.startDate ?? e.endDate ?? '').slice(0, 10); const to = String(e.endDate ?? e.startDate ?? '').slice(0, 10); return { title: e.title as string, from, to } })
    .filter((e) => e.from && e.to && e.from <= f.hasta && e.to >= f.desde)
  const rows: BucketRow[] = buckets.map((b) => ({ ...b, ...mk(acc.get(b.key)!), flags: evs.filter((e) => e.from <= b.to && e.to >= b.from).map((e) => e.title) }))
  const totalAcc = [...acc.values()].reduce((t, a) => ({ ventas: t.ventas + a.ventas, n: t.n + a.n, gastos: t.gastos + a.gastos, entregas: t.entregas + a.entregas, transferencias: t.transferencias + a.transferencias, ahorros: t.ahorros + a.ahorros, costo: t.costo + a.costo }), { ventas: 0, n: 0, gastos: 0, entregas: 0, transferencias: 0, ahorros: 0, costo: 0 })
  const total = mk(totalAcc)
  const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)

  return {
    filters: f,
    sedeName: f.sede ? branches.find((b) => String(b.id) === f.sede)?.name ?? 'Sede' : 'Todas las sedes',
    generatedAt: new Date().toISOString(),
    buckets: rows,
    total,
    avgMonthly: total.ventas / Math.max(1, rows.length),
    change: rows.map((r, i) => ({ key: r.key, label: r.label, flag: r.flags.length > 0, ventas: i ? pct(r.ventas, rows[i - 1].ventas) : null, gastos: i ? pct(r.gastos, rows[i - 1].gastos) : null })),
    gastosByCategory: sortDesc(gastoCat),
    unitsByCategory,
    categoryCharts,
    top: ranked.slice(0, N),
    bottom: ranked.slice(-N).reverse().sort((a, b) => a.v - b.v).slice(0, N),
    site: { visits, cart, promo, perBucket: buckets.map((b) => ({ key: b.key, label: b.label, ...siteB.get(b.key)! })), byPromo: sortDesc(byPromo) },
    inventory: {
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, ...invB.get(b.key)! })),
      totalUnits, productsTracked: tracked.length, belowMin: belowAll.length, below: belowAll.slice(0, 8),
      rotation: ranked.slice(0, 5).map((r) => {
        const pid = soldRows.find((x) => x.name === r.k)?.pid ?? ''
        return { name: r.k, sold: r.v, stock: stock.get(pid) ?? 0 }
      }),
    },
    returns: {
      count: retCount, value: retValue,
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, ...retB.get(b.key)! })),
      top: sortDesc(new Map([...retUnits].map(([pid, q]) => [nameP.get(pid) ?? 'Producto', q] as [string, number]))).slice(0, 5),
    },
    artistic: {
      total: artTotal, units: artUnitsTotal, invoices: artInvoices,
      top: artRows.slice(0, N), bottom: [...artRows].reverse().slice(0, N),
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, ...artB.get(b.key)! })),
    },
    events: evs,
  }
}

const emptyMetrics = (): Metrics => ({
  ventas: 0, nVentas: 0, ticket: null, gastos: 0, entregas: 0, transferencias: 0, ahorros: 0, costo: 0, margen: null, ratio: null,
})

/** Vista inicial de analítica (sin ETL): mismos periodos y etiquetas, valores en cero. */
export function buildEmptyReport(f: Filters, sedeName: string): Report {
  const buckets = makeBuckets(f)
  const zero = emptyMetrics()
  const rows: BucketRow[] = buckets.map((b) => ({ ...b, ...zero, flags: [] }))
  return {
    filters: f,
    sedeName,
    generatedAt: new Date().toISOString(),
    buckets: rows,
    total: zero,
    avgMonthly: 0,
    change: rows.map((r) => ({ key: r.key, label: r.label, flag: false, ventas: null, gastos: null })),
    gastosByCategory: [],
    unitsByCategory: [],
    categoryCharts: [],
    top: [],
    bottom: [],
    site: {
      visits: 0, cart: 0, promo: 0,
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, visits: 0, cart: 0, promo: 0 })),
      byPromo: [],
    },
    inventory: {
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, entradas: 0, salidas: 0 })),
      totalUnits: 0, productsTracked: 0, belowMin: 0, below: [], rotation: [],
    },
    returns: {
      count: 0, value: 0,
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, count: 0, value: 0 })),
      top: [],
    },
    artistic: {
      total: 0, units: 0, invoices: 0, top: [], bottom: [],
      perBucket: buckets.map((b) => ({ key: b.key, label: b.label, units: 0, value: 0 })),
    },
    events: [],
  }
}
