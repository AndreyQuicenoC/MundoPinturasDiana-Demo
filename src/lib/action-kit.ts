import 'server-only'
import { revalidatePath } from 'next/cache'
import { appAuth } from './app-auth'
import { getPayloadClient } from './payload'
import { roleOf, type ModuleKey } from './access'
import { effectiveFor } from './permissions'

export type Res = { ok: true; message?: string; data?: unknown } | { ok: false; error: string }

export type Ctx = Awaited<ReturnType<typeof guard>>

/**
 * Valida sesión y permiso efectivo (matriz + ajustes en BD). `write` exige modo distinto de «ver».
 * `acc` se esparce en las llamadas a Payload: `payload.find({ ..., ...c.acc })`.
 * Si el permiso fue concedido por encima del rol (viaGrant) se omite el control de acceso de la colección.
 */
export async function guard(module?: ModuleKey, opts: { write?: boolean } = {}) {
  const user = await appAuth.currentUser()
  const role = roleOf(user as any)
  if (!user || !role) throw new Error('Tu sesión expiró. Vuelve a ingresar.')
  let mode: string = 'total'
  let viaGrant = false
  if (module) {
    const eff = (await effectiveFor(role, user.id))[module]
    mode = eff.mode
    viaGrant = eff.viaGrant
    if (mode === 'none') throw new Error('No tienes permiso para esta acción.')
    if (opts.write && mode === 'ver') throw new Error('Tu permiso para este módulo es solo de consulta.')
  }
  return { user, role, mode, viaGrant, acc: { user, overrideAccess: viaGrant } as { user: typeof user; overrideAccess: boolean }, payload: await getPayloadClient() }
}

export const fail = (e: unknown): Res => {
  const err = e as any
  const detail = err?.data?.errors?.map((x: any) => x.message).filter(Boolean).join(' · ')
  return { ok: false, error: detail || err?.message || 'No se pudo completar la acción.' }
}

export const run = async (module: ModuleKey | undefined, fn: (c: Ctx) => Promise<Res | void>, opts: { write?: boolean } = { write: true }): Promise<Res> => {
  try {
    const c = await guard(module, opts)
    const out = await fn(c)
    revalidatePath('/panel', 'layout')
    return out ?? { ok: true }
  } catch (e) {
    return fail(e)
  }
}
