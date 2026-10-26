import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fixed = ['', '/catalogo', '/sobre-nosotros', '/sedes', '/mapa-del-sitio'].map((p) => ({ url: `${base}${p}` }))
  const prods = (await getProducts()).map((p) => ({ url: `${base}/catalogo/${p.slug}` }))
  return [...fixed, ...prods]
}
