import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage, spStr } from '@/lib/panel-ctx'
import { findPage, options } from '@/lib/panel-data'
import { DomiciliosModule } from '@/components/panel/domicilios-module'
import { Head, Wrap } from '@/components/panel/page-head'

const FILTERS: Record<string, any> = {
  activos: { status: { in: ['pendiente', 'en_ruta'] } },
  entregado: { status: { equals: 'entregado' } },
  cancelado: { status: { equals: 'cancelado' } },
}

export default async function Module(ctx: PanelCtx) {
  const { user, sp, overrideAccess: oa } = ctx
  const raw = spStr(sp.estado, 'activos')
  const estado = raw === 'todos' || raw in FILTERS ? raw : 'activos'
  const [list, couriers] = await Promise.all([
    findPage(user, 'domicilios', { depth: 1, page: spPage(sp), sort: '-createdAt', where: FILTERS[estado], overrideAccess: oa }),
    options(user, 'couriers', { active: { equals: true } }, oa),
  ])
  return (
    <Wrap head={<Head title="Domicilios" blurb="Los domicilios nacen en el punto de venta; aquí solo se gestionan: asignar domiciliario y avanzar el estado. El pago al domiciliario no entra en ventas ni en gastos." />}>
      <DomiciliosModule rows={list.docs} page={list.page} totalPages={list.totalPages} totalDocs={list.totalDocs} sp={sp} estado={estado} couriers={couriers} base={ctx.base} canWrite={ctx.canWrite} />
    </Wrap>
  )
}
