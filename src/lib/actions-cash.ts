'use server'
import { run, type Res } from './action-kit'
import { computeCash, expectedCash } from './cash'

const CATS = ['gasto', 'transferencia', 'ahorro', 'adicion']
const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

async function conceptInfo(payload: any, id?: string) {
  if (!id) return null
  const c = await payload.findByID({ collection: 'cash-concepts', id, depth: 0, overrideAccess: true })
  return { id: c.id as string, category: c.category as string | undefined, categoryRef: idOf(c.categoryRef) as string | undefined }
}

export async function addCashMovement(v: { branch: string; category: string; concept?: string; amount: number; note?: string }): Promise<Res> {
  return run('caja', async ({ payload, acc }) => {
    const amount = Number(v.amount)
    if (!(amount > 0)) throw new Error('El valor debe ser mayor a 0.')
    const ci = await conceptInfo(payload, v.concept)
    const category = ci?.category && !CATS.includes(v.category) ? ci.category : v.category
    if (!CATS.includes(category)) throw new Error('Elige una categoría válida.')
    if (!v.branch) throw new Error('Elige la sede.')
    await payload.create({
      collection: 'cash-movements', ...acc, depth: 0,
      data: { branch: v.branch, category, concept: ci?.id, categoryRef: ci?.categoryRef, amount, note: v.note?.trim() || undefined, date: new Date().toISOString() } as any,
    })
    return { ok: true, message: 'Movimiento de caja registrado.' }
  })
}

async function editable(c: any, id: string) {
  const m = await c.payload.findByID({ collection: 'cash-movements', id, depth: 0, ...c.acc })
  if (m.locked || m.closing) throw new Error('Este movimiento está bloqueado o ya pertenece a una jornada cerrada.')
  if (c.role === 'empleado' && idOf(m.user) !== c.user.id) throw new Error('Solo puedes modificar tus propios movimientos.')
  return m
}

export async function updateCashMovement(id: string, v: { concept?: string; category?: string; amount: number; note?: string }): Promise<Res> {
  return run('caja', async (c) => {
    await editable(c, id)
    const amount = Number(v.amount)
    if (!(amount > 0)) throw new Error('El valor debe ser mayor a 0.')
    const ci = await conceptInfo(c.payload, v.concept)
    const category = v.category && CATS.includes(v.category) ? v.category : ci?.category
    const data: Record<string, unknown> = { amount, note: v.note?.trim() || null, concept: ci?.id ?? null, categoryRef: ci?.categoryRef ?? null }
    if (category) { data.category = category; if (category === 'transferencia') data.locked = true }
    await c.payload.update({ collection: 'cash-movements', id, ...c.acc, depth: 0, data: data as any })
    return { ok: true, message: 'Movimiento actualizado.' }
  })
}

export async function deleteCashMovement(id: string): Promise<Res> {
  return run('caja', async (c) => {
    await editable(c, id)
    await c.payload.delete({ collection: 'cash-movements', id, ...c.acc })
    return { ok: true, message: 'Movimiento eliminado.' }
  })
}

export async function closeCashDay(v: { day: string; branch: string; baseInitial: number; delivery: number; deliveryNote?: string; countedCash: number; notes?: string }): Promise<Res> {
  return run('cierre', async ({ user, payload, acc }) => {
    const c = await computeCash(user, v.day, v.branch)
    if (c.closed) throw new Error('Esa jornada ya fue cerrada en esta sede.')
    const base = Math.max(0, Number(v.baseInitial) || 0)
    const delivery = Math.max(0, Number(v.delivery) || 0)
    const counted = Math.max(0, Number(v.countedCash) || 0)
    const expected = expectedCash(base, c, delivery)
    const closing = await payload.create({
      collection: 'cash-closings', ...acc, depth: 0,
      data: { day: v.day, branch: v.branch, user: user.id, baseInitial: base, delivery, deliveryNote: v.deliveryNote?.trim() || undefined, cashSales: c.cashSales, additions: c.additions, expenses: c.expenses, savings: c.savings, transfers: c.transfers, expectedCash: expected, countedCash: counted, difference: counted - expected, transferSales: c.transferSales, cardSales: c.cardSales, status: 'cerrado', notes: v.notes?.trim() || undefined } as any,
    })
    if (delivery > 0) {
      await payload.create({ collection: 'cash-deliveries', ...acc, depth: 0, data: { day: v.day, branch: v.branch, closing: closing.id, amount: delivery, description: v.deliveryNote?.trim() || undefined } as any })
    }
    for (const id of c.movementIds) await payload.update({ collection: 'cash-movements', id, data: { closing: closing.id, locked: true }, overrideAccess: true, context: { skipAudit: true } })
    return { ok: true, message: `Jornada cerrada. Diferencia: $${(counted - expected).toLocaleString('es-CO')}.` }
  })
}
