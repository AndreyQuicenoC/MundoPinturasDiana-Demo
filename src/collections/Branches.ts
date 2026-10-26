import type { CollectionConfig } from 'payload'
import { auditHooks } from '@/lib/audit-hooks'
import { hasRole } from '@/lib/access'
import { bust } from '@/lib/revalidate'

const audit = auditHooks('Sedes', (d) => d.name)

export const Branches: CollectionConfig = {
  slug: 'branches',
  admin: { useAsTitle: 'name', group: 'Operación' },
  access: { read: () => true, create: hasRole('admin'), update: hasRole('admin'), delete: hasRole('admin') },
  hooks: {
    afterChange: [...audit.afterChange, ({ doc }) => (bust('branches'), doc)],
    afterDelete: [...audit.afterDelete, ({ doc }) => (bust('branches'), doc)],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'address', type: 'text', required: true },
    { name: 'city', type: 'text', defaultValue: 'Cali' },
    { name: 'phone', type: 'text' },
    { name: 'whatsapp', type: 'text', admin: { description: 'Solo dígitos con indicativo, ej. 573186111159' } },
    { name: 'schedule', type: 'text', defaultValue: 'Lun–Sáb 8:00 a.m.–5:00 p.m. · Dom 8:00 a.m.–12:00 m.' },
    { name: 'mapsUrl', type: 'text', label: 'Ubicación en Google Maps (enlace o enlace de inserción)', admin: { description: 'Pega el enlace de «Compartir» de Google Maps o el enlace/código de «Insertar un mapa».' } },
    { name: 'order', type: 'number', defaultValue: 10, label: 'Orden en el sitio' },
    { name: 'mapQuery', type: 'text', admin: { description: 'Texto para el mapa embebido' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
