import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { hasRole, never } from '@/lib/access'

const ROLES = ['admin', 'gerente', 'empleado']

const rpAudit = auditHooks('Permisos', (d) => `Rol ${d.role} · ${d.module} · ${d.granted ? 'concedido' : 'revocado'}`)
const upAudit = auditHooks('Permisos', (d) => `Usuario ${typeof d.user === 'object' ? d.user?.name : d.user} · ${d.module} · ${d.granted ? 'concedido' : 'revocado'}`)

/** Rol_permiso: ajustes por rol sobre la matriz por defecto. */
export const RolePermissions: CollectionConfig = {
  slug: 'role-permissions',
  labels: { singular: 'Permiso de rol', plural: 'Permisos de rol' },
  admin: { group: 'Seguridad', defaultColumns: ['role', 'module', 'granted'] },
  access: { read: hasRole('admin'), create: never, update: never, delete: never },
  hooks: rpAudit,
  fields: [
    { name: 'role', type: 'select', required: true, options: ROLES, index: true },
    { name: 'module', type: 'text', required: true, index: true },
    { name: 'granted', type: 'checkbox', required: true, defaultValue: true },
  ],
}

/** Usuario_permiso: ajustes por usuario (prevalecen sobre el rol). */
export const UserPermissions: CollectionConfig = {
  slug: 'user-permissions',
  labels: { singular: 'Permiso de usuario', plural: 'Permisos de usuario' },
  admin: { group: 'Seguridad', defaultColumns: ['user', 'module', 'granted'] },
  access: { read: hasRole('admin'), create: never, update: never, delete: never },
  hooks: upAudit,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'module', type: 'text', required: true, index: true },
    { name: 'granted', type: 'checkbox', required: true, defaultValue: true },
  ],
}

/** Tokens_recuperacion: el código de 6 dígitos se guarda solo como hash. */
export const RecoveryTokens: CollectionConfig = {
  slug: 'recovery-tokens',
  labels: { singular: 'Token de recuperación', plural: 'Tokens de recuperación' },
  admin: { group: 'Seguridad', defaultColumns: ['user', 'expiresAt', 'used'] },
  access: { read: never, create: never, update: never, delete: never },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'tokenHash', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'used', type: 'checkbox', defaultValue: false },
    { name: 'attempts', type: 'number', defaultValue: 0 },
  ],
}
