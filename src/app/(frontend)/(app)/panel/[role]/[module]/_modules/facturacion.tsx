import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage, spStr } from '@/lib/panel-ctx'
import { findPage } from '@/lib/panel-data'
import { FacturacionModule } from '@/components/panel/facturacion-module'
import { Head, Wrap } from '@/components/panel/page-head'

const FILTERS: Record<string, any> = {
  pendientes: { status: { not_equals: 'generada' } },
  generadas: { status: { equals: 'generada' } },
}

export default async function Module(ctx: PanelCtx) {
  const { user, sp, overrideAccess: oa } = ctx
  const raw = spStr(sp.ver, 'pendientes')
  const ver = raw === 'todas' || raw in FILTERS ? raw : 'pendientes'
  const list = await findPage(user, 'electronic-invoices', { depth: 1, page: spPage(sp), sort: '-createdAt', where: FILTERS[ver], overrideAccess: oa })
  return (
    <Wrap head={<Head title="Factura electrónica" blurb="Las solicitudes nacen en el punto de venta; aquí solo se gestiona su estado." />}>
      <FacturacionModule rows={list.docs} page={list.page} totalPages={list.totalPages} totalDocs={list.totalDocs} sp={sp} ver={ver} base={ctx.base} canWrite={ctx.canWrite} />
    </Wrap>
  )
}
