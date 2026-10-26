import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './payload'
import type { Branch, Product, Media, Promotion } from '@/payload-types'
import { bogotaDay } from './schedule'

export type PublicProduct = {
  id: number | string
  slug: string
  name: string
  sku: string
  description?: string | null
  brand?: string | null
  category?: string | null
  categorySlug?: string | null
  artistic: boolean
  colors: { name: string; hex: string }[]
  sizes: string[]
  productType?: string | null
  unit?: string | null
  salePrice: number
  featured: boolean
  inStock: boolean
  image: { url: string; alt: string } | null
}

export type SiteSettingsData = {
  whatsapp: string
  address: string
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsData> => {
    const payload = await getPayloadClient()
    const s = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    return {
      whatsapp: s.whatsapp || '573122486627',
      address: s.address || 'Calle 10 #10-15, Cali',
      instagram: s.instagram,
      facebook: s.facebook,
      tiktok: s.tiktok,
    }
  },
  ['site-settings'],
  { tags: ['site-settings'] },
)

export const getBranches = unstable_cache(
  async (): Promise<Branch[]> => {
    const payload = await getPayloadClient()
    const r = await payload.find({ collection: 'branches', where: { active: { not_equals: false } }, limit: 20, depth: 0, sort: ['order', 'name'], overrideAccess: false })
    return r.docs
  },
  ['branches-v3'],
  { tags: ['branches'], revalidate: 3600 },
)

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const shape = (p: Product, stock: Set<string>): PublicProduct => {
  const m = typeof p.image === 'object' ? (p.image as Media | null) : null
  const cat = p.productCategory && typeof p.productCategory === 'object' ? p.productCategory : null
  const type = p.saleType && typeof p.saleType === 'object' ? p.saleType : null
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    name: p.name,
    sku: p.sku,
    description: p.description,
    brand: p.brand,
    category: cat?.name || p.category,
    categorySlug: cat?.slug || (p.category ? slugify(p.category) : null),
    artistic: type?.code === 'artistico',
    colors: (p.colors ?? []).filter((c) => c.name && /^#[0-9a-fA-F]{6}$/.test(c.hex)).map((c) => ({ name: c.name, hex: c.hex })),
    sizes: (p.sizes ?? []).map((z) => z.label).filter(Boolean),
    productType: p.productType,
    unit: p.unit,
    salePrice: p.salePrice,
    featured: !!p.featured,
    inStock: p.status !== 'agotado' && stock.has(String(p.id)),
    image: m?.url ? { url: m.url, alt: m.alt || p.name } : null,
  }
}

async function loadProducts(): Promise<PublicProduct[]> {
  const payload = await getPayloadClient()
  const r = await payload.find({
    collection: 'products',
    where: { and: [{ status: { not_equals: 'inactivo' } }, { visible: { not_equals: false } }] },
    limit: 500,
    depth: 1,
    sort: 'name',
    overrideAccess: false,
  })
  const inv = await payload.find({ collection: 'inventory', where: { quantity: { greater_than: 0 } }, limit: 5000, depth: 0, pagination: false, overrideAccess: true })
  const stock = new Set(inv.docs.map((i) => String(typeof i.product === 'object' ? i.product.id : i.product)))
  return r.docs.map((p) => shape(p, stock))
}

export const getProducts = unstable_cache(loadProducts, ['products-all-v3'], { tags: ['products', 'categories'] })

/** Ids de productos ordenados por unidades vendidas (ventas no anuladas). Se refresca cada hora. */
export const getBestSellerIds = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient()
      const r = await payload.find({ collection: 'sales', where: { status: { not_equals: 'anulada' } }, limit: 1000, depth: 0, sort: '-createdAt', overrideAccess: true })
      const tally = new Map<string, number>()
      for (const sale of r.docs as any[]) for (const l of sale.lines ?? []) {
        const id = String(typeof l.product === 'object' ? l.product?.id : l.product)
        tally.set(id, (tally.get(id) ?? 0) + Number(l.quantity || 0))
      }
      return [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
    } catch {
      return []
    }
  },
  ['best-sellers-v1'],
  { tags: ['products'], revalidate: 3600 },
)

export type PublicPromotion = { id: string; title: string; kind: 'promocion' | 'sorteo'; description: string; hashtags: string; image: string; startDate: string; endDate: string }

const safeUrl = (u?: string | null) => {
  const v = String(u ?? '').trim()
  return /^https?:\/\//i.test(v) || v.startsWith('/') ? v : ''
}
const mediaUrl = (m: unknown) => (m && typeof m === 'object' ? ((m as Media).url ?? '') : '')

/** Promociones publicadas con sus datos completos. El filtro por fecha se aplica también en el cliente (el sitio es estático). */
export const getPromotions = unstable_cache(
  async (): Promise<PublicPromotion[]> => {
    const payload = await getPayloadClient()
    const r = await payload.find({ collection: 'promotions', where: { active: { equals: true } }, limit: 50, depth: 1, sort: 'endDate', overrideAccess: false })
    return (r.docs as Promotion[])
      .map((p) => ({
        id: String(p.id),
        title: String(p.title ?? '').trim(),
        kind: p.kind,
        description: String(p.description ?? '').trim(),
        hashtags: String(p.hashtags ?? '').trim(),
        image: mediaUrl(p.image) || safeUrl(p.imageUrl),
        startDate: String(p.startDate ?? '').slice(0, 10),
        endDate: String(p.endDate ?? '').slice(0, 10),
      }))
      .filter((p) => p.image && p.title && p.description && p.hashtags && p.startDate && p.endDate)
  },
  ['promotions-v1'],
  { tags: ['promotions'], revalidate: 3600 },
)

export type PublicEvent = { id: string; title: string; type: string; description: string; image: string; startDate: string; endDate: string }

export const getPublicEvents = unstable_cache(
  async (): Promise<PublicEvent[]> => {
    const payload = await getPayloadClient()
    const r = await payload.find({ collection: 'events', where: { and: [{ visible: { equals: true } }, { active: { not_equals: false } }] }, limit: 50, depth: 1, sort: 'startDate', overrideAccess: false })
    return (r.docs as any[])
      .map((e) => {
        const start = String(e.startDate ?? e.date ?? '').slice(0, 10)
        return { id: String(e.id), title: String(e.title ?? ''), type: String(e.type ?? 'otro'), description: String(e.description ?? ''), image: mediaUrl(e.image) || safeUrl(e.imageUrl), startDate: start, endDate: String(e.endDate ?? '').slice(0, 10) || start }
      })
      .filter((e) => e.title && e.startDate)
  },
  ['events-v1'],
  { tags: ['events'], revalidate: 3600 },
)

export const serverToday = () => bogotaDay()

export const getProductBySlug = async (slug: string) => (await getProducts()).find((p) => p.slug === slug) ?? null



export type SiteImages = Record<'hero' | 'mural' | 'team', { url: string; alt: string } | null>

export const getSiteImages = unstable_cache(
  async (): Promise<SiteImages> => {
    const payload = await getPayloadClient()
    const r = await payload.find({ collection: 'media', where: { filename: { like: 'site-' } }, limit: 20, depth: 0, overrideAccess: true })
    const pick = (n: string) => {
      const m = r.docs.find((d) => d.filename?.startsWith(`site-${n}`))
      return m?.url ? { url: m.url, alt: m.alt || '' } : null
    }
    return { hero: pick('hero'), mural: pick('mural'), team: pick('team') }
  },
  ['site-images-v1'],
  { tags: ['site-settings', 'products'] },
)
