import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { fieldHasRole, hasRole, isStaff, roleOf } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { hidden: true, useAsTitle: 'name' },
  auth: {
    tokenExpiration: 60 * 60 * 10,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    create: hasRole('admin'),
    delete: hasRole('admin'),
    read: isStaff,
    update: ({ req, id }) => {
      const r = roleOf(req.user as any)
      if (r === 'admin') return true
      return !!req.user && String(req.user.id) === String(id)
    },
  },
  hooks: auditHooks('Usuarios', (d) => `${d.name} (${d.role})`),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'document', type: 'text', unique: true, index: true, label: 'Documento' },
    { name: 'phone', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'empleado',
      saveToJWT: true,
      options: ['admin', 'gerente', 'empleado'],
      access: { create: fieldHasRole('admin'), update: fieldHasRole('admin') },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'activo',
      saveToJWT: true,
      options: ['activo', 'inactivo', 'bloqueado'],
      access: { create: fieldHasRole('admin'), update: fieldHasRole('admin') },
    },
    { name: 'branch', type: 'relationship', relationTo: 'branches', access: { update: fieldHasRole('admin') } },
    { name: 'bloodType', type: 'select', options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], label: 'Tipo de sangre' },
    { name: 'birthDate', type: 'date', label: 'Fecha de nacimiento', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'address', type: 'text', label: 'Dirección' },
    { name: 'emergencyContactName', type: 'text', label: 'Contacto de emergencia' },
    { name: 'emergencyContactPhone', type: 'text', label: 'Teléfono de emergencia' },
    { name: 'mustChangePassword', type: 'checkbox', defaultValue: false, access: { update: ({ req }) => !!req.user } },
  ],
}
