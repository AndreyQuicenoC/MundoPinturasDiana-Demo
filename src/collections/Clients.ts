import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { hasRole, isStaff } from '@/lib/access'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: { useAsTitle: 'name', group: 'Comercial', defaultColumns: ['name', 'document', 'phone', 'clientType'] },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: hasRole('admin', 'gerente') },
  hooks: auditHooks('Clientes', (d) => `${d.name} · ${d.document ?? 's/d'}`),
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'document', type: 'text', unique: true, index: true, label: 'Documento / NIT' },
    { name: 'phone', type: 'text', index: true },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'text' },
    { name: 'clientType', type: 'select', defaultValue: 'natural', options: ['natural', 'empresa', 'pintor', 'contratista'] },
    { name: 'habeasData', type: 'checkbox', defaultValue: false, label: 'Autoriza tratamiento de datos (Habeas Data)' },
    { name: 'habeasDataDate', type: 'date' },
    { name: 'notes', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
