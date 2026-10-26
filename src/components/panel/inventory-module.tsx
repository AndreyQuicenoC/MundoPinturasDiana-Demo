'use client'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AlertTriangle, Barcode, ClipboardList, FileText, HelpCircle, Keyboard, Search, Trash2 } from 'lucide-react'
import { registerAdjustment, registerBulkEntries, registerEntry, transferStock } from '@/lib/actions-inventory'
import { parseBulkInventoryText } from '@/lib/inventory-bulk'
import { Combobox } from './combobox'
import { toast } from '@/components/ui/toaster'
import { Empty, Pager, Panel, Select, UrlTabs, btnGhost, btnPrimary, dt, input, money, useDo, type Opt, type Row } from './kit'

type Sp = Record<string, string | string[] | undefined>
type Pg = { page: number; totalPages: number; totalDocs: number }
export type ProductOpt = Opt & { hint?: string; origin?: string; sku?: string; barcode?: string }
export type StockRow = { id: string; name: string; sku?: string; origin?: string; unit?: string; min: number; cells: Record<string, number>; total: number }

const TYPE_LABEL: Record<string, string> = {
  entrada_compra: 'Entrada', venta: 'Venta', ajuste_positivo: 'Ajuste +', ajuste_negativo: 'Ajuste −', merma: 'Merma / daño',
  devolucion: 'Devolución', anulacion: 'Anulación', traslado_entrada: 'Traslado entrada', traslado_salida: 'Traslado salida',
}
const TYPE_TONE: Record<string, string> = {
  entrada_compra: 'bg-emerald-100 text-emerald-800', traslado_entrada: 'bg-emerald-100 text-emerald-800',
  venta: 'bg-rose-100 text-rose-700', merma: 'bg-rose-100 text-rose-700', traslado_salida: 'bg-rose-100 text-rose-700',
  ajuste_positivo: 'bg-amber-100 text-amber-800', ajuste_negativo: 'bg-amber-100 text-amber-800',
  devolucion: 'bg-cyan-100 text-cyan-800', anulacion: 'bg-slate-200 text-slate-700',
}
const TypeBadge = ({ v }: { v: string }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_TONE[v] ?? 'bg-plum-soft text-plum'}`}>{TYPE_LABEL[v] ?? v}</span>
const OriginBadge = ({ v }: { v?: string }) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${v === 'fabricado' ? 'bg-violet-100 text-violet-800' : 'bg-sky-100 text-sky-800'}`}>{v === 'fabricado' ? 'Fabricado' : 'Comprado'}</span>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Filtros guardados en la URL (reinician la página). */
function Filters({ sp, fields }: { sp: Sp; fields: { key: string; label: string; type: 'text' | 'date' | 'select'; opts?: Opt[]; placeholder?: string }[] }) {
  const router = useRouter(), path = usePathname()
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, one(sp[f.key])])))
  const apply = (next = v) => {
    const q = new URLSearchParams()
    for (const [k, val] of Object.entries(sp)) if (val != null && k !== 'page' && !fields.some((f) => f.key === k)) q.set(k, one(val))
    for (const f of fields) if (next[f.key]) q.set(f.key, next[f.key])
    router.push(`${path}?${q.toString()}`, { scroll: false })
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); apply() }} className="mb-4 flex flex-wrap items-end gap-3">
      {fields.map((f) => (
        <label key={f.key} className="text-xs font-semibold text-ink/70">{f.label}
          {f.type === 'select'
            ? <Select value={v[f.key]} onChange={(x) => { const n = { ...v, [f.key]: x }; setV(n); apply(n) }} opts={f.opts ?? []} empty="Todos" />
            : <input type={f.type} value={v[f.key]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className={`${input} w-44`} />}
        </label>
      ))}
      <button title="Aplicar filtros" aria-label="Aplicar filtros" className={`${btnGhost} gap-1.5`}><Search size={15} /> Filtrar</button>
    </form>
  )
}

export type KardexRow = { id: string; createdAt: string; product: string; branch: string; type: string; quantity: number; delta: number; before: number; after: number; unitCost?: number | null; supplier?: string; reference?: string; reason?: string; actor?: string }

