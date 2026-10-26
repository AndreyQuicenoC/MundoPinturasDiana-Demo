/** Gráficos SVG/CSS ligeros para la analítica (sin dependencias; se renderizan en el servidor). */
import { formatCOPClient } from '@/lib/format'

export const C = { plum: '#4A154B', magenta: '#E11D74', cyan: '#00ACC1', sun: '#ffc93c', paper: '#fffaf4', ink: '#1b1220' }
export const PIE_COLORS = [C.magenta, C.cyan, C.plum, C.sun, '#8a4b8c', '#5fc8d4', '#f27aac', '#b8935a']

export const cop = (n: number) => formatCOPClient(Math.round(n))
export const compact = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(1).replace('.', ',')} MM`
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1).replace('.', ',')} M`
  if (a >= 1e3) return `${s}$${Math.round(a / 1e3)} mil`
  return `${s}$${Math.round(a)}`
}
export const num = (n: number) => new Intl.NumberFormat('es-CO').format(Math.round(n))
export const pct = (n: number | null | undefined, d = 1) => (n == null ? '—' : `${(n * 100).toFixed(d).replace('.', ',')}%`)
export const pct100 = (n: number | null | undefined) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}%`)

export const ChartCard = ({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border-2 border-plum/10 bg-white p-5">
    <h3 className="font-display text-lg font-extrabold text-plum">{title}</h3>
    <div className="mt-3">{children}</div>
    <p className="mt-3 text-xs leading-relaxed text-ink/60">{caption}</p>
  </section>
)

export const Legend = ({ items }: { items: { name: string; color: string }[] }) => (
  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
    {items.map((i) => <li key={i.name} className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: i.color }} />{i.name}</li>)}
  </ul>
)

export const NoData = ({ text = 'Sin datos en el periodo seleccionado.' }: { text?: string }) => (
  <p className="rounded-xl border-2 border-dashed border-plum/15 p-6 text-center text-sm text-ink/55">{text}</p>
)

type Series = { name: string; color: string; values: number[] }

/** Barras verticales (una o varias series). `flags` marca periodos con un evento clave. */
export function VBars({ labels, series, format = cop, axis = compact, flags, label }: { labels: string[]; series: Series[]; format?: (n: number) => string; axis?: (n: number) => string; flags?: boolean[]; label: string }) {
  const W = 640, H = 220, L = 52, R = 8, T = 22, B = 28
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  if (!series.some((s) => s.values.some((v) => v > 0))) return <NoData />
  const pw = W - L - R, ph = H - T - B
  const gw = pw / labels.length
  const bw = Math.min(34, (gw * 0.7) / series.length)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={T + ph * (1 - t)} y2={T + ph * (1 - t)} stroke={C.plum} strokeOpacity={t === 0 ? 0.35 : 0.1} />
            <text x={L - 6} y={T + ph * (1 - t) + 3} textAnchor="end" fontSize="10" fill={C.ink} fillOpacity="0.6">{axis(max * t)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const cx = L + gw * i + gw / 2
          return (
            <g key={l + i}>
              {series.map((s, j) => {
                const h = (s.values[i] / max) * ph
                const x = cx - (bw * series.length) / 2 + bw * j
                return <rect key={s.name} x={x} y={T + ph - h} width={bw - 2} height={Math.max(h, s.values[i] > 0 ? 1 : 0)} rx="3" fill={s.color}><title>{`${l} · ${s.name}: ${format(s.values[i])}`}</title></rect>
              })}
              {flags?.[i] && <path d={`M${cx - 6} ${T - 4} h12 l-6 -10 z`} fill={C.sun} stroke={C.plum} strokeWidth="1"><title>{`${l}: evento clave`}</title></path>}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="10.5" fill={C.ink} fillOpacity="0.75">{l}</text>
            </g>
          )
        })}
      </svg>
      {series.length > 1 && <Legend items={series} />}
      {flags?.some(Boolean) && <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60"><span className="inline-block size-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-sun" />Mes con evento clave: lee estos datos con cautela (atípicos).</p>}
    </div>
  )
}

/** Cambio % mes a mes: barras agrupadas sobre una línea base en 0. */
export function ChangeBars({ rows }: { rows: { label: string; ventas: number | null; gastos: number | null; flag: boolean }[] }) {
  const W = 640, H = 240, L = 52, R = 8, T = 22, B = 28
  const vals = rows.flatMap((r) => [r.ventas, r.gastos]).filter((v): v is number => v != null)
  if (rows.length < 2 || !vals.length) return <NoData text="Se necesitan al menos dos meses con datos para comparar el cambio mensual." />
  const lim = Math.max(10, ...vals.map(Math.abs))
  const ph = H - T - B, zero = T + ph / 2, gw = (W - L - R) / rows.length, bw = Math.min(22, gw * 0.35)
  const y = (v: number) => (v / lim) * (ph / 2)
  const bar = (v: number | null, x: number, color: string, name: string, l: string) =>
    v == null ? null : <rect x={x} y={v >= 0 ? zero - y(v) : zero} width={bw - 1} height={Math.max(1, Math.abs(y(v)))} rx="2" fill={color}><title>{`${l} · ${name}: ${pct100(v)}`}</title></rect>
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cambio porcentual mensual de ventas y gastos">
        {[-1, 0, 1].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={zero - t * (ph / 2)} y2={zero - t * (ph / 2)} stroke={C.plum} strokeOpacity={t === 0 ? 0.5 : 0.1} strokeWidth={t === 0 ? 1.5 : 1} />
            <text x={L - 6} y={zero - t * (ph / 2) + 3} textAnchor="end" fontSize="10" fill={C.ink} fillOpacity="0.6">{t === 0 ? '0%' : pct100(t * lim).replace(',0', '')}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = L + gw * i + gw / 2
          return (
            <g key={r.label + i}>
              {bar(r.ventas, cx - bw, C.magenta, 'Ventas', r.label)}
              {bar(r.gastos, cx, C.plum, 'Gastos', r.label)}
              {r.flag && <path d={`M${cx - 6} ${T - 4} h12 l-6 -10 z`} fill={C.sun} stroke={C.plum} strokeWidth="1"><title>{`${r.label}: evento clave`}</title></path>}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="10.5" fill={C.ink} fillOpacity="0.75">{r.label}</text>
            </g>
          )
        })}
      </svg>
      <Legend items={[{ name: '% cambio de ventas', color: C.magenta }, { name: '% cambio de gastos', color: C.plum }]} />
      {rows.some((r) => r.flag) && <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60"><span className="inline-block size-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-sun" />Mes con evento clave (dato atípico).</p>}
    </div>
  )
}

/** Barras horizontales para rankings. */
export function HBars({ items, color = C.cyan, format = num, empty }: { items: { k: string; v: number; extra?: number }[]; color?: string; format?: (n: number) => string; empty?: string }) {
  if (!items.length) return <NoData text={empty} />
  const max = Math.max(1, ...items.map((i) => i.v))
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.k} className="text-sm">
          <div className="flex justify-between gap-3"><span className="truncate" title={i.k}>{i.k}</span><b className="shrink-0 font-mono text-xs">{format(i.v)}</b></div>
          <div className="mt-1 h-2 rounded-full bg-plum-soft"><div className="h-2 rounded-full" style={{ width: `${Math.max(2, (i.v / max) * 100)}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  )
}

