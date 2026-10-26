'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Squiggle } from '@/components/ui/splash'
import type { PublicProduct } from '@/lib/data'

export function ProductCarousel({ id, kicker, title, href, products, color = '#00ACC1', empty }: { id: string; kicker: string; title: string; href: string; products: PublicProduct[]; color?: string; empty?: string }) {
  const rail = useRef<HTMLUListElement>(null)
  const go = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * Math.max(280, rail.current.clientWidth * 0.8), behavior: 'smooth' })
  const btn = 'grid size-11 place-items-center rounded-full border-2 border-plum text-plum transition hover:bg-plum hover:text-white'
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-10" aria-labelledby={id}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">{kicker}</p>
          <h2 id={id} className="mt-2 font-display text-3xl font-extrabold text-plum md:text-4xl">{title}</h2>
          <Squiggle className="mt-3 h-4 w-40" color={color} />
        </div>
        <div className="flex items-center gap-3">
          {products.length > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => go(-1)} aria-label={`Anterior en ${title}`} className={btn}><ChevronLeft className="size-5" aria-hidden /></button>
              <button type="button" onClick={() => go(1)} aria-label={`Siguiente en ${title}`} className={btn}><ChevronRight className="size-5" aria-hidden /></button>
            </div>
          )}
          <Link href={href} className="group inline-flex items-center gap-2 font-bold text-brand">Ver todo <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
        </div>
      </div>
      {products.length ? (
        <ul ref={rail} className="-mx-5 mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 pt-1 [scrollbar-width:none] md:-mx-10 md:px-10 [&::-webkit-scrollbar]:hidden">
          {products.map((p) => (
            <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[23.5%]"><ProductCard p={p} /></li>
          ))}
        </ul>
      ) : (
        <div className="stripes mt-8 rounded-3xl border-2 border-dashed border-plum/30 p-10 text-center">
          <Palette className="mx-auto size-9 text-brand" aria-hidden />
          <p className="mt-3 font-display text-xl font-bold text-plum">{empty ?? 'Muy pronto, nuevos productos en esta sección'}</p>
          <p className="mt-1 text-sm text-ink/65">Mientras tanto, mira todo el catálogo o escríbenos.</p>
        </div>
      )}
    </section>
  )
}
