import type { PanelCtx } from '@/lib/panel-ctx'
import { spStr } from '@/lib/panel-ctx'
import { UrlTabs } from '@/components/panel/kit'
import { resourceView } from './_resource'

const ACTIONS = ['crear', 'editar', 'eliminar', 'login', 'logout', 'anular']

export default async function Module(ctx: PanelCtx) {
  const a = spStr(ctx.sp.accion)
  const accion = ACTIONS.includes(a) ? a : ''
  return resourceView(ctx, 'auditoria', {
    where: accion ? { action: { equals: accion } } : undefined,
    above: <UrlTabs param="accion" value={accion || 'todas'} sp={{ ...ctx.sp, accion: undefined }} tabs={[{ id: 'todas', label: 'Todas' }, ...ACTIONS.map((x) => ({ id: x, label: x[0].toUpperCase() + x.slice(1) }))]} />,
  })
}
