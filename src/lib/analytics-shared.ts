/** Utilidades puras de la analítica (sin acceso a datos): filtros por URL, fechas y nombre del PDF. */

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const pad = (n: number) => String(n).padStart(2, '0')
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export const daysInMonth = (y: number, m1: number) => new Date(Date.UTC(y, m1, 0)).getUTCDate()
export const todayBogota = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10)
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10)

export type Filters = { sede: string; desde: string; hasta: string; monthly: boolean }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const validDay = (s: string) => DAY_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

/** Por defecto: año en curso. El desglose es mensual cuando el rango empieza el día 1 y termina el último día de un mes. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const year = Number(todayBogota().slice(0, 4))
  let desde = one(sp.desde)
  let hasta = one(sp.hasta)
  if (!validDay(desde)) desde = ''
  if (!validDay(hasta)) hasta = ''
  if (!desde && !hasta) { desde = `${year}-01-01`; hasta = `${year}-12-31` }
  else if (!desde) desde = `${hasta.slice(0, 4)}-01-01`
  else if (!hasta) hasta = `${desde.slice(0, 4)}-12-31`
  if (hasta < desde) [desde, hasta] = [hasta, desde]
  const [hy, hm] = hasta.split('-').map(Number)
  const monthly = desde.endsWith('-01') && hasta === `${hy}-${pad(hm)}-${pad(daysInMonth(hy, hm))}`
  return { sede: one(sp.sede), desde, hasta, monthly }
}

export function presets(today = todayBogota()) {
  const y = Number(today.slice(0, 4))
  const m = Number(today.slice(5, 7))
  const q0 = Math.floor((m - 1) / 3) * 3 + 1
  const range = (a: string, b: string) => ({ desde: a, hasta: b })
  return [
    { id: 'anio', label: 'Este año', ...range(`${y}-01-01`, `${y}-12-31`) },
    { id: 'pasado', label: 'Año pasado', ...range(`${y - 1}-01-01`, `${y - 1}-12-31`) },
    { id: 'trimestre', label: 'Trimestre', ...range(`${y}-${pad(q0)}-01`, `${y}-${pad(q0 + 2)}-${pad(daysInMonth(y, q0 + 2))}`) },
    { id: 'mes', label: 'Mes actual', ...range(`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(daysInMonth(y, m))}`) },
  ]
}

/** `Reporte_2026_Septiembre_01sep-30sep.pdf` · `Reporte_2026_SeptiembreANoviembre_01sep-3nov.pdf` */
export function reportFileName(desde: string, hasta: string) {
  const [y1, m1, d1] = desde.split('-').map(Number)
  const [y2, m2, d2] = hasta.split('-').map(Number)
  const year = y1 === y2 ? String(y1) : `${y1}-${y2}`
  const months = y1 === y2 && m1 === m2 ? MONTHS[m1 - 1] : `${MONTHS[m1 - 1]}A${MONTHS[m2 - 1]}`
  return `Reporte_${year}_${months}_${pad(d1)}${MONTHS_SHORT[m1 - 1]}-${d2}${MONTHS_SHORT[m2 - 1]}.pdf`
}

export const fmtDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

export const qs = (o: Record<string, string | undefined>) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Query param que simula la ejecución del ETL de analítica (solo en demo; en producción lo dispara el backend). */
export const ANALYTICS_ETL_PARAM = 'procesar'

export function isAnalyticsProcessed(sp: Record<string, string | string[] | undefined>): boolean {
  return one(sp[ANALYTICS_ETL_PARAM]) === '1'
}
