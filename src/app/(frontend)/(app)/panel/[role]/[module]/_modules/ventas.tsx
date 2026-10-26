import type { PanelCtx } from '@/lib/panel-ctx'
import { spPage, spStr } from '@/lib/panel-ctx'
import { findAll, findPage } from '@/lib/panel-data'
import { currentMonth, dayEnd, dayStart, isDay, isMonth, monthLabel, monthRange, todayBogota } from '@/lib/sales-util'
import { SalesModule } from '@/components/panel/sales-module'
import { Head, Wrap } from '@/components/panel/page-head'

export default async function Module(ctx: PanelCtx) {
  const { user, sp, role, overrideAccess: oa } = ctx
  const isEmp = role === 'empleado'
  const mesRaw = spStr(sp.mes)
  const mes = isMonth(mesRaw) ? mesRaw : currentMonth()
  const branch = spStr(sp.branch)
  const estado = spStr(sp.estado)
  const desde = spStr(sp.desde)
  const hasta = spStr(sp.hasta)
  const numero = parseInt(spStr(sp.numero), 10)

  const and: any[] = []
  if (isEmp) {
    // Empleado: solo sus ventas de hoy (hora de Bogotá).
    and.push({ seller: { equals: user.id } }, { createdAt: { greater_than_equal: dayStart(todayBogota()) } })
  } else {
    if (branch) and.push({ branch: { equals: branch } })
    if (['emitida', 'devolucion_parcial', 'anulada'].includes(estado)) and.push({ status: { equals: estado } })
    if (isDay(desde)) and.push({ createdAt: { greater_than_equal: dayStart(desde) } })
    if (isDay(hasta)) and.push({ createdAt: { less_than_equal: dayEnd(hasta) } })
  }
  if (numero > 0) and.push({ number: { equals: numero } })

  const list = await findPage(user, 'sales', { depth: 1, page: spPage(sp), sort: '-createdAt', where: and.length ? { and } : undefined, overrideAccess: oa })

  let stats: { month: string; label: string; sales: number; returns: number } | null = null
  if (!isEmp) {
    const r = monthRange(mes)
    const base: any[] = branch ? [{ branch: { equals: branch } }] : []
    const [monthSales, withReturns] = await Promise.all([
      findAll(user, 'sales', { depth: 0, limit: 5000, where: { and: [...base, { status: { not_equals: 'anulada' } }, { createdAt: { greater_than_equal: r.gte } }, { createdAt: { less_than: r.lt } }] }, overrideAccess: oa }),
      findAll(user, 'sales', { depth: 0, limit: 5000, where: { and: [...base, { 'returns.at': { greater_than_equal: r.gte } }, { 'returns.at': { less_than: r.lt } }] }, overrideAccess: oa }),
    ])
    const sales = monthSales.reduce((a, s) => a + (s.reportableTotal ?? s.total ?? 0), 0)
    let returns = 0
    for (const s of withReturns) for (const x of s.returns ?? []) if (x.at && x.at >= r.gte && x.at < r.lt) returns += x.value ?? 0
    stats = { month: mes, label: monthLabel(mes), sales, returns }
  }

  return (
    <Wrap head={<Head title={isEmp ? 'Mis ventas de hoy' : 'Ventas'} blurb={isEmp ? 'Solo ves las ventas que registraste hoy.' : 'Anulaciones y devoluciones restituyen inventario y quedan auditadas.'} />}>
      <SalesModule
        sales={list.docs} page={list.page} totalPages={list.totalPages} totalDocs={list.totalDocs} sp={sp}
        isEmp={isEmp} canManage={!isEmp} base={ctx.base} branches={ctx.branches}
        filters={{ mes, branch, estado, desde, hasta }} stats={stats} openNumber={numero > 0 ? numero : null}
      />
    </Wrap>
  )
}
