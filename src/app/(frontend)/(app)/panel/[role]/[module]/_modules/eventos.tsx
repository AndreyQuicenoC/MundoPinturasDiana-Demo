import type { PanelCtx } from '@/lib/panel-ctx'
import { spStr } from '@/lib/panel-ctx'
import { UrlTabs } from '@/components/panel/kit'
import { bogotaToday, dateState } from '@/lib/panel-data'
import { resourceView } from './_resource'

const VER = ['vigentes', 'archivadas', 'todas']

export default async function Module(ctx: PanelCtx) {
  const v = spStr(ctx.sp.ver)
  const ver = VER.includes(v) ? v : 'vigentes'
  const today = bogotaToday()
  const start = `${today}T00:00:00.000Z`
  return resourceView(ctx, 'eventos', {
    where: ver === 'vigentes' ? { endDate: { greater_than_equal: start } } : ver === 'archivadas' ? { endDate: { less_than: start } } : undefined,
    sort: ver === 'vigentes' ? 'startDate' : '-startDate',
    above: <UrlTabs param="ver" value={ver} sp={ctx.sp} tabs={[{ id: 'vigentes', label: 'Próximos y en curso' }, { id: 'archivadas', label: 'Pasados' }, { id: 'todas', label: 'Todos' }]} />,
    decorate: (rows) => rows.map((r) => ({ ...r, _estado: dateState(r.startDate ?? r.date, r.endDate ?? r.date, today) })),
  })
}
