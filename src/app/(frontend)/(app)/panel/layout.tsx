import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import type { ModuleKey } from '@/lib/access'
import { effectiveForUser } from '@/lib/permissions'
import { MODULE_LABELS } from '@/lib/panel-config'
import { PanelShell } from '@/components/panel/shell'

/** Orden del menú: operación diaria, catálogo, marketing, análisis y administración. */
const ORDER: ModuleKey[] = [
  'resumen', 'pos', 'ventas', 'domicilios', 'facturacion', 'caja', 'cierre', 'conceptos',
  'productos', 'categorias', 'inventario', 'clientes', 'proveedores', 'promociones', 'eventos', 'analitica',
  'usuarios', 'permisos', 'sedes', 'auditoria',
]

export const metadata: Metadata = { title: 'Panel · Mundo Pinturas Diana', robots: { index: false, follow: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await appAuth.currentUser()
  if (!user) redirect('/login')
  const base = `/panel/${user.role}`
  const eff = await effectiveForUser(user)
  const items = [
    ...ORDER.filter((m) => eff[m].mode !== 'none').map((m) => ({ key: m, label: MODULE_LABELS[m], href: m === 'resumen' ? base : `${base}/${m}` })),
    { key: 'cuenta', label: MODULE_LABELS.cuenta, href: `${base}/cuenta` },
  ]
  return <PanelShell user={{ name: user.name, role: user.role }} items={items}>{children}</PanelShell>
}
