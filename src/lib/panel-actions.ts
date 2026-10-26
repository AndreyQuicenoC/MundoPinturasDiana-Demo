'use server'
import { RESOURCES } from './panel-config'
import { computeCash, expectedCash } from './cash'
import { run, type Res } from './action-kit'
import type { ModuleKey } from './access'

export async function saveRow(key: ModuleKey, id: string | null, values: Record<string, unknown>): Promise<Res> {
  const cfg = RESOURCES[key]
  if (!cfg) return { ok: false, error: 'Módulo desconocido.' }
  return run(key, async ({ user, payload, acc }) => {
    const data: Record<string, unknown> = {}
    for (const f of cfg.fields) {
      if (!(f.name in values)) continue
      if (f.createOnly && id) continue
      let v = values[f.name]
      if (f.type === 'number') v = v === '' || v == null ? undefined : Number(v)
      else if (f.type === 'relation') v = v || null
      else if (f.type === 'checkbox') v = !!v
      else if (typeof v === 'string') v = v.trim()
      if (v === '' && !f.required) v = id ? null : undefined
      data[f.name] = v
    }
    if (key === 'usuarios' && !id && String(data.password ?? '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
    if (key === 'clientes' && data.habeasData) data.habeasDataDate = new Date().toISOString()
    const base = { collection: cfg.collection as any, data: data as any, ...acc, depth: 0 }
    if (id) await payload.update({ ...base, id })
    else await payload.create(base)
    return { ok: true, message: id ? 'Cambios guardados.' : `Se creó el ${cfg.singular}.` }
  })
}

const EXTRA_DELETABLE: Record<string, ModuleKey> = { 'cash-movements': 'caja' }

export async function removeRow(collection: string, id: string): Promise<Res> {
  const moduleKey = (Object.entries(RESOURCES).find(([, c]) => c?.collection === collection)?.[0] as ModuleKey | undefined) ?? EXTRA_DELETABLE[collection]
  if (!moduleKey) return { ok: false, error: 'No se puede eliminar este tipo de registro.' }
  return run(moduleKey, async ({ payload, acc }) => {
    await payload.delete({ collection: collection as any, id, ...acc })
    return { ok: true, message: 'Registro eliminado.' }
  })
}

export type SaleInput = {
  branch: string
  client?: string
  channel: 'mostrador' | 'domicilio'
  lines: { product: string; quantity: number; discountPct: number }[]
  payments: { method: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'; bankAccount?: string; amount: number }[]
  notes?: string
}

export async function createSale(input: SaleInput): Promise<Res> {
  return run('pos', async ({ user, payload, acc }) => {
    const stockErr: string[] = []
    for (const l of input.lines) {
      const inv = await payload.find({ collection: 'inventory', where: { and: [{ product: { equals: l.product } }, { branch: { equals: input.branch } }] }, limit: 1, depth: 1, ...acc })
      const have = inv.docs[0]?.quantity ?? 0
      if (have < l.quantity) stockErr.push(`${(inv.docs[0]?.product as any)?.name ?? 'Producto'}: disponible ${have}`)
    }
    if (stockErr.length) throw new Error(`Stock insuficiente — ${stockErr.join('; ')}`)
    const sale = await payload.create({
      collection: 'sales', ...acc, depth: 0,
      data: {
        branch: input.branch,
        client: input.client || undefined,
        channel: input.channel,
        lines: input.lines.map((l) => ({ product: l.product, quantity: l.quantity, discountPct: l.discountPct })),
        payments: input.payments.filter((p) => p.amount > 0).map((p) => ({ method: p.method, bankAccount: p.method === 'transferencia' ? p.bankAccount || undefined : undefined, amount: p.amount })),
        notes: input.notes,
      } as any,
    })
    return { ok: true, message: `Venta #${sale.number} registrada.` }
  })
}

export async function voidSale(id: string, reason: string): Promise<Res> {
  return run('ventas', async ({ user, payload, acc }) => {
    await payload.update({ collection: 'sales', id, ...acc, data: { status: 'anulada', voidReason: reason } })
    return { ok: true, message: 'Venta anulada y stock restituido.' }
  })
}

export async function returnSale(id: string, product: string, quantity: number, reason: string): Promise<Res> {
  return run('ventas', async ({ user, payload, acc }) => {
    const sale = await payload.findByID({ collection: 'sales', id, depth: 0, ...acc })
    const returns = [...(sale.returns ?? []).map((r) => ({ product: typeof r.product === 'object' ? (r.product as any).id : r.product, quantity: r.quantity, reason: r.reason })), { product, quantity, reason }]
    await payload.update({ collection: 'sales', id, ...acc, data: { returns } as any })
    return { ok: true, message: 'Devolución registrada.' }
  })
}

export async function registerMovement(v: { product: string; branch: string; type: string; quantity: number; unitCost?: number; supplier?: string; reference?: string; reason?: string }): Promise<Res> {
  return run('inventario', async ({ user, payload, acc }) => {
    await payload.create({ collection: 'inventory-movements', ...acc, depth: 0, data: { ...v, quantity: Number(v.quantity), supplier: v.supplier || undefined } as any })
    return { ok: true, message: 'Movimiento registrado.' }
  })
}

export async function transferStock(v: { product: string; from: string; to: string; quantity: number; reason?: string }): Promise<Res> {
  return run('inventario', async ({ user, payload, acc }) => {
    if (v.from === v.to) throw new Error('Elige sedes distintas.')
    const base = { collection: 'inventory-movements' as const, ...acc, depth: 0 }
    const ref = `Traslado ${new Date().toISOString().slice(0, 10)}`
    await payload.create({ ...base, data: { product: v.product, branch: v.from, type: 'traslado_salida', quantity: Number(v.quantity), reference: ref, reason: v.reason } })
    await payload.create({ ...base, data: { product: v.product, branch: v.to, type: 'traslado_entrada', quantity: Number(v.quantity), reference: ref, reason: v.reason } })
    return { ok: true, message: 'Traslado realizado.' }
  })
}

export async function addCashMovement(v: { branch: string; category: string; concept?: string; amount: number; note?: string }): Promise<Res> {
  return run('caja', async ({ user, payload, acc }) => {
    await payload.create({ collection: 'cash-movements', ...acc, depth: 0, data: { branch: v.branch, category: v.category, concept: v.concept || undefined, amount: Number(v.amount), note: v.note, date: new Date().toISOString() } as any })
    return { ok: true, message: 'Movimiento de caja registrado.' }
  })
}

export async function closeDay(v: { day: string; branch: string; baseInitial: number; countedCash: number; notes?: string }): Promise<Res> {
  return run('cierre', async ({ user, payload, acc }) => {
    const c = await computeCash(user, v.day, v.branch)
    if (c.closed) throw new Error('Esa jornada ya fue cerrada en esta sede.')
    const base = Math.max(0, Number(v.baseInitial) || 0)
    const counted = Math.max(0, Number(v.countedCash) || 0)
    const expected = expectedCash(base, c)
    const closing = await payload.create({
      collection: 'cash-closings', ...acc, depth: 0,
      data: { day: v.day, branch: v.branch, user: user.id, baseInitial: base, cashSales: c.cashSales, additions: c.additions, expenses: c.expenses, savings: c.savings, transfers: c.transfers, expectedCash: expected, countedCash: counted, difference: counted - expected, transferSales: c.transferSales, cardSales: c.cardSales, status: 'cerrado', notes: v.notes } as any,
    })
    for (const id of c.movementIds) await payload.update({ collection: 'cash-movements', id, data: { closing: closing.id, locked: true }, overrideAccess: true, context: { skipAudit: true } })
    return { ok: true, message: `Jornada cerrada. Diferencia: $${(counted - expected).toLocaleString('es-CO')}.` }
  })
}

export async function markNotification(id: string, status: 'leida' | 'archivada'): Promise<Res> {
  return run(undefined, async ({ user, payload }) => {
    await payload.update({ collection: 'notifications', id, data: { status }, user, overrideAccess: false })
  })
}

export async function changePassword(current: string, next: string): Promise<Res> {
  return run(undefined, async ({ user, payload }) => {
    if (next.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.')
    try {
      await payload.login({ collection: 'users', data: { email: user.email, password: current } })
    } catch {
      throw new Error('La contraseña actual no es correcta.')
    }
    await payload.update({ collection: 'users', id: user.id, data: { password: next, mustChangePassword: false }, user, overrideAccess: false })
    return { ok: true, message: 'Contraseña actualizada.' }
  })
}

const PROFILE_FIELDS = ['name', 'phone', 'document', 'bloodType', 'birthDate', 'address', 'emergencyContactName', 'emergencyContactPhone'] as const
const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export async function updateProfile(values: Record<string, string>): Promise<Res> {
  return run(undefined, async ({ user, payload }) => {
    const data: Record<string, unknown> = {}
    for (const f of PROFILE_FIELDS) {
      if (!(f in values)) continue
      const v = String(values[f] ?? '').trim().slice(0, 120)
      data[f] = v === '' ? null : v
    }
    if (!data.name) throw new Error('El nombre es obligatorio.')
    if (data.phone && !/^[0-9+\s()-]{7,20}$/.test(String(data.phone))) throw new Error('Teléfono inválido.')
    if (data.emergencyContactPhone && !/^[0-9+\s()-]{7,20}$/.test(String(data.emergencyContactPhone))) throw new Error('Teléfono de emergencia inválido.')
    if (data.bloodType && !BLOOD.includes(String(data.bloodType))) throw new Error('Tipo de sangre inválido.')
    if (data.birthDate) {
      const d = new Date(String(data.birthDate))
      if (Number.isNaN(d.getTime()) || d > new Date()) throw new Error('Fecha de nacimiento inválida.')
    }
    await payload.update({ collection: 'users', id: user.id, data: data as any, user, overrideAccess: false, depth: 0 })
    return { ok: true, message: 'Perfil actualizado.' }
  }, { write: false })
}
