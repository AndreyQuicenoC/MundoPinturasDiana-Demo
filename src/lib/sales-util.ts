/** Utilidades puras (cliente y servidor) para ventas: zona horaria de Bogotá (UTC−5, sin horario de verano). */
const OFF = 5 * 3600_000

export const bogotaNow = () => new Date(Date.now() - OFF)
export const currentMonth = () => bogotaNow().toISOString().slice(0, 7)
export const isMonth = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
export const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

/** Inicio (UTC) del día de Bogotá `YYYY-MM-DD`. */
export const dayStart = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + OFF).toISOString()
export const dayEnd = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + OFF + 86400_000 - 1).toISOString()
export const todayBogota = () => bogotaNow().toISOString().slice(0, 10)

export function monthRange(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  return { gte: new Date(Date.parse(`${mes}-01T00:00:00Z`) + OFF).toISOString(), lt: new Date(Date.parse(`${next}-01T00:00:00Z`) + OFF).toISOString() }
}

export const monthLabel = (mes: string) => new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
