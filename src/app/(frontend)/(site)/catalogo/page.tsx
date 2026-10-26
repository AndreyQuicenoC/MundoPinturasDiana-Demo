import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts } from '@/lib/data'
import { CatalogClient } from '@/components/catalog-client'
import { Squiggle } from '@/components/ui/splash'

export const metadata: Metadata = {
  title: 'Catálogo de pinturas | Mundo Pinturas Diana',
  description: 'Explora pinturas, esmaltes y acabados. Arma tu carrito y confirma tu pedido por WhatsApp.',
}

export default async function CatalogPage() {
  const products = await getProducts()
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Catálogo</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold text-plum md:text-6xl">Elige tu color</h1>
      <Squiggle className="mt-3 h-4 w-52" />
      <p className="mt-4 max-w-2xl text-ink/70">Precios sujetos a confirmación y disponibilidad. Confirma tu pedido con la sede por WhatsApp.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="skeleton h-[60vh] rounded-3xl" />}>
          <CatalogClient products={products} />
        </Suspense>
      </div>
    </div>
  )
}
