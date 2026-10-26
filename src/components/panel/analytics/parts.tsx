import Link from 'next/link'
import type { Metrics, Report } from '@/lib/analytics'
import { ANALYTICS_ETL_PARAM, fmtDay, presets, qs, reportFileName, type Filters } from '@/lib/analytics-shared'
import type { Opt } from '@/components/panel/kit'
import { C, cop, num, pct } from './charts'
import { AnalyticsPdfDownload } from './pdf-download'

const field = 'mt-1 rounded-xl border-2 border-plum/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan'

export function FilterBar({ path, f, branches, processed }: { path: string; f: Filters; branches: Opt[]; processed: boolean }) {
  const today = presets()
  const active = today.find((p) => p.desde === f.desde && p.hasta === f.hasta)?.id
  const reportBase = `${path.replace(/\/analitica$/, '')}/reporte`
  const pdf = `${reportBase}${qs({ sede: f.sede, desde: f.desde, hasta: f.hasta, [ANALYTICS_ETL_PARAM]: processed ? '1' : undefined })}`
  const linkQs = (extra: Record<string, string | undefined>) =>
    qs({ sede: f.sede, desde: extra.desde ?? f.desde, hasta: extra.hasta ?? f.hasta, [ANALYTICS_ETL_PARAM]: processed ? '1' : undefined })
  return (
    <div className="mb-5 rounded-2xl border-2 border-plum/10 bg-white p-4">
      <form method="get" action={path} className="flex flex-wrap items-end gap-3">
        {processed ? <input type="hidden" name={ANALYTICS_ETL_PARAM} value="1" /> : null}
        <label className="text-xs font-bold uppercase tracking-wider text-ink/55">Sede
          <select name="sede" defaultValue={f.sede} className={`${field} block min-w-44 normal-case tracking-normal`}>
            <option value="">Todas las sedes</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-ink/55">Desde
          <input type="date" name="desde" defaultValue={f.desde} className={`${field} block normal-case tracking-normal`} />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-ink/55">Hasta
          <input type="date" name="hasta" defaultValue={f.hasta} className={`${field} block normal-case tracking-normal`} />
        </label>
        <button className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark">Aplicar</button>
        <AnalyticsPdfDownload
          href={pdf}
          fileName={reportFileName(f.desde, f.hasta)}
          disabled={!processed}
          disabledHint="Procesa la analítica antes de descargar el PDF."
        />
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/55">Atajos</span>
        {today.map((p) => (
          <Link key={p.id} href={`${path}${linkQs({ desde: p.desde, hasta: p.hasta })}`} scroll={false}
            className={`rounded-full px-3.5 py-1 text-sm font-bold transition ${active === p.id ? 'bg-plum text-white' : 'border-2 border-plum/15 text-plum hover:bg-plum-soft'}`}>{p.label}</Link>
        ))}
        <span className="ml-auto text-xs text-ink/55">{fmtDay(f.desde)} – {fmtDay(f.hasta)} · {f.monthly ? 'desglose mensual' : 'periodo único'}</span>
      </div>
    </div>
  )
}

const MARGIN_NOTE = 'Margen de ganancia = (ventas − costo de lo vendido − gastos) ÷ ventas. El costo sale del precio de costo de cada producto vendido.'

export function KpiGrid({ m, avgMonthly, months }: { m: Metrics; avgMonthly: number; months: number }) {
  const cards: { l: string; v: string; hint?: string; title?: string }[] = [
    { l: 'Total de ventas', v: cop(m.ventas), hint: `${num(m.nVentas)} ventas · sin artísticos` },
    { l: 'Ticket promedio', v: m.ticket == null ? '—' : cop(m.ticket), hint: 'Promedio por venta' },
    { l: 'Promedio mensual', v: cop(avgMonthly), hint: `Ventas ÷ ${months} ${months === 1 ? 'periodo' : 'meses'}` },
    { l: 'Total de gastos', v: cop(m.gastos) },
    { l: 'Total de entregas', v: cop(m.entregas), hint: 'Entregas de dinero' },
    { l: 'Total de transferencias', v: cop(m.transferencias) },
    { l: 'Total de ahorros', v: cop(m.ahorros) },
    { l: 'Margen de ganancia', v: pct(m.margen), hint: '(Ventas − costo − gastos) ÷ ventas', title: MARGIN_NOTE },
    { l: 'Ratio de gastos', v: pct(m.ratio), hint: 'Gastos ÷ ventas' },
  ]
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.l} title={c.title} className="rounded-2xl border-2 border-plum/10 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/55">{c.l}</p>
            <p className="font-display text-3xl font-extrabold text-plum">{c.v}</p>
            {c.hint && <p className="mt-1 text-xs text-ink/55">{c.hint}</p>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink/55">{MARGIN_NOTE} Las ventas excluyen anuladas y productos artísticos, y descuentan devoluciones.</p>
    </>
  )
}

export function MonthTable({ r }: { r: Report }) {
  const cols = ['Ventas', 'Nº', 'Ticket', 'Gastos', 'Entregas', 'Transf.', 'Ahorros', 'Margen', 'Ratio gastos']
  const cells = (m: Metrics) => [cop(m.ventas), num(m.nVentas), m.ticket == null ? '—' : cop(m.ticket), cop(m.gastos), cop(m.entregas), cop(m.transferencias), cop(m.ahorros), pct(m.margen), pct(m.ratio)]
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
          <tr><th className="px-3 py-2.5">{r.filters.monthly ? 'Mes' : 'Periodo'}</th>{cols.map((c) => <th key={c} className="px-3 py-2.5 text-right">{c}</th>)}</tr>
        </thead>
        <tbody>
          {r.buckets.map((b) => (
            <tr key={b.key} className="border-t border-plum/10">
              <th className="whitespace-nowrap px-3 py-2 font-bold text-plum">
                {b.label}
                {b.flags.length > 0 && <span title={`Evento clave: ${b.flags.join(', ')}`} className="ml-2 rounded-full bg-sun px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-ink">evento clave</span>}
              </th>
              {cells(b).map((c, i) => <td key={i} className="px-3 py-2 text-right font-mono text-xs">{c}</td>)}
            </tr>
          ))}
          <tr className="border-t-2 border-plum/30 bg-paper font-bold">
            <th className="px-3 py-2.5 text-plum">Total</th>
            {cells(r.total).map((c, i) => <td key={i} className="px-3 py-2.5 text-right font-mono text-xs">{c}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export const Section = ({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-display text-2xl font-extrabold text-plum">{title}</h2>
    {blurb && <p className="mb-3 mt-1 max-w-3xl text-sm text-ink/60">{blurb}</p>}
    <div className="mt-3 space-y-5">{children}</div>
  </section>
)

export const Stat = ({ l, v, hint, tone }: { l: string; v: string; hint?: string; tone?: string }) => (
  <div className="rounded-2xl border-2 border-plum/10 bg-white p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-ink/55">{l}</p>
    <p className="font-display text-2xl font-extrabold" style={{ color: tone ?? C.plum }}>{v}</p>
    {hint && <p className="mt-0.5 text-xs text-ink/55">{hint}</p>}
  </div>
)
