import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertTriangle, ArrowUpRight, Banknote, Bell, FileCheck2, ShoppingBag, Truck } from 'lucide-react'
import { appAuth } from '@/lib/app-auth'
import { effectiveForUser } from '@/lib/permissions'
import { findAll } from '@/lib/panel-data'
import { bogotaDay, dayRange } from '@/lib/cash'
import { formatCOPClient } from '@/lib/format'
import { Panel, Empty, dt } from '@/components/panel/kit'
import { NotifList } from '@/components/panel/notif-list'
import { Blob } from '@/components/ui/splash'

export default async function Resumen({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  const user = await appAuth.currentUser()
  if (!user) redirect('/login')
  if (user.role !== role) redirect(`/panel/${user.role}`)
  if (!['admin', 'gerente', 'empleado'].includes(role)) notFound()

  const eff = await effectiveForUser(user)
  const can = (m: keyof typeof eff) => eff[m].mode !== 'none'
  const oa = (m: keyof typeof eff) => eff[m].viaGrant
  const isEmp = role === 'empleado'
  const r = dayRange(bogotaDay())
  const [sales, stock, notifs] = await Promise.all([
    findAll(user, 'sales', { depth: 0, where: { and: [{ createdAt: { greater_than_equal: r.gte } }, { createdAt: { less_than_equal: r.lte } }, { status: { not_equals: 'anulada' } }] } }),
    !isEmp && can('inventario') ? findAll(user, 'inventory', { depth: 1, overrideAccess: oa('inventario') }) : Promise.resolve([]),
    findAll(user, 'notifications', { depth: 0, limit: 8, sort: '-createdAt', where: { status: { not_equals: 'archivada' } } }),
  ])
  const pendingDoms = !isEmp && can('domicilios') ? await countPending(user, 'domicilios', { status: { in: ['pendiente', 'en_ruta'] } }, oa('domicilios')) : 0
  const pendingFes = !isEmp && can('facturacion') ? await countPending(user, 'electronic-invoices', { status: { not_equals: 'generada' } }, oa('facturacion')) : 0
  const total = sales.reduce((a, s) => a + (s.reportableTotal ?? s.total), 0)
  const low = stock.filter((s) => s.quantity <= (s.product?.minimumStock ?? 0))
  const hi = new Date(Date.now() - 5 * 3600_000).getUTCHours()
  const greet = hi < 12 ? 'Buenos días' : hi < 19 ? 'Buenas tardes' : 'Buenas noches'
  const base = `/panel/${role}`
  const kpi = [
    { l: isEmp ? 'Total vendido hoy' : 'Ventas de hoy', v: formatCOPClient(total), s: isEmp ? 'lo que llevas registrado hoy' : `${sales.length} venta${sales.length === 1 ? '' : 's'}`, Icon: Banknote, tone: 'bg-brand text-white', href: undefined as string | undefined },
    ...(!isEmp && can('inventario') ? [{ l: 'Bajo stock mínimo', v: String(low.length), s: 'productos por reponer', Icon: AlertTriangle, tone: 'bg-sun text-ink', href: `${base}/inventario` }] : []),
    ...(!isEmp && can('domicilios') ? [{ l: 'Domicilios pendientes', v: String(pendingDoms), s: 'por entregar', Icon: Truck, tone: 'bg-cyan text-white', href: `${base}/domicilios` }] : []),
    ...(!isEmp && can('facturacion') ? [{ l: 'Facturas electrónicas pendientes', v: String(pendingFes), s: 'por gestionar o corregir', Icon: FileCheck2, tone: 'bg-plum text-white', href: `${base}/facturacion` }] : []),
  ]
  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-3xl bg-plum p-7 text-white sm:p-10">
        <Blob color="#E11D74" className="absolute -right-10 -top-16 size-64 animate-float opacity-70" />
        <p className="relative text-sm font-bold uppercase tracking-widest text-cyan">{role}</p>
        <h1 className="relative mt-1 font-display text-4xl font-extrabold sm:text-5xl">{greet}, {user.name.split(' ')[0]}</h1>
        {can('pos') && <Link href={`${base}/pos`} className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-plum shadow-[4px_4px_0_0_var(--color-brand)] transition hover:-translate-y-0.5"><ShoppingBag size={18} /> Nueva venta <ArrowUpRight size={16} /></Link>}
      </header>
      <div className={`mt-6 grid gap-4 ${kpi.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : kpi.length === 1 ? 'max-w-sm' : 'sm:grid-cols-3'}`}>
        {kpi.map(({ l, v, s, Icon, tone, href }) => {
          const body = (
            <>
              <span className={`inline-flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/55">{l}</p>
              <p className="font-display text-3xl font-extrabold text-plum">{v}</p>
              <p className="text-xs text-ink/55">{s}</p>
            </>
          )
          return href
            ? <Link key={l} href={href} className="rounded-2xl border-2 border-plum/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-plum/30">{body}</Link>
            : <div key={l} className="rounded-2xl border-2 border-plum/10 bg-white p-5">{body}</div>
        })}
      </div>
      <div className={`mt-6 grid gap-5 ${!isEmp && can('inventario') ? 'lg:grid-cols-2' : ''}`}>
        {!isEmp && can('inventario') && (
          <Panel title="Alertas de inventario">
            {low.length ? <ul className="divide-y divide-plum/10 text-sm">{low.slice(0, 6).map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.product?.name} <span className="text-ink/50">· {s.branch?.name}</span></span><b className="text-brand">{s.quantity}</b></li>)}</ul> : <Empty text="Todo el stock está por encima del mínimo." />}
          </Panel>
        )}
        <Panel title="Notificaciones" action={<Bell size={18} className="text-plum/60" />}>
          <NotifList items={notifs.map((n) => ({ id: n.id, title: n.title, message: n.message, type: n.type, status: n.status, when: dt(n.createdAt) }))} />
        </Panel>
      </div>
    </div>
  )
}

async function countPending(user: any, collection: string, where: any, overrideAccess: boolean) {
  const { getPayloadClient } = await import('@/lib/payload')
  const payload = await getPayloadClient()
  const r = await payload.count({ collection: collection as any, where, user, overrideAccess })
  return r.totalDocs
}
