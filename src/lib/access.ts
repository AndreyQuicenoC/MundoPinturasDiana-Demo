import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type AppRole = 'admin' | 'gerente' | 'empleado'

type AnyUser = { collection?: string; role?: AppRole; status?: string; id?: string | number } | null | undefined

export function roleOf(user: AnyUser): AppRole | null {
  if (!user) return null
  if (user.collection === 'admins') return 'admin'
  if (user.collection === 'users' && user.status === 'activo' && user.role) return user.role
  return null
}

export const hasRole =
  (...roles: AppRole[]): Access =>
  ({ req }) => {
    const r = roleOf(req.user as AnyUser)
    return !!r && roles.includes(r)
  }

export const fieldHasRole =
  (...roles: AppRole[]): FieldAccess =>
  ({ req }) => {
    const r = roleOf(req.user as AnyUser)
    return !!r && roles.includes(r)
  }

export const isStaff = hasRole('admin', 'gerente', 'empleado')
export const isManager = hasRole('admin', 'gerente')
export const isAdminRole = hasRole('admin')
export const never: Access = () => false
export const fieldNever: FieldAccess = () => false

/** Admin/gerente see everything; empleado only rows whose `field` is their own id. */
export const ownOrManager =
  (field: string): Access =>
  ({ req }) => {
    const user = req.user as AnyUser
    const r = roleOf(user)
    if (!r) return false
    if (r === 'admin' || r === 'gerente') return true
    return { [field]: { equals: user!.id } }
  }

export const actorName = (req: PayloadRequest) => {
  const u = req.user as (AnyUser & { name?: string; email?: string }) | null
  return u ? (u.name ?? u.email ?? String(u.id)) : 'Sistema'
}

export const MODULES = [
  'resumen', 'usuarios', 'permisos', 'sedes', 'categorias', 'productos', 'inventario', 'clientes', 'proveedores',
  'ventas', 'pos', 'domicilios', 'facturacion', 'caja', 'conceptos', 'cierre', 'eventos', 'promociones', 'auditoria', 'analitica',
] as const
export type ModuleKey = (typeof MODULES)[number]
export type Mode = 'total' | 'ver' | 'propio' | 'none'

/** Matriz por defecto por rol. Los ajustes de la BD (Rol_permiso / Usuario_permiso) se aplican encima en lib/permissions.ts. */
export const PERMISSIONS: Record<ModuleKey, Record<AppRole, Mode>> = {
  resumen: { admin: 'total', gerente: 'total', empleado: 'propio' },
  usuarios: { admin: 'total', gerente: 'none', empleado: 'none' },
  permisos: { admin: 'total', gerente: 'none', empleado: 'none' },
  sedes: { admin: 'total', gerente: 'none', empleado: 'none' },
  categorias: { admin: 'total', gerente: 'none', empleado: 'none' },
  productos: { admin: 'total', gerente: 'total', empleado: 'ver' },
  inventario: { admin: 'total', gerente: 'total', empleado: 'ver' },
  clientes: { admin: 'total', gerente: 'total', empleado: 'total' },
  proveedores: { admin: 'total', gerente: 'none', empleado: 'none' },
  ventas: { admin: 'total', gerente: 'total', empleado: 'propio' },
  pos: { admin: 'total', gerente: 'total', empleado: 'total' },
  domicilios: { admin: 'total', gerente: 'total', empleado: 'total' },
  facturacion: { admin: 'total', gerente: 'total', empleado: 'none' },
  caja: { admin: 'total', gerente: 'total', empleado: 'none' },
  conceptos: { admin: 'total', gerente: 'total', empleado: 'none' },
  cierre: { admin: 'total', gerente: 'total', empleado: 'none' },
  eventos: { admin: 'total', gerente: 'total', empleado: 'none' },
  promociones: { admin: 'total', gerente: 'total', empleado: 'none' },
  auditoria: { admin: 'total', gerente: 'none', empleado: 'none' },
  analitica: { admin: 'total', gerente: 'total', empleado: 'none' },
}

/** Módulos que nunca se pueden revocar al administrador (evita quedarse sin acceso al panel). */
export const LOCKED_FOR_ADMIN: ModuleKey[] = ['resumen', 'permisos', 'usuarios']
/** Modo que se otorga cuando se habilita un módulo que por defecto estaba en «none». */
export const GRANT_MODE: Record<ModuleKey, Mode> = Object.fromEntries(
  MODULES.map((m) => [m, ['usuarios', 'permisos', 'sedes', 'auditoria', 'analitica'].includes(m) ? 'ver' : 'total']),
) as Record<ModuleKey, Mode>

export const canModule = (role: AppRole, m: ModuleKey) => PERMISSIONS[m][role] !== 'none'
