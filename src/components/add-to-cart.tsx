'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from './cart/cart-provider'
import { toast } from './ui/toaster'
import type { PublicProduct } from '@/lib/data'

export function AddToCart({ product: p }: { product: PublicProduct }) {
  const { add } = useCart()
  const [q, setQ] = useState(1)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const needColor = p.colors.length > 0
  const needSize = p.sizes.length > 0
  const submit = () => {
    if (needColor && !color) return toast('Elige un color para continuar.', 'error')
    if (needSize && !size) return toast('Elige un tamaño para continuar.', 'error')
    add({ id: p.id, slug: p.slug, name: p.name, sku: p.sku, price: p.salePrice, image: p.image?.url, color, size }, q)
    toast(`${q} × "${p.name}"${[color, size].filter(Boolean).length ? ` (${[color, size].filter(Boolean).join(', ')})` : ''} en tu carrito`)
  }
  return (
    <>
    {needColor && (
      <fieldset className="mt-8">
        <legend className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Color{color ? ` · ${color}` : ''}</legend>
        <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Colores disponibles">
          {p.colors.map((c) => {
            const on = color === c.name
            return (
              <button key={c.name} type="button" aria-pressed={on} aria-label={c.name} title={c.name} onClick={() => setColor(on ? null : c.name)}
                className={`relative grid size-11 place-items-center rounded-full border-2 transition hover:scale-110 ${on ? 'border-plum ring-4 ring-brand/40' : 'border-plum/20'}`} style={{ backgroundColor: c.hex }}>
                {on && <Check className="size-5 text-white mix-blend-difference" aria-hidden />}
              </button>
            )
          })}
        </div>
      </fieldset>
    )}
    {needSize && (
      <fieldset className="mt-6">
        <legend className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tamaño{size ? ` · ${size}` : ''}</legend>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tamaños disponibles">
          {p.sizes.map((z) => {
            const on = size === z
            return (
              <button key={z} type="button" aria-pressed={on} onClick={() => setSize(on ? null : z)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${on ? 'border-plum bg-plum text-white' : 'border-plum/20 text-plum hover:border-plum'}`}>
                {z}
              </button>
            )
          })}
        </div>
      </fieldset>
    )}
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border-2 border-plum">
        <button type="button" aria-label="Disminuir cantidad" onClick={() => setQ((v) => Math.max(1, v - 1))} className="grid size-12 place-items-center text-plum hover:text-brand"><Minus className="size-4" /></button>
        <input aria-label="Cantidad" inputMode="numeric" value={q} onChange={(e) => setQ(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, '')) || 1)))} className="w-12 bg-transparent text-center font-bold outline-none" />
        <button type="button" aria-label="Aumentar cantidad" onClick={() => setQ((v) => Math.min(999, v + 1))} className="grid size-12 place-items-center text-plum hover:text-brand"><Plus className="size-4" /></button>
      </div>
      <button
        type="button"
        onClick={submit}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-bold text-white shadow-[5px_5px_0_0_#4A154B] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#4A154B]"
      >
        <ShoppingBag className="size-5" aria-hidden /> Agregar al carrito
      </button>
      <Link href="/carrito" className="font-bold text-plum underline decoration-brand decoration-2 underline-offset-4">Ir al carrito</Link>
    </div>
    </>
  )
}