/** Dona con leyenda. */
export function Donut({ items, format = cop }: { items: { k: string; v: number }[]; format?: (n: number) => string }) {
  const total = items.reduce((s, i) => s + i.v, 0)
  if (!total) return <NoData text="No hay gastos registrados en el periodo." />
  const shown = items.length > 7 ? [...items.slice(0, 7), { k: 'Otras', v: items.slice(7).reduce((s, i) => s + i.v, 0) }] : items
  const R = 80, r = 48, cx = 100, cy = 100
  let a0 = -Math.PI / 2
  const paths = shown.map((i, idx) => {
    const a1 = a0 + (i.v / total) * Math.PI * 2 - (shown.length === 1 ? 0.0001 : 0)
    const large = a1 - a0 > Math.PI ? 1 : 0
    const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)} ${cy + rad * Math.sin(a)}`
    const d = `M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} L${p(r, a1)} A${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`
    a0 = a1
    return <path key={i.k} d={d} fill={PIE_COLORS[idx % PIE_COLORS.length]}><title>{`${i.k}: ${format(i.v)} (${((i.v / total) * 100).toFixed(1)}%)`}</title></path>
  })
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" className="size-44 shrink-0" role="img" aria-label="Distribución de gastos por categoría">
        {paths}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fill={C.ink} fillOpacity="0.6">Gastos</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.plum}>{compact(total)}</text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {shown.map((i, idx) => (
          <li key={i.k} className="flex items-center gap-2"><span className="size-3 shrink-0 rounded-sm" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} /><span className="truncate">{i.k}</span><span className="ml-auto shrink-0 font-mono text-xs">{((i.v / total) * 100).toFixed(1).replace('.', ',')}% · {compact(i.v)}</span></li>
        ))}
      </ul>
    </div>
  )
}
