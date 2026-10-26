import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage } from '@/lib/panel-ctx'
import { findPage } from '@/lib/panel-data'
import { bogotaDay, computeCash } from '@/lib/cash'
import { CloseModule } from '@/components/panel/cierre-module'
import { Head, Wrap } from '@/components/panel/page-head'

export default async function Module(ctx: PanelCtx) {
  const [c, hist] = await Promise.all([
    computeCash(ctx.user, bogotaDay(), ctx.branch),
    findPage(ctx.user, 'cash-closings', { depth: 1, sort: '-day', overrideAccess: ctx.overrideAccess, page: spPage(ctx.sp) }),
  ])
  const k = c.closed as any
  // Jornada cerrada: se muestran los valores congelados en el cierre (los movimientos ya quedaron ligados a él).
  const summary = k
    ? { day: c.day, branch: c.branch, cashSales: k.cashSales ?? 0, transferSales: k.transferSales ?? 0, cardSales: k.cardSales ?? 0, additions: k.additions ?? 0, expenses: k.expenses ?? 0, savings: k.savings ?? 0, transfers: k.transfers ?? 0, salesCount: c.salesCount, closed: true, baseInitial: k.baseInitial ?? 0, delivery: k.delivery ?? 0, deliveryNote: k.deliveryNote ?? '', countedCash: k.countedCash ?? 0, notes: k.notes ?? '' }
    : { day: c.day, branch: c.branch, cashSales: c.cashSales, transferSales: c.transferSales, cardSales: c.cardSales, additions: c.additions, expenses: c.expenses, savings: c.savings, transfers: c.transfers, salesCount: c.salesCount, closed: false, baseInitial: 0, delivery: 0, deliveryNote: '', countedCash: 0, notes: '' }
  return (
    <Wrap head={<Head title="Cierre de jornada" blurb="Efectivo = base + ventas en efectivo + adiciones − (gastos + ahorros + transferencias) − entrega." />}>
      <CloseModule summary={summary} branches={ctx.branches} history={hist.docs} pg={{ page: hist.page, totalPages: hist.totalPages, totalDocs: hist.totalDocs }} sp={ctx.sp} />
    </Wrap>
  )
}
