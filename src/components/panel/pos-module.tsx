'use client'
import { useMemo, useState } from 'react'
import { Minus, Palette, Plus, Search, Trash2 } from 'lucide-react'
import { createPosSale } from '@/lib/actions-sales'
import { Badge, Empty, Panel, Select, btnPrimary, input, money, useDo, type Opt } from './kit'

type P = { id: string; name: string; sku: string; salePrice: number; stock: Record<string, number>; colors: string[]; sizes: string[]; artistic: boolean }
type C = Opt & { name: string; document: string; email: string; phone: string; address: string }
type Line = { uid: number; p: P; qty: number; disc: number; color: string; size: string }
type Pay = { method: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'; bankAccount: string; amount: number }

let uid = 1
const emptyPay = (): Pay => ({ method: 'efectivo', bankAccount: '', amount: 0 })

export function PosModule({ products, branches, clients, banks, defaultBranch, role }: { products: P[]; branches: Opt[]; clients: C[]; banks: Opt[]; defaultBranch: string; role: string }) {
  const [branch, setBranch] = useState(defaultBranch || branches[0]?.id || '')
  const [q, setQ] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [client, setClient] = useState('')
  const [pays, setPays] = useState<Pay[]>([emptyPay()])
  const [notes, setNotes] = useState('')
  const [dom, setDom] = useState(false)
  const [d, setD] = useState({ name: '', phone: '', address: '', fee: '' })
  const [fe, setFe] = useState(false)
  const [b, setB] = useState({ name: '', document: '', email: '' })
  const [err, setErr] = useState('')
  const { run, pending } = useDo()
  const maxDisc = role === 'empleado' ? 10 : 100

  const found = useMemo(() => {
    const t = q.trim().toLowerCase()
    return products.filter((p) => !t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)).slice(0, 12)
  }, [products, q])

  const lineTotal = (l: Line) => Math.round(l.p.salePrice * l.qty * (1 - l.disc / 100))
  const total = lines.reduce((a, l) => a + lineTotal(l), 0)
  const artistic = lines.filter((l) => l.p.artistic).reduce((a, l) => a + lineTotal(l), 0)
  const paid = pays.reduce((a, p) => a + (Number(p.amount) || 0), 0)
  const stockOf = (p: P) => p.stock[branch] ?? 0
  const usedOf = (pid: string) => lines.filter((l) => l.p.id === pid).reduce((a, l) => a + l.qty, 0)
  const hasVariants = (p: P) => p.colors.length > 0 || p.sizes.length > 0

  const add = (p: P) => setLines((s) => {
    const i = hasVariants(p) ? -1 : s.findIndex((l) => l.p.id === p.id)
    if (i >= 0) return s.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + 1, stockOf(p)) } : l))
    if (s.filter((l) => l.p.id === p.id).reduce((a, l) => a + l.qty, 0) >= stockOf(p)) return s
    return [...s, { uid: uid++, p, qty: 1, disc: 0, color: '', size: '' }]
  })
  const upd = (id: number, patch: Partial<Line>) => setLines((s) => s.map((l) => (l.uid === id ? { ...l, ...patch } : l)))
  const setPay = (i: number, patch: Partial<Pay>) => setPays((s) => s.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  const cl = clients.find((c) => c.id === client)
  const pickClient = (id: string) => {
    setClient(id)
    const c = clients.find((x) => x.id === id)
    if (c) {
      if (fe) setB({ name: c.name, document: c.document, email: c.email })
      if (dom) setD((v) => ({ ...v, name: v.name || c.name, phone: v.phone || c.phone, address: v.address || c.address }))
    } else setFe(false)
  }
  const toggleFe = (on: boolean) => { setFe(on); if (on && cl) setB({ name: cl.name, document: cl.document, email: cl.email }) }
  const toggleDom = (on: boolean) => { setDom(on); if (on && cl) setD((v) => ({ ...v, name: v.name || cl.name, phone: v.phone || cl.phone, address: v.address || cl.address })) }

  const issues = [
    !lines.length && 'Agrega al menos un producto.',
    lines.some((l) => usedOf(l.p.id) > stockOf(l.p)) && 'Hay productos sin stock suficiente en esta sede.',
    lines.length > 0 && paid !== total && `Los pagos (${money(paid)}) deben sumar el total (${money(total)}).`,
    pays.some((p) => p.method === 'transferencia' && !p.bankAccount) && 'Elige la cuenta que recibe la transferencia.',
    dom && (!d.name.trim() || !d.phone.trim() || !d.address.trim()) && 'Completa nombre, teléfono y dirección del domicilio.',
    fe && !client && 'La factura electrónica requiere elegir un cliente.',
    fe && (!b.name.trim() || !b.document.trim()) && 'Completa nombre y documento del comprador.',
  ].filter(Boolean) as string[]

  const submit = () => {
    setErr('')
    return run(
      async () => {
        const r = await createPosSale({
          branch, client: client || undefined, notes,
          lines: lines.map((l) => ({ product: l.p.id, quantity: l.qty, discountPct: l.disc, color: l.color || undefined, size: l.size || undefined })),
          payments: pays,
          delivery: dom ? { name: d.name, phone: d.phone, address: d.address, fee: Number(d.fee) || 0 } : null,
          invoice: fe ? { buyerName: b.name, buyerDocument: b.document, buyerEmail: b.email } : null,
        })
        if (!r.ok) setErr(r.error)
        return r
      },
      () => { setLines([]); setPays([emptyPay()]); setNotes(''); setClient(''); setDom(false); setFe(false); setD({ name: '', phone: '', address: '', fee: '' }); setB({ name: '', document: '', email: '' }) },
    )
  }

  const chk = 'flex items-center gap-2 text-sm font-semibold'
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <Panel title="Productos">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <label className="relative">
            <span className="sr-only">Buscar producto</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o SKU…" className={`${input} !mt-0 pl-10`} />
          </label>
          <Select value={branch} onChange={(v) => { setBranch(v); setLines([]) }} opts={branches} aria-label="Sede" title="Sede de la venta" className={`${input} !mt-0`} />
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {found.map((p) => (
            <li key={p.id}>
              <button disabled={stockOf(p) - usedOf(p.id) < 1} onClick={() => add(p)} title={`Agregar ${p.name}`} aria-label={`Agregar ${p.name}`} className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-plum/10 p-3 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-cyan disabled:opacity-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-ink/55">{p.sku} · stock {stockOf(p)}</span>
                  {p.artistic && <span className="mt-0.5 block text-[11px] font-bold text-brand-dark">Artístico · no suma a ventas</span>}
                  {hasVariants(p) && <span className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/55"><Palette size={11} /> con {[p.colors.length && 'colores', p.sizes.length && 'tamaños'].filter(Boolean).join(' y ')}</span>}
                </span>
                <span className="shrink-0 text-sm font-extrabold text-plum">{money(p.salePrice)}</span>
              </button>
            </li>
          ))}
        </ul>
        {!found.length && <Empty text="No hay productos con ese criterio." />}
      </Panel>

      <Panel title="Venta en curso" action={<Badge v={dom ? 'domicilio' : 'mostrador'} />}>
        {lines.length === 0 ? <Empty text="Toca un producto para agregarlo." /> : (
          <ul className="divide-y divide-plum/10">
            {lines.map((l) => (
              <li key={l.uid} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{l.p.name}{l.p.artistic && <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand-dark">Artístico</span>}</p>
                  <button aria-label={`Quitar ${l.p.name}`} title="Quitar de la venta" onClick={() => setLines((s) => s.filter((x) => x.uid !== l.uid))} className="rounded-lg p-1.5 text-brand hover:bg-brand/10"><Trash2 size={15} /></button>
                </div>
                {hasVariants(l.p) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.p.colors.length > 0 && <select aria-label="Color" title="Color" value={l.color} onChange={(e) => upd(l.uid, { color: e.target.value })} className="rounded-lg border-2 border-plum/15 px-2 py-1 text-xs"><option value="">Color (opcional)</option>{l.p.colors.map((c) => <option key={c}>{c}</option>)}</select>}
                    {l.p.sizes.length > 0 && <select aria-label="Tamaño" title="Tamaño" value={l.size} onChange={(e) => upd(l.uid, { size: e.target.value })} className="rounded-lg border-2 border-plum/15 px-2 py-1 text-xs"><option value="">Tamaño (opcional)</option>{l.p.sizes.map((c) => <option key={c}>{c}</option>)}</select>}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center rounded-lg border-2 border-plum/15">
                    <button aria-label="Menos" title="Menos" onClick={() => upd(l.uid, { qty: Math.max(1, l.qty - 1) })} className="p-1.5"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold" aria-live="polite">{l.qty}</span>
                    <button aria-label="Más" title="Más" onClick={() => upd(l.uid, { qty: l.qty + (stockOf(l.p) - usedOf(l.p.id) > 0 ? 1 : 0) })} className="p-1.5"><Plus size={14} /></button>
                  </span>
                  <label className="flex items-center gap-1.5 text-xs">Desc. %
                    <input type="number" min={0} max={maxDisc} value={l.disc} onChange={(e) => upd(l.uid, { disc: Math.min(maxDisc, Math.max(0, Number(e.target.value))) })} className="w-16 rounded-lg border-2 border-plum/15 px-2 py-1" />
                  </label>
                  <span className="ml-auto font-extrabold text-plum">{money(lineTotal(l))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 border-t-2 border-dashed border-plum/15 pt-4">
          <label className="text-xs font-semibold">Cliente (opcional)<Select value={client} onChange={pickClient} opts={clients} empty="Cliente de mostrador" title="Cliente de la venta" /></label>
          <label className={chk}><input type="checkbox" checked={dom} onChange={(e) => toggleDom(e.target.checked)} title="La venta se entrega a domicilio" /> Domicilio</label>
          {dom && (
            <div className="grid gap-2 rounded-xl bg-plum-soft/50 p-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Nombre *<input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold">Teléfono *<input value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Dirección *<input value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Valor del domicilio cobrado (no suma al total de la venta)<input type="number" min={0} value={d.fee} onChange={(e) => setD({ ...d, fee: e.target.value })} className={input} /></label>
            </div>
          )}
          <label className={chk}><input type="checkbox" checked={fe} disabled={!client} onChange={(e) => toggleFe(e.target.checked)} title={client ? 'Solicitar factura electrónica (seguimiento interno)' : 'Elige un cliente para solicitar factura electrónica'} /> Factura electrónica{!client && <span className="text-xs font-normal text-ink/55">(elige un cliente)</span>}</label>
          {fe && (
            <div className="grid gap-2 rounded-xl bg-plum-soft/50 p-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Nombre del comprador *<input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold">Documento / NIT *<input value={b.document} onChange={(e) => setB({ ...b, document: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Correo<input type="email" value={b.email} onChange={(e) => setB({ ...b, email: e.target.value })} className={input} /></label>
              <p className="text-xs text-ink/60 sm:col-span-2">Queda como solicitud pendiente en «Factura electrónica»; se gestiona a mano, sin conexión con la DIAN.</p>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-plum">Pagos</p>
        {pays.map((p, i) => (
          <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
            <select aria-label="Método de pago" title="Método de pago" value={p.method} onChange={(e) => setPay(i, { method: e.target.value as any })} className={`${input} !mt-0`}>
              {['efectivo', 'transferencia', 'tarjeta', 'credito'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input aria-label="Valor" title="Valor pagado" type="number" min={0} value={p.amount || ''} placeholder="Valor" onChange={(e) => setPay(i, { amount: Number(e.target.value) })} className={`${input} !mt-0`} />
            <button aria-label="Pagar el resto" title="Pagar el resto del total" onClick={() => setPay(i, { amount: Math.max(0, total - (paid - (Number(p.amount) || 0))) })} className="rounded-xl bg-plum-soft px-3 text-xs font-bold text-plum">Resto</button>
            {p.method === 'transferencia' && <div className="col-span-3"><Select value={p.bankAccount} onChange={(v) => setPay(i, { bankAccount: v })} opts={banks} empty="Cuenta que recibe…" aria-label="Cuenta" title="Cuenta que recibe" className={`${input} !mt-0`} /></div>}
          </div>
        ))}
        <button onClick={() => setPays((s) => [...s, emptyPay()])} title="Agregar otro método de pago" aria-label="Agregar pago mixto" className="mt-2 text-xs font-bold text-brand">+ Pago mixto</button>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" aria-label="Notas" className={input} />
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/55">Total</p>
            <p className="font-display text-3xl font-extrabold text-plum">{money(total)}</p>
            {artistic > 0 && <p className="text-xs text-brand-dark">Incluye {money(artistic)} artístico (solo en la factura; no suma a ventas)</p>}
          </div>
          <button disabled={pending || issues.length > 0} onClick={submit} title="Registrar la venta" aria-label="Registrar venta" className={btnPrimary}>{pending ? 'Registrando…' : 'Registrar venta'}</button>
        </div>
        {issues.length > 0 && lines.length > 0 && <p className="mt-3 text-xs text-brand-dark" role="status">{issues[0]}</p>}
        {err && <p className="mt-3 rounded-xl bg-brand/10 p-3 text-sm font-semibold text-brand-dark" role="alert">{err}</p>}
      </Panel>
    </div>
  )
}
