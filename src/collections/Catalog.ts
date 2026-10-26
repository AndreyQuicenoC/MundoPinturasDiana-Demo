import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { bust } from '@/lib/revalidate'
import { APIError } from 'payload'
import { hasRole, isManager } from '@/lib/access'

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const catAudit = auditHooks('Categorías de producto', (d) => d.name)

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: { singular: 'Categoría de producto', plural: 'Categorías de producto' },
  admin: { useAsTitle: 'name', group: 'Catálogo', defaultColumns: ['name', 'active', 'showInHome', 'homeOrder'] },
  access: { read: () => true, create: isManager, update: isManager, delete: hasRole('admin') },
  hooks: {
    beforeValidate: [({ data }) => { if (data && !data.slug && data.name) data.slug = slugify(data.name); return data }],
    beforeDelete: [async ({ id, req }) => {
      const used = await req.payload.count({ collection: 'products', where: { productCategory: { equals: id } }, overrideAccess: true, req })
      if (used.totalDocs > 0) throw new APIError(`No se puede eliminar: ${used.totalDocs} producto(s) usan esta categoría. Reasígnalos o desactívala.`, 400)
    }],
    afterChange: [...catAudit.afterChange, ({ doc }) => (bust('categories', 'products'), doc)],
    afterDelete: [...catAudit.afterDelete, ({ doc }) => (bust('categories', 'products'), doc)],
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar', description: 'Se genera automáticamente' } },
    { name: 'description', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Activa' },
    { name: 'showInHome', type: 'checkbox', defaultValue: false, label: 'Mostrar como carrusel en el inicio' },
    { name: 'homeOrder', type: 'number', defaultValue: 10, label: 'Orden en el inicio' },
  ],
}

const typeAudit = auditHooks('Tipos de producto', (d) => d.name)

/** Tipos_producto: `affectsDailySales=false` para los artísticos (solo factura, no suman a totales de venta). */
export const ProductTypes: CollectionConfig = {
  slug: 'product-types',
  labels: { singular: 'Tipo de producto', plural: 'Tipos de producto' },
  admin: { useAsTitle: 'name', group: 'Catálogo', defaultColumns: ['name', 'code', 'affectsDailySales'] },
  access: { read: () => true, create: hasRole('admin'), update: hasRole('admin'), delete: hasRole('admin') },
  hooks: {
    afterChange: [...typeAudit.afterChange, ({ doc }) => (bust('products'), doc)],
    afterDelete: typeAudit.afterDelete,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'code', type: 'select', required: true, unique: true, options: ['normal', 'artistico'], defaultValue: 'normal' },
    { name: 'description', type: 'textarea' },
    { name: 'affectsDailySales', type: 'checkbox', defaultValue: true, label: 'Suma a las ventas del día/mes/año' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
