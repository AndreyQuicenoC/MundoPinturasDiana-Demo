/** Datos mock iniciales para la demo (sin base de datos externa). */

export type DemoUser = {
  id: string
  collection: 'users'
  email: string
  password: string
  name: string
  role: 'admin' | 'gerente' | 'empleado'
  status: 'activo'
  branch?: string
  document?: string
  phone?: string
}

export type DemoStore = {
  globals: { 'site-settings': Record<string, unknown> }
  collections: Record<string, any[]>
  sessions: Map<string, string>
}

let seq = 1000
const id = () => String(++seq)

export function createInitialDemoStore(): DemoStore {
  seq = 1000
  const branch1 = 'br-1'
  const branch2 = 'br-2'
  const typeNormal = 'pt-normal'
  const typeArt = 'pt-art'
  const catVin = 'cat-vin'
  const catEsm = 'cat-esm'
  const catHer = 'cat-her'
  const sup1 = 'sup-1'

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
    { id: catEsm, name: 'Esmaltes', slug: 'esmaltes', active: true, showInHome: false },
    { id: catHer, name: 'Herramientas', slug: 'herramientas', active: true, showInHome: false },
  ]

  const products = [
    { id: 'p1', name: 'Vinilo blanco premium 1 gal', sku: 'VIN-BLAN-1GL', barcode: '7701234567890', slug: 'vin-blanco-1gl', productCategory: catVin, saleType: typeNormal, origin: 'comprado', salePrice: 89000, costPrice: 62000, minimumStock: 5, visible: true, featured: true, status: 'activo', imageUrl: '/brand/banner.jpg', unit: 'galon' },
    { id: 'p2', name: 'Vinilo azul océano 1/4 gal', sku: 'VIN-AZUL-CUA', barcode: '7701234567891', slug: 'vin-azul-cua', productCategory: catVin, saleType: typeNormal, origin: 'comprado', salePrice: 28000, costPrice: 18000, minimumStock: 8, visible: true, status: 'activo', imageUrl: '/brand/banner.jpg', unit: 'cuarto' },
    { id: 'p3', name: 'Esmalte rojo bermellón 1/4', sku: 'ESM-ROJ-CUA', barcode: '7701234567892', slug: 'esm-roj-cua', productCategory: catEsm, saleType: typeNormal, origin: 'comprado', salePrice: 22000, costPrice: 14000, minimumStock: 6, visible: true, status: 'activo', imageUrl: '/brand/banner.jpg', unit: 'cuarto' },
    { id: 'p4', name: 'Brocha 4 pulgadas', sku: 'BRO-4P', barcode: '7701234567894', slug: 'bro-4p', productCategory: catHer, saleType: typeNormal, origin: 'comprado', salePrice: 12000, costPrice: 7000, minimumStock: 10, visible: true, status: 'activo', imageUrl: '/brand/logo.png', unit: 'unidad' },
    { id: 'p5', name: 'Kit mural artístico', sku: 'ART-MURAL-KIT', barcode: '7701234567897', slug: 'art-mural-kit', productCategory: catVin, saleType: typeArt, origin: 'fabricado', salePrice: 150000, costPrice: 90000, minimumStock: 2, visible: true, status: 'activo', imageUrl: '/brand/banner.jpg', unit: 'unidad' },
  ]

  const suppliers = [{ id: sup1, name: 'Distribuidora Color SAS', nit: '900123456', active: true }]
  const cashCategories = [
    { id: 'cc-op', name: 'Operación', type: 'gasto', active: true },
    { id: 'cc-nom', name: 'Nómina', type: 'gasto', active: true },
    { id: 'cc-srv', name: 'Servicios', type: 'gasto', active: true },
  ]
  const cashConcepts = [
    { id: 'cx-1', name: 'Pago servicios públicos', categoryRef: 'cc-srv', category: 'gasto', active: true, suggestedAmount: 120000 },
    { id: 'cx-2', name: 'Nómina quincenal', categoryRef: 'cc-nom', category: 'gasto', active: true },
  ]

  const inventory: any[] = []
  const inventoryMovements: any[] = []
  for (const p of products) {
    for (const b of [branch1, branch2]) {
      const q = 15 + (p.sku.length % 12)
      inventory.push({ id: id(), product: p.id, branch: b, quantity: q })
      inventoryMovements.push({
        id: id(), product: p.id, branch: b, type: 'entrada_compra', quantity: q, unitCost: p.costPrice, supplier: sup1,
        reference: 'Seed demo', createdAt: `${new Date().getFullYear()}-01-05T15:00:00.000Z`, balanceAfter: q, actor: 'Sistema',
      })
    }
  }

  const clients = [
    { id: 'cl-1', name: 'Juan Pérez', document: '1234567890', phone: '3001234567', clientType: 'natural', habeasData: true, active: true },
    { id: 'cl-2', name: 'Constructora Andina', document: '900555444', phone: '6025551234', clientType: 'empresa', habeasData: true, active: true },
  ]

  const year = new Date().getFullYear()
  const sales: any[] = []
  let saleNum = 1
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    const count = 22 + (m % 5)
    for (let i = 0; i < count; i++) {
      const day = String(1 + (i % 27)).padStart(2, '0')
      const p = products[i % products.length]
      const qty = 1 + (i % 4)
      const artistic = p.saleType === typeArt
      const lineTotal = p.salePrice * qty
      const artisticTotal = artistic ? lineTotal : 0
      const total = lineTotal
      sales.push({
        id: id(),
        number: saleNum++,
        branch: i % 2 ? branch1 : branch2,
        seller: i % 3 ? 'u-emp' : 'u-ger',
        status: 'completada',
        createdAt: `${year}-${mm}-${day}T${String(9 + (i % 8)).padStart(2, '0')}:30:00.000Z`,
        lines: [{ product: p.id, name: p.name, quantity: qty, unitPrice: p.salePrice, discountPct: 0, lineTotal, affectsSales: !artistic }],
        subtotal: lineTotal,
        discountTotal: 0,
        total,
        artisticTotal,
        reportableTotal: total - artisticTotal,
        payments: [{ method: ['efectivo', 'transferencia', 'tarjeta'][i % 3], amount: total }],
        returns: m === 6 && i === 0 ? [{ product: p.id, quantity: 1 }] : [],
      })
    }
  }

  const cashMovements: any[] = []
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    for (let g = 0; g < 12; g++) {
      cashMovements.push({
        id: id(),
        branch: g % 2 ? branch1 : branch2,
        category: 'gasto',
        categoryRef: cashCategories[g % 3].id,
        amount: 25000 + g * 8000,
        date: `${year}-${mm}-${String(1 + g).padStart(2, '0')}`,
        note: 'Gasto operativo demo',
        createdAt: `${year}-${mm}-${String(1 + g).padStart(2, '0')}T12:00:00.000Z`,
      })
    }
  }

  const siteEvents: any[] = []
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    for (let v = 0; v < 80; v++) {
      siteEvents.push({ id: id(), type: 'visit', day: `${year}-${mm}-${String(1 + (v % 25)).padStart(2, '0')}` })
    }
    for (let w = 0; w < 15; w++) {
      siteEvents.push({ id: id(), type: 'whatsapp_promo', day: `${year}-${mm}-10`, promotion: 'promo-1' })
    }
  }
  siteEvents.push({ id: id(), type: 'whatsapp_cart', day: `${year}-06-15` })

  const promotions = [{
    id: 'promo-1', title: 'Semana del color', kind: 'promocion', description: '15% en vinilos seleccionados.', hashtags: '#ColorCali #MundoPinturasDiana',
    imageUrl: '/brand/banner.jpg', startDate: `${year}-01-01`, endDate: `${year}-12-31`, active: true,
  }]

  const events = [{
    id: 'ev-1', title: 'Capacitación mezclas especiales', type: 'capacitacion', startDate: `${year}-03-10`, endDate: `${year}-03-10`,
    importance: 'clave', visible: true, active: true, description: 'Jornada con proveedor.', imageUrl: '/brand/banner.jpg',
  }]

  const domicilios = [
    { id: 'dom-1', branch: branch1, customerName: 'María Gómez', phone: '3001112233', address: 'Calle 5 # 12-34', courier: 'Pedro R.', courierFee: 8000, status: 'en_ruta', createdAt: `${year}-10-20T14:00:00.000Z` },
  ]

  const auditLogs = [
    { id: id(), createdAt: `${year}-10-01T10:00:00.000Z`, actor: 'Admin Demo', entity: 'Productos', action: 'editar', summary: 'Actualizó precio Vinilo blanco' },
  ]

  return {
    globals: {
      'site-settings': { whatsapp: '573122486627', address: 'Calle 10 #10-15, Cali' },
    },
    collections: {
      users,
      branches,
      'product-types': productTypes,
      'product-categories': productCategories,
      products,
      suppliers,
      'cash-categories': cashCategories,
      'cash-concepts': cashConcepts,
      inventory,
      'inventory-movements': inventoryMovements,
      clients,
      sales,
      'cash-movements': cashMovements,
      'site-events': siteEvents,
      promotions,
      events,
      domicilios,
      'audit-logs': auditLogs,
      'role-permissions': [],
      'user-permissions': [],
      couriers: [],
      'bank-accounts': [{ id: 'ba-1', name: 'Bancolombia Ahorros', active: true }],
      'cash-deliveries': [],
      'cash-closings': [],
      'electronic-invoices': [],
      notifications: [],
      media: [],
      folders: [],
      tags: [],
      admins: [],
      'recovery-tokens': [],
      'price-history': [],
    },
    sessions: new Map<string, string>(),
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __demoStore: DemoStore | undefined
}

export function getDemoStore(): DemoStore {
  if (!globalThis.__demoStore) globalThis.__demoStore = createInitialDemoStore()
  return globalThis.__demoStore
}

export function resetDemoStore() {
  globalThis.__demoStore = createInitialDemoStore()
}
