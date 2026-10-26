/** Generación masiva de datos demo (2 años, catálogo, caja, analítica). */

import type { DemoUser } from './fixtures'

let seq = 1000
export const nextId = () => String(++seq)
export function resetSeq(n = 1000) {
  seq = n
}

export const bogotaDay = (d = new Date()) => new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10)

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Imágenes públicas (Unsplash) — distintas por producto. */
const IMG = {
  paint1: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=640&q=80',
  paint2: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=640&q=80',
  paint3: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=640&q=80',
  paint4: 'https://images.unsplash.com/photo-1615876234686-2fd0a5a2a0a0?w=640&q=80',
  brush: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=640&q=80',
  roller: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=640&q=80',
  can: 'https://images.unsplash.com/photo-1513467632582-449a5c4d0f84?w=640&q=80',
  tools: 'https://images.unsplash.com/photo-1504140335590-69b22a25b088?w=640&q=80',
  mural: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=640&q=80',
  store: 'https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=640&q=80',
}

type ProdDef = {
  sku: string
  name: string
  cat: string
  sale: number
  cost: number
  barcode: string
  imageUrl: string
  type?: 'normal' | 'art'
  min?: number
  featured?: boolean
  unit?: string
}

const PRODUCT_DEFS: ProdDef[] = [
  { sku: 'VIN-BLAN-1GL', name: 'Vinilo blanco premium 1 gal', cat: 'vin', sale: 89000, cost: 62000, barcode: '7701234567890', imageUrl: IMG.paint1, featured: true, unit: 'galon' },
  { sku: 'VIN-AZUL-CUA', name: 'Vinilo azul océano 1/4 gal', cat: 'vin', sale: 28000, cost: 18000, barcode: '7701234567891', imageUrl: IMG.paint2, min: 8, unit: 'cuarto' },
  { sku: 'VIN-VER-1GL', name: 'Vinilo verde selva galón', cat: 'vin', sale: 92000, cost: 64000, barcode: '7701234567801', imageUrl: IMG.paint3, unit: 'galon' },
  { sku: 'VIN-GRIS-CUA', name: 'Vinilo gris perla 1/4 gal', cat: 'vin', sale: 29500, cost: 19000, barcode: '7701234567802', imageUrl: IMG.can, unit: 'cuarto' },
  { sku: 'ESM-ROJ-CUA', name: 'Esmalte rojo bermellón 1/4', cat: 'esm', sale: 22000, cost: 14000, barcode: '7701234567892', imageUrl: IMG.paint4, min: 6, unit: 'cuarto' },
  { sku: 'ESM-NEG-GAL', name: 'Esmalte negro satinado galón', cat: 'esm', sale: 95000, cost: 65000, barcode: '7701234567893', imageUrl: IMG.paint1, unit: 'galon' },
  { sku: 'ESM-BLAN-CUA', name: 'Esmalte blanco mate 1/4', cat: 'esm', sale: 21000, cost: 13500, barcode: '7701234567803', imageUrl: IMG.can, unit: 'cuarto' },
  { sku: 'ESM-AZUL-GAL', name: 'Esmalte azul industrial galón', cat: 'esm', sale: 88000, cost: 58000, barcode: '7701234567804', imageUrl: IMG.paint2, unit: 'galon' },
  { sku: 'BRO-4P', name: 'Brocha 4 pulgadas', cat: 'her', sale: 12000, cost: 7000, barcode: '7701234567894', imageUrl: IMG.brush, min: 10, unit: 'unidad' },
  { sku: 'BRO-2P', name: 'Brocha 2 pulgadas angular', cat: 'her', sale: 8500, cost: 4800, barcode: '7701234567805', imageUrl: IMG.brush, unit: 'unidad' },
  { sku: 'ROD-9', name: 'Rodillo 9 mm felpa', cat: 'her', sale: 18000, cost: 11000, barcode: '7701234567895', imageUrl: IMG.roller, unit: 'unidad' },
  { sku: 'ROD-23', name: 'Rodillo 23 cm texturizado', cat: 'her', sale: 24000, cost: 15000, barcode: '7701234567806', imageUrl: IMG.roller, unit: 'unidad' },
  { sku: 'BAR-CRIST', name: 'Barniz cristal 1/4 gal', cat: 'bar', sale: 32000, cost: 21000, barcode: '7701234567896', imageUrl: IMG.can, unit: 'cuarto' },
  { sku: 'BAR-MATE-GAL', name: 'Barniz mate galón', cat: 'bar', sale: 78000, cost: 52000, barcode: '7701234567807', imageUrl: IMG.paint3, unit: 'galon' },
  { sku: 'LIX-AGUA-1L', name: 'Thinner aguarrás 1 L', cat: 'her', sale: 15000, cost: 9000, barcode: '7701234567808', imageUrl: IMG.tools, unit: 'litro' },
  { sku: 'MAS-UNIV-1KG', name: 'Masilla universal 1 kg', cat: 'her', sale: 19000, cost: 12000, barcode: '7701234567809', imageUrl: IMG.tools, unit: 'kilo' },
  { sku: 'CIN-TAPE', name: 'Cinta enmascarar 48 mm', cat: 'her', sale: 6500, cost: 3500, barcode: '7701234567810', imageUrl: IMG.tools, min: 20, unit: 'unidad' },
  { sku: 'LAC-AUT-GAL', name: 'Laca automotriz galón', cat: 'bar', sale: 125000, cost: 82000, barcode: '7701234567811', imageUrl: IMG.paint4, unit: 'galon' },
  { sku: 'VIN-AMAR-CUA', name: 'Vinilo amarillo sol 1/4', cat: 'vin', sale: 27000, cost: 17500, barcode: '7701234567812', imageUrl: IMG.paint2, unit: 'cuarto' },
  { sku: 'ESM-VERDE-CUA', name: 'Esmalte verde bosque 1/4', cat: 'esm', sale: 23000, cost: 14500, barcode: '7701234567813', imageUrl: IMG.paint3, unit: 'cuarto' },
  { sku: 'ART-MURAL-KIT', name: 'Kit mural artístico', cat: 'vin', sale: 150000, cost: 90000, barcode: '7701234567897', imageUrl: IMG.mural, type: 'art', min: 2, unit: 'unidad' },
  { sku: 'ART-CANVA-SET', name: 'Set lienzos + acrílicos artísticos', cat: 'vin', sale: 98000, cost: 58000, barcode: '7701234567814', imageUrl: IMG.mural, type: 'art', unit: 'unidad' },
  { sku: 'PINT-EXT-GAL', name: 'Pintura exterior clima 5 gal', cat: 'vin', sale: 185000, cost: 125000, barcode: '7701234567815', imageUrl: IMG.store, unit: 'galon' },
  { sku: 'IMP-PREMIUM', name: 'Imprimante sellador 1 gal', cat: 'esm', sale: 72000, cost: 48000, barcode: '7701234567816', imageUrl: IMG.can, unit: 'galon' },
  { sku: 'ESP-ALU-1L', name: 'Esmalte aluminio 1 L', cat: 'esm', sale: 38000, cost: 25000, barcode: '7701234567817', imageUrl: IMG.paint4, unit: 'litro' },
]

