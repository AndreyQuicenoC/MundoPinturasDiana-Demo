import 'server-only'
import type { User } from '@/payload-types'
import { getPayloadClient } from './payload'

export const bogotaDay = (d = new Date()) => new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10)
export const dayRange = (day: string) => ({ gte: `${day}T00:00:00-05:00`, lte: `${day}T23:59:59.999-05:00` })

export async function computeCash(user: User, day: string, branch: string) {
  const payload = await getPayloadClient()
  const r = dayRange(day)
  const common = { depth: 0, limit: 1000, user, overrideAccess: false } as const
  const [sales, moves, closing] = await Promise.all([
    payload.find({ collection: 'sales', ...common, where: { and: [{ branch: { equals: branch } }, { createdAt: { greater_than_equal: r.gte } }, { createdAt: { less_than_equal: r.lte } }, { status: { not_equals: 'anulada' } }, { channel: { not_equals: 'domicilio' } }] } }),
    payload.find({ collection: 'cash-movements', ...common, where: { and: [{ branch: { equals: branch } }, { date: { greater_than_equal: r.gte } }, { date: { less_than_equal: r.lte } }, { closing: { exists: false } }] } }),
    payload.find({ collection: 'cash-closings', depth: 0, limit: 1, user, overrideAccess: false, where: { and: [{ day: { equals: day } }, { branch: { equals: branch } }] } }),
  ])
  let cashSales = 0, transferSales = 0, cardSales = 0
  for (const s of sales.docs) for (const p of s.payments ?? []) {
    if (p.method === 'efectivo') cashSales += p.amount
    else if (p.method === 'transferencia') transferSales += p.amount
    else if (p.method === 'tarjeta') cardSales += p.amount
  }
  const sum = (c: string) => moves.docs.filter((m) => m.category === c).reduce((a, m) => a + m.amount, 0)
  const additions = sum('adicion'), expenses = sum('gasto'), savings = sum('ahorro'), transfers = sum('transferencia')
  return { day, branch, cashSales, transferSales, cardSales, additions, expenses, savings, transfers, salesCount: sales.docs.length, closed: closing.docs[0] ?? null, movementIds: moves.docs.map((m) => m.id) }
}

/** Efectivo esperado = base + ventas en efectivo + adiciones − (gastos + ahorros + transferencias) − entrega. */
export const expectedCash = (base: number, c: { cashSales: number; additions: number; expenses: number; savings: number; transfers: number }, delivery = 0) =>
  base + c.cashSales + c.additions - (c.expenses + c.savings + c.transfers) - delivery
