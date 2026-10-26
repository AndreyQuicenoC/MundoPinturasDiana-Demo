import type { PanelCtx } from '@/lib/panel-ctx'
import { findAll, options } from '@/lib/panel-data'
import { PosModule } from '@/components/panel/pos-module'
import { Head, Wrap } from '@/components/panel/page-head'

export default async function Module(ctx: PanelCtx) {
  const { user, overrideAccess: oa } = ctx
  const [prods, inv, clients, banks] = await Promise.all([
    findAll(user, 'products', { depth: 1, where: { and: [{ status: { equals: 'activo' } }, { visible: { not_equals: false } }] }, sort: 'name', overrideAccess: oa }),
    findAll(user, 'inventory', { depth: 0, overrideAccess: oa }),
    findAll(user, 'clients', { depth: 0, sort: 'name', overrideAccess: oa }),
    options(user, 'bank-accounts', { active: { equals: true } }, oa),
  ])
  const stock: Record<string, Record<string, number>> = {}
  for (const i of inv) (stock[i.product] ??= {})[i.branch] = i.quantity
  return (
    <Wrap head={<Head title="Punto de venta" blurb="El servidor recalcula precios y totales; el stock baja al registrar. Domicilio y factura electrónica se gestionan después en sus páginas." />}>
      <PosModule
        products={prods.map((p) => ({
          id: p.id, name: p.name, sku: p.sku ?? '', salePrice: p.salePrice, stock: stock[p.id] ?? {},
          colors: (p.colors ?? []).map((c: any) => c.name).filter(Boolean), sizes: (p.sizes ?? []).map((s: any) => s.label).filter(Boolean),
          artistic: typeof p.saleType === 'object' && p.saleType ? p.saleType.affectsDailySales === false : false,
        }))}
        branches={ctx.branches}
        clients={clients.map((c) => ({ id: c.id, label: c.name + (c.document ? ` · ${c.document}` : ''), name: c.name ?? '', document: c.document ?? '', email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' }))}
        banks={banks} defaultBranch={ctx.branch} role={ctx.role}
      />
    </Wrap>
  )
}
