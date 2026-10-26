import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { auditHooks } from '@/lib/audit-hooks'
import { fieldHasRole, hasRole } from '@/lib/access'

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const audit = auditHooks('Productos', (d) => `${d.name} · ${d.sku}`)

export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'name', group: 'Catálogo', defaultColumns: ['name', 'sku', 'productCategory', 'salePrice', 'status'] },
  access: { read: () => true, create: hasRole('admin', 'gerente'), update: hasRole('admin', 'gerente'), delete: hasRole('admin') },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) data.slug = `${slugify(data.name)}-${slugify(String(data.sku ?? ''))}`
        return data
      },
    ],
    afterChange: [
      ...audit.afterChange,
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'update' && previousDoc && previousDoc.salePrice !== doc.salePrice) {
          await req.payload.create({
            collection: 'price-history',
            overrideAccess: true,
            req,
            data: { product: doc.id, oldPrice: previousDoc.salePrice, newPrice: doc.salePrice },
          })
        }
        try {
          revalidateTag('products', 'max')
        } catch {}
        return doc
      },
    ],
    afterDelete: [
      ...audit.afterDelete,
      async ({ doc }) => {
        try {
          revalidateTag('products', 'max')
        } catch {}
        return doc
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'sku', type: 'text', required: true, unique: true, index: true },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar', description: 'Se genera automáticamente' } },
    { name: 'description', type: 'textarea' },
    { name: 'brand', type: 'text', index: true },
    { name: 'productCategory', type: 'relationship', relationTo: 'product-categories', index: true, label: 'Categoría' },
    { name: 'category', type: 'text', index: true, admin: { readOnly: true, description: 'Texto heredado; se usa solo si no hay categoría asignada.' } },
    { name: 'saleType', type: 'relationship', relationTo: 'product-types', index: true, label: 'Tipo de producto (normal / artístico)' },
    { name: 'origin', type: 'select', defaultValue: 'comprado', options: ['comprado', 'fabricado'], label: 'Origen' },
    { name: 'productType', type: 'text', label: 'Línea (vinilo, esmalte, laca…)' },
    { name: 'barcode', type: 'text', label: 'Código de barras' },
    { name: 'ivaPct', type: 'number', min: 0, max: 100, label: 'IVA % (opcional)' },
    { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Visible en el catálogo público', admin: { position: 'sidebar' } },
    {
      name: 'colors', type: 'array', label: 'Colores disponibles',
      fields: [{ name: 'name', type: 'text', required: true }, { name: 'hex', type: 'text', required: true, validate: (v: any) => /^#[0-9a-fA-F]{6}$/.test(String(v ?? '')) || 'Usa un color #RRGGBB' }],
    },
    { name: 'sizes', type: 'array', label: 'Tamaños disponibles', fields: [{ name: 'label', type: 'text', required: true }] },
    { name: 'imageUrl', type: 'text', label: 'Enlace de imagen (alternativa)' },
    { name: 'unit', type: 'select', defaultValue: 'unidad', options: ['unidad', 'cuarto', 'galon', 'cunete', 'litro', 'kilo', 'metro'] },
    { name: 'salePrice', type: 'number', required: true, min: 0 },
    { name: 'costPrice', type: 'number', min: 0, access: { read: fieldHasRole('admin', 'gerente') } },
    { name: 'minimumStock', type: 'number', defaultValue: 0, min: 0 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Producto insignia', admin: { position: 'sidebar' } },
    { name: 'status', type: 'select', defaultValue: 'activo', options: ['activo', 'inactivo', 'agotado'], admin: { position: 'sidebar' } },
  ],
}
