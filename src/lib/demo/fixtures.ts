/** Datos mock iniciales para la demo (sin base de datos externa). */

import { buildDemoData } from './build-fixtures'

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

export function createInitialDemoStore(): DemoStore {
  const data = buildDemoData()

  return {
    globals: {
      'site-settings': {
        whatsapp: '573122486627',
        address: 'Calle 10 #10-15, Cali',
        email: 'contacto@mundopinturasdiana.test',
      },
    },
    collections: {
      users: data.users,
      branches: data.branches,
      'product-types': data.productTypes,
      'product-categories': data.productCategories,
      products: data.products,
      suppliers: data.suppliers,
      'cash-categories': data.cashCategories,
      'cash-concepts': data.cashConcepts,
      inventory: data.inventory,
      'inventory-movements': data.inventoryMovements,
      clients: data.clients,
      sales: data.sales,
      'cash-movements': data.cashMovements,
      'site-events': data.siteEvents,
      promotions: data.promotions,
      events: data.events,
      domicilios: data.domicilios,
      couriers: data.couriers,
      'electronic-invoices': data.electronicInvoices,
      'cash-deliveries': data.cashDeliveries,
      notifications: data.notifications,
      'audit-logs': data.auditLogs,
      'role-permissions': [],
      'user-permissions': [],
      'bank-accounts': [
        { id: 'ba-1', name: 'Bancolombia Ahorros', active: true },
        { id: 'ba-2', name: 'Davivienda Corriente', active: true },
      ],
      'cash-closings': [],
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
