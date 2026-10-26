import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { bust } from '@/lib/revalidate'
import { hasRole, isManager, isStaff, never, roleOf } from '@/lib/access'

const promoAudit = auditHooks('Promociones y sorteos', (d) => `${d.title} · hasta ${String(d.endDate).slice(0, 10)}`)

export const Promotions: CollectionConfig = {
  slug: 'promotions',
  labels: { singular: 'Promoción o sorteo', plural: 'Promociones y sorteos' },
  admin: { useAsTitle: 'title', group: 'Marketing', defaultColumns: ['title', 'kind', 'startDate', 'endDate', 'active'] },
  access: {
    read: ({ req }) => (roleOf(req.user as any) ? true : { active: { equals: true } }),
    create: isManager,
    update: isManager,
    delete: hasRole('admin', 'gerente'),
  },
  hooks: {
    beforeChange: [({ data }) => {
      if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) throw new APIError('La fecha de fin no puede ser anterior a la de inicio.', 400)
      if (!data.image && !String(data.imageUrl ?? '').trim()) throw new APIError('Agrega una imagen o el enlace de una imagen.', 400)
      return data
    }],
    afterChange: [...promoAudit.afterChange, ({ doc }) => (bust('promotions'), doc)],
    afterDelete: [...promoAudit.afterDelete, ({ doc }) => (bust('promotions'), doc)],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'kind', type: 'select', required: true, defaultValue: 'promocion', options: ['promocion', 'sorteo'], label: 'Tipo' },
    { name: 'description', type: 'textarea', required: true },
    { name: 'hashtags', type: 'text', required: true, label: 'Hashtags', admin: { description: 'Separados por espacio. Ej: #ColorCali #DECO' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'imageUrl', type: 'text', label: 'Enlace de la imagen (alternativa)' },
    { name: 'startDate', type: 'date', required: true, index: true },
    { name: 'endDate', type: 'date', required: true, index: true, admin: { description: 'Es la única fecha visible en el sitio público.' } },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Publicada (puedes pausarla sin borrarla)' },
  ],
}

export const SiteEvents: CollectionConfig = {
  slug: 'site-events',
  labels: { singular: 'Evento del sitio', plural: 'Eventos del sitio' },
  admin: { group: 'Marketing', defaultColumns: ['type', 'path', 'day', 'createdAt'] },
  access: { read: isManager, create: never, update: never, delete: hasRole('admin') },
  fields: [
    { name: 'type', type: 'select', required: true, index: true, options: ['visit', 'whatsapp_cart', 'whatsapp_promo'] },
    { name: 'path', type: 'text' },
    { name: 'promotion', type: 'relationship', relationTo: 'promotions', index: true },
    { name: 'day', type: 'text', index: true, admin: { description: 'AAAA-MM-DD (hora de Bogotá)' } },
  ],
}

export { isStaff }
