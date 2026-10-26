import { redirect } from 'next/navigation'
import type { PanelCtx } from '@/lib/panel-ctx'
import { spStr } from '@/lib/panel-ctx'
import { getPayloadClient } from '@/lib/payload'
import { MODULE_LABELS } from '@/lib/panel-config'
import type { AppRole } from '@/lib/access'
import { Head, Wrap } from '@/components/panel/page-head'
import { PermissionsModule } from '@/components/panel/permissions-module'

export default async function Module(ctx: PanelCtx) {
  if (ctx.role !== 'admin') redirect(ctx.base)
  const payload = await getPayloadClient()
  const tab = spStr(ctx.sp.tab) === 'usuario' ? 'usuario' : 'rol'
  const userId = spStr(ctx.sp.user)

  const [rp, usersRes] = await Promise.all([
    payload.find({ collection: 'role-permissions', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
    tab === 'usuario' ? payload.find({ collection: 'users', limit: 500, depth: 0, pagination: false, sort: 'name', overrideAccess: true }) : Promise.resolve({ docs: [] as any[] }),
  ])
  const roleOv: Record<string, Record<string, boolean>> = {}
  for (const d of rp.docs as any[]) (roleOv[d.role] ??= {})[d.module] = !!d.granted

  const users = (usersRes.docs as any[]).map((u) => ({ id: String(u.id), label: u.name ?? u.email, role: u.role as AppRole }))
  const selected = users.find((u) => u.id === userId) ?? null
  const userOv: Record<string, boolean> = {}
  if (selected) {
    const up = await payload.find({ collection: 'user-permissions', where: { user: { equals: selected.id } }, limit: 500, depth: 0, pagination: false, overrideAccess: true })
    for (const d of up.docs as any[]) userOv[d.module] = !!d.granted
  }
  return (
    <Wrap head={<Head title="Permisos" blurb="Qué páginas ve cada rol y cada usuario. Los ajustes por usuario prevalecen sobre los del rol." />}>
      <PermissionsModule tab={tab} labels={MODULE_LABELS} roleOv={roleOv} users={users} selected={selected} userOv={userOv} sp={ctx.sp} selfId={String(ctx.user.id)} />
    </Wrap>
  )
}
