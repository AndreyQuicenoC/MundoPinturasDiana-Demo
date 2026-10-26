'use client'
import { useMemo, useState } from 'react'
import { Check, Lock, Pencil, Trash2, X } from 'lucide-react'
import { addCashMovement, deleteCashMovement, updateCashMovement } from '@/lib/actions-cash'
import { Combobox } from './combobox'
import { Confirm, Empty, Pager, Panel, Select, btnPrimary, dt, input, money, useDo, type Opt, type Row } from './kit'

const CATS: [string, string][] = [['gasto', 'Gasto'], ['transferencia', 'Transferencia'], ['ahorro', 'Ahorro'], ['adicion', 'Adición de base']]
const catLabel = Object.fromEntries(CATS)
const TONE: Record<string, { text: string; chip: string; sign: string }> = {
  adicion: { text: 'text-emerald-700', chip: 'bg-emerald-100 text-emerald-800', sign: '+' },
  gasto: { text: 'text-rose-600', chip: 'bg-rose-100 text-rose-700', sign: '−' },
  ahorro: { text: 'text-rose-600', chip: 'bg-rose-100 text-rose-700', sign: '−' },
  transferencia: { text: 'text-sky-700', chip: 'bg-sky-100 text-sky-800', sign: '−' },
}

export type Summary = { day: string; branch: string; cashSales: number; transferSales: number; cardSales: number; additions: number; expenses: number; savings: number; transfers: number; salesCount: number; closed: boolean; expected: number }
type Pg = { page: number; totalPages: number; totalDocs: number }

