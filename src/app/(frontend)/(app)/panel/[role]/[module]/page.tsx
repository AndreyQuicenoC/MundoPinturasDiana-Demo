import { notFound, redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { MODULES, type ModuleKey } from '@/lib/access'
import { effectiveFor } from '@/lib/permissions'
import { options } from '@/lib/panel-data'
import type { PanelCtx } from '@/lib/panel-ctx'
import { Head, Wrap } from '@/components/panel/page-head'
import { AccountForm } from '@/components/panel/account-form'

type Mod = { default: (ctx: PanelCtx) => Promise<React.ReactNode> | React.ReactNode }
const REGISTRY: Record<Exclude<ModuleKey, 'resumen'>, () => Promise<Mod>> = {
  usuarios: () => import('./_modules/usuarios'),
  permisos: () => import('./_modules/permisos'),
  sedes: () => import('./_modules/sedes'),
  categorias: () => import('./_modules/categorias'),
  productos: () => import('./_modules/productos'),
  inventario: () => import('./_modules/inventario'),
  clientes: () => import('./_modules/clientes'),
  proveedores: () => import('./_modules/proveedores'),
  ventas: () => import('./_modules/ventas'),
  pos: () => import('./_modules/pos'),
  domicilios: () => import('./_modules/domicilios'),
  facturacion: () => import('./_modules/facturacion'),
  caja: () => import('./_modules/caja'),
  conceptos: () => import('./_modules/conceptos'),
  cierre: () => import('./_modules/cierre'),
  eventos: () => import('./_modules/eventos'),
  promociones: () => import('./_modules/promociones'),
  auditoria: () => import('./_modules/auditoria'),
  analitica: () => import('./_modules/analitica'),
}

export default async function ModulePage({ params, searchParams }: { params: Promise<{ role: string; module: string }>; searchParams: Promise<PanelCtx['sp']> }) {
  const { role, module: mod } = await params
  const sp = await searchParams
  const user = await appAuth.currentUser()
  if (!user) redirect('/login')
  if (user.role !== role) redirect(`/panel/${user.role}/${mod}`)

  if (mod === 'cuenta') {
    const full = user as any
    return (
      <Wrap head={<Head title="Mi cuenta" blurb="Tus datos personales y tu contraseña." />}>
        <AccountForm user={{ name: user.name, email: user.email, role: user.role, phone: full.phone ?? '', document: full.document ?? '', bloodType: full.bloodType ?? '', birthDate: full.birthDate ? String(full.birthDate).slice(0, 10) : '', address: full.address ?? '', emergencyContactName: full.emergencyContactName ?? '', emergencyContactPhone: full.emergencyContactPhone ?? '' }} />
      </Wrap>
    )
  }
  if (!(MODULES as readonly string[]).includes(mod) || mod === 'resumen') notFound()
  const key = mod as Exclude<ModuleKey, 'resumen'>

  const eff = (await effectiveFor(user.role, user.id))[key]
  if (eff.mode === 'none') redirect(`/panel/${user.role}`)

  const defaultBranch = typeof user.branch === 'object' && user.branch ? (user.branch as any).id : (user.branch as string | undefined) ?? ''
  const branches = await options(user, 'branches', { active: { equals: true } }, eff.viaGrant)
  const ctx: PanelCtx = {
    user, role: user.role, mode: eff.mode, canWrite: eff.mode !== 'ver', viaGrant: eff.viaGrant, overrideAccess: eff.viaGrant,
    sp, branches, branch: defaultBranch || branches[0]?.id || '', base: `/panel/${user.role}`,
  }
  const { default: Module } = await REGISTRY[key]()
  return <>{await Module(ctx)}</>
}
