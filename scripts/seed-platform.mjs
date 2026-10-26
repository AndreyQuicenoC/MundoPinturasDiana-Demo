/**
 * Semilla idempotente para Vercel/Netlify (PostgreSQL).
 * Usuarios demo, sedes, catálogo base y categorías de caja.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const DEMO_USERS = [
  { email: 'admin@mundopinturasdiana.test', password: 'Admin#2026demo', name: 'Admin Demo', role: 'admin' },
  { email: 'gerente@mundopinturasdiana.test', password: 'Gerente#2026demo', name: 'Gerente Demo', role: 'gerente' },
  { email: 'empleado@mundopinturasdiana.test', password: 'Empleado#2026demo', name: 'Empleado Demo', role: 'empleado' },
]

const IMG = '/brand/banner.jpg'

async function upsertUser(payload, u, branchId) {
  const found = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, limit: 1, overrideAccess: true })
  if (found.docs[0]) return found.docs[0]
  return payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { ...u, status: 'activo', branch: branchId },
  })
}

async function main() {
  console.log('[seed-platform] Iniciando…')
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      whatsapp: '573122486627',
      address: 'Calle 10 #10-15, Cali',
    },
  })

  let branch = (await payload.find({ collection: 'branches', limit: 1, overrideAccess: true })).docs[0]
  if (!branch) {
    branch = await payload.create({
      collection: 'branches',
      overrideAccess: true,
      data: {
        name: 'Sede Cali Centro',
        address: 'Calle 10 #10-15, Cali',
        city: 'Cali',
        whatsapp: '573122486627',
        schedule: 'Lun–Sáb 8:00–18:00',
        active: true,
        order: 1,
      },
    })
  }

  const branch2Exists = await payload.find({ collection: 'branches', where: { name: { equals: 'Sede Sur' } }, limit: 1, overrideAccess: true })
  let branch2 = branch2Exists.docs[0]
  if (!branch2) {
    branch2 = await payload.create({
      collection: 'branches',
      overrideAccess: true,
      data: {
        name: 'Sede Sur',
        address: 'Av. 6N #28-30, Cali',
        city: 'Cali',
        whatsapp: '573122486628',
        active: true,
        order: 2,
      },
    })
  }

  for (const u of DEMO_USERS) {
    await upsertUser(payload, u, branch.id)
  }

  let catNormal = (await payload.find({ collection: 'product-types', where: { code: { equals: 'normal' } }, limit: 1, overrideAccess: true })).docs[0]
  if (!catNormal) {
    catNormal = await payload.create({ collection: 'product-types', overrideAccess: true, data: { name: 'Normal', code: 'normal', affectsDailySales: true } })
  }
  let catArt = (await payload.find({ collection: 'product-types', where: { code: { equals: 'artistico' } }, limit: 1, overrideAccess: true })).docs[0]
  if (!catArt) {
    catArt = await payload.create({ collection: 'product-types', overrideAccess: true, data: { name: 'Artístico', code: 'artistico', affectsDailySales: false } })
  }

  const catNames = ['Vinilos', 'Esmaltes', 'Herramientas', 'Barnices']
  const categories = {}
  for (const name of catNames) {
    let c = (await payload.find({ collection: 'product-categories', where: { name: { equals: name } }, limit: 1, overrideAccess: true })).docs[0]
    if (!c) c = await payload.create({ collection: 'product-categories', overrideAccess: true, data: { name, active: true, showInHome: name === 'Vinilos' } })
    categories[name] = c
  }

  let supplier = (await payload.find({ collection: 'suppliers', limit: 1, overrideAccess: true })).docs[0]
  if (!supplier) {
    supplier = await payload.create({
      collection: 'suppliers',
      overrideAccess: true,
      data: { name: 'Distribuidora Color SAS', nit: '900123456', active: true },
    })
  }

  const cashCats = ['Operación', 'Nómina', 'Servicios', 'Transporte']
  for (const name of cashCats) {
    const ex = await payload.find({ collection: 'cash-categories', where: { name: { equals: name } }, limit: 1, overrideAccess: true })
    if (!ex.docs[0]) {
      await payload.create({ collection: 'cash-categories', overrideAccess: true, data: { name, type: 'gasto', active: true } })
    }
  }

  const skuBase = [
    ['VIN-BLAN-1GL', 'Vinilo blanco premium 1 gal', 'Vinilos', 89000, 62000, '7701234567890'],
    ['VIN-AZUL-CUA', 'Vinilo azul océano 1/4 gal', 'Vinilos', 28000, 18000, '7701234567891'],
    ['ESM-ROJ-CUA', 'Esmalte rojo bermellón 1/4', 'Esmaltes', 22000, 14000, '7701234567892'],
    ['ESM-NEG-GAL', 'Esmalte negro satinado galón', 'Esmaltes', 95000, 65000, '7701234567893'],
    ['BRO-4P', 'Brocha 4 pulgadas', 'Herramientas', 12000, 7000, '7701234567894'],
    ['ROD-9', 'Rodillo 9 mm felpa', 'Herramientas', 18000, 11000, '7701234567895'],
    ['BAR-CRIST', 'Barniz cristal 1/4 gal', 'Barnices', 32000, 21000, '7701234567896'],
    ['ART-MURAL-KIT', 'Kit mural artístico', 'Vinilos', 150000, 90000, '7701234567897'],
  ]

  for (const [sku, name, catName, sale, cost, barcode] of skuBase) {
    const ex = await payload.find({ collection: 'products', where: { sku: { equals: sku } }, limit: 1, overrideAccess: true })
    if (ex.docs[0]) continue
    const artistic = sku.startsWith('ART-')
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        name,
        sku,
        barcode,
        slug: `${sku.toLowerCase()}`,
        productCategory: categories[catName].id,
        saleType: artistic ? catArt.id : catNormal.id,
        origin: 'comprado',
        salePrice: sale,
        costPrice: cost,
        minimumStock: 5,
        visible: true,
        featured: sku === 'VIN-BLAN-1GL',
        status: 'activo',
        imageUrl: IMG,
        unit: sku.includes('GAL') || sku.includes('GAL') ? 'galon' : sku.includes('CUA') ? 'cuarto' : 'unidad',
      },
    })
  }

  const products = await payload.find({ collection: 'products', limit: 50, overrideAccess: true })
  for (const p of products.docs) {
    for (const b of [branch, branch2]) {
      const inv = await payload.find({
        collection: 'inventory',
        where: { and: [{ product: { equals: p.id } }, { branch: { equals: b.id } }] },
        limit: 1,
        overrideAccess: true,
      })
      if (!inv.docs[0]) {
        await payload.create({
          collection: 'inventory-movements',
          overrideAccess: true,
          data: {
            product: p.id,
            branch: b.id,
            type: 'entrada_compra',
            quantity: 20 + (Number(String(p.id).slice(-2)) % 15),
            unitCost: p.costPrice ?? 0,
            supplier: supplier.id,
            reference: 'Seed inicial demo',
          },
        })
      }
    }
  }

  const promoEx = await payload.find({ collection: 'promotions', limit: 1, overrideAccess: true })
  if (!promoEx.docs[0]) {
    const y = new Date().getFullYear()
    await payload.create({
      collection: 'promotions',
      overrideAccess: true,
      data: {
        title: 'Semana del color',
        kind: 'promocion',
        description: '15% en vinilos seleccionados presentando este código en caja.',
        hashtags: '#ColorCali #MundoPinturasDiana',
        imageUrl: IMG,
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        active: true,
      },
    })
  }

  console.log('[seed-platform] Demo lista. Ejecuta npm run seed:demo-analytics para más ventas.')
  process.exit(0)
}

main().catch((e) => {
  console.error('[seed-platform]', e)
  process.exit(1)
})
