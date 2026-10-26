'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Truck, UserRound, X } from 'lucide-react'
import { updateDomicilio } from '@/lib/actions-sales'
import { Badge, Confirm, Empty, Modal, Pager, UrlTabs, btnGhost, btnPrimary, dt, input, money, useDo, type Opt, type Row } from './kit'

const TABS = [
  { id: 'activos', label: 'Pendientes y en ruta' },
  { id: 'entregado', label: 'Entregados' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'todos', label: 'Todos' },
]

export function DomiciliosModule({ rows, page, totalPages, totalDocs, sp, estado, couriers, base, canWrite }: {
  rows: Row[]; page: number; totalPages: number; totalDocs: number; sp: Record<string, string | string[] | undefined>; estado: string; couriers: Opt[]; base: string; canWrite: boolean
}) {
  const [open, setOpen] = useState<string | null>(null)
  const [edit, setEdit] = useState<Row | null>(null)
  const [f, setF] = useState({ courierRef: '', courier: '', fee: '', notes: '' })
  const [conf, setConf] = useState<{ row: Row; status: 'entregado' | 'cancelado' } | null>(null)
  const { run, pending } = useDo()

  const startEdit = (r: Row) => {
    setEdit(r)
    setF({ courierRef: r.courierRef?.id ?? r.courierRef ?? '', courier: r.courier ?? '', fee: r.courierFee != null ? String(r.courierFee) : '', notes: r.notes ?? '' })
  }
  const open_ = (r: Row) => r.status === 'pendiente' || r.status === 'en_ruta'

  return (
    <div>
      <UrlTabs param="estado" value={estado} tabs={TABS} sp={sp} />
      {!rows.length ? <Empty text="No hay domicilios en esta vista." /> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border-2 border-plum/10 bg-white">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {r.customerName} <Badge v={r.status} />
                    {r.saleNumber != null && <Link href={`${base}/ventas?numero=${r.saleNumber}`} className="text-xs font-bold text-brand underline" title="Ver la venta de este domicilio" aria-label={`Ver venta ${r.saleNumber}`}>Venta #{r.saleNumber}</Link>}
                  </p>
                  <p className="text-xs text-ink/60">{r.address} · {r.phone}</p>
                  <p className="text-xs text-ink/55">Solicitado {dt(r.requestedAt ?? r.createdAt)} · Domiciliario: {r.courier || 'sin asignar'}{r.courierFee != null ? ` · Pago domiciliario ${money(r.courierFee)}` : ''}{r.deliveryFee ? ` · Cobrado ${money(r.deliveryFee)}` : ''}</p>
                </div>
                {canWrite && open_(r) && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => startEdit(r)} className={btnGhost} title="Asignar domiciliario y pago" aria-label="Asignar domiciliario"><UserRound size={15} /> Domiciliario</button>
                    {r.status === 'pendiente' && <button disabled={pending} onClick={() => run(() => updateDomicilio(r.id, { status: 'en_ruta' }))} className={btnPrimary} title="Marcar como en ruta" aria-label="Marcar en ruta"><Truck size={15} /> En ruta</button>}
                    {r.status === 'en_ruta' && <button disabled={pending} onClick={() => setConf({ row: r, status: 'entregado' })} className={btnPrimary} title="Marcar como entregado" aria-label="Marcar entregado"><Check size={15} /> Entregado</button>}
                    <button disabled={pending} onClick={() => setConf({ row: r, status: 'cancelado' })} className={btnGhost} title="Cancelar el domicilio" aria-label="Cancelar domicilio"><X size={15} /> Cancelar</button>
                  </div>
                )}
                <button onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} title="Ver historial de estados" aria-label="Ver historial" className="rounded-lg p-1.5 hover:bg-plum-soft"><ChevronDown size={18} className={`transition ${open === r.id ? 'rotate-180' : ''}`} /></button>
              </div>
              {open === r.id && (
                <div className="border-t-2 border-dashed border-plum/15 p-4 text-xs text-ink/70">
                  {r.notes && <p className="mb-2">Notas: {r.notes}</p>}
                  {r.history?.length ? <ul className="space-y-1">{r.history.map((h: Row, i: number) => <li key={i}>{dt(h.at)} · {String(h.from ?? '—').replace(/_/g, ' ')} → <b>{String(h.to).replace(/_/g, ' ')}</b> · {h.by}</li>)}</ul> : <p>Sin cambios de estado todavía.</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} totalPages={totalPages} totalDocs={totalDocs} sp={sp} />

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={`Domicilio de ${edit.customerName}`}>
          <label className="block text-sm font-semibold">Domiciliario registrado
            <select value={f.courierRef} onChange={(e) => setF({ ...f, courierRef: e.target.value })} className={input} title="Domiciliario registrado"><option value="">— Otro / escribir nombre —</option>{couriers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
          {!f.courierRef && <label className="mt-4 block text-sm font-semibold">Nombre del domiciliario<input value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })} className={input} /></label>}
          <label className="mt-4 block text-sm font-semibold">Pago al domiciliario (opcional)<input type="number" min={0} value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} className={input} /></label>
          <p className="mt-1 text-xs text-ink/55">No entra en ventas ni en gastos del día.</p>
          <label className="mt-4 block text-sm font-semibold">Notas<input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={input} /></label>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEdit(null)} className={btnGhost} title="Cerrar sin guardar">Cancelar</button>
            <button disabled={pending} onClick={() => run(() => updateDomicilio(edit.id, { courierRef: f.courierRef, courier: f.courier, courierFee: f.fee === '' ? null : Number(f.fee), notes: f.notes }), () => setEdit(null))} className={btnPrimary} title="Guardar cambios">Guardar</button>
          </div>
        </Modal>
      )}
      <Confirm open={!!conf} danger={conf?.status === 'cancelado'} busy={pending} title={conf?.status === 'entregado' ? 'Marcar como entregado' : 'Cancelar domicilio'}
        text={conf?.status === 'entregado' ? 'El domicilio quedará como entregado y ya no se podrá cambiar.' : 'El domicilio quedará cancelado y ya no se podrá cambiar. La venta no se anula.'}
        yes={conf?.status === 'entregado' ? 'Marcar entregado' : 'Cancelar domicilio'} onNo={() => setConf(null)}
        onYes={() => conf && run(() => updateDomicilio(conf.row.id, { status: conf.status }), () => setConf(null))} />
    </div>
  )
}
