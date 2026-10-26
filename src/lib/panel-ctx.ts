import type { User } from '@/payload-types'
import type { AppRole, Mode } from './access'
import type { Opt } from '@/components/panel/kit'

/** Contexto que el despachador entrega a cada módulo (`panel/_modules/<key>.tsx`). */
export type PanelCtx = {
  user: User
  role: AppRole
  mode: Mode
  canWrite: boolean
  viaGrant: boolean
  sp: Record<string, string | string[] | undefined>
  branches: Opt[]
  branch: string
  base: string
  overrideAccess: boolean
}

export const spStr = (v: string | string[] | undefined, d = '') => (Array.isArray(v) ? v[0] : v) ?? d
export const spPage = (sp: PanelCtx['sp'], key = 'page') => Math.max(1, parseInt(spStr(sp[key], '1'), 10) || 1)
