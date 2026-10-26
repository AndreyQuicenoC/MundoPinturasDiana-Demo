import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import type { Where } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { actorName, hasRole, isManager, isStaff, ownOrManager, roleOf } from '@/lib/access'

const ownOpen = (uid: string | number): Where => ({
  and: [{ user: { equals: uid } }, { locked: { not_equals: true } }, { closing: { exists: false } }],
})

const CATEGORIES = ['gasto', 'transferencia', 'ahorro', 'adicion']

export const CashConcepts: CollectionConfig = {
  slug: 'cash-concepts',
  admin: { useAsTitle: 'name', group: 'Caja', defaultColumns: ['name', 'categoryRef', 'suggestedAmount'] },
  access: { read: isStaff, create: isManager, update: isManager, delete: hasRole('admin') },
  hooks: {
    beforeChange: [async ({ data, req }) => {
      const id = typeof data.categoryRef === 'object' ? data.categoryRef?.id : data.categoryRef
      if (id) {
        const c = await req.payload.findByID({ collection: 'cash-categories', id, depth: 0, overrideAccess: true, req })
        data.category = c.type
      }
      return data
    }],
    ...(() => { const a = auditHooks('Conceptos de caja', (d) => `${d.name} (${d.category})`); return { afterChange: a.afterChange, afterDelete: a.afterDelete } })(),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'categoryRef', type: 'relationship', relationTo: 'cash-categories', label: 'Categoría' },
    { name: 'category', type: 'select', options: CATEGORIES, index: true, admin: { readOnly: true, description: 'Se deriva de la categoría.' } },
    { name: 'suggestedAmount', type: 'number', min: 0, label: 'Valor sugerido (opcional)' },
    { name: 'description', type: 'text', label: 'Detalle sugerido (opcional)' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

const audit = auditHooks('Caja', (d) => `${d.category} · $${d.amount} · ${d.note ?? ''}`)

export const CashMovements: CollectionConfig = {
  slug: 'cash-movements',
  admin: { group: 'Caja', defaultColumns: ['date', 'category', 'concept', 'amount', 'branch'] },
  access: {
    read: ownOrManager('user'),
    create: isStaff,
    update: ({ req }) => {
      const r = roleOf(req.user as any)
      if (r === 'admin' || r === 'gerente') return true
      return r === 'empleado' ? ownOpen(req.user!.id) : false
    },
    delete: ({ req }) => {
      const r = roleOf(req.user as any)
      if (r === 'admin' || r === 'gerente') return { closing: { exists: false } } as Where
      return r === 'empleado' ? ownOpen(req.user!.id) : false
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create') {
          if (!(Number(data.amount) > 0)) throw new APIError('El valor debe ser mayor a 0.', 400)
          data.user = req.user?.collection === 'users' ? req.user.id : undefined
          data.actor = actorName(req)
          data.date = data.date ?? new Date().toISOString()
          if (data.category === 'transferencia') data.locked = true
        }
        return data
      },
    ],
    afterChange: audit.afterChange,
    afterDelete: audit.afterDelete,
  },
  fields: [
    { name: 'date', type: 'date', required: true, index: true },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'category', type: 'select', required: true, options: CATEGORIES, index: true },
    { name: 'concept', type: 'relationship', relationTo: 'cash-concepts', index: true },
    { name: 'categoryRef', type: 'relationship', relationTo: 'cash-categories', index: true },
    { name: 'amount', type: 'number', required: true, min: 1 },
    { name: 'note', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'actor', type: 'text' },
    { name: 'locked', type: 'checkbox', defaultValue: false, admin: { description: 'Las transferencias se precargan bloqueadas en el cierre.' } },
    { name: 'closing', type: 'relationship', relationTo: 'cash-closings', index: true },
  ],
}

const closingAudit = auditHooks('Cierres', (d) => `Cierre ${d.day} · esperado $${d.expectedCash} · contado $${d.countedCash} · dif $${d.difference}`)

export const CashClosings: CollectionConfig = {
  slug: 'cash-closings',
  admin: { useAsTitle: 'day', group: 'Caja', defaultColumns: ['day', 'branch', 'expectedCash', 'countedCash', 'difference', 'status'] },
  access: { read: ownOrManager('user'), create: isStaff, update: isManager, delete: hasRole('admin') },
  hooks: { afterChange: closingAudit.afterChange, afterDelete: closingAudit.afterDelete },
  fields: [
    { name: 'day', type: 'text', required: true, index: true, label: 'Día (AAAA-MM-DD)' },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'baseInitial', type: 'number', defaultValue: 0 },
    { name: 'delivery', type: 'number', defaultValue: 0, label: 'Entrega' },
    { name: 'deliveryNote', type: 'text' },
    { name: 'cashSales', type: 'number', defaultValue: 0 },
    { name: 'additions', type: 'number', defaultValue: 0 },
    { name: 'expenses', type: 'number', defaultValue: 0 },
    { name: 'savings', type: 'number', defaultValue: 0 },
    { name: 'transfers', type: 'number', defaultValue: 0 },
    { name: 'expectedCash', type: 'number', defaultValue: 0 },
    { name: 'countedCash', type: 'number', defaultValue: 0 },
    { name: 'difference', type: 'number', defaultValue: 0 },
    { name: 'transferSales', type: 'number', defaultValue: 0 },
    { name: 'cardSales', type: 'number', defaultValue: 0 },
    { name: 'status', type: 'select', defaultValue: 'cerrado', options: ['abierto', 'cerrado'] },
    { name: 'notes', type: 'textarea' },
  ],
}
