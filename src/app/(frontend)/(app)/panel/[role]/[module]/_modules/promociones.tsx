import type { PanelCtx } from '@/lib/panel-ctx'
import { spStr } from '@/lib/panel-ctx'
import { UrlTabs } from '@/components/panel/kit'
import { bogotaToday, dateState } from '@/lib/panel-data'
import { getPayloadClient } from '@/lib/payload'
import { resourceView } from './_resource'

const VER = ['vigentes', 'archivadas', 'todas']

export default async function Module(ctx: PanelCtx) {
  const v = spStr(ctx.sp.ver)
  const ver = VER.includes(v) ? v : 'vigentes'
  const today = bogotaToday()
  const start = `${today}T00:00:00.000Z`
  return resourceView(ctx, 'promociones', {
    where: ver === 'vigentes' ? { endDate: { greater_than_equal: start } } : ver === 'archivadas' ? { endDate: { less_than: start } } : undefined,
    sort: ver === 'archivadas' ? '-endDate' : ver === 'todas' ? '-startDate' : 'endDate',
    above: <UrlTabs param="ver" value={ver} sp={ctx.sp} tabs={[{ id: 'vigentes', label: 'Vigentes y programadas' }, { id: 'archivadas', label: 'Archivadas' }, { id: 'todas', label: 'Todas' }]} />,
    decorate: async (rows) => {
      // Clics en «Pedir por WhatsApp» de cada promoción (site-events tipo whatsapp_promo).
      const payload = await getPayloadClient()
      const counts = new Map<string, number>()
      if (rows.length) {
        const ev = await payload.find({ collection: 'site-events', where: { and: [{ type: { equals: 'whatsapp_promo' } }, { promotion: { in: rows.map((r) => r.id) } }] }, limit: 5000, depth: 0, pagination: false, select: { promotion: true }, overrideAccess: true })
        for (const e of ev.docs as any[]) {
          const id = String(typeof e.promotion === 'object' ? e.promotion?.id : e.promotion)
          counts.set(id, (counts.get(id) ?? 0) + 1)
        }
      }
      return rows.map((r) => {
        const st = dateState(r.startDate, r.endDate, today)
        return { ...r, _estado: st !== 'archivada' && r.active === false ? 'pausada' : st, _wa: counts.get(String(r.id)) ?? 0 }
      })
    },
  })
}
