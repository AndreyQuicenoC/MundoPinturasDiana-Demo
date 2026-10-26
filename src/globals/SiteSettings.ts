import type { GlobalConfig } from 'payload'
import { isAdminRole } from '@/lib/access'
import { bust } from '@/lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: isAdminRole },
  hooks: { afterChange: [({ doc }) => (bust('site-settings'), doc)] },
  fields: [
    { name: 'whatsapp', type: 'text', defaultValue: '573122486627', admin: { description: 'Solo dígitos con indicativo de país' } },
    { name: 'address', type: 'text', defaultValue: 'Calle 10 #10-15, Cali' },
    { name: 'instagram', type: 'text', admin: { description: 'URL completa del perfil (por configurar)' } },
    { name: 'facebook', type: 'text', admin: { description: 'URL completa del perfil (por configurar)' } },
    { name: 'tiktok', type: 'text', admin: { description: 'URL completa del perfil (por configurar)' } },
  ],
}
