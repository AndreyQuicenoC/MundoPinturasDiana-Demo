import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { bust } from '@/lib/revalidate'
import { hasRole, isManager, isStaff, never, roleOf } from '@/lib/access'

export const Domicilios: CollectionConfig = {
  slug: 'domicilios',
  labels: { singular: 'Domicilio', plural: 'Domicilios' },
  admin: { useAsTitle: 'customerName', group: 'Ventas', defaultColumns: ['customerName', 'address', 'courier', 'status', 'createdAt'] },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isManager },
  hooks: (() => {
    const a = auditHooks('Domicilios', (d) => `${d.customerName} · ${d.status}`)
    return {
      beforeChange: [({ data, originalDoc, operation, req }: any) => {
        if (operation === 'update' && data.status && data.status !== originalDoc?.status) {
          const next: Record<string, string[]> = { pendiente: ['en_ruta', 'cancelado'], en_ruta: ['entregado', 'cancelado'], entregado: [], cancelado: [] }
          if (!next[originalDoc?.status]?.includes(data.status)) throw new APIError('Ese cambio de estado no está permitido.', 400)
          data.history = [...(originalDoc?.history ?? []), { from: originalDoc?.status, to: data.status, at: new Date().toISOString(), by: (req.user as any)?.name ?? 'Sistema' }]
          if (data.status === 'entregado') data.deliveredAt = new Date().toISOString()
        }
        return data
      }],
      afterChange: a.afterChange,
      afterDelete: a.afterDelete,
    }
  })(),
  fields: [
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'sale', type: 'relationship', relationTo: 'sales' },
    { name: 'customerName', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'address', type: 'text', required: true },
    { name: 'courier', type: 'text', label: 'Domiciliario' },
    { name: 'courierRef', type: 'relationship', relationTo: 'couriers', label: 'Domiciliario (registrado)' },
    { name: 'courierFee', type: 'number', min: 0, admin: { description: 'No entra en ventas ni gastos del día.' } },
    { name: 'deliveryFee', type: 'number', min: 0, label: 'Valor del domicilio cobrado' },
    { name: 'saleNumber', type: 'number', index: true },
    { name: 'requestedAt', type: 'date' },
    { name: 'deliveredAt', type: 'date' },
    {
      name: 'history', type: 'array', admin: { readOnly: true },
      fields: [{ name: 'from', type: 'text' }, { name: 'to', type: 'text' }, { name: 'at', type: 'date' }, { name: 'by', type: 'text' }],
    },
    { name: 'status', type: 'select', defaultValue: 'pendiente', index: true, options: ['pendiente', 'en_ruta', 'entregado', 'cancelado'] },
    { name: 'notes', type: 'textarea' },
  ],
}

const eventAudit = auditHooks('Eventos', (d) => d.title)

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Evento', plural: 'Eventos' },
  admin: { useAsTitle: 'title', group: 'Operación', defaultColumns: ['title', 'startDate', 'endDate', 'importance', 'visible'] },
  access: {
    read: ({ req }): any => (roleOf(req.user as any) ? true : { and: [{ visible: { equals: true } }, { active: { not_equals: false } }] }),
    create: isManager,
    update: isManager,
    delete: isManager,
  },
  hooks: {
    beforeValidate: [({ data }) => {
      if (data && !data.startDate && data.date) data.startDate = data.date
      if (data && !data.endDate && data.startDate) data.endDate = data.startDate
      return data
    }],
    beforeChange: [({ data }) => {
      if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) throw new APIError('La fecha de fin no puede ser anterior a la de inicio.', 400)
      return data
    }],
    afterChange: [...eventAudit.afterChange, ({ doc }) => (bust('events'), doc)],
    afterDelete: [...eventAudit.afterDelete, ({ doc }) => (bust('events'), doc)],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'type', type: 'select', defaultValue: 'otro', options: ['promocion', 'capacitacion', 'entrega', 'festivo', 'social', 'atipico', 'otro'], label: 'Tipo' },
    { name: 'importance', type: 'select', defaultValue: 'normal', options: ['normal', 'clave'], index: true, label: 'Importancia', admin: { description: 'Clave = afecta datos u operación y se marca en la analítica como atípico.' } },
    { name: 'startDate', type: 'date', index: true, label: 'Inicio' },
    { name: 'endDate', type: 'date', index: true, label: 'Fin' },
    { name: 'date', type: 'date', admin: { hidden: true } },
    { name: 'branch', type: 'relationship', relationTo: 'branches' },
    { name: 'description', type: 'textarea' },
    { name: 'impact', type: 'textarea', label: 'Impacto en la operación' },
    { name: 'affectedAreas', type: 'text', label: 'Áreas afectadas' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'imageUrl', type: 'text', label: 'Enlace de la foto (alternativa)' },
    { name: 'visible', type: 'checkbox', defaultValue: false, label: 'Visible en el sitio público' },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Activo' },
  ],
}

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: { group: 'Seguridad', defaultColumns: ['createdAt', 'actor', 'entity', 'action', 'summary'] },
  access: { read: isManager, create: never, update: never, delete: never },
  timestamps: true,
  fields: [
    { name: 'actor', type: 'text', index: true },
    { name: 'entity', type: 'text', index: true },
    { name: 'action', type: 'select', options: ['crear', 'editar', 'eliminar', 'login', 'logout', 'anular'] },
    { name: 'docId', type: 'text' },
    { name: 'summary', type: 'text' },
  ],
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: { useAsTitle: 'title', group: 'Operación' },
  access: {
    read: ({ req }) => {
      const r = roleOf(req.user as any)
      if (!r) return false
      if (r === 'admin') return true
      return { audience: { in: ['todos', r] } }
    },
    create: isManager,
    update: isStaff,
    delete: hasRole('admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'type', type: 'select', options: ['info', 'exito', 'advertencia', 'error'], defaultValue: 'info' },
    { name: 'audience', type: 'select', options: ['todos', 'admin', 'gerente', 'empleado'], defaultValue: 'todos' },
    { name: 'status', type: 'select', options: ['no_leida', 'leida', 'archivada'], defaultValue: 'no_leida' },
  ],
}

export const Couriers: CollectionConfig = {
  slug: 'couriers',
  labels: { singular: 'Domiciliario', plural: 'Domiciliarios' },
  admin: { useAsTitle: 'name', group: 'Operación' },
  access: { read: isStaff, create: isManager, update: isManager, delete: hasRole('admin') },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