export function InventoryModule({ tab, sp, stock, shownBranches, low, kardex, products, branches, suppliers, canWrite, pg }: {
  tab: string; sp: Sp; stock: StockRow[]; shownBranches: Opt[]; low: { count: number; names: string[] }; kardex: KardexRow[]; products: ProductOpt[]; branches: Opt[]; suppliers: Opt[]; canWrite: boolean; pg: Pg
}) {
  const tabs = [{ id: 'stock', label: 'Existencias' }, { id: 'kardex', label: 'Historial de movimientos' }, ...(canWrite ? [{ id: 'entrada', label: 'Registrar entrada' }, { id: 'ajuste', label: 'Ajuste / merma' }, { id: 'traslado', label: 'Traslado' }] : [])]
  const cur = tabs.some((t) => t.id === tab) ? tab : 'stock'
  return (
    <div className="space-y-5">
      {low.count > 0 && (
        <p role="status" className="flex items-start gap-2 rounded-xl border-2 border-sun bg-sun/20 p-3 text-sm font-medium">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {low.count} existencia{low.count > 1 ? 's' : ''} en o bajo el stock mínimo: {low.names.slice(0, 4).join(', ')}{low.count > 4 ? '…' : ''}
        </p>
      )}
      <UrlTabs value={cur} tabs={tabs} sp={sp} />
      {cur === 'stock' && <Stock sp={sp} stock={stock} cols={shownBranches} branches={branches} pg={pg} />}
      {cur === 'kardex' && <Kardex sp={sp} rows={kardex} branches={branches} pg={pg} />}
      {cur === 'entrada' && canWrite && <EntryHub products={products} branches={branches} suppliers={suppliers} />}
      {cur === 'ajuste' && canWrite && <Adjust products={products} branches={branches} />}
      {cur === 'traslado' && canWrite && <Transfer products={products} branches={branches} />}
    </div>
  )
}

