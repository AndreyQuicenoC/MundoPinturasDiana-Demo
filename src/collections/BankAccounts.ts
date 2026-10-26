import type { CollectionConfig } from 'payload'
import { hasRole, isStaff } from '@/lib/access'

export const BankAccounts: CollectionConfig = {
  slug: 'bank-accounts',
  admin: { useAsTitle: 'name', group: 'Caja' },
  access: { read: isStaff, create: hasRole('admin', 'gerente'), update: hasRole('admin', 'gerente'), delete: hasRole('admin') },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nombre (ej. Bancolombia ahorros)' },
    { name: 'bank', type: 'text' },
    { name: 'lastDigits', type: 'text', maxLength: 4, label: 'Últimos 4 dígitos' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
