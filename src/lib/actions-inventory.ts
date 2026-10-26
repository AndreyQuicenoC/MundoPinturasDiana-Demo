'use server'
import { run, type Res } from './action-kit'

const qty = (n: unknown) => {
  const v = Number(n)
  if (!Number.isInteger(v) || v <= 0) throw new Error('La cantidad debe ser un entero mayor a 0.')
  return v
}

/** Entrada de inventario (compra o producción): proveedor obligatorio si el producto es comprado. */
export async function registerEntry(v: { product: string; branch: string; quantity: number; supplier?: string; unitCost?: number | string; reference?: string; notes?: string }): Promise<Res> {
  return run('inventario', async ({ payload, acc }) => {
    if (!v.product) throw new Error('Elige el producto.')
    if (!v.branch) throw new Error('Elige la sede.')
    const q = qty(v.quantity)
    const p = await payload.findByID({ collection: 'products', id: v.product, depth: 0, overrideAccess: true })
    if (p.origin !== 'fabricado' && !v.supplier) throw new Error('Los productos comprados requieren proveedor.')
    const cost = v.unitCost === '' || v.unitCost == null ? undefined : Number(v.unitCost)
    if (cost != null && !(cost >= 0)) throw new Error('El costo unitario no puede ser negativo.')
    await payload.create({
      collection: 'inventory-movements', ...acc, depth: 0,
      data: { product: v.product, branch: v.branch, type: 'entrada_compra', quantity: q, supplier: v.supplier || undefined, unitCost: cost, reference: v.reference?.trim() || undefined, reason: v.notes?.trim() || undefined } as any,
    })
    return { ok: true, message: `Entrada registrada: +${q} de ${p.name}.` }
  })
}

/** Ajustes (positivo/negativo) y mermas/daños: motivo obligatorio. */
export async function registerAdjustment(v: { product: string; branch: string; type: string; quantity: number; reason: string; reference?: string }): Promise<Res> {
  return run('inventario', async ({ payload, acc }) => {
    if (!['ajuste_positivo', 'ajuste_negativo', 'merma'].includes(v.type)) throw new Error('Tipo de movimiento inválido.')
    if (!v.product || !v.branch) throw new Error('Elige producto y sede.')
    if (!v.reason?.trim()) throw new Error('El motivo es obligatorio.')
    const q = qty(v.quantity)
    await payload.create({
      collection: 'inventory-movements', ...acc, depth: 0,
      data: { product: v.product, branch: v.branch, type: v.type, quantity: q, reason: v.reason.trim(), reference: v.reference?.trim() || undefined } as any,
    })
    return { ok: true, message: 'Movimiento registrado.' }
  })
}

/** Traslado entre sedes: salida + entrada; si la segunda falla se revierte la primera. */
export async function transferStock(v: { product: string; from: string; to: string; quantity: number; reason?: string }): Promise<Res> {
  return run('inventario', async ({ payload, acc }) => {
    if (!v.product) throw new Error('Elige el producto.')
    if (!v.from || !v.to || v.from === v.to) throw new Error('Elige sedes de origen y destino distintas.')
    const q = qty(v.quantity)
    const ref = `Traslado ${new Date().toISOString().slice(0, 10)}`
    const mk = (branch: string, type: string) => payload.create({ collection: 'inventory-movements', ...acc, depth: 0, data: { product: v.product, branch, type, quantity: q, reference: ref, reason: v.reason?.trim() || undefined } as any })
    await mk(v.from, 'traslado_salida')
    try {
      await mk(v.to, 'traslado_entrada')
    } catch (e) {
      await payload.create({ collection: 'inventory-movements', ...acc, depth: 0, data: { product: v.product, branch: v.from, type: 'ajuste_positivo', quantity: q, reference: ref, reason: 'Reversión de traslado fallido' } as any })
      throw e
    }
    return { ok: true, message: 'Traslado realizado.' }
  })
}

type EntryLine = { product: string; quantity: number; unitCost?: number }

async function createEntry(payload: any, acc: any, line: EntryLine & { branch: string; supplier?: string; reference?: string; notes?: string }) {
  const q = qty(line.quantity)
  const cost = line.unitCost == null ? undefined : Number(line.unitCost)
  if (cost != null && !(cost >= 0)) throw new Error('El costo unitario no puede ser negativo.')
  await payload.create({
    collection: 'inventory-movements', ...acc, depth: 0,
    data: {
      product: line.product, branch: line.branch, type: 'entrada_compra', quantity: q,
      supplier: line.supplier || undefined, unitCost: cost,
      reference: line.reference?.trim() || undefined, reason: line.notes?.trim() || undefined,
    } as any,
  })
}

/** Varias entradas de compra con la misma sede, proveedor y documento (carga rápida o escaneo). */
export async function registerBulkEntries(v: {
  branch: string
  supplier?: string
  reference?: string
  notes?: string
  lines: EntryLine[]
}): Promise<Res> {
  return run('inventario', async ({ payload, acc }) => {
    if (!v.branch) throw new Error('Elige la sede.')
    if (!v.lines?.length) throw new Error('Agrega al menos un producto.')
    const uniq = new Map<string, EntryLine>()
    for (const l of v.lines) {
      if (!l.product) throw new Error('Hay líneas sin producto.')
      const prev = uniq.get(l.product)
      if (prev) uniq.set(l.product, { ...prev, quantity: prev.quantity + l.quantity, unitCost: l.unitCost ?? prev.unitCost })
      else uniq.set(l.product, { ...l })
    }
    let n = 0
    for (const line of uniq.values()) {
      const p = await payload.findByID({ collection: 'products', id: line.product, depth: 0, overrideAccess: true })
      if (p.origin !== 'fabricado' && !v.supplier) throw new Error(`«${p.name}» es comprado: el proveedor es obligatorio.`)
      await createEntry(payload, acc, { ...line, branch: v.branch, supplier: v.supplier, reference: v.reference, notes: v.notes })
      n += 1
    }
    return { ok: true, message: `${n} entrada${n > 1 ? 's' : ''} registrada${n > 1 ? 's' : ''} en el kardex.` }
  })
}