function Stock({ sp, stock, cols, branches, pg }: { sp: Sp; stock: StockRow[]; cols: Opt[]; branches: Opt[]; pg: Pg }) {
  return (
    <>
      <Filters sp={sp} fields={[{ key: 'q', label: 'Buscar producto', type: 'text', placeholder: 'Nombre o código' }, { key: 'sede', label: 'Sede', type: 'select', opts: branches }]} />
      {stock.length ? (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr><th className="px-4 py-3">Producto</th><th>Origen</th>{cols.map((b) => <th key={b.id} className="text-right">{b.label}</th>)}<th className="text-right">Total</th><th className="px-4 text-right">Mínimo</th></tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {stock.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-semibold">{s.name}{s.sku && <span className="ml-2 text-xs font-normal text-ink/50">{s.sku}</span>}</td>
                  <td><OriginBadge v={s.origin} /></td>
                  {cols.map((b) => {
                    const q = s.cells[b.id] ?? 0, isLow = q <= s.min
                    return <td key={b.id} className={`text-right font-extrabold ${isLow ? 'text-rose-600' : ''}`}>{isLow && <span className="mr-1.5 inline-block rounded bg-rose-100 px-1.5 text-[10px] font-bold uppercase text-rose-700">{q === 0 ? 'Agotado' : 'Bajo'}</span>}{q}</td>
                  })}
                  <td className="text-right font-bold">{s.total}</td>
                  <td className="px-4 text-right text-ink/55">{s.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text="No hay productos que coincidan. Crea productos en el módulo Productos y aparecerán aquí." />}
      <Pager {...pg} sp={sp} />
    </>
  )
}

function Kardex({ sp, rows, branches, pg }: { sp: Sp; rows: KardexRow[]; branches: Opt[]; pg: Pg }) {
  const typeOpts = Object.entries(TYPE_LABEL).map(([id, label]) => ({ id, label }))
  return (
    <>
      <Filters sp={sp} fields={[{ key: 'type', label: 'Tipo', type: 'select', opts: typeOpts }, { key: 'sede', label: 'Sede', type: 'select', opts: branches }, { key: 'desde', label: 'Desde', type: 'date' }, { key: 'hasta', label: 'Hasta', type: 'date' }]} />
      <p className="mb-3 flex flex-wrap gap-2 text-xs" aria-label="Leyenda de tipos">
        {['entrada_compra', 'venta', 'ajuste_positivo', 'devolucion', 'anulacion'].map((t) => <TypeBadge key={t} v={t} />)}
      </p>
      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum"><tr><th className="px-4 py-3">Fecha</th><th>Producto</th><th>Sede</th><th>Tipo</th><th className="text-right">Cant.</th><th className="text-right">Anterior</th><th className="text-right">Nuevo</th><th className="text-right">Costo</th><th>Proveedor</th><th>Referencia / motivo</th><th className="px-4">Responsable</th></tr></thead>
            <tbody className="divide-y divide-plum/10">
              {rows.map((x) => (
                <tr key={x.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{dt(x.createdAt)}</td><td className="font-semibold">{x.product}</td><td>{x.branch}</td><td><TypeBadge v={x.type} /></td>
                  <td className={`text-right font-bold ${x.delta > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{x.delta > 0 ? '+' : '−'}{x.quantity}</td>
                  <td className="text-right text-ink/60">{x.before}</td><td className="text-right">{x.after}</td>
                  <td className="text-right">{x.unitCost != null ? money(x.unitCost) : '—'}</td><td className="text-xs">{x.supplier || '—'}</td>
                  <td className="max-w-48 truncate text-xs" title={[x.reference, x.reason].filter(Boolean).join(' · ')}>{[x.reference, x.reason].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-4 text-xs">{x.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text="Aún no hay movimientos." />}
      <Pager {...pg} sp={sp} />
    </>
  )
}

type EntryMode = 'manual' | 'barcode' | 'bulk'

const resolveProduct = (products: ProductOpt[], code: string) => {
  const c = code.trim().toLowerCase()
  if (!c) return undefined
  return products.find((p) => p.sku?.toLowerCase() === c || p.barcode?.toLowerCase() === c || String(p.id).toLowerCase() === c)
}

function EntryHub({ products, branches, suppliers }: { products: ProductOpt[]; branches: Opt[]; suppliers: Opt[] }) {
  const [mode, setMode] = useState<EntryMode>('manual')
  const tabs: { id: EntryMode; label: string; icon: ReactNode }[] = [
    { id: 'manual', label: 'Manual', icon: <Keyboard size={15} aria-hidden /> },
    { id: 'barcode', label: 'Código de barras', icon: <Barcode size={15} aria-hidden /> },
    { id: 'bulk', label: 'Carga rápida', icon: <ClipboardList size={15} aria-hidden /> },
  ]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Modo de entrada">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => setMode(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${mode === t.id ? 'bg-plum text-white' : 'border-2 border-plum/15 text-plum hover:bg-plum-soft'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {mode === 'manual' && <ManualEntry products={products} branches={branches} suppliers={suppliers} />}
      {mode === 'barcode' && <BarcodeEntry products={products} branches={branches} suppliers={suppliers} />}
      {mode === 'bulk' && <BulkEntry products={products} branches={branches} suppliers={suppliers} />}
    </div>
  )
}

function SharedMeta({ branch, setBranch, supplier, setSupplier, reference, setReference, notes, setNotes, branches, suppliers, needSupplier }: {
  branch: string; setBranch: (v: string) => void; supplier: string; setSupplier: (v: string) => void
  reference: string; setReference: (v: string) => void; notes: string; setNotes: (v: string) => void
  branches: Opt[]; suppliers: Opt[]; needSupplier: boolean
}) {
  return (
    <>
      <label className="text-sm font-semibold">Sede<Select value={branch} onChange={setBranch} opts={branches} /></label>
      <div className="text-sm font-semibold">Proveedor{needSupplier ? ' *' : ' (opcional)'}
        <Combobox required={needSupplier} value={supplier} onChange={setSupplier} opts={suppliers} label="Proveedor" placeholder="Buscar proveedor…" />
      </div>
      <label className="text-sm font-semibold">Documento / referencia<input value={reference} placeholder="Factura, remisión…" onChange={(e) => setReference(e.target.value)} className={input} /></label>
      <label className="text-sm font-semibold sm:col-span-2">Observaciones<input value={notes} onChange={(e) => setNotes(e.target.value)} className={input} /></label>
    </>
  )
}

function ManualEntry({ products, branches, suppliers }: { products: ProductOpt[]; branches: Opt[]; suppliers: Opt[] }) {
  const blank = { product: '', branch: branches[0]?.id ?? '', quantity: '1', supplier: '', unitCost: '', reference: '', notes: '' }
  const [m, setM] = useState(blank)
  const { run, pending } = useDo()
  const p = products.find((x) => x.id === m.product)
  const needSupplier = !!p && p.origin !== 'fabricado'
  return (
    <Panel title="Entrada manual">
      <form onSubmit={(e) => { e.preventDefault(); run(() => registerEntry({ ...m, quantity: Number(m.quantity) }), () => setM({ ...blank, branch: m.branch })) }} className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm font-semibold sm:col-span-2">Producto<Combobox required value={m.product} onChange={(v) => setM({ ...m, product: v })} opts={products} label="Producto" placeholder="Buscar producto…" /></div>
        <label className="text-sm font-semibold">Cantidad<input type="number" min={1} step={1} required value={m.quantity} onChange={(e) => setM({ ...m, quantity: e.target.value })} className={input} /></label>
        <label className="text-sm font-semibold">Costo unitario<input type="number" min={0} value={m.unitCost} onChange={(e) => setM({ ...m, unitCost: e.target.value })} className={input} /></label>
        <SharedMeta branch={m.branch} setBranch={(v) => setM({ ...m, branch: v })} supplier={m.supplier} setSupplier={(v) => setM({ ...m, supplier: v })} reference={m.reference} setReference={(v) => setM({ ...m, reference: v })} notes={m.notes} setNotes={(v) => setM({ ...m, notes: v })} branches={branches} suppliers={suppliers} needSupplier={needSupplier} />
        <div className="sm:col-span-2"><button disabled={pending} title="Registrar entrada" aria-label="Registrar entrada" className={btnPrimary}>Registrar entrada</button></div>
      </form>
    </Panel>
  )
}

type ScanRow = { productId: string; name: string; sku?: string; qty: number; unitCost?: string }

function BarcodeEntry({ products, branches, suppliers }: { products: ProductOpt[]; branches: Opt[]; suppliers: Opt[] }) {
  const [branch, setBranch] = useState(branches[0]?.id ?? '')
  const [supplier, setSupplier] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [code, setCode] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [rows, setRows] = useState<ScanRow[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { run, pending } = useDo()
  const needSupplier = useMemo(() => rows.some((r) => products.find((p) => p.id === r.productId)?.origin !== 'fabricado'), [rows, products])

  const addScan = () => {
    const prod = resolveProduct(products, code)
    if (!prod) { toast('Código no encontrado. Usa SKU o código de barras registrado.', 'error'); return }
    const cost = unitCost.trim() ? Number(unitCost) : undefined
    setRows((prev) => {
      const i = prev.findIndex((x) => x.productId === prod.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: next[i].qty + 1, unitCost: unitCost || next[i].unitCost }
        return next
      }
      return [...prev, { productId: prod.id, name: prod.label, sku: prod.sku, qty: 1, unitCost: unitCost || undefined }]
    })
    setCode('')
    inputRef.current?.focus()
  }

  const commit = () => {
    if (!rows.length) return
    run(
      () => registerBulkEntries({
        branch, supplier: supplier || undefined, reference, notes,
        lines: rows.map((r) => ({ product: r.productId, quantity: r.qty, unitCost: r.unitCost ? Number(r.unitCost) : undefined })),
      }),
      () => { setRows([]); setReference(''); setNotes('') },
    )
  }

  return (
    <Panel title="Entrada por código de barras">
      <p className="mb-4 text-sm text-ink/60">Conecta el lector USB (modo teclado), elige sede y proveedor, y escanea. Cada lectura suma una unidad al producto.</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SharedMeta branch={branch} setBranch={setBranch} supplier={supplier} setSupplier={setSupplier} reference={reference} setReference={setReference} notes={notes} setNotes={setNotes} branches={branches} suppliers={suppliers} needSupplier={needSupplier} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); addScan() }}
        className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-cyan/40 bg-cyan/5 p-4 sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-sm font-semibold">
          Escanear o escribir código
          <input ref={inputRef} autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="SKU / código de barras" className={`${input} mt-1 font-mono`} title="El lector USB escribe aquí y envía Enter" />
        </label>
        <label className="w-full text-sm font-semibold sm:w-36">
          Costo (opcional)
          <input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className={`${input} mt-1`} />
        </label>
        <button type="submit" className={`${btnGhost} shrink-0`} title="Agregar lectura">Agregar</button>
      </form>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border-2 border-plum/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum"><tr><th className="px-3 py-2">Producto</th><th>SKU</th><th className="text-right">Cantidad</th><th className="px-3 text-right">Acción</th></tr></thead>
            <tbody className="divide-y divide-plum/10">
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td className="px-3 py-2 font-semibold">{r.name}</td>
                  <td className="font-mono text-xs text-ink/60">{r.sku ?? '—'}</td>
                  <td className="text-right font-bold">{r.qty}</td>
                  <td className="px-3 text-right">
                    <button type="button" aria-label="Quitar" title="Quitar" onClick={() => setRows((x) => x.filter((y) => y.productId !== r.productId))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/55">Aún no hay lecturas. Escanea el primer producto para ver el listado.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={pending || !rows.length} onClick={commit} className={btnPrimary} title="Registrar todas las entradas">Registrar {rows.length} producto{rows.length === 1 ? '' : 's'}</button>
      </div>
    </Panel>
  )
}

function BulkEntry({ products, branches, suppliers }: { products: ProductOpt[]; branches: Opt[]; suppliers: Opt[] }) {
  const [branch, setBranch] = useState(branches[0]?.id ?? '')
  const [supplier, setSupplier] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [text, setText] = useState('')
  const { run, pending } = useDo()
  const preview = useMemo(() => {
    const { lines, errors } = parseBulkInventoryText(text)
    const resolved = lines.map((l) => {
      const p = resolveProduct(products, l.sku)
      return { ...l, product: p, error: p ? undefined : `SKU «${l.sku}» no encontrado` }
    })
    return { lines: resolved, errors: [...errors, ...resolved.map((r) => r.error).filter(Boolean) as string[]] }
  }, [text, products])
  const needSupplier = preview.lines.some((l) => l.product && l.product.origin !== 'fabricado')

  const submit = () => {
    const ok = preview.lines.filter((l) => l.product)
    if (!ok.length) return
    if (preview.errors.length) return
    run(
      () => registerBulkEntries({
        branch, supplier: supplier || undefined, reference, notes,
        lines: ok.map((l) => ({ product: l.product!.id, quantity: l.quantity, unitCost: l.unitCost })),
      }),
      () => setText(''),
    )
  }

  return (
    <Panel title="Carga rápida desde texto">
      <p className="mb-4 text-sm text-ink/60">Pega líneas en formato SKU - CANTIDAD - costo unitario. Ideal para transcribir ítems de una factura.</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SharedMeta branch={branch} setBranch={setBranch} supplier={supplier} setSupplier={setSupplier} reference={reference} setReference={setReference} notes={notes} setNotes={setNotes} branches={branches} suppliers={suppliers} needSupplier={needSupplier} />
      </div>
      <p className="mb-2 flex items-start gap-2 text-xs text-ink/60">
        <HelpCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
        Ejemplo: <span className="font-mono">VIN-BLAN-1GL - 12 - 45000, ESM-ROJ-CUA - 6 - 18000</span> (separador <FileText size={12} className="inline" aria-hidden /> coma o salto de línea).
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="SKU - CANTIDAD - costo unitario&#10;SKU - CANTIDAD - costo unitario" className={`${input} min-h-[140px] w-full font-mono text-xs`} />
      {preview.errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-rose-700">{preview.errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
      {preview.lines.length > 0 && !preview.errors.length && (
        <p className="mt-2 text-xs font-semibold text-emerald-800">{preview.lines.length} línea{preview.lines.length > 1 ? 's' : ''} lista{preview.lines.length > 1 ? 's' : ''} para registrar.</p>
      )}
      <div className="mt-4">
        <button type="button" disabled={pending || !preview.lines.length || preview.errors.length > 0} onClick={submit} className={btnPrimary}>Registrar entradas</button>
      </div>
    </Panel>
  )
}

function Adjust({ products, branches }: { products: ProductOpt[]; branches: Opt[] }) {
  const blank = { product: '', branch: branches[0]?.id ?? '', type: 'ajuste_negativo', quantity: '1', reason: '' }
  const [m, setM] = useState(blank)
  const { run, pending } = useDo()
  const sign = m.type === 'ajuste_positivo' ? '+' : '−'
  return (
    <Panel title="Ajuste, merma o daño">
      <form onSubmit={(e) => { e.preventDefault(); run(() => registerAdjustment({ ...m, quantity: Number(m.quantity) }), () => setM({ ...blank, branch: m.branch, type: m.type })) }} className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm font-semibold sm:col-span-2">Producto<Combobox required value={m.product} onChange={(v) => setM({ ...m, product: v })} opts={products} label="Producto" placeholder="Buscar producto…" /></div>
        <label className="text-sm font-semibold">Sede<Select value={m.branch} onChange={(v) => setM({ ...m, branch: v })} opts={branches} /></label>
        <label className="text-sm font-semibold">Tipo<Select value={m.type} onChange={(v) => setM({ ...m, type: v })} opts={[{ id: 'ajuste_positivo', label: 'Ajuste positivo (+)' }, { id: 'ajuste_negativo', label: 'Ajuste negativo (−)' }, { id: 'merma', label: 'Merma / daño (−)' }]} /></label>
        <label className="text-sm font-semibold">Cantidad<input type="number" min={1} step={1} required value={m.quantity} onChange={(e) => setM({ ...m, quantity: e.target.value })} className={input} /></label>
        <label className="text-sm font-semibold">Motivo (obligatorio)<input required value={m.reason} onChange={(e) => setM({ ...m, reason: e.target.value })} className={input} /></label>
        <p className="text-xs text-ink/60 sm:col-span-2">Impacto: {sign}{Number(m.quantity) || 0} unidades en la sede elegida. Queda en el historial y en auditoría.</p>
        <div className="sm:col-span-2"><button disabled={pending} title="Registrar movimiento" aria-label="Registrar movimiento" className={btnPrimary}>Registrar</button></div>
      </form>
    </Panel>
  )
}

function Transfer({ products, branches }: { products: ProductOpt[]; branches: Opt[] }) {
  const [t, setT] = useState({ product: '', from: branches[0]?.id ?? '', to: branches[1]?.id ?? '', quantity: '1', reason: '' })
  const { run, pending } = useDo()
  return (
    <Panel title="Traslado entre sedes">
      {branches.length < 2 ? <Empty text="Necesitas al menos dos sedes activas para hacer traslados." /> : (
        <form onSubmit={(e) => { e.preventDefault(); run(() => transferStock({ ...t, quantity: Number(t.quantity) }), () => setT({ ...t, quantity: '1', reason: '' })) }} className="grid gap-4 sm:grid-cols-2">
          <div className="text-sm font-semibold sm:col-span-2">Producto<Combobox required value={t.product} onChange={(v) => setT({ ...t, product: v })} opts={products} label="Producto" placeholder="Buscar producto…" /></div>
          <label className="text-sm font-semibold">Desde<Select value={t.from} onChange={(v) => setT({ ...t, from: v })} opts={branches} /></label>
          <label className="text-sm font-semibold">Hacia<Select value={t.to} onChange={(v) => setT({ ...t, to: v })} opts={branches} /></label>
          <label className="text-sm font-semibold">Cantidad<input type="number" min={1} step={1} required value={t.quantity} onChange={(e) => setT({ ...t, quantity: e.target.value })} className={input} /></label>
          <label className="text-sm font-semibold">Motivo<input value={t.reason} onChange={(e) => setT({ ...t, reason: e.target.value })} className={input} /></label>
          <div className="sm:col-span-2"><button disabled={pending} title="Trasladar" aria-label="Trasladar" className={btnPrimary}>Trasladar</button></div>
        </form>
      )}
    </Panel>
  )
}
