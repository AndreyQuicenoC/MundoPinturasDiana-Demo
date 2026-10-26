import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { actorName, hasRole, isManager, isStaff, never, ownOrManager } from '@/lib/access'

export const MOVEMENT_TYPES = ['gasto', 'transferencia', 'ahorro', 'adicion'] as const

const catAudit = auditHooks('Categorías de movimiento', (d) => `${d.name} (${d.type})`)

/** Categorias_movimiento */
export const CashCategories: CollectionConfig = {
  slug: 'cash-categories',
  labels: { singular: 'Categoría de movimiento', plural: 'Categorías de movimiento' },
  admin: { useAsTitle: 'name', group: 'Caja', defaultColumns: ['name', 'type', 'active'] },
  access: { read: isStaff, create: isManager, update: isManager, delete: hasRole('admin') },
  hooks: catAudit,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, options: [...MOVEMENT_TYPES], label: 'Tipo de movimiento', index: true },
    { name: 'description', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

const delAudit = auditHooks('Entregas de dinero', (d) => `Entrega ${d.day} · $${d.amount}`)

/** Entregas_dinero: valor del día, ligado al reporte (cierre) de la jornada. */
export const CashDeliveries: CollectionConfig = {
  slug: 'cash-deliveries',
  labels: { singular: 'Entrega de dinero', plural: 'Entregas de dinero' },
  admin: { group: 'Caja', defaultColumns: ['day', 'branch', 'amount', 'user'] },
  access: { read: ownOrManager('user'), create: isStaff, update: isManager, delete: hasRole('admin') },
  hooks: {
    beforeChange: [({ data, operation, req }) => {
      if (operation === 'create') {
        if (!(Number(data.amount) >= 0)) throw new APIError('La entrega no puede ser negativa.', 400)
        if (req.user?.collection === 'users') data.user = req.user.id
        data.actor = data.actor ?? actorName(req)
      }
      return data
    }],
    afterChange: delAudit.afterChange,
    afterDelete: delAudit.afterDelete,
  },
  fields: [
    { name: 'day', type: 'text', required: true, index: true, label: 'Día (AAAA-MM-DD)' },
    { name: 'branch', type: 'relationship', relationTo: 'branches', required: true, index: true },
    { name: 'closing', type: 'relationship', relationTo: 'cash-closings', index: true },
    { name: 'amount', type: 'number', required: true, min: 0 },
    { name: 'description', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'actor', type: 'text' },
  ],
}

const feAudit = auditHooks('Factura electrónica', (d) => `Solicitud #${d.saleNumber ?? ''} · ${d.status}`)

export const FE_STATUSES = ['solicitada', 'en_proceso', 'generada', 'rechazada'] as const
/** Máquina de estados del seguimiento manual: solicitada → en_proceso → generada; cualquiera → rechazada («Por corregir») → en_proceso. */
export const FE_NEXT: Record<string, string[]> = {
  solicitada: ['en_proceso', 'rechazada'],
  en_proceso: ['generada', 'rechazada'],
  generada: ['rechazada'],
  rechazada: ['en_proceso'],
}

/**
 * Facturas_electronicas: SEGUIMIENTO MANUAL INTERNO. No hay integración con la DIAN ni con ningún
 * proveedor tecnológico. `rechazada` se muestra como «Por corregir» en la interfaz.
 */
export const ElectronicInvoices: CollectionConfig = {
  slug: 'electronic-invoices',
  labels: { singular: 'Factura electrónica', plural: 'Facturas electrónicas' },
  admin: { group: 'Ventas', defaultColumns: ['saleNumber', 'buyerName', 'status', 'requestedAt', 'generatedAt'] },
  access: { read: isManager, create: isManager, update: isManager, delete: never },
  hooks: {
    beforeChange: [({ data, originalDoc, operation, req }) => {
      if (operation === 'update' && data.status && data.status !== originalDoc?.status) {
        if (!FE_NEXT[originalDoc?.status]?.includes(data.status)) throw new APIError('Ese cambio de estado no está permitido.', 400)
        data.history = [...(originalDoc?.history ?? []), { from: originalDoc?.status, to: data.status, at: new Date().toISOString(), by: actorName(req) }]
        if (data.status === 'generada') {
          data.generatedAt = new Date().toISOString()
          if (req.user?.collection === 'users') data.generatedBy = req.user.id
        }
      }
      return data
    }],
    afterChange: feAudit.afterChange,
  },
  fields: [
    { name: 'sale', type: 'relationship', relationTo: 'sales', required: true, unique: true, index: true },
    { name: 'saleNumber', type: 'number', index: true },
    { name: 'branch', type: 'relationship', relationTo: 'branches', index: true },
    { name: 'buyerName', type: 'text' },
    { name: 'buyerDocument', type: 'text' },
    { name: 'buyerEmail', type: 'email' },
    { name: 'total', type: 'number' },
    { name: 'status', type: 'select', required: true, defaultValue: 'solicitada', index: true, options: [...FE_STATUSES] },
    { name: 'requestedAt', type: 'date' },
    { name: 'generatedAt', type: 'date' },
    { name: 'generatedBy', type: 'relationship', relationTo: 'users' },
    { name: 'externalNumber', type: 'text', label: 'Número asignado (opcional)' },
    { name: 'observations', type: 'textarea' },
    {
      name: 'history', type: 'array', admin: { readOnly: true },
      fields: [{ name: 'from', type: 'text' }, { name: 'to', type: 'text' }, { name: 'at', type: 'date' }, { name: 'by', type: 'text' }],
    },
  ],
}
