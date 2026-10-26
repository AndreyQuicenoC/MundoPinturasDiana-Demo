// Horario y días no laborales de las sedes (hora de Bogotá, UTC-5, sin horario de verano).
export const SCHEDULE_TEXT = 'Lun–Sáb 8:00 a.m.–5:00 p.m. · Dom 8:00 a.m.–12:00 m.'
export const CLOSED_DAYS_TEXT = 'Cerramos solo el 1 de enero, Jueves Santo, Viernes Santo y el 25 de diciembre.'

type Parts = { y: number; m: number; d: number; dow: number; minutes: number }

/** Componentes de fecha/hora en Bogotá para cualquier instante. */
export function bogotaParts(date: Date = new Date()): Parts {
  const t = new Date(date.getTime() - 5 * 3600_000)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay(), minutes: t.getUTCHours() * 60 + t.getUTCMinutes() }
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
export function easterSunday(year: number): { m: number; d: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { m: month, d: day }
}

const dayKey = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d)

/** Motivo del cierre ('Año Nuevo', 'Jueves Santo', ...) o null si es un día laboral. */
export function closedReason(date: Date = new Date()): string | null {
  const { y, m, d } = bogotaParts(date)
  if (m === 1 && d === 1) return 'Año Nuevo'
  if (m === 12 && d === 25) return 'Navidad'
  const e = easterSunday(y)
  const k = dayKey(y, m, d)
  const easter = dayKey(y, e.m, e.d)
  if (k === easter - 3 * 86400_000) return 'Jueves Santo'
  if (k === easter - 2 * 86400_000) return 'Viernes Santo'
  return null
}

export const isClosedDay = (date: Date = new Date()) => closedReason(date) !== null

export type TodayStatus = { open: boolean; closedAllDay: boolean; label: string; detail: string }

/** Estado actual: "Abierto ahora" / "Cerrado hoy (festivo)" / "Cerrado ahora". */
export function todayStatus(now: Date = new Date()): TodayStatus {
  const reason = closedReason(now)
  if (reason) return { open: false, closedAllDay: true, label: 'Cerrado hoy (festivo)', detail: reason }
  const { dow, minutes } = bogotaParts(now)
  const close = dow === 0 ? 12 * 60 : 17 * 60
  const hours = dow === 0 ? '8:00 a.m.–12:00 m.' : '8:00 a.m.–5:00 p.m.'
  if (minutes >= 8 * 60 && minutes < close) return { open: true, closedAllDay: false, label: 'Abierto ahora', detail: `Hoy ${hours}` }
  return { open: false, closedAllDay: false, label: 'Cerrado ahora', detail: `Hoy ${hours}` }
}

/** YYYY-MM-DD en hora de Bogotá. */
export const bogotaDay = (date: Date = new Date()) => {
  const { y, m, d } = bogotaParts(date)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