const CASH_CONCEPT_NAMES: { name: string; cat: string; amount?: number; catType?: 'gasto' | 'transferencia' | 'ahorro' | 'adicion' }[] = [
  { name: 'Pago servicios públicos', cat: 'cc-srv', amount: 120000 },
  { name: 'Nómina quincenal', cat: 'cc-nom', amount: 2800000 },
  { name: 'Pago proveedor QUIMEX', cat: 'cc-op', amount: 850000 },
  { name: 'Transporte mercancía', cat: 'cc-trans', amount: 95000 },
  { name: 'Cafetería y aseo', cat: 'cc-op', amount: 45000 },
  { name: 'Publicidad redes', cat: 'cc-mkt', amount: 180000 },
  { name: 'Comisión datáfono', cat: 'cc-op', amount: 32000 },
  { name: 'Arriendo local', cat: 'cc-srv', amount: 4500000 },
  { name: 'Pago DIAN / impuestos', cat: 'cc-op', amount: 520000 },
  { name: 'Mantenimiento equipos', cat: 'cc-op', amount: 75000 },
  { name: 'Dotación empleados', cat: 'cc-nom', amount: 120000 },
  { name: 'Flete domicilios', cat: 'cc-trans', amount: 65000 },
  { name: 'Ahorro caja menor', cat: 'cc-ahorro', catType: 'ahorro', amount: 200000 },
  { name: 'Transferencia a banco', cat: 'cc-trans', catType: 'transferencia', amount: 1500000 },
  { name: 'Transferencia proveedor', cat: 'cc-trans', catType: 'transferencia', amount: 980000 },
  { name: 'Adición base caja', cat: 'cc-op', catType: 'adicion', amount: 500000 },
  { name: 'Pago energía', cat: 'cc-srv', amount: 210000 },
  { name: 'Pago acueducto', cat: 'cc-srv', amount: 85000 },
  { name: 'Pago gas', cat: 'cc-srv', amount: 62000 },
  { name: 'Bonificación vendedor', cat: 'cc-nom', amount: 150000 },
  { name: 'Material POP tienda', cat: 'cc-mkt', amount: 95000 },
  { name: 'Seguridad / vigilancia', cat: 'cc-srv', amount: 380000 },
  { name: 'Recarga datáfono', cat: 'cc-op', amount: 28000 },
  { name: 'Fondo empleados', cat: 'cc-ahorro', catType: 'ahorro', amount: 100000 },
]

