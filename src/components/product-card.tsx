'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Check, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useCart } from './cart/cart-provider'
import { toast } from './ui/toaster'
import { formatCOPClient } from '@/lib/format'
import type { PublicProduct } from '@/lib/data'

export function ProductCard({ p, priority = false }: { p: PublicProduct; priority?: boolean }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-plum/10 bg-white transition duration-300 hover:-translate-y-1.5 hover:border-plum hover:shadow-[8px_8px_0_0_#E11D74]">
      <Link href={`/catalogo/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-plum-soft" aria-label={`Ver ${p.name}`}>
        {p.image ? (
          <Image src={p.image.url} alt={p.image.alt} fill sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw" priority={priority} className="object-cover transition duration-700 group-hover:scale-110" />
        ) : (
          <div className="dots grid h-full place-items-center font-display text-5xl font-extrabold text-plum/25">{p.name.slice(0, 1)}</div>
        )}
        {!p.inStock && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white">Consultar stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-dark">{[p.brand, p.category].filter(Boolean).join(' · ') || 'Producto'}</p>
        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-plum">
          <Link href={`/catalogo/${p.slug}`} className="after:absolute after:inset-0 after:content-none">{p.name}</Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="font-display text-2xl font-extrabold text-ink">{formatCOPClient(p.salePrice)}</p>
            {p.unit && <p className="text-xs text-ink/55">por {p.unit}</p>}
          </div>
          {p.colors.length > 0 || p.sizes.length > 0 ? (
            <Link
              href={`/catalogo/${p.slug}`}
              aria-label={`Elegir color o tamaño de ${p.name}`}
              className="relative z-10 grid size-12 place-items-center rounded-2xl bg-brand text-white transition hover:scale-110 hover:bg-plum active:scale-95"
            >
              <SlidersHorizontal className="size-5" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                add({ id: p.id, slug: p.slug, name: p.name, sku: p.sku, price: p.salePrice, image: p.image?.url })
                setDone(true)
                toast(`"${p.name}" agregado al carrito`)
                setTimeout(() => setDone(false), 1400)
              }}
              aria-label={`Agregar ${p.name} al carrito`}
              className="relative z-10 grid size-12 place-items-center rounded-2xl bg-brand text-white transition hover:scale-110 hover:bg-plum active:scale-95"
            >
              {done ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
