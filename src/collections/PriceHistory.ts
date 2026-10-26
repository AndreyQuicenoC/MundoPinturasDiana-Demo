import type { CollectionConfig } from 'payload'
import { isManager, never } from '@/lib/access'

export const PriceHistory: CollectionConfig = {
  slug: 'price-history',
  admin: { group: 'Catálogo', defaultColumns: ['product', 'oldPrice', 'newPrice', 'createdAt'] },
  access: { read: isManager, create: never, update: never, delete: never },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'oldPrice', type: 'number' },
    { name: 'newPrice', type: 'number', required: true },
  ],
}
