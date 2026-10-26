import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage } from '@/lib/panel-ctx'
import { findAll, findPage } from '@/lib/panel-data'
import { bogotaDay, computeCash, dayRange, expectedCash } from '@/lib/cash'
import { CashModule } from '@/components/panel/cash-module'
import { Head, Wrap } from '@/components/panel/page-head'

export default async function Module(ctx: PanelCtx) {
  const day = bogotaDay(), r = dayRange(day)
  const where = { and: [{ closing: { exists: false } }, { date: { greater_than_equal: r.gte } }] }
  const [pageRes, concepts, c] = await Promise.all([
    findPage(ctx.user, 'cash-movements', { depth: 1, sort: '-date', overrideAccess: ctx.overrideAccess, where, page: spPage(ctx.sp) }),
    findAll(ctx.user, 'cash-concepts', { depth: 0, overrideAccess: ctx.overrideAccess, where: { active: { not_equals: false } } }),
    computeCash(ctx.user, day, ctx.branch),
  ])
  const canEdit = ctx.role === 'empleado' ? [ctx.user.id] : 'all'
  return (
    <Wrap head={<Head title="Caja" blurb="Elige un concepto para precargar categoría, valor y detalle; todo es editable. Las transferencias quedan bloqueadas." />}>
      <CashModule
        movements={pageRes.docs} concepts={concepts} branches={ctx.branches} defaultBranch={ctx.branch} sp={ctx.sp} canEdit={canEdit}
        pg={{ page: pageRes.page, totalPages: pageRes.totalPages, totalDocs: pageRes.totalDocs }}
        summary={{ ...c, closed: !!c.closed, expected: expectedCash(0, c) }}
      />
    </Wrap>
  )
}
