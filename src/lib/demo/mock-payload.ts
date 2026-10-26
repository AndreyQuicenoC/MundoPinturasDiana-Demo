import 'server-only'
import { demoUserPublic, findDemoUser, signDemoSessionToken, verifyDemoSessionToken } from './demo-auth'
import { getDemoStore } from './fixtures'

const MOVEMENT_SIGN: Record<string, 1 | -1> = {
  entrada_compra: 1, anulacion: 1, devolucion: 1, ajuste_positivo: 1, traslado_entrada: 1,
  venta: -1, ajuste_negativo: -1, traslado_salida: -1, merma: -1,
}

function applyInventoryMovement(data: Record<string, unknown>) {
  const sign = MOVEMENT_SIGN[data.type as string] ?? 0
  if (!sign) return
  const product = data.product
  const branch = data.branch
  const qty = Number(data.quantity)
  if (!product || !branch || !qty) return
  const inv = getDemoStore().collections.inventory ?? []
  const row = inv.find((i) => String(i.product) === String(product) && String(i.branch) === String(branch))
  const before = row?.quantity ?? 0
  const after = before + sign * qty
  if (row) row.quantity = after
  else inv.push({ id: `inv-${Date.now()}`, product, branch, quantity: after })
  data.balanceAfter = after
  data.actor = data.actor ?? 'Demo'
}

function rel(collection: string, val: unknown, depth: number) {
  if (!val || depth <= 0) return val
  const id = typeof val === 'object' && val !== null && 'id' in val ? (val as { id: string }).id : val
  const doc = getDemoStore().collections[collection]?.find((d) => String(d.id) === String(id))
  return doc ? { ...doc } : val
}

function pop(doc: any, depth: number) {
  if (!doc || depth <= 0) return doc
  const out = { ...doc }
  if (out.branch) out.branch = rel('branches', out.branch, depth - 1)
  if (out.product) out.product = rel('products', out.product, depth - 1)
  if (out.productCategory) out.productCategory = rel('product-categories', out.productCategory, depth - 1)
  if (out.saleType) out.saleType = rel('product-types', out.saleType, depth - 1)
  if (out.supplier) out.supplier = rel('suppliers', out.supplier, depth - 1)
  return out
}

function matchWhere(doc: any, where: any): boolean {
  if (!where) return true
  if (where.and) return where.and.every((w: unknown) => matchWhere(doc, w))
  if (where.or) return where.or.some((w: unknown) => matchWhere(doc, w))
  for (const [key, cond] of Object.entries(where)) {
    let val = doc[key]
    if (typeof val === 'object' && val?.id) val = val.id
    const c = cond as Record<string, unknown>
    if (c.equals !== undefined && String(val) !== String(c.equals)) return false
    if (c.not_equals !== undefined && String(val) === String(c.not_equals)) return false
    if (Array.isArray(c.in) && !c.in.map(String).includes(String(val))) return false
    if (c.greater_than_equal !== undefined) {
      const a = String(val ?? '')
      const b = String(c.greater_than_equal)
      if (a < b.slice(0, Math.min(a.length, b.length))) return false
    }
    if (c.less_than !== undefined && !(String(val ?? '') < String(c.less_than))) return false
    if (c.less_than_equal !== undefined && !(String(val ?? '') <= String(c.less_than_equal))) return false
    if (c.like !== undefined) {
      const needle = String(c.like).replace(/%/g, '').toLowerCase()
      if (!String(val ?? '').toLowerCase().includes(needle)) return false
    }
    if (c.exists !== undefined) {
      const ex = val != null && val !== ''
      if (c.exists !== ex) return false
    }
  }
  return true
}

function sortDocs(docs: any[], sort?: string | string[]) {
  if (!sort) return docs
  const keys = Array.isArray(sort) ? sort : [sort]
  return [...docs].sort((a, b) => {
    for (const key of keys) {
      const desc = key.startsWith('-')
      const field = desc ? key.slice(1) : key
      const av = a[field] ?? ''
      const bv = b[field] ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      if (cmp !== 0) return desc ? -cmp : cmp
    }
    return 0
  })
}

export function createMockPayload() {
  const api = {
    async find(opts: { collection: string; where?: unknown; limit?: number; page?: number; sort?: string | string[]; depth?: number; pagination?: boolean; overrideAccess?: boolean; select?: unknown }) {
      const { collection, where, limit = 10, page = 1, sort, depth = 0 } = opts
      let docs = [...(getDemoStore().collections[collection] ?? [])]
      if (where) docs = docs.filter((d) => matchWhere(d, where))
      docs = sortDocs(docs, sort)
      const totalDocs = docs.length
      const start = (Math.max(1, page) - 1) * limit
      const pageDocs = docs.slice(start, start + limit)
      return {
        docs: pageDocs.map((d) => pop(d, depth)),
        totalDocs,
        page: Math.max(1, page),
        totalPages: Math.max(1, Math.ceil(totalDocs / limit)),
      }
    },

    async findByID(opts: { collection: string; id: string | number; depth?: number }) {
      const doc = getDemoStore().collections[opts.collection]?.find((d) => String(d.id) === String(opts.id))
      if (!doc) throw new Error('No encontrado')
      return pop(doc, opts.depth ?? 0)
    },

    async count(opts: { collection: string; where?: unknown }) {
      const r = await api.find({ collection: opts.collection, where: opts.where, limit: 100000, page: 1 })
      return { totalDocs: r.totalDocs }
    },

    async create(opts: { collection: string; data: Record<string, unknown> }) {
      const store = getDemoStore()
      if (!store.collections[opts.collection]) store.collections[opts.collection] = []
      const doc = { id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...opts.data, createdAt: opts.data.createdAt ?? new Date().toISOString() }
      if (opts.collection === 'inventory-movements') applyInventoryMovement(doc)
      store.collections[opts.collection].push(doc)
      return { doc }
    },

    async update(opts: { collection: string; id: string | number; data: Record<string, unknown> }) {
      const arr = getDemoStore().collections[opts.collection] ?? []
      const i = arr.findIndex((d) => String(d.id) === String(opts.id))
      if (i < 0) throw new Error('No encontrado')
      arr[i] = { ...arr[i], ...opts.data }
      return { doc: arr[i] }
    },

    async delete(opts: { collection: string; id: string | number }) {
      const arr = getDemoStore().collections[opts.collection] ?? []
      const i = arr.findIndex((d) => String(d.id) === String(opts.id))
      if (i >= 0) arr.splice(i, 1)
      return { doc: { id: opts.id } }
    },

    async login(opts: { collection: string; data: { email: string; password: string } }) {
      if (opts.collection !== 'users') throw new Error('Credenciales inválidas')
      const u = findDemoUser(opts.data.email, opts.data.password)
      if (!u) throw new Error('Credenciales inválidas')
      const token = await signDemoSessionToken(u)
      return { token, user: demoUserPublic(u) }
    },

    async auth(opts: { headers: Headers }) {
      const raw = opts.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
      if (!raw) return { user: null }
      const user = await verifyDemoSessionToken(raw)
      return { user }
    },

    async findGlobal(opts: { slug: string }) {
      const g = getDemoStore().globals[opts.slug as 'site-settings']
      return g ?? {}
    },

    async updateGlobal(opts: { slug: string; data: Record<string, unknown> }) {
      const store = getDemoStore()
      if (opts.slug === 'site-settings') {
        store.globals['site-settings'] = { ...store.globals['site-settings'], ...opts.data }
        return store.globals['site-settings']
      }
      return opts.data
    },
  }
  return api
}

export type MockPayload = ReturnType<typeof createMockPayload>
