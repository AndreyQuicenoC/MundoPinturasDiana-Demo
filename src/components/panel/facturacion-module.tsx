'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, ChevronDown, Info, Pencil, Play, RotateCcw } from 'lucide-react'
import { setInvoiceStatus, updateInvoiceData } from '@/lib/actions-sales'
import { Badge, Empty, Modal, Pager, UrlTabs, btnGhost, btnPrimary, dt, input, money, useDo, type Row } from './kit'

const TABS = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'generadas', label: 'Ya generadas' },
  { id: 'todas', label: 'Todas' },
]
const STATE_LABEL: Record<string, string> = { solicitada: 'Solicitada', en_proceso: 'En proceso', generada: 'Generada', rechazada: 'Por corregir' }

export function FacturacionModule({ rows, page, totalPages, totalDocs, sp, ver, base, canWrite }: {
  rows: Row[]; page: number; totalPages: number; totalDocs: number; sp: Record<string, string | string[] | undefined>; ver: string; base: string; canWrite: boolean
}) {
  const [open, setOpen] = useState<string | null>(null)
  const [edit, setEdit] = useState<Row | null>(null)
  const [f, setF] = useState({ buyerName: '', buyerDocument: '', buyerEmail: '', externalNumber: '', observations: '' })
  const [fix, setFix] = useState<Row | null>(null)
  const [note, setNote] = useState('')
  const { run, pending } = useDo()

  const startEdit = (r: Row) => {
    setEdit(r)
    setF({ buyerName: r.buyerName ?? '', buyerDocument: r.buyerDocument ?? '', buyerEmail: r.buyerEmail ?? '', externalNumber: r.externalNumber ?? '', observations: r.observations ?? '' })
  }

  return (
    <div>
      <div role="note" className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-sun bg-sun/20 p-4 text-sm text-ink">
        <Info size={18} className="mt-0.5 shrink-0 text-plum" aria-hidden />
        <p><b>Seguimiento interno manual.</b> Este sistema no se conecta con la DIAN; la factura se genera por fuera y aquí solo se registra su estado.</p>
      </div>
      <UrlTabs param="ver" value={ver} tabs={TABS} sp={sp} />
      {!rows.length ? <Empty text={ver === 'generadas' ? 'Todavía no hay facturas marcadas como generadas.' : 'No hay facturas por gestionar en esta vista.'} /> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border-2 border-plum/10 bg-white">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {r.buyerName || 'Sin nombre de comprador'}
                    <span className="inline-flex items-center gap-1"><Badge v={r.status} />{r.status === 'rechazada' && <span className="text-xs font-bold text-brand-dark">Por corregir</span>}</span>
                    {r.saleNumber != null && <Link href={`${base}/ventas?numero=${r.saleNumber}`} className="text-xs font-bold text-brand underline" title="Ver la venta de esta factura" aria-label={`Ver venta ${r.saleNumber}`}>Venta #{r.saleNumber}</Link>}
                  </p>
                  <p className="text-xs text-ink/60">Doc. {r.buyerDocument || '—'} · {r.buyerEmail || 'sin correo'} · {money(r.total)}</p>
                  <p className="text-xs text-ink/55">Solicitada {dt(r.requestedAt ?? r.createdAt)}{r.externalNumber ? ` · Ref. externa: ${r.externalNumber}` : ''}</p>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => startEdit(r)} className={btnGhost} title="Editar datos del comprador, referencia y notas" aria-label="Editar datos"><Pencil size={15} /> Datos</button>
                    {r.status === 'solicitada' && <button disabled={pending} onClick={() => run(() => setInvoiceStatus(r.id, 'en_proceso'))} className={btnPrimary} title="Marcar en proceso" aria-label="Marcar en proceso"><Play size={15} /> En proceso</button>}
                    {r.status === 'en_proceso' && <button disabled={pending} onClick={() => run(() => setInvoiceStatus(r.id, 'generada'))} className={btnPrimary} title="Ya generaste la factura por fuera: márcala como generada" aria-label="Marcar generada"><Check size={15} /> Generada</button>}
                    {r.status === 'rechazada' && <button disabled={pending} onClick={() => run(() => setInvoiceStatus(r.id, 'en_proceso'))} className={btnPrimary} title="Volver a ponerla en proceso" aria-label="Volver a proceso"><RotateCcw size={15} /> Reintentar</button>}
                    {r.status !== 'rechazada' && <button disabled={pending} onClick={() => { setFix(r); setNote('') }} className={btnGhost} title="Hubo un error: marcar como «Por corregir»" aria-label="Marcar por corregir"><AlertTriangle size={15} /> Por corregir</button>}
                  </div>
                )}
                <button onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} title="Ver historial de estados" aria-label="Ver historial" className="rounded-lg p-1.5 hover:bg-plum-soft"><ChevronDown size={18} className={`transition ${open === r.id ? 'rotate-180' : ''}`} /></button>
              </div>
              {open === r.id && (
                <div className="border-t-2 border-dashed border-plum/15 p-4 text-xs text-ink/70">
                  {r.observations && <p className="mb-2 whitespace-pre-line">Notas: {r.observations}</p>}
                  {r.generatedAt && <p className="mb-2">Generada: {dt(r.generatedAt)}</p>}
                  {r.history?.length ? <ul className="space-y-1">{r.history.map((h: Row, i: number) => <li key={i}>{dt(h.at)} · {STATE_LABEL[h.from] ?? '—'} → <b>{STATE_LABEL[h.to] ?? h.to}</b> · {h.by}</li>)}</ul> : <p>Sin cambios de estado todavía.</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} totalPages={totalPages} totalDocs={totalDocs} sp={sp} />

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={`Factura · venta #${edit.saleNumber ?? ''}`}>
          <label className="block text-sm font-semibold">Nombre del comprador<input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} className={input} /></label>
          <label className="mt-4 block text-sm font-semibold">Documento / NIT<input value={f.buyerDocument} onChange={(e) => setF({ ...f, buyerDocument: e.target.value })} className={input} /></label>
          <label className="mt-4 block text-sm font-semibold">Correo<input type="email" value={f.buyerEmail} onChange={(e) => setF({ ...f, buyerEmail: e.target.value })} className={input} /></label>
          <label className="mt-4 block text-sm font-semibold">Número/Referencia externa (opcional)<input value={f.externalNumber} onChange={(e) => setF({ ...f, externalNumber: e.target.value })} className={input} /></label>
          <label className="mt-4 block text-sm font-semibold">Notas<textarea rows={3} value={f.observations} onChange={(e) => setF({ ...f, observations: e.target.value })} className={input} /></label>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEdit(null)} className={btnGhost} title="Cerrar sin guardar">Cancelar</button>
            <button disabled={pending} onClick={() => run(() => updateInvoiceData(edit.id, f), () => setEdit(null))} className={btnPrimary} title="Guardar datos">Guardar</button>
          </div>
        </Modal>
      )}
      {fix && (
        <Modal open onClose={() => setFix(null)} title="Marcar como «Por corregir»">
          <p className="text-sm text-ink/70">Indica qué hay que corregir (opcional). Luego podrás ponerla de nuevo en proceso.</p>
          <label className="mt-4 block text-sm font-semibold">Qué corregir<input autoFocus value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setFix(null)} className={btnGhost} title="Cerrar sin cambios">Cancelar</button>
            <button disabled={pending} onClick={() => run(() => setInvoiceStatus(fix.id, 'rechazada', note), () => setFix(null))} className={btnPrimary} title="Confirmar">Marcar por corregir</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
