import 'server-only'
import { createRequire } from 'node:module'
import path from 'node:path'
import PDFDocument from 'pdfkit'

const require = createRequire(import.meta.url)
try {
  const pdfRoot = path.dirname(require.resolve('pdfkit/package.json'))
  process.env.PDFKIT_FONT_PATH = path.join(pdfRoot, 'js', 'data')
} catch {
  /* pdfkit resuelto vía serverExternalPackages en runtime */
}
import type { Metrics, Rank, Report } from './analytics'
import { fmtDay } from './analytics-shared'
import { formatCOPClient } from './format'

const PLUM = '#4A154B', MAGENTA = '#E11D74', CYAN = '#00ACC1', SUN = '#ffc93c', PAPER = '#fffaf4', INK = '#1b1220', SOFT = '#f6eef6'
const PIE = [MAGENTA, CYAN, PLUM, SUN, '#8a4b8c', '#5fc8d4', '#f27aac', '#b8935a']
const PW = 595.28, PH = 841.89, M = 40, CW = PW - M * 2

const cop = (n: number) => formatCOPClient(Math.round(n))
const num = (n: number) => new Intl.NumberFormat('es-CO').format(Math.round(n))
const pct = (n: number | null) => (n == null ? '—' : `${(n * 100).toFixed(1).replace('.', ',')}%`)
const pctS = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}%`
const compact = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1e9) return `$${(a / 1e9).toFixed(1).replace('.', ',')} MM`
  if (a >= 1e6) return `$${(a / 1e6).toFixed(1).replace('.', ',')} M`
  if (a >= 1e3) return `$${Math.round(a / 1e3)} mil`
  return `$${Math.round(a)}`
}

type Series = { name: string; color: string; values: number[] }

export async function renderReportPdf(r: Report): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, info: { Title: 'Reporte de analítica · Mundo Pinturas Diana', Author: 'Mundo Pinturas Diana' } })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))))
  let y = 0

  const need = (h: number) => { if (y + h > PH - M - 20) { doc.addPage(); y = M } }
  const text = (s: string, x: number, yy: number, o: { size?: number; bold?: boolean; color?: string; width?: number; align?: 'left' | 'center' | 'right' } = {}) => {
    doc.font(o.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(o.size ?? 9).fillColor(o.color ?? INK)
    doc.text(s, x, yy, { width: o.width, align: o.align, lineBreak: false, ellipsis: true })
  }
  const para = (s: string, size = 9, color = '#5b4a5e') => {
    doc.font('Helvetica').fontSize(size)
    const h = doc.heightOfString(s, { width: CW })
    need(h + 6)
    doc.fillColor(color).text(s, M, y, { width: CW })
    y += h + 6
  }
  const section = (title: string, blurb: string) => {
    need(210)
    y += 8
    doc.rect(M, y, 4, 18).fill(MAGENTA)
    text(title, M + 12, y + 2, { size: 15, bold: true, color: PLUM })
    y += 26
    para(blurb)
  }
  const chart = (title: string, caption: string, h: number, draw: (x: number, y: number, w: number) => void) => {
    doc.font('Helvetica').fontSize(8.5)
    const ch = doc.heightOfString(caption, { width: CW - 24 })
    need(h + ch + 44)
    doc.roundedRect(M, y, CW, h + ch + 40, 8).lineWidth(1).strokeColor('#e6d6e7').stroke()
    text(title, M + 12, y + 10, { size: 11, bold: true, color: PLUM })
    draw(M + 12, y + 30, CW - 24)
    doc.fillColor('#5b4a5e').font('Helvetica').fontSize(8.5).text(caption, M + 12, y + 34 + h, { width: CW - 24 })
    y += h + ch + 50
  }

  const vbars = (x: number, y0: number, w: number, h: number, labels: string[], series: Series[], flags: boolean[] | undefined, fmt: (n: number) => string) => {
    const max = Math.max(1, ...series.flatMap((s) => s.values))
    const L = 44, ph = h - 26, pw = w - L, gw = pw / labels.length
    const bw = Math.min(26, (gw * 0.7) / series.length)
    if (!series.some((s) => s.values.some((v) => v > 0))) { text('Sin datos en el periodo seleccionado.', x, y0 + h / 2 - 5, { size: 9, color: '#999', width: w, align: 'center' }); return }
    for (const t of [0, 0.5, 1]) {
      const yy = y0 + 12 + (ph - 12) * (1 - t)
      doc.moveTo(x + L, yy).lineTo(x + w, yy).lineWidth(0.5).strokeColor(t === 0 ? '#9c7a9d' : '#eadbea').stroke()
      text(fmt(max * t), x, yy - 3, { size: 6.5, color: '#777', width: L - 4, align: 'right' })
    }
    labels.forEach((l, i) => {
      const cx = x + L + gw * i + gw / 2
      series.forEach((s, j) => {
        const bh = (s.values[i] / max) * (ph - 12)
        if (bh > 0) doc.roundedRect(cx - (bw * series.length) / 2 + bw * j, y0 + ph - bh, bw - 1.5, bh, 1.5).fill(s.color)
      })
      if (flags?.[i]) doc.polygon([cx - 5, y0 + 9], [cx + 5, y0 + 9], [cx, y0 - 1]).fillAndStroke(SUN, PLUM)
      text(l, cx - gw / 2, y0 + h - 12, { size: 7, color: '#555', width: gw, align: 'center' })
    })
    if (series.length > 1) {
      let lx = x + L
      for (const s of series) { doc.rect(lx, y0 - 8, 7, 7).fill(s.color); text(s.name, lx + 10, y0 - 8, { size: 7 }); lx += 70 }
    }
  }

  const hbars = (x: number, y0: number, w: number, items: Rank[], color: string, fmt: (n: number) => string, rowH = 20) => {
    if (!items.length) { text('Sin datos en el periodo seleccionado.', x, y0 + 4, { size: 9, color: '#999', width: w, align: 'center' }); return }
    const max = Math.max(1, ...items.map((i) => i.v))
    items.forEach((it, i) => {
      const yy = y0 + i * rowH
      text(it.k, x, yy, { size: 8, width: w - 90 })
      text(fmt(it.v), x + w - 85, yy, { size: 8, bold: true, width: 85, align: 'right' })
      doc.roundedRect(x, yy + 10, w, 4, 2).fill(SOFT)
      doc.roundedRect(x, yy + 10, Math.max(3, (it.v / max) * w), 4, 2).fill(color)
    })
  }

  // ---------- Portada ----------
  doc.rect(0, 0, PW, 190).fill(PLUM)
  doc.rect(0, 190, PW, 6).fill(MAGENTA)
  doc.circle(PW - 70, 70, 46).fill(SUN)
  doc.circle(PW - 120, 120, 22).fill(CYAN)
  doc.circle(PW - 36, 130, 14).fill(MAGENTA)
  text('MUNDO PINTURAS DIANA', M, 50, { size: 11, bold: true, color: SUN })
  text('Reporte de analítica', M, 72, { size: 32, bold: true, color: '#ffffff' })
  text(`${fmtDay(r.filters.desde)}  –  ${fmtDay(r.filters.hasta)}`, M, 118, { size: 14, color: '#ffffff' })
  text(`${r.sedeName}  ·  ${r.filters.monthly ? 'Desglose mensual' : 'Periodo único'}`, M, 140, { size: 10, color: '#e9d3ea' })
  text(`Generado el ${new Date(r.generatedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'short' })}`, M, 160, { size: 8.5, color: '#cfa9d1' })
  y = 218

  // ---------- KPIs ----------
  section('Indicadores del periodo', 'Resumen del rango elegido. Las ventas incluyen solo productos normales, sin anuladas y descontando devoluciones; los artísticos se reportan aparte.')
  const m = r.total
  const kpis: [string, string, string?][] = [
    ['Total de ventas', cop(m.ventas), `${num(m.nVentas)} ventas`],
    ['Ticket promedio', m.ticket == null ? '—' : cop(m.ticket), 'Promedio por venta'],
    ['Promedio mensual', cop(r.avgMonthly), `En ${r.buckets.length} ${r.buckets.length === 1 ? 'periodo' : 'meses'}`],
    ['Total de gastos', cop(m.gastos)],
    ['Total de entregas', cop(m.entregas), 'Entregas de dinero'],
    ['Total de transferencias', cop(m.transferencias)],
    ['Total de ahorros', cop(m.ahorros)],
    ['Margen de ganancia', pct(m.margen), '(ventas - costo - gastos) / ventas'],
    ['Ratio de gastos', pct(m.ratio), 'Gastos / ventas'],
  ]
  const cw = (CW - 20) / 3
  kpis.forEach(([l, v, hint], i) => {
    if (i % 3 === 0) need(66)
    const x = M + (i % 3) * (cw + 10)
    doc.roundedRect(x, y, cw, 58, 8).fillAndStroke(i % 3 === 0 ? PAPER : '#ffffff', '#e6d6e7')
    doc.rect(x, y + 10, 3, 38).fill([MAGENTA, CYAN, SUN][i % 3])
    text(l.toUpperCase(), x + 12, y + 9, { size: 6.5, bold: true, color: '#7a6a7d', width: cw - 18 })
    text(v, x + 12, y + 22, { size: 14, bold: true, color: PLUM, width: cw - 18 })
    if (hint) text(hint, x + 12, y + 43, { size: 6.5, color: '#7a6a7d', width: cw - 18 })
    if (i % 3 === 2) y += 66
  })
  y += 4
  para('Margen de ganancia = (ventas - costo de lo vendido - gastos) / ventas. Ratio de gastos = gastos / ventas.', 8)

  // ---------- Tabla mensual ----------
  section(r.filters.monthly ? 'Desglose por mes' : 'Periodo seleccionado', 'Los mismos indicadores por mes. Los meses marcados con * contienen un evento clave y sus datos pueden ser atípicos.')
  const cols = ['Ventas', 'Nº', 'Ticket', 'Gastos', 'Entregas', 'Transf.', 'Ahorros', 'Margen', 'Ratio']
  const cells = (x: Metrics) => [compact(x.ventas), num(x.nVentas), x.ticket == null ? '—' : compact(x.ticket), compact(x.gastos), compact(x.entregas), compact(x.transferencias), compact(x.ahorros), pct(x.margen), pct(x.ratio)]
  const lw = r.filters.monthly ? 56 : 120
  const tw = (CW - lw) / cols.length
  need(24)
  doc.rect(M, y, CW, 18).fill(PLUM)
  text(r.filters.monthly ? 'Mes' : 'Periodo', M + 6, y + 6, { size: 7.5, bold: true, color: '#fff' })
  cols.forEach((c, i) => text(c, M + lw + tw * i, y + 6, { size: 7.5, bold: true, color: '#fff', width: tw - 4, align: 'right' }))
  y += 18
  const rows: [string, Metrics, boolean][] = [...r.buckets.map((b) => [b.label + (b.flags.length ? ' *' : ''), b, false] as [string, Metrics, boolean]), ['Total', r.total, true]]
  rows.forEach(([l, x, bold], i) => {
    need(16)
    if (bold) doc.rect(M, y, CW, 16).fill(SOFT)
    else if (i % 2) doc.rect(M, y, CW, 16).fill(PAPER)
    text(l, M + 6, y + 5, { size: 7.5, bold: true, color: PLUM, width: lw })
    cells(x).forEach((c, k) => text(c, M + lw + tw * k, y + 5, { size: 7.5, bold, width: tw - 4, align: 'right' }))
    y += 16
  })
  y += 8
  if (r.events.length) para(`Eventos clave en el rango: ${r.events.map((e) => e.title).join(', ')}.`, 8)

  // ---------- Ventas y gastos ----------
  const labels = r.buckets.map((b) => b.label)
  const flags = r.buckets.map((b) => b.flags.length > 0)
  section('Ventas y gastos', 'Evolución en el tiempo y distribución del gasto.')
  chart(r.filters.monthly ? 'Ventas por mes' : 'Ventas del periodo', 'Ventas netas de productos normales en cada mes. El triángulo amarillo indica un mes con evento clave.', 150, (x, yy, w) => vbars(x, yy, w, 150, labels, [{ name: 'Ventas', color: MAGENTA, values: r.buckets.map((b) => b.ventas) }], flags, compact))
  chart(r.filters.monthly ? 'Gastos por mes' : 'Gastos del periodo', 'Suma de los movimientos de caja de tipo gasto registrados en cada mes.', 150, (x, yy, w) => vbars(x, yy, w, 150, labels, [{ name: 'Gastos', color: PLUM, values: r.buckets.map((b) => b.gastos) }], flags, compact))

  // cambio % (barras sobre línea 0)
  const ch = r.change
  chart('Cambio porcentual mes a mes', 'Compara cada mes con el anterior. Si las ventas crecen más que los gastos el negocio gana eficiencia; si los gastos crecen más rápido, conviene revisarlos.', 160, (x, yy, w) => {
    const vals = ch.flatMap((c) => [c.ventas, c.gastos]).filter((v): v is number => v != null)
    if (ch.length < 2 || !vals.length) { text('Se necesitan al menos dos meses con datos.', x, yy + 70, { size: 9, color: '#999', width: w, align: 'center' }); return }
    const lim = Math.max(10, ...vals.map(Math.abs)), L = 40, zero = yy + 66, half = 52, gw = (w - L) / ch.length, bw = Math.min(16, gw * 0.35)
    for (const t of [-1, 0, 1]) {
      doc.moveTo(x + L, zero - t * half).lineTo(x + w, zero - t * half).lineWidth(t === 0 ? 1 : 0.5).strokeColor(t === 0 ? '#9c7a9d' : '#eadbea').stroke()
      text(t === 0 ? '0%' : pctS(t * lim), x, zero - t * half - 3, { size: 6.5, color: '#777', width: L - 4, align: 'right' })
    }
    ch.forEach((c, i) => {
      const cx = x + L + gw * i + gw / 2
      const one = (v: number | null, bx: number, col: string) => { if (v == null) return; const bh = Math.max(1, Math.abs((v / lim) * half)); doc.rect(bx, v >= 0 ? zero - bh : zero, bw - 1, bh).fill(col) }
      one(c.ventas, cx - bw, MAGENTA); one(c.gastos, cx, PLUM)
      if (c.flag) doc.polygon([cx - 5, yy + 5], [cx + 5, yy + 5], [cx, yy - 5]).fillAndStroke(SUN, PLUM)
      text(c.label, cx - gw / 2, yy + 134, { size: 7, color: '#555', width: gw, align: 'center' })
    })
    doc.rect(x + L, yy + 148, 7, 7).fill(MAGENTA); text('% cambio de ventas', x + L + 10, yy + 148, { size: 7 })
    doc.rect(x + L + 100, yy + 148, 7, 7).fill(PLUM); text('% cambio de gastos', x + L + 110, yy + 148, { size: 7 })
  })

  // dona
  chart('Gastos por categoría', 'Proporción del gasto del periodo que corresponde a cada categoría de caja.', 130, (x, yy) => {
    const total = r.gastosByCategory.reduce((s, i) => s + i.v, 0)
    if (!total) { text('No hay gastos registrados en el periodo.', x, yy + 50, { size: 9, color: '#999', width: CW - 24, align: 'center' }); return }
    const items = r.gastosByCategory.length > 7 ? [...r.gastosByCategory.slice(0, 7), { k: 'Otras', v: r.gastosByCategory.slice(7).reduce((s, i) => s + i.v, 0) }] : r.gastosByCategory
    const cx = x + 62, cy = yy + 62, R = 58, rr = 34
    let a0 = -Math.PI / 2
    items.forEach((it, idx) => {
      const a1 = a0 + (it.v / total) * Math.PI * 2 - (items.length === 1 ? 0.0001 : 0)
      const large = a1 - a0 > Math.PI ? 1 : 0
      const p = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`
      doc.path(`M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} L${p(rr, a1)} A${rr} ${rr} 0 ${large} 0 ${p(rr, a0)} Z`).fill(PIE[idx % PIE.length])
      a0 = a1
    })
    text('Gastos', cx - 30, cy - 8, { size: 7, color: '#777', width: 60, align: 'center' })
    text(compact(total), cx - 30, cy + 2, { size: 8.5, bold: true, color: PLUM, width: 60, align: 'center' })
    items.forEach((it, idx) => {
      const ly = yy + 8 + idx * 15
      doc.rect(x + 150, ly, 8, 8).fill(PIE[idx % PIE.length])
      text(it.k, x + 164, ly, { size: 8, width: 190 })
      text(`${((it.v / total) * 100).toFixed(1).replace('.', ',')}%  ·  ${compact(it.v)}`, x + 350, ly, { size: 8, bold: true, width: 130, align: 'right' })
    })
  })

  // ---------- Productos ----------
  section('Productos', 'Unidades vendidas de productos normales, ya descontadas las devoluciones.')
  const hb = (title: string, caption: string, items: Rank[], color: string, fmt: (n: number) => string = (n) => `${num(n)} u.`) =>
    chart(title, caption, Math.max(40, items.length * 20 + 4), (x, yy, w) => hbars(x, yy, w, items, color, fmt))
  hb('Unidades por categoría', 'Qué categorías mueven más volumen en el periodo.', r.unitsByCategory.slice(0, 8), CYAN)
  hb('Más vendidos (Top 10)', 'Los productos con más unidades vendidas.', r.top, MAGENTA)
  hb('Menos vendidos', 'Entre los productos vendidos, los de menor salida: candidatos a promoción o a reducir compras.', r.bottom, SUN)
  for (const c of r.categoryCharts.slice(0, 4)) hb(`Categoría: ${c.category}`, `${num(c.units)} unidades en la categoría; se muestran sus productos principales.`, c.items, CYAN)

  // ---------- Sitio ----------
  section('Sitio web', `Visitas: ${num(r.site.visits)}  ·  Clics en WhatsApp del carrito: ${num(r.site.cart)}  ·  Clics en WhatsApp de promociones: ${num(r.site.promo)}. No dependen de la sede.`)
  chart(r.filters.monthly ? 'Visitas por mes' : 'Visitas del periodo', 'Cuántas veces se visitó el sitio público en cada mes.', 130, (x, yy, w) => vbars(x, yy, w, 130, labels, [{ name: 'Visitas', color: CYAN, values: r.site.perBucket.map((b) => b.visits) }], flags, num))
  hb('Clics de WhatsApp por promoción', 'Qué promociones generan más conversaciones con clientes.', r.site.byPromo.slice(0, 8), MAGENTA, (n) => `${num(n)} clics`)

  // ---------- Inventario ----------
  const inv = r.inventory
  section('Inventario', `Unidades en stock: ${num(inv.totalUnits)}  ·  Productos activos: ${num(inv.productsTracked)}  ·  Bajo el mínimo: ${num(inv.belowMin)}.`)
  chart('Entradas vs. salidas', 'Entradas: compras y ajustes positivos. Salidas: ventas netas, mermas y ajustes negativos. Si las salidas superan siempre a las entradas, el stock se agota.', 140, (x, yy, w) =>
    vbars(x, yy, w, 140, labels, [{ name: 'Entradas', color: CYAN, values: inv.perBucket.map((b) => b.entradas) }, { name: 'Salidas', color: MAGENTA, values: inv.perBucket.map((b) => Math.max(0, b.salidas)) }], undefined, num))
  hb('Productos bajo el mínimo', 'Mayor faltante primero: son los que conviene reponer.', inv.below.map((b) => ({ k: `${b.name} (mín. ${b.min})`, v: b.stock })), MAGENTA, (n) => `${num(n)} en stock`)
  hb('Mayor rotación', 'Productos más vendidos frente al stock actual.', inv.rotation.map((x) => ({ k: `${x.name} (stock ${num(x.stock)})`, v: x.sold })), PLUM, (n) => `${num(n)} vendidas`)

  // ---------- Devoluciones ----------
  section('Devoluciones', `${num(r.returns.count)} devoluciones por ${cop(r.returns.value)} en el periodo (ya descontadas de las ventas).`)
  chart(r.filters.monthly ? 'Valor devuelto por mes' : 'Valor devuelto', 'Dinero devuelto a clientes en cada mes.', 120, (x, yy, w) => vbars(x, yy, w, 120, labels, [{ name: 'Valor', color: SUN, values: r.returns.perBucket.map((b) => b.value) }], undefined, compact))
  hb('Más devueltos', 'Productos con más unidades devueltas; conviene revisar su calidad o descripción.', r.returns.top, SUN)

  // ---------- Artísticos ----------
  const a = r.artistic
  section('Productos artísticos', `Valor facturado ${cop(a.total)}  ·  ${num(a.units)} unidades  ·  ${num(a.invoices)} facturas. Se facturan pero no suman a las ventas ni a los indicadores anteriores.`)
  chart('Valor por mes', 'Valor facturado de productos artísticos en cada mes.', 110, (x, yy, w) => vbars(x, yy, w, 110, labels, [{ name: 'Valor', color: MAGENTA, values: a.perBucket.map((b) => b.value) }], undefined, compact))
  chart('Unidades por mes', 'Unidades artísticas vendidas en cada mes.', 110, (x, yy, w) => vbars(x, yy, w, 110, labels, [{ name: 'Unidades', color: CYAN, values: a.perBucket.map((b) => b.units) }], undefined, num))
  hb('Artísticos más vendidos', 'Los de mayor salida en unidades.', a.top.slice(0, 5), MAGENTA)
  hb('Artísticos menos vendidos', 'Los de menor salida en unidades.', a.bottom.slice(0, 5), SUN)

  // ---------- Pie de página ----------
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    doc.page.margins.bottom = 0
    doc.rect(0, PH - 26, PW, 26).fill(PAPER)
    text('Mundo Pinturas Diana · Reporte de analítica', M, PH - 17, { size: 7, color: '#7a6a7d' })
    text(`Página ${i + 1} de ${range.count}`, PW - M - 100, PH - 17, { size: 7, color: '#7a6a7d', width: 100, align: 'right' })
  }
  doc.end()
  return done
}
