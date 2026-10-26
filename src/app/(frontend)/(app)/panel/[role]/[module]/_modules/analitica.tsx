import type { PanelCtx } from '@/lib/panel-ctx'
import { buildEmptyReport, buildReport } from '@/lib/analytics'
import { isAnalyticsProcessed, parseFilters } from '@/lib/analytics-shared'
import { Head, Wrap } from '@/components/panel/page-head'
import { C, ChartCard, ChangeBars, Donut, HBars, NoData, VBars, cop, num } from '@/components/panel/analytics/charts'
import { AnalyticsEtlBanner, AnalyticsProcessedNote } from '@/components/panel/analytics/etl-banner'
import { FilterBar, KpiGrid, MonthTable, Section, Stat } from '@/components/panel/analytics/parts'

export default async function Module(ctx: PanelCtx) {
  const f = parseFilters(ctx.sp)
  const valid = ctx.branches.some((b) => b.id === f.sede)
  const sede = valid ? f.sede : ''
  const processed = isAnalyticsProcessed(ctx.sp)
  const sedeName = sede ? ctx.branches.find((b) => b.id === sede)?.label ?? 'Sede' : 'Todas las sedes'
  const r = processed ? await buildReport({ ...f, sede }) : buildEmptyReport({ ...f, sede }, sedeName)
  const labels = r.buckets.map((b) => b.label)
  const flags = r.buckets.map((b) => b.flags.length > 0)
  const per = r.filters.monthly ? 'mes' : 'periodo'
  const path = `${ctx.base}/analitica`
  const inv = r.inventory

  return (
    <Wrap head={<Head title="Analítica" blurb={`Ventas, gastos y comportamiento del negocio · ${r.sedeName}. Las ventas son de productos normales; los artísticos se muestran aparte.`} />}>
      <FilterBar path={path} f={{ ...f, sede }} branches={ctx.branches} processed={processed} />
      {!processed ? (
        <AnalyticsEtlBanner action={path} sede={sede} desde={f.desde} hasta={f.hasta} />
      ) : (
        <AnalyticsProcessedNote at={r.generatedAt} />
      )}

      <Section title="Indicadores del periodo" blurb="Resumen de todo el rango elegido.">
        <KpiGrid m={r.total} avgMonthly={r.avgMonthly} months={r.buckets.length} />
      </Section>

      <Section title={r.filters.monthly ? 'Desglose por mes' : 'Periodo seleccionado'} blurb="Los mismos indicadores, separados por mes. Los meses con un evento clave se marcan porque sus datos pueden ser atípicos.">
        <MonthTable r={r} />
        {r.events.length > 0 && <p className="text-xs text-ink/60">Eventos clave en el rango: {r.events.map((e) => e.title).join(' · ')}.</p>}
      </Section>

      <Section title="Ventas y gastos" blurb="Evolución en el tiempo y gastos por categoría.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title={`Ventas por ${per}`} caption="Ventas netas (sin anuladas, sin artísticos y menos devoluciones) en cada mes.">
            <VBars labels={labels} flags={flags} series={[{ name: 'Ventas', color: C.magenta, values: r.buckets.map((b) => b.ventas) }]} label="Ventas por mes" />
          </ChartCard>
          <ChartCard title={`Gastos por ${per}`} caption="Suma de los movimientos de caja de tipo gasto registrados en cada mes.">
            <VBars labels={labels} flags={flags} series={[{ name: 'Gastos', color: C.plum, values: r.buckets.map((b) => b.gastos) }]} label="Gastos por mes" />
          </ChartCard>
        </div>
        <ChartCard title="Cambio porcentual mes a mes" caption="Compara cada mes con el anterior: si las ventas suben más que los gastos el negocio gana eficiencia; si los gastos crecen más rápido, conviene revisarlos.">
          <ChangeBars rows={r.change} />
        </ChartCard>
        <ChartCard title="Gastos por categoría" caption="Qué proporción del gasto del periodo corresponde a cada categoría de caja.">
          <Donut items={r.gastosByCategory} />
        </ChartCard>
      </Section>

      <Section title="Productos" blurb="Unidades vendidas de productos normales (ya descontadas las devoluciones).">
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Unidades por categoría" caption="Qué categorías mueven más volumen en el periodo.">
            <HBars items={r.unitsByCategory.slice(0, 10)} color={C.cyan} />
          </ChartCard>
          <ChartCard title="Más vendidos (Top 10)" caption="Los productos con más unidades vendidas.">
            <HBars items={r.top} color={C.magenta} />
          </ChartCard>
          <ChartCard title="Menos vendidos (10 últimos)" caption="Entre los productos que sí se vendieron, los de menor salida: candidatos a promoción o a reducir compras.">
            <HBars items={r.bottom} color={C.sun} />
          </ChartCard>
        </div>
        {r.categoryCharts.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {r.categoryCharts.map((c) => (
              <ChartCard key={c.category} title={c.category} caption={`${num(c.units)} unidades en la categoría; se muestran sus productos principales.`}>
                <HBars items={c.items} color={C.cyan} />
              </ChartCard>
            ))}
          </div>
        )}
      </Section>

      <Section title="Sitio web" blurb="Visitas y clics de WhatsApp del sitio público. Estos datos no dependen de la sede.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat l="Visitas" v={num(r.site.visits)} />
          <Stat l="Clics en WhatsApp del carrito" v={num(r.site.cart)} />
          <Stat l="Clics en WhatsApp de promociones" v={num(r.site.promo)} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title={`Visitas por ${per}`} caption="Cuántas veces se visitó el sitio en cada mes.">
            <VBars labels={labels} flags={flags} format={num} axis={num} series={[{ name: 'Visitas', color: C.cyan, values: r.site.perBucket.map((b) => b.visits) }]} label="Visitas por mes" />
          </ChartCard>
          <ChartCard title="Clics de WhatsApp por promoción" caption="Qué promociones generan más conversaciones con clientes.">
            <HBars items={r.site.byPromo} color={C.magenta} empty="Aún no hay clics en promociones en este periodo." />
          </ChartCard>
        </div>
      </Section>

      <Section title="Inventario" blurb="Cuánto entra y cuánto sale, y dónde falta producto.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat l="Unidades en stock" v={num(inv.totalUnits)} hint={`${num(inv.productsTracked)} productos activos`} />
          <Stat l="Bajo el mínimo" v={num(inv.belowMin)} hint="Productos con stock menor al mínimo" tone={inv.belowMin ? C.magenta : C.cyan} />
          <Stat l="Compras y ajustes (+)" v={num(inv.perBucket.reduce((s, b) => s + b.entradas, 0))} hint="Unidades que entraron al inventario" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Entradas vs. salidas" caption="Entradas: compras y ajustes positivos. Salidas: ventas netas, mermas y ajustes negativos. Si las salidas superan siempre a las entradas, el stock se agota.">
            <VBars labels={labels} format={num} axis={num} series={[{ name: 'Entradas', color: C.cyan, values: inv.perBucket.map((b) => b.entradas) }, { name: 'Salidas', color: C.magenta, values: inv.perBucket.map((b) => Math.max(0, b.salidas)) }]} label="Entradas y salidas de inventario" />
          </ChartCard>
          <ChartCard title="Productos bajo el mínimo" caption="Mayor faltante primero: son los que conviene reponer.">
            {inv.below.length ? <HBars items={inv.below.map((b) => ({ k: `${b.name} (mín. ${b.min})`, v: b.stock }))} color={C.magenta} format={(n) => `${num(n)} en stock`} /> : <NoData text="Ningún producto está por debajo de su mínimo." />}
          </ChartCard>
        </div>
        <ChartCard title="Mayor rotación" caption="Productos más vendidos frente al stock que queda hoy; poco stock y mucha venta significa reponer pronto.">
          {inv.rotation.length ? <HBars items={inv.rotation.map((x) => ({ k: `${x.name} (stock ${num(x.stock)})`, v: x.sold }))} color={C.plum} format={(n) => `${num(n)} vendidas`} /> : <NoData />}
        </ChartCard>
      </Section>

      <Section title="Devoluciones" blurb="Devoluciones parciales de productos normales dentro del periodo.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat l="Devoluciones" v={num(r.returns.count)} />
          <Stat l="Valor devuelto" v={cop(r.returns.value)} hint="Ya descontado de las ventas" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title={`Valor devuelto por ${per}`} caption="Dinero devuelto a clientes en cada mes.">
            <VBars labels={labels} series={[{ name: 'Valor devuelto', color: C.sun, values: r.returns.perBucket.map((b) => b.value) }]} label="Devoluciones por mes" />
          </ChartCard>
          <ChartCard title="Más devueltos" caption="Productos con más unidades devueltas; vale la pena revisar su calidad o descripción.">
            <HBars items={r.returns.top} color={C.sun} empty="No hay devoluciones en este periodo." />
          </ChartCard>
        </div>
      </Section>

      <Section title="Productos artísticos" blurb="Se facturan pero no suman a las ventas ni a los indicadores de arriba.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat l="Valor facturado" v={cop(r.artistic.total)} />
          <Stat l="Unidades" v={num(r.artistic.units)} />
          <Stat l="Facturas con artísticos" v={num(r.artistic.invoices)} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Unidades y valor por mes" caption="Valor facturado (magenta) y unidades (cian, escala propia) de artísticos.">
            <div className="space-y-4">
              <VBars labels={labels} series={[{ name: 'Valor', color: C.magenta, values: r.artistic.perBucket.map((b) => b.value) }]} label="Valor de artísticos por mes" />
              <VBars labels={labels} format={num} axis={num} series={[{ name: 'Unidades', color: C.cyan, values: r.artistic.perBucket.map((b) => b.units) }]} label="Unidades de artísticos por mes" />
            </div>
          </ChartCard>
          <div className="space-y-5">
            <ChartCard title="Más vendidos" caption="Artísticos con más unidades.">
              <HBars items={r.artistic.top.slice(0, 5)} color={C.magenta} empty="No hubo artísticos vendidos." format={(n) => `${num(n)} u.`} />
            </ChartCard>
            <ChartCard title="Menos vendidos" caption="Artísticos con menor salida.">
              <HBars items={r.artistic.bottom.slice(0, 5)} color={C.sun} empty="No hubo artísticos vendidos." format={(n) => `${num(n)} u.`} />
            </ChartCard>
          </div>
        </div>
      </Section>
      <p className="mt-6 text-xs text-ink/50">Montos en pesos colombianos (COP). En los ejes, «mil» son miles y «M» millones.</p>
    </Wrap>
  )
}
