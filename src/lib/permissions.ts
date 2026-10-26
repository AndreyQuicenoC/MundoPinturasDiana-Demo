import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GRANT_MODE, LOCKED_FOR_ADMIN, MODULES, PERMISSIONS, type AppRole, type Mode, type ModuleKey } from '@/lib/access'

export type Effective = Record<ModuleKey, { mode: Mode; viaGrant: boolean }>

type U = { id: string | number; collection?: string }

/** Modo efectivo por módulo: matriz por defecto → ajuste del rol → ajuste del usuario (el del usuario prevalece). */
export const effectiveFor = cache(async (role: AppRole, userId: string | number | null): Promise<Effective> => {
  const payload = await getPayload({ config })
  const [rp, up] = await Promise.all([
    payload.find({ collection: 'role-permissions', where: { role: { equals: role } }, limit: 200, depth: 0, overrideAccess: true }),
    userId == null
      ? Promise.resolve({ docs: [] as any[] })
      : payload.find({ collection: 'user-permissions', where: { user: { equals: userId } }, limit: 200, depth: 0, overrideAccess: true }),
  ])
  const roleMap = new Map<string, boolean>(rp.docs.map((d: any) => [d.module, !!d.granted]))
  const userMap = new Map<string, boolean>(up.docs.map((d: any) => [d.module, !!d.granted]))
  const out = {} as Effective
  for (const m of MODULES) {
    const base = PERMISSIONS[m][role]
    const ov = userMap.has(m) ? userMap.get(m) : roleMap.get(m)
    let mode: Mode = base
    if (ov === false) mode = 'none'
    else if (ov === true && base === 'none') mode = GRANT_MODE[m]
    if (role === 'admin' && LOCKED_FOR_ADMIN.includes(m)) mode = base
    if (m === 'resumen') mode = base
    out[m] = { mode, viaGrant: mode !== base && mode !== 'none' }
  }
  return out
})

export async function effectiveForUser(user: U & { role: AppRole }) {
  return effectiveFor(user.role, user.collection === 'users' ? user.id : null)
}

export const canAccess = (eff: Effective, m: ModuleKey) => eff[m].mode !== 'none'
