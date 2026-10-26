import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { hasRole, isManager } from '@/lib/access'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: { useAsTitle: 'name', group: 'Comercial' },
  access: { read: isManager, create: isManager, update: isManager, delete: hasRole('admin') },
  hooks: auditHooks('Proveedores', (d) => d.name),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'nit', type: 'text', unique: true, index: true },
    { name: 'contact', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'products', type: 'textarea', label: 'Qué nos suministra' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
