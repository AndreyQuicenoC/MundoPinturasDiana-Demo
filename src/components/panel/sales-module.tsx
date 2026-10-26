'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Ban, ChevronDown, Printer, Undo2 } from 'lucide-react'
import { returnSaleAction, voidSaleAction } from '@/lib/actions-sales'
import { Badge, Empty, Modal, Pager, Panel, btnGhost, btnPrimary, dt, input, money, useDo, type Opt, type Row } from './kit'

type Stats = { month: string; label: string; sales: number; returns: number } | null
type Filters = { mes: string; branch: string; estado: string; desde: string; hasta: string }

export function SalesModule({ sales, page, totalPages, totalDocs, sp, isEmp, canManage, base, branches, filters, stats, openNumber }: {
  sales: Row[]; page: number; totalPages: number; totalDocs: number; sp: Record<string, string | string[] | undefined>
  isEmp: boolean; canManage: boolean; base: string; branches: Opt[]; filters: Filters; stats: Stats; openNumber: number | null
}) {
  const [open, setOpen] = useState<string | null>(openNumber ? (sales.find((s) => s.number === openNumber)?.id ?? null) : null)
  const [voiding, setVoiding] = useState<Row | null>(null)
  const [reason, setReason] = useState('')
  const [ret, setRet] = useState<Row | null>(null)
  const [rp, setRp] = useState({ product: '', qty: 1, reason: '' })
  const { run, pending } = useDo()
  const pid = (v: any) => v?.id ?? v

  return (
    <div>
      {stats && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <Panel><p className="text-xs font-bold uppercase tracking-wider text-ink/55">Ventas del mes · <span className="capitalize">{stats.label}</span></p><p className="mt-1 font-display text-3xl font-extrabold text-plum">{money(stats.sales)}</p><p className="mt-1 text-xs text-ink/55">No incluye anuladas ni productos artísticos.</p></Panel>
          <Panel><p className="text-xs font-bold uppercase tracking-wider text-ink/55">Devoluciones del mes</p><p className="mt-1 font-display text-3xl font-extrabold text-plum">{money(stats.returns)}</p></Panel>
        </div>
      )}

      {canManage && (
        <form method="get" className="mb-5 grid gap-3 rounded-2xl border-2 border-plum/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs font-semibold">Mes (estadísticas)<input type="month" name="mes" defaultValue={filters.mes} className={input} title="Mes de las estadísticas" /></label>
          <label className="text-xs font-semibold">Sede<select name="branch" defaultValue={filters.branch} className={input} title="Filtrar por sede"><option value="">Todas</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></label>
          <label className="text-xs font-semibold">Estado<select name="estado" defaultValue={filters.estado} className={input} title="Filtrar por estado"><option value="">Todos</option><option value="emitida">Emitida</option><option value="devolucion_parcial">Devolución parcial</option><option value="anulada">Anulada</option></select></label>
          <label className="text-xs font-semibold">Desde<input type="date" name="desde" defaultValue={filters.desde} className={input} title="Fecha inicial" /></label>
          <label className="text-xs font-semibold">Hasta<input type="date" name="hasta" defaultValue={filters.hasta} className={input} title="Fecha final" /></label>
          <div className="flex items-end gap-2">
            <button type="submit" className={btnPrimary} title="Aplicar filtros" aria-label="Aplicar filtros">Filtrar</button>
            <Link href={base + '/ventas'} className={btnGhost} title="Quitar filtros" aria-label="Quitar filtros">Limpiar</Link>
          </div>
        </form>
      )}

      {!sales.length ? <Empty text={isEmp ? 'Hoy todavía no has registrado ventas.' : 'No hay ventas con estos filtros.'} /> : (
        <ul className="space-y-2">
          {sales.map((s) => (
            <li key={s.id} className="rounded-2xl border-2 border-plum/10 bg-white">
              <button onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id} title="Ver detalle de la venta" aria-label={`Ver detalle de la venta ${s.number}`} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left">
                <span className="font-display text-lg font-extrabold text-plum">#{s.number}</span>
                <span className="text-sm text-ink/60">{dt(s.createdAt)}</span>
                <span className="text-sm">{s.sellerName}</span>
                <Badge v={s.status} />
                <span className="ml-auto font-extrabold">{money(s.total)}</span>
                <ChevronDown size={18} className={`transition ${open === s.id ? 'rotate-180' : ''}`} />
              </button>
              {open === s.id && (
                <div className="border-t-2 border-dashed border-plum/15 p-4 text-sm">
                  <table className="w-full">
                    <tbody>
                      {s.lines.map((l: Row, i: number) => (
                        <tr key={i}>
                          <td className="py-1">{l.name}{(l.color || l.size) && <span className="text-xs text-ink/55"> · {[l.color, l.size].filter(Boolean).join(' / ')}</span>}{l.affectsSales === false && <span className="ml-2 text-[11px] font-bold text-brand-dark">Artístico</span>}</td>
                          <td className="text-right">{l.quantity} × {money(l.unitPrice)}{l.discountPct ? ` (−${l.discountPct}%)` : ''}</td>
                          <td className="w-28 text-right font-bold">{money(l.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-ink/60">Pagos: {s.payments?.map((p: Row) => `${p.method} ${money(p.amount)}${p.bankAccount?.name ? ` (${p.bankAccount.name})` : ''}`).join(' · ')}</p>
                  {s.delivery?.enabled && <p className="mt-1 text-xs text-ink/60">Domicilio: {s.delivery.name} · {s.delivery.address}</p>}
                  {s.electronicInvoice?.requested && <p className="mt-1 text-xs text-ink/60">Factura electrónica solicitada (seguimiento interno).</p>}
                  {s.returns?.length > 0 && <p className="mt-1 text-xs text-ink/60">Devoluciones: {s.returns.map((r: Row) => `${r.quantity}× ${r.product?.name ?? ''}`).join(', ')}</p>}
                  {s.voidReason && <p className="mt-1 text-xs text-brand-dark">Motivo de anulación: {s.voidReason}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`${base}/imprimir/${s.id}?formato=carta`} className={btnGhost} title="Imprimir comprobante de venta" aria-label={`Imprimir venta ${s.number}`}><Printer size={15} /> Imprimir</Link>
                    {canManage && s.status !== 'anulada' && (
                      <>
                        <button onClick={() => { setRet(s); setRp({ product: pid(s.lines[0]?.product), qty: 1, reason: '' }) }} className={btnGhost} title="Registrar devolución parcial" aria-label="Registrar devolución parcial"><Undo2 size={15} /> Devolución parcial</button>
                        <button onClick={() => { setVoiding(s); setReason('') }} className={btnGhost} title="Anular la venta completa" aria-label="Anular venta"><Ban size={15} /> Anular venta</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} totalPages={totalPages} totalDocs={totalDocs} sp={sp} />

      {voiding && <Modal open onClose={() => setVoiding(null)} title={`Anular venta #${voiding.number}`}>
        <p className="text-sm text-ink/70">El stock vuelve al inventario y la acción queda en auditoría.</p>
        <label className="mt-4 block text-sm font-semibold">Motivo<input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} className={input} /></label>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setVoiding(null)} className={btnGhost} title="Cerrar sin anular">Cancelar</button><button disabled={pending || !reason.trim()} onClick={() => run(() => voidSaleAction(voiding.id, reason), () => setVoiding(null))} className={btnPrimary} title="Confirmar anulación">Anular venta</button></div>
      </Modal>}

      {ret && <Modal open onClose={() => setRet(null)} title={`Devolución · venta #${ret.number}`}>
        <label className="block text-sm font-semibold">Producto
          <select value={rp.product} onChange={(e) => setRp({ ...rp, product: e.target.value })} className={input}>{ret.lines.map((l: Row, i: number) => <option key={i} value={pid(l.product)}>{l.name} (vendidos {l.quantity})</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-semibold">Cantidad<input type="number" min={1} value={rp.qty} onChange={(e) => setRp({ ...rp, qty: Number(e.target.value) })} className={input} /></label>
        <label className="mt-4 block text-sm font-semibold">Motivo<input value={rp.reason} onChange={(e) => setRp({ ...rp, reason: e.target.value })} className={input} /></label>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setRet(null)} className={btnGhost} title="Cerrar sin registrar">Cancelar</button><button disabled={pending || rp.qty < 1} onClick={() => run(() => returnSaleAction(ret.id, rp.product, rp.qty, rp.reason), () => setRet(null))} className={btnPrimary} title="Registrar devolución">Registrar devolución</button></div>
      </Modal>}
    </div>
  )
}
