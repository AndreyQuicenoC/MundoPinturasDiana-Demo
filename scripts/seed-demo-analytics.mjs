/**
 * Amplía datos de demo para analítica (ventas, caja, sitio, inventario).
 * Ejecutar solo dentro del entorno Figma Make / Payload conectado:
 *   node scripts/seed-demo-analytics.mjs
 *
 * Idempotente: no duplica si ya existen >= 200 ventas en el año en curso.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts' // tsx / entorno Make

const bogotaDay = (d = new Date()) => new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10)
const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1))

async function main() {
  const payload = await getPayload({ config })
  const year = Number(bogotaDay().slice(0, 4))
  const totalSales = await payload.count({ collection: 'sales', overrideAccess: true })
  if (totalSales.totalDocs >= 200) {
    console.log(`Ya hay ${totalSales.totalDocs} ventas; omitiendo seed.`)
    process.exit(0)
  }

  const [branches, products, users, promos, ccats] = await Promise.all([
    payload.find({ collection: 'branches', limit: 20, overrideAccess: true }),
    payload.find({ collection: 'products', where: { status: { equals: 'activo' } }, limit: 200, overrideAccess: true }),
    payload.find({ collection: 'users', where: { status: { equals: 'activo' } }, limit: 20, overrideAccess: true }),
    payload.find({ collection: 'promotions', limit: 20, overrideAccess: true }),
    payload.find({ collection: 'cash-categories', where: { type: { equals: 'gasto' } }, limit: 20, overrideAccess: true }),
  ])

  const branchIds = branches.docs.map((b) => b.id)
  const prods = products.docs.filter((p) => p.salePrice > 0)
  const sellers = users.docs.length ? users.docs : [{ id: undefined }]
  if (!branchIds.length || prods.length < 3) {
    console.error('Faltan sedes o productos activos para sembrar.')
    process.exit(1)
  }

  let saleNo = (await payload.find({ collection: 'sales', sort: '-number', limit: 1, overrideAccess: true })).docs[0]?.number ?? 0

  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    const days = new Date(Date.UTC(year, m, 0)).getUTCDate()
    const salesThisMonth = rand(18, 42)
    for (let i = 0; i < salesThisMonth; i++) {
      const day = rand(1, days)
      const createdAt = `${year}-${mm}-${String(day).padStart(2, '0')}T${String(rand(9, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}:00.000Z`
      const branch = branchIds[rand(0, branchIds.length - 1)]
      const lineCount = rand(1, 4)
      const lines = []
      let subtotal = 0
      let artistic = 0
      for (let j = 0; j < lineCount; j++) {
        const p = prods[rand(0, prods.length - 1)]
        const qty = rand(1, 5)
        const gross = p.salePrice * qty
        subtotal += gross
        const affects = j !== lineCount - 1 || m % 4 !== 0
        lines.push({ product: p.id, name: p.name, quantity: qty, unitPrice: p.salePrice, discountPct: 0, lineTotal: gross, affectsSales: affects })
        if (!affects) artistic += gross
      }
      const total = subtotal
      saleNo += 1
      await payload.create({
        collection: 'sales',
        overrideAccess: true,
        data: {
          number: saleNo,
          branch,
          seller: sellers[rand(0, sellers.length - 1)].id,
          status: 'completada',
          lines,
          subtotal,
          discountTotal: 0,
          total,
          artisticTotal: artistic,
          reportableTotal: total - artistic,
          payments: [{ method: ['efectivo', 'transferencia', 'tarjeta'][rand(0, 2)], amount: total }],
          createdAt,
        },
      })
    }
    // movimientos de caja
    const gastos = rand(8, 20)
    for (let g = 0; g < gastos; g++) {
      const day = `${year}-${mm}-${String(rand(1, days)).padStart(2, '0')}`
      await payload.create({
        collection: 'cash-movements',
        overrideAccess: true,
        data: {
          branch: branchIds[rand(0, branchIds.length - 1)],
          category: 'gasto',
          categoryRef: ccats.docs[rand(0, Math.max(0, ccats.docs.length - 1))]?.id,
          amount: rand(15_000, 450_000),
          date: day,
          note: 'Gasto operativo demo',
        },
      })
    }
    // visitas sitio
    for (let v = 0; v < rand(40, 120); v++) {
      const day = `${year}-${mm}-${String(rand(1, days)).padStart(2, '0')}`
      await payload.create({
        collection: 'site-events',
        overrideAccess: true,
        data: { type: 'visit', day },
      })
    }
    if (promos.docs.length) {
      for (let w = 0; w < rand(5, 25); w++) {
        const day = `${year}-${mm}-${String(rand(1, days)).padStart(2, '0')}`
        await payload.create({
          collection: 'site-events',
          overrideAccess: true,
          data: { type: 'whatsapp_promo', day, promotion: promos.docs[rand(0, promos.docs.length - 1)].id },
        })
      }
    }
  }

  console.log('Seed de analítica completado.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
