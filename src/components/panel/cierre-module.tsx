'use client'
import { useState } from 'react'
import { closeCashDay } from '@/lib/actions-cash'
import { Badge, Confirm, Empty, Pager, Panel, btnPrimary, input, money, useDo, type Opt, type Row } from './kit'

export type CloseSummary = {
  day: string; branch: string; cashSales: number; transferSales: number; cardSales: number; additions: number; expenses: number; savings: number; transfers: number; salesCount: number
  closed: boolean; baseInitial: number; delivery: number; deliveryNote: string; countedCash: number; notes: string
}

export function CloseModule({ summary, branches, history, pg, sp }: { summary: CloseSummary; branches: Opt[]; history: Row[]; pg: { page: number; totalPages: number; totalDocs: number }; sp: Record<string, string | string[] | undefined> }) {
  const closed = summary.closed
  const [base, setBase] = useState(summary.baseInitial || 0)
  const [delivery, setDelivery] = useState(summary.delivery || 0)
  const [dNote, setDNote] = useState(summary.deliveryNote)
  const [counted, setCounted] = useState(closed ? String(summary.countedCash) : '')
  const [notes, setNotes] = useState(summary.notes)
  const [ask, setAsk] = useState(false)
  const { run, pending } = useDo()
  const expected = base + summary.cashSales + summary.additions - (summary.expenses + summary.savings + summary.transfers) - delivery
  const diff = (Number(counted) || 0) - expected
  const row = (l: string, v: number, sign = '') => <div className="flex justify-between py-2 text-sm"><dt>{l}</dt><dd className="font-bold">{sign}{money(v)}</dd></div>
  const numInput = (label: string, v: number, set: (n: number) => void) => (
    <div className="flex items-center justify-between py-2 text-sm"><dt>{label}</dt><dd><input aria-label={label} title={label} type="number" min={0} disabled={closed} value={v || ''} onChange={(e) => set(Number(e.target.value))} className="w-32 rounded-lg border-2 border-plum/15 px-2 py-1 text-right font-bold disabled:bg-ink/5" /></dd></div>
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Jornada ${summary.day} · ${branches.find((b) => b.id === summary.branch)?.label ?? ''}`}>
          {closed && <p className="mb-3 rounded-xl bg-cyan/15 p-3 text-sm font-bold text-cyan-dark">Esta jornada ya está cerrada y bloqueada.</p>}
          <dl className="divide-y divide-plum/10">
            {numInput('Base inicial', base, setBase)}
            {numInput('Entrega', delivery, setDelivery)}
            {delivery > 0 && !closed && (
              <div className="py-2 text-sm"><label className="block text-xs font-semibold text-ink/60">Nota de la entrega (opcional)<input value={dNote} onChange={(e) => setDNote(e.target.value)} className={input} /></label></div>
            )}
            {closed && summary.deliveryNote && <div className="py-2 text-xs text-ink/60">Nota de la entrega: {summary.deliveryNote}</div>}
            {row(`Ventas en efectivo (${summary.salesCount} ventas)`, summary.cashSales, '+ ')}
            {row('Adiciones de base', summary.additions, '+ ')}
            {row('Gastos', summary.expenses, '− ')}
            {row('Ahorros', summary.savings, '− ')}
            {row('Transferencias (bloqueadas)', summary.transfers, '− ')}
            {row('Entrega', delivery, '− ')}
            <div className="flex justify-between py-3"><dt className="font-extrabold text-plum">Efectivo esperado</dt><dd className="font-display text-2xl font-extrabold text-plum">{money(expected)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-ink/55">Informativo: ventas por transferencia {money(summary.transferSales)} · tarjeta {money(summary.cardSales)}. Los domicilios y el pago al domiciliario no entran en este cálculo. La entrega se guarda como valor del día, no como gasto.</p>
        </Panel>
        <Panel title="Arqueo y cierre">
          <label className="block text-sm font-semibold">Efectivo contado<input type="number" min={0} disabled={closed} value={counted} onChange={(e) => setCounted(e.target.value)} className={input} /></label>
          <p className={`mt-3 rounded-xl p-3 text-sm font-bold ${counted === '' ? 'bg-plum-soft text-plum' : diff === 0 ? 'bg-cyan/15 text-cyan-dark' : 'bg-brand/10 text-brand-dark'}`} role="status">
            {counted === '' ? 'Ingresa lo contado para ver la diferencia.' : diff === 0 ? 'Caja cuadrada.' : diff > 0 ? `Sobrante de ${money(diff)}` : `Faltante de ${money(-diff)}`}
          </p>
          <label className="mt-4 block text-sm font-semibold">Observaciones<textarea rows={3} disabled={closed} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} /></label>
          <button disabled={closed || counted === '' || pending} title="Cerrar jornada" aria-label="Cerrar jornada" onClick={() => setAsk(true)} className={`${btnPrimary} mt-5`}>Cerrar jornada</button>
        </Panel>
      </div>

      <Panel title="Cierres anteriores">
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-plum"><tr><th className="py-2">Día</th><th>Sede</th><th className="text-right">Base</th><th className="text-right">Entrega</th><th className="text-right">Esperado</th><th className="text-right">Contado</th><th className="text-right">Diferencia</th><th className="pl-4">Estado</th></tr></thead>
              <tbody className="divide-y divide-plum/10">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2.5 font-semibold">{h.day}</td><td>{h.branch?.name ?? '—'}</td>
                    <td className="text-right">{money(h.baseInitial ?? 0)}</td><td className="text-right">{money(h.delivery ?? 0)}</td>
                    <td className="text-right">{money(h.expectedCash)}</td><td className="text-right">{money(h.countedCash)}</td>
                    <td className={`text-right font-bold ${h.difference === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{money(h.difference)}</td>
                    <td className="pl-4"><Badge v={h.status ?? 'cerrado'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty text="Aún no hay cierres registrados." />}
        <Pager {...pg} sp={sp} />
      </Panel>

      <Confirm open={ask} busy={pending} yes="Cerrar jornada" title="Cerrar la jornada" text="Al cerrar, los movimientos del día quedan bloqueados y no se podrán editar. ¿Continuar?" onNo={() => setAsk(false)} onYes={() => run(() => closeCashDay({ day: summary.day, branch: summary.branch, baseInitial: base, delivery, deliveryNote: dNote, countedCash: Number(counted), notes }), () => setAsk(false))} />
    </div>
  )
}