export function buildDemoData() {
  resetSeq(1000)
  const branch1 = 'br-1'
  const branch2 = 'br-2'
  const typeNormal = 'pt-normal'
  const typeArt = 'pt-art'
  const catVin = 'cat-vin'
  const catEsm = 'cat-esm'
  const catHer = 'cat-her'
  const catBar = 'cat-bar'
  const sup1 = 'sup-1'
  const sup2 = 'sup-2'
  const today = bogotaDay()
  const yearNow = Number(today.slice(0, 4))

  const users: DemoUser[] = [
    { id: 'u-admin', collection: 'users', email: 'admin@mundopinturasdiana.test', password: 'Admin#2026demo', name: 'Admin Demo', role: 'admin', status: 'activo', branch: branch1, document: '100000001' },
    { id: 'u-ger', collection: 'users', email: 'gerente@mundopinturasdiana.test', password: 'Gerente#2026demo', name: 'Gerente Demo', role: 'gerente', status: 'activo', branch: branch1 },
    { id: 'u-emp', collection: 'users', email: 'empleado@mundopinturasdiana.test', password: 'Empleado#2026demo', name: 'Empleado Demo', role: 'empleado', status: 'activo', branch: branch1 },
  ]

  const branches = [
    { id: branch1, name: 'Cali Centro', address: 'Calle 10 #10-15, Cali', city: 'Cali', whatsapp: '573122486627', schedule: 'Lun–Sáb 8:00–18:00', active: true, order: 1 },
    { id: branch2, name: 'Sede Sur', address: 'Av. 6N #28-30, Cali', city: 'Cali', whatsapp: '573122486628', active: true, order: 2 },
  ]

  const productTypes = [
    { id: typeNormal, name: 'Normal', code: 'normal', affectsDailySales: true },
    { id: typeArt, name: 'Artístico', code: 'artistico', affectsDailySales: false },
  ]

  const productCategories = [
    { id: catVin, name: 'Vinilos', slug: 'vinilos', active: true, showInHome: true, homeOrder: 1 },
    { id: catEsm, name: 'Esmaltes', slug: 'esmaltes', active: true, showInHome: true, homeOrder: 2 },
    { id: catHer, name: 'Herramientas', slug: 'herramientas', active: true, showInHome: false },
    { id: catBar, name: 'Barnices', slug: 'barnices', active: true, showInHome: false },
  ]

  const catMap = { vin: catVin, esm: catEsm, her: catHer, bar: catBar }

  const products = PRODUCT_DEFS.map((d, i) => ({
    id: `p${i + 1}`,
    name: d.name,
    sku: d.sku,
    barcode: d.barcode,
    slug: slug(d.name) || d.sku.toLowerCase(),
    productCategory: catMap[d.cat as keyof typeof catMap],
    saleType: d.type === 'art' ? typeArt : typeNormal,
    origin: d.type === 'art' ? 'fabricado' : 'comprado',
    salePrice: d.sale,
    costPrice: d.cost,
    minimumStock: d.min ?? 5,
    visible: true,
    featured: d.featured ?? false,
    status: 'activo',
    imageUrl: d.imageUrl,
    unit: d.unit ?? 'unidad',
  }))

  const suppliers = [
    { id: sup1, name: 'Distribuidora Color SAS', nit: '900123456', contact: 'Laura M.', phone: '6025550101', active: true },
    { id: sup2, name: 'Quimex Andina', nit: '900888777', contact: 'Carlos R.', phone: '6025550202', active: true },
  ]

  const cashCategories = [
    { id: 'cc-op', name: 'Operación', type: 'gasto', active: true },
    { id: 'cc-nom', name: 'Nómina', type: 'gasto', active: true },
    { id: 'cc-srv', name: 'Servicios', type: 'gasto', active: true },
    { id: 'cc-trans', name: 'Transporte', type: 'gasto', active: true },
    { id: 'cc-mkt', name: 'Marketing', type: 'gasto', active: true },
    { id: 'cc-ahorro', name: 'Ahorros', type: 'gasto', active: true },
  ]

  const cashConcepts = CASH_CONCEPT_NAMES.map((c, i) => ({
    id: `cx-${i + 1}`,
    name: c.name,
    categoryRef: c.cat,
    category: c.catType ?? 'gasto',
    active: true,
    suggestedAmount: c.amount,
    description: c.name,
  }))

  const inventory: any[] = []
  const inventoryMovements: any[] = []
  products.forEach((p, pi) => {
    for (const [bi, b] of [branch1, branch2].entries()) {
      let q = 12 + ((pi + bi) % 18)
      if (pi % 7 === 0) q = Math.max(1, (p.minimumStock ?? 5) - 2)
      if (pi % 11 === 0) q = 0
      inventory.push({ id: nextId(), product: p.id, branch: b, quantity: q })
      inventoryMovements.push({
        id: nextId(),
        product: p.id,
        branch: b,
        type: 'entrada_compra',
        quantity: q + 5,
        unitCost: p.costPrice,
        supplier: pi % 2 ? sup1 : sup2,
        reference: 'Seed demo',
        createdAt: `${yearNow - 1}-01-08T15:00:00.000Z`,
        balanceAfter: q,
        actor: 'Sistema',
      })
    }
  })

  for (let extra = 0; extra < 80; extra++) {
    const p = products[extra % products.length]
    const b = extra % 2 ? branch1 : branch2
    const month = 1 + (extra % 24)
    const y = month > 12 ? yearNow : yearNow - 1
    const mm = String(((month - 1) % 12) + 1).padStart(2, '0')
    const day = String(1 + (extra % 26)).padStart(2, '0')
    inventoryMovements.push({
      id: nextId(),
      product: p.id,
      branch: b,
      type: extra % 5 === 0 ? 'ajuste_negativo' : 'entrada_compra',
      quantity: 2 + (extra % 8),
      unitCost: p.costPrice,
      createdAt: `${y}-${mm}-${day}T10:00:00.000Z`,
      balanceAfter: 10,
      actor: 'Gerente Demo',
    })
  }

  const clients = [
    { id: 'cl-1', name: 'Juan Pérez', document: '1234567890', phone: '3001234567', clientType: 'natural', habeasData: true, active: true },
    { id: 'cl-2', name: 'Constructora Andina', document: '900555444', phone: '6025551234', clientType: 'empresa', habeasData: true, active: true },
    { id: 'cl-3', name: 'Pintor freelance Diego', document: '987654321', phone: '3109876543', clientType: 'pintor', habeasData: true, active: true },
    { id: 'cl-4', name: 'Obra Torres del Río', document: '900111222', phone: '6024443322', clientType: 'contratista', habeasData: true, active: true },
  ]

  const sales: any[] = []
  let saleNum = 1
  const sellers = ['u-emp', 'u-ger', 'u-admin']
  const payMethods = ['efectivo', 'transferencia', 'tarjeta'] as const

  const mkSale = (opts: {
    y: number
    m: number
    day: number
    hour: number
    branch: string
    seller: string
    status?: string
    withReturn?: boolean
    fe?: boolean
    domicilio?: boolean
  }) => {
    const mm = String(opts.m).padStart(2, '0')
    const dd = String(opts.day).padStart(2, '0')
    const p = products[(saleNum + opts.day) % products.length]
    const qty = 1 + (saleNum % 4)
    const artistic = p.saleType === typeArt
    const lineTotal = p.salePrice * qty
    const artisticTotal = artistic ? lineTotal : 0
    const total = lineTotal
    const createdAt = `${opts.y}-${mm}-${dd}T${String(opts.hour).padStart(2, '0')}:${String((saleNum * 7) % 60).padStart(2, '0')}:00.000Z`
    const status = opts.status ?? 'emitida'
    const sale = {
      id: nextId(),
      number: saleNum++,
      branch: opts.branch,
      seller: opts.seller,
      sellerName: users.find((u) => u.id === opts.seller)?.name ?? 'Vendedor',
      status,
      channel: opts.domicilio ? 'domicilio' : 'mostrador',
      createdAt,
      lines: [{ product: p.id, name: p.name, quantity: qty, unitPrice: p.salePrice, discountPct: saleNum % 9 === 0 ? 5 : 0, lineTotal, affectsSales: !artistic }],
      subtotal: lineTotal,
      discountTotal: 0,
      total,
      artisticTotal,
      reportableTotal: total - artisticTotal,
      payments: [{ method: payMethods[saleNum % 3], amount: total }],
      returns: opts.withReturn ? [{ product: p.id, quantity: 1, at: createdAt, reason: 'Cliente cambió de color' }] : [],
      electronicInvoice: opts.fe ? { requested: true, buyerName: clients[saleNum % clients.length].name, buyerDocument: clients[saleNum % clients.length].document } : { requested: false },
    }
    sales.push(sale)
    return sale
  }

  for (const y of [yearNow - 1, yearNow]) {
    for (let m = 1; m <= 12; m++) {
      if (y === yearNow && m > Number(today.slice(5, 7))) continue
      const dim = new Date(y, m, 0).getDate()
      const count = 32 + ((m + y) % 6) * 4
      for (let i = 0; i < count; i++) {
        mkSale({
          y,
          m,
          day: 1 + (i % dim),
          hour: 8 + (i % 10),
          branch: i % 2 ? branch1 : branch2,
          seller: sellers[i % 3],
          withReturn: y === yearNow && m === 6 && i % 17 === 0,
          fe: i % 11 === 0,
        })
      }
    }
  }

  for (let t = 0; t < 14; t++) {
    mkSale({
      y: Number(today.slice(0, 4)),
      m: Number(today.slice(5, 7)),
      day: Number(today.slice(8, 10)),
      hour: 8 + (t % 9),
      branch: t % 2 ? branch1 : branch2,
      seller: sellers[t % 3],
      fe: t % 4 === 0,
      domicilio: t % 5 === 0,
    })
  }

  const cashMovements: any[] = []
  const gastoConcepts = cashConcepts.filter((c) => c.category === 'gasto')
  const ahorroConcepts = cashConcepts.filter((c) => c.category === 'ahorro')
  const transConcepts = cashConcepts.filter((c) => c.category === 'transferencia')
  const adicionConcepts = cashConcepts.filter((c) => c.category === 'adicion')

  const pushCash = (opts: { y: number; m: number; day: number; branch: string; category: string; amount: number; concept?: string; catRef?: string; note?: string }) => {
    const mm = String(opts.m).padStart(2, '0')
    const dd = String(opts.day).padStart(2, '0')
    const dayStr = `${opts.y}-${mm}-${dd}`
    cashMovements.push({
      id: nextId(),
      branch: opts.branch,
      category: opts.category,
      concept: opts.concept,
      categoryRef: opts.catRef,
      amount: opts.amount,
      date: dayStr,
      note: opts.note ?? 'Movimiento demo',
      createdAt: `${dayStr}T12:00:00.000Z`,
      user: 'u-ger',
      actor: 'Gerente Demo',
      locked: opts.category === 'transferencia',
    })
  }

  for (const y of [yearNow - 1, yearNow]) {
    for (let m = 1; m <= 12; m++) {
      if (y === yearNow && m > Number(today.slice(5, 7))) continue
      const dim = new Date(y, m, 0).getDate()
      for (let g = 0; g < 18 + (m % 5); g++) {
        const c = gastoConcepts[g % gastoConcepts.length]
        pushCash({
          y,
          m,
          day: 1 + (g % dim),
          branch: g % 2 ? branch1 : branch2,
          category: 'gasto',
          amount: 25000 + g * 7500 + (m * 1000),
          concept: c.id,
          catRef: c.categoryRef,
          note: c.name,
        })
      }
      for (let a = 0; a < 4 + (m % 3); a++) {
        const c = ahorroConcepts[a % Math.max(1, ahorroConcepts.length)] ?? gastoConcepts[0]
        pushCash({
          y,
          m,
          day: 5 + (a % 20),
          branch: branch1,
          category: 'ahorro',
          amount: 80000 + a * 25000,
          concept: c.id,
          note: 'Ahorro programado demo',
        })
      }
      for (let tr = 0; tr < 6 + (m % 4); tr++) {
        const c = transConcepts[tr % Math.max(1, transConcepts.length)] ?? gastoConcepts[0]
        pushCash({
          y,
          m,
          day: 3 + (tr % 22),
          branch: tr % 2 ? branch2 : branch1,
          category: 'transferencia',
          amount: 400000 + tr * 120000,
          concept: c.id,
          note: 'Transferencia demo',
        })
      }
      for (let ad = 0; ad < 2; ad++) {
        const c = adicionConcepts[ad % Math.max(1, adicionConcepts.length)] ?? gastoConcepts[0]
        pushCash({
          y,
          m,
          day: 1 + ad,
          branch: branch1,
          category: 'adicion',
          amount: 300000,
          concept: c.id,
          note: 'Base de caja',
        })
      }
    }
  }

  const td = Number(today.slice(8, 10))
  const tm = Number(today.slice(5, 7))
  const ty = Number(today.slice(0, 4))
  for (let g = 0; g < 12; g++) {
    const c = gastoConcepts[g % gastoConcepts.length]
    pushCash({ y: ty, m: tm, day: td, branch: g % 2 ? branch1 : branch2, category: 'gasto', amount: 35000 + g * 12000, concept: c.id, catRef: c.categoryRef, note: `Gasto jornada hoy — ${c.name}` })
  }
  for (let a = 0; a < 3; a++) {
    pushCash({ y: ty, m: tm, day: td, branch: branch1, category: 'ahorro', amount: 150000 + a * 50000, note: 'Ahorro caja hoy' })
  }
  for (let tr = 0; tr < 4; tr++) {
    pushCash({ y: ty, m: tm, day: td, branch: branch2, category: 'transferencia', amount: 600000 + tr * 200000, note: 'Transferencia banco hoy' })
  }
  pushCash({ y: ty, m: tm, day: td, branch: branch1, category: 'adicion', amount: 500000, note: 'Adición base mañana' })

  const siteEvents: any[] = []
  for (const y of [yearNow - 1, yearNow]) {
    for (let m = 1; m <= 12; m++) {
      if (y === yearNow && m > Number(today.slice(5, 7))) continue
      const mm = String(m).padStart(2, '0')
      for (let v = 0; v < 95 + m * 3; v++) {
        siteEvents.push({ id: nextId(), type: 'visit', day: `${y}-${mm}-${String(1 + (v % 27)).padStart(2, '0')}` })
      }
      for (let w = 0; w < 18 + (m % 7); w++) {
        siteEvents.push({ id: nextId(), type: 'whatsapp_promo', day: `${y}-${mm}-${String(2 + (w % 24)).padStart(2, '0')}`, promotion: 'promo-1' })
      }
      if (m % 3 === 0) siteEvents.push({ id: nextId(), type: 'whatsapp_cart', day: `${y}-${mm}-15` })
    }
  }

  const promotions = [
    {
      id: 'promo-1',
      title: 'Semana del color',
      kind: 'promocion',
      description: '15% en vinilos seleccionados.',
      hashtags: '#ColorCali #MundoPinturasDiana',
      imageUrl: IMG.store,
      startDate: `${yearNow}-01-01`,
      endDate: `${yearNow}-12-31`,
      active: true,
    },
    {
      id: 'promo-2',
      title: 'Sorteo pintor del mes',
      kind: 'sorteo',
      description: 'Participa con tu factura.',
      hashtags: '#PintorPro #Diana',
      imageUrl: IMG.mural,
      startDate: `${yearNow}-03-01`,
      endDate: `${yearNow}-09-30`,
      active: true,
    },
  ]

  const events = [
    {
      id: 'ev-1',
      title: 'Capacitación mezclas especiales',
      type: 'capacitacion',
      startDate: `${yearNow}-03-10`,
      endDate: `${yearNow}-03-10`,
      importance: 'clave',
      visible: true,
      active: true,
      description: 'Jornada con proveedor QUIMEX.',
      imageUrl: IMG.store,
    },
    {
      id: 'ev-2',
      title: 'Entrega pedido obra municipal',
      type: 'entrega',
      startDate: `${yearNow}-06-18`,
      endDate: `${yearNow}-06-19`,
      importance: 'normal',
      visible: true,
      active: true,
      description: 'Despacho grande sede sur.',
      imageUrl: IMG.paint3,
    },
    {
      id: 'ev-3',
      title: 'Promoción día de la madre',
      type: 'promocion',
      startDate: `${yearNow}-05-08`,
      endDate: `${yearNow}-05-12`,
      importance: 'clave',
      visible: true,
      active: true,
      description: 'Descuentos en esmaltes y vinilos.',
      imageUrl: IMG.paint2,
    },
  ]

  const domicilios = [
    { id: 'dom-1', branch: branch1, customerName: 'María Gómez', phone: '3001112233', address: 'Calle 5 # 12-34', courier: 'Pedro R.', courierFee: 8000, status: 'en_ruta', createdAt: `${today}T09:00:00.000Z` },
    { id: 'dom-2', branch: branch1, customerName: 'Juan Pérez', phone: '3001234567', address: 'Carrera 66 # 10-20', courier: 'Ana L.', courierFee: 9000, status: 'pendiente', createdAt: `${today}T11:30:00.000Z` },
    { id: 'dom-3', branch: branch2, customerName: 'Obra Torres', phone: '6024443322', address: 'Av. Roosevelt # 25-10', courier: 'Pedro R.', courierFee: 15000, status: 'entregado', createdAt: `${today}T08:15:00.000Z` },
  ]

  const couriers = [
    { id: 'cou-1', name: 'Pedro R.', phone: '3201112233', active: true },
    { id: 'cou-2', name: 'Ana L.', phone: '3204445566', active: true },
  ]

  const electronicInvoices = sales
    .filter((s) => s.electronicInvoice?.requested)
    .slice(0, 40)
    .map((s, i) => ({
      id: nextId(),
      sale: s.id,
      branch: s.branch,
      status: i % 5 === 0 ? 'pendiente' : i % 7 === 0 ? 'error' : 'generada',
      buyerName: s.electronicInvoice.buyerName,
      buyerDocument: s.electronicInvoice.buyerDocument,
      total: s.total,
      createdAt: s.createdAt,
      cufe: i % 5 === 0 ? undefined : `CUFE-DEMO-${s.number}-${i}`,
    }))

  const cashDeliveries = [
    { id: nextId(), day: today, branch: branch1, amount: 450000, note: 'Entrega efectivo a banco' },
    { id: nextId(), day: `${yearNow}-${String(tm).padStart(2, '0')}-01`, branch: branch2, amount: 380000, note: 'Entrega mensual' },
  ]

  const notifications = [
    { id: nextId(), title: 'Stock bajo: Vinilo azul océano', body: 'Sede Cali Centro por debajo del mínimo.', read: false, createdAt: `${today}T07:00:00.000Z`, user: 'u-admin' },
    { id: nextId(), title: 'Domicilio en ruta', body: 'María Gómez — Calle 5 # 12-34', read: false, createdAt: `${today}T09:05:00.000Z`, user: 'u-ger' },
    { id: nextId(), title: 'FE pendiente', body: '3 facturas electrónicas por generar.', read: false, createdAt: `${today}T10:00:00.000Z`, user: 'u-admin' },
    { id: nextId(), title: 'Cierre de ayer con diferencia', body: 'Revisar conteo Sede Sur.', read: true, createdAt: `${today}T06:00:00.000Z`, user: 'u-ger' },
    { id: nextId(), title: 'Promoción activa', body: 'Semana del color — compartir en WhatsApp.', read: false, createdAt: `${today}T08:00:00.000Z` },
    { id: nextId(), title: 'Producto agotado', body: 'Cinta enmascarar 48 mm en Sede Sur.', read: false, createdAt: `${today}T11:00:00.000Z`, user: 'u-emp' },
    { id: nextId(), title: 'Capacitación próxima', body: 'Recordatorio mezclas especiales.', read: true, createdAt: `${today}T07:30:00.000Z` },
  ]

  const auditLogs = [
    { id: nextId(), createdAt: `${today}T08:00:00.000Z`, actor: 'Admin Demo', entity: 'Productos', action: 'editar', summary: 'Actualizó precio Vinilo blanco' },
    { id: nextId(), createdAt: `${today}T09:30:00.000Z`, actor: 'Gerente Demo', entity: 'Caja', action: 'crear', summary: 'Registró gasto operativo' },
    { id: nextId(), createdAt: `${today}T10:15:00.000Z`, actor: 'Empleado Demo', entity: 'Ventas', action: 'crear', summary: 'Venta # registrada en POS' },
  ]

  return {
    users,
    branches,
    productTypes,
    productCategories,
    products,
    suppliers,
    cashCategories,
    cashConcepts,
    inventory,
    inventoryMovements,
    clients,
    sales,
    cashMovements,
    siteEvents,
    promotions,
    events,
    domicilios,
    couriers,
    electronicInvoices,
    cashDeliveries,
    notifications,
    auditLogs,
    today,
    yearNow,
  }
}
