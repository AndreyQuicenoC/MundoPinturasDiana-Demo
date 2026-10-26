'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag, AlertTriangle } from 'lucide-react'
import { useCart } from './cart-provider'
import { toast } from '../ui/toaster'
import { formatCOPClient } from '@/lib/format'
import { checkCart, submitOrder, type CheckedLine } from '@/app/(frontend)/(site)/carrito/actions'

type Branch = { id: number | string; name: string; address: string; whatsapp?: string | null }

export function CartClient({ branches }: { branches: Branch[] }) {
  const { lines, ready, subtotal, setQty, remove, replace, clear } = useCart()
  const [checked, setChecked] = useState<Record<string, CheckedLine>>({})
  const [branchId, setBranchId] = useState(String(branches[0]?.id ?? ''))
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!ready || !lines.length) return
    checkCart(lines.map((l) => ({ id: l.id, quantity: l.quantity }))).then((res) => {
      const map: Record<string, CheckedLine> = {}
      res.forEach((r) => (map[String(r.id)] = r))
      setChecked(map)
      const gone = res.filter((r) => !r.exists)
      const changed = res.filter((r) => r.exists && lines.find((l) => String(l.id) === String(r.id))?.price !== r.price)
      if (gone.length || changed.length) {
        replace(lines.filter((l) => !gone.some((g) => String(g.id) === String(l.id))).map((l) => ({ ...l, price: res.find((r) => String(r.id) === String(l.id))?.price ?? l.price })))
        if (gone.length) toast('Quitamos del carrito productos que ya no están disponibles.', 'info')
        if (changed.length) toast('Actualizamos precios del carrito con los valores vigentes.', 'info')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (!ready) return <div className="skeleton h-72 rounded-3xl" />
  if (!lines.length)
    return (
      <div className="stripes rounded-3xl border-2 border-dashed border-plum/30 p-16 text-center">
        <ShoppingBag className="mx-auto size-12 text-brand" aria-hidden />
        <p className="mt-4 font-display text-3xl font-bold text-plum">Tu carrito está vacío</p>
        <p className="mt-1 text-ink/65">Explora el catálogo y agrega lo que necesites.</p>
        <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-brand px-7 py-3.5 font-bold text-white">Ir al catálogo</Link>
      </div>
    )

  const unavailable = lines.filter((l) => checked[String(l.id)] && !checked[String(l.id)].available)

  const send = () => {
    setErr('')
    start(async () => {
      const r = await submitOrder({ name, phone, branchId, items: lines.map((l) => ({ id: l.id, quantity: l.quantity, color: l.color, size: l.size })) })
      if (!r.ok) return setErr(r.error)
      if (!window.open(r.url, '_blank', 'noopener')) window.location.href = r.url
      clear()
      toast('Pedido registrado. Continúa la conversación en WhatsApp.')
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <ul className="space-y-4">
        {lines.map((l) => {
          const c = checked[String(l.id)]
          return (
            <li key={l.key} className="flex gap-4 rounded-3xl border-2 border-plum/10 bg-white p-4 transition hover:border-plum/30">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-plum-soft">
                {l.image ? <Image src={l.image} alt="" fill sizes="96px" className="object-cover" /> : <div className="dots h-full" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/catalogo/${l.slug}`} className="font-display text-lg font-bold leading-tight text-plum hover:text-brand">{l.name}</Link>
                <p className="font-mono text-xs text-ink/50">Ref. {l.sku}</p>
                {(l.color || l.size) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs font-semibold text-plum">
                    {l.color && <span>Color: {l.color}</span>}
                    {l.size && <span>Tamaño: {l.size}</span>}
                  </p>
                )}
                {c && !c.available && <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-dark"><AlertTriangle className="size-3.5" aria-hidden />Sujeto a disponibilidad</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border-2 border-plum/20">
                    <button aria-label={`Disminuir ${l.name}`} onClick={() => setQty(l.key, l.quantity - 1)} className="grid size-9 place-items-center text-plum"><Minus className="size-4" /></button>
                    <span className="w-8 text-center text-sm font-bold" aria-live="polite">{l.quantity}</span>
                    <button aria-label={`Aumentar ${l.name}`} onClick={() => setQty(l.key, l.quantity + 1)} className="grid size-9 place-items-center text-plum"><Plus className="size-4" /></button>
                  </div>
                  <p className="font-display text-xl font-extrabold">{formatCOPClient(l.price * l.quantity)}</p>
                </div>
              </div>
              <button aria-label={`Quitar ${l.name}`} onClick={() => { remove(l.key); toast('Producto quitado') }} className="self-start text-ink/40 transition hover:text-brand"><Trash2 className="size-5" /></button>
            </li>
          )
        })}
      </ul>

      <aside className="h-fit rounded-3xl border-2 border-plum bg-white p-6 shadow-[8px_8px_0_0_#E11D74] lg:sticky lg:top-28">
        <h2 className="font-display text-2xl font-extrabold text-plum">Resumen</h2>
        <dl className="mt-4 flex items-baseline justify-between border-b border-plum/10 pb-4">
          <dt className="text-ink/70">Total estimado</dt>
          <dd className="font-display text-3xl font-extrabold">{formatCOPClient(subtotal)}</dd>
        </dl>
        <p className="mt-3 rounded-xl bg-sun/30 p-3 text-xs font-medium text-ink">Precios sujetos a confirmación y disponibilidad.</p>
        {unavailable.length > 0 && <p className="mt-3 text-xs text-brand-dark">Algunos productos aparecen sin existencias; la sede te confirmará.</p>}

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-bold">Sede
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-1.5 w-full rounded-xl border-2 border-plum/15 px-3 py-3 outline-none focus:border-cyan">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">Tu nombre
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className="mt-1.5 w-full rounded-xl border-2 border-plum/15 px-3 py-3 outline-none focus:border-cyan" />
          </label>
          <label className="block text-sm font-bold">Teléfono
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} className="mt-1.5 w-full rounded-xl border-2 border-plum/15 px-3 py-3 outline-none focus:border-cyan" />
          </label>
        </div>
        <p className="mt-3 text-xs text-ink/55">Usaremos tus datos solo para atender este pedido (Ley 1581 de 2012).</p>
        {err && <p role="alert" className="mt-3 rounded-xl bg-brand/10 p-3 text-sm font-semibold text-brand-dark">{err}</p>}
        <button onClick={send} disabled={pending || !branches.length} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1FA855] py-4 font-bold text-white transition hover:brightness-110 disabled:opacity-60">
          <MessageCircle className="size-5" aria-hidden /> {pending ? 'Preparando…' : 'Enviar pedido por WhatsApp'}
        </button>
        <button onClick={() => { clear(); toast('Carrito vaciado', 'info') }} className="mt-3 w-full text-sm font-bold text-ink/55 hover:text-brand">Vaciar carrito</button>
      </aside>
    </div>
  )
}