export function CashModule({ movements, concepts, branches, defaultBranch, summary, pg, sp, canEdit }: { movements: Row[]; concepts: Row[]; branches: Opt[]; defaultBranch: string; summary: Summary; pg: Pg; sp: Record<string, string | string[] | undefined>; canEdit: (string | number)[] | 'all' }) {
  const [branch, setBranch] = useState(defaultBranch)
  const [category, setCategory] = useState('gasto')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [del, setDel] = useState<Row | null>(null)
  const [edit, setEdit] = useState<{ id: string; concept: string; amount: string; note: string } | null>(null)
  const { run, pending } = useDo()
  const active = useMemo(() => concepts.filter((c) => c.active !== false), [concepts])
  const copts = useMemo(() => active.map((c) => ({ id: c.id, label: c.name, hint: catLabel[c.category] ?? '' })), [active])
  const byId = (id: string) => active.find((c) => c.id === id)

  const pickConcept = (id: string, set: { cat?: (v: string) => void; amount: (v: string) => void; note: (v: string) => void }) => {
    const c = byId(id)
    if (!c) return
    if (c.category) set.cat?.(c.category)
    set.amount(c.suggestedAmount != null ? String(c.suggestedAmount) : '')
    set.note(c.description ?? '')
  }
  const mayEdit = (m: Row) => !m.locked && (canEdit === 'all' || canEdit.includes(m.user?.id ?? m.user))

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Panel title="Nuevo movimiento">
        <form onSubmit={(e) => { e.preventDefault(); run(() => addCashMovement({ branch, category, concept: concept || undefined, amount: Number(amount), note }), () => { setAmount(''); setNote(''); setConcept('') }) }} className="space-y-4">
          <label className="block text-sm font-semibold">Sede<Select value={branch} onChange={setBranch} opts={branches} /></label>
          <div className="block text-sm font-semibold">Concepto
            <Combobox value={concept} label="Concepto" placeholder="Buscar concepto…" opts={copts} empty="Sin conceptos activos"
              onChange={(id) => { setConcept(id); pickConcept(id, { cat: setCategory, amount: setAmount, note: setNote }) }} />
          </div>
          <fieldset><legend className="text-sm font-semibold">Categoría</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">{CATS.map(([k, l]) => <button type="button" key={k} title={`Categoría: ${l}`} aria-label={`Categoría ${l}`} aria-pressed={category === k} onClick={() => setCategory(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${category === k ? 'bg-plum text-white' : 'bg-plum-soft text-plum'}`}>{l}</button>)}</div>
          </fieldset>
          <label className="block text-sm font-semibold">Valor (COP)<input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} className={input} /></label>
          <label className="block text-sm font-semibold">Detalle<input value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>
          <button disabled={pending} title="Registrar movimiento" aria-label="Registrar movimiento" className={btnPrimary}>Registrar</button>
        </form>
      </Panel>
      <Panel title="Movimientos de la jornada">
        <p className="mb-2 text-xs text-ink/55">Efectivo esperado hoy: <b className="text-plum">{money(summary.expected)}</b> (con base $0 y sin entrega)</p>
        <p className="mb-3 flex flex-wrap gap-2 text-xs font-bold" aria-label="Leyenda">
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.adicion.chip}`}>+ Suma: adición de base</span>
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.gasto.chip}`}>− Resta: gasto / ahorro</span>
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.transferencia.chip}`}>− Resta: transferencia</span>
        </p>
        {movements.length ? (
          <ul className="divide-y divide-plum/10">
            {movements.map((m) => {
              const t = TONE[m.category] ?? TONE.gasto
              const editing = edit?.id === m.id
              return (
                <li key={m.id} className="py-2.5 text-sm">
                  {editing && edit ? (
                    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); run(() => updateCashMovement(m.id, { concept: edit.concept || undefined, amount: Number(edit.amount), note: edit.note }), () => setEdit(null)) }}>
                      <Combobox value={edit.concept} label="Concepto" placeholder="Concepto…" opts={copts}
                        onChange={(id) => { setEdit((x) => x && { ...x, concept: id }); pickConcept(id, { amount: (v) => setEdit((x) => x && { ...x, amount: v }), note: (v) => setEdit((x) => x && { ...x, note: v }) }) }} />
                      <div className="flex flex-wrap gap-2">
                        <input aria-label="Valor" type="number" min={1} required value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} className={`${input} !mt-0 w-36`} />
                        <input aria-label="Detalle" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} className={`${input} !mt-0 min-w-40 flex-1`} />
                        <button disabled={pending} title="Guardar cambios" aria-label="Guardar cambios" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"><Check size={16} /></button>
                        <button type="button" title="Cancelar edición" aria-label="Cancelar edición" onClick={() => setEdit(null)} className="rounded-lg p-2 text-ink/60 hover:bg-plum-soft"><X size={16} /></button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${t.chip}`}>{catLabel[m.category] ?? m.category}</span>
                      <span className="min-w-0 flex-1 truncate">{m.concept?.name ? <b>{m.concept.name}</b> : null}{m.concept?.name && m.note ? ' · ' : ''}{m.note || (m.concept?.name ? '' : '—')}<span className="block text-xs text-ink/50">{dt(m.date)} · {m.actor}</span></span>
                      <b className={t.text}>{t.sign} {money(m.amount)}</b>
                      {m.locked ? <Lock size={15} aria-label="Bloqueado" className="text-ink/40" /> : mayEdit(m) ? (
                        <>
                          <button title="Editar movimiento" aria-label="Editar movimiento" onClick={() => setEdit({ id: m.id, concept: m.concept?.id ?? '', amount: String(m.amount), note: m.note ?? '' })} className="rounded-lg p-1.5 text-plum hover:bg-plum-soft"><Pencil size={15} /></button>
                          <button title="Eliminar movimiento" aria-label="Eliminar movimiento" onClick={() => setDel(m)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10"><Trash2 size={15} /></button>
                        </>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : <Empty text="Sin movimientos abiertos." />}
        <Pager {...pg} sp={sp} />
      </Panel>
      <Confirm open={!!del} danger busy={pending} yes="Eliminar" title="Eliminar movimiento" text={`¿Eliminar el movimiento de ${money(del?.amount)}? Quedará en auditoría.`} onNo={() => setDel(null)} onYes={() => run(() => deleteCashMovement(del!.id), () => setDel(null))} />
    </div>
  )
}
