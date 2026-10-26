import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProductBySlug, getProducts } from '@/lib/data'
import { AddToCart } from '@/components/add-to-cart'
import { ProductCard } from '@/components/product-card'
import { formatCOPClient } from '@/lib/format'

export const dynamicParams = true

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug)
  return p ? { title: `${p.name} | Mundo Pinturas Diana`, description: p.description ?? `${p.name} disponible en Mundo Pinturas Diana, Cali.` } : {}
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) notFound()
  const related = (await getProducts()).filter((x) => x.id !== p.id && (p.categorySlug ? x.categorySlug === p.categorySlug : x.category === p.category)).slice(0, 4)
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined, offers: { '@type': 'Offer', priceCurrency: 'COP', price: p.salePrice, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } }
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-10 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/catalogo" className="inline-flex items-center gap-2 font-bold text-plum hover:text-brand"><ArrowLeft className="size-4" aria-hidden /> Volver al catálogo</Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-plum bg-plum-soft shadow-[10px_10px_0_0_#00ACC1]">
          {p.image ? <Image src={p.image.url} alt={p.image.alt} fill priority sizes="(max-width:1024px) 100vw, 600px" className="object-cover" /> : <div className="dots grid h-full place-items-center font-display text-9xl font-extrabold text-plum/20">{p.name[0]}</div>}
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">{[p.brand, p.category].filter(Boolean).join(' · ')}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-plum md:text-5xl">{p.name}</h1>
          <p className="mt-2 font-mono text-sm text-ink/55">Ref. {p.sku}</p>
          <p className="mt-6 font-display text-5xl font-extrabold text-ink">{formatCOPClient(p.salePrice)}</p>
          {p.unit && <p className="text-sm text-ink/55">por {p.unit}</p>}
          <p className={`mt-4 inline-flex w-fit rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${p.inStock ? 'bg-cyan/15 text-cyan-dark' : 'bg-ink/10 text-ink'}`}>{p.inStock ? 'Disponible' : 'Consultar disponibilidad'}</p>
          {p.description && <p className="mt-6 max-w-prose leading-relaxed text-ink/75">{p.description}</p>}
          <AddToCart product={p} />
          <p className="mt-4 text-sm text-ink/55">Precios sujetos a confirmación y disponibilidad.</p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="rel">
          <h2 id="rel" className="font-display text-3xl font-extrabold text-plum">También te puede interesar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  )
}
