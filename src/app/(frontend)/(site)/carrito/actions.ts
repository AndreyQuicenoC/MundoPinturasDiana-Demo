'use server'
import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { getBranches, getProducts, getSiteSettings } from '@/lib/data'
import { bogotaDay } from '@/lib/schedule'

type In = { id: string | number; quantity: number; color?: string | null; size?: string | null }

export type CheckedLine = { id: string | number; price: number; available: boolean; exists: boolean; name: string }

export async function checkCart(items: In[]): Promise<CheckedLine[]> {
  const all = await getProducts()
  return items.slice(0, 60).map((i) => {
    const p = all.find((x) => String(x.id) === String(i.id))
    return p ? { id: i.id, price: p.salePrice, available: p.inStock, exists: true, name: p.name } : { id: i.id, price: 0, available: false, exists: false, name: '' }
  })
}

const hits = new Map<string, number[]>()

export async function submitOrder(input: { name: string; phone: string; branchId: string | number; items: In[] }) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  if (recent.length >= 8) return { ok: false as const, error: 'Has enviado varios pedidos seguidos. Intenta de nuevo en unos minutos.' }
  hits.set(ip, [...recent, now])

  const name = String(input.name ?? '').trim()
  const phone = String(input.phone ?? '').trim()
  if (name.length < 2 || name.length > 80) return { ok: false as const, error: 'Escribe tu nombre.' }
  if (!/^[0-9+\s()-]{7,20}$/.test(phone)) return { ok: false as const, error: 'Escribe un teléfono válido.' }
  const branches = await getBranches()
  const branch = branches.find((b) => String(b.id) === String(input.branchId))
  if (!branch) return { ok: false as const, error: 'Selecciona una sede.' }
  if (!input.items?.length) return { ok: false as const, error: 'Tu carrito está vacío.' }

  const all = await getProducts()
  const lines: string[] = []
  let total = 0
  for (const i of input.items.slice(0, 60)) {
    const p = all.find((x) => String(x.id) === String(i.id))
    const q = Math.floor(Number(i.quantity))
    if (!p || !(q > 0 && q <= 999)) return { ok: false as const, error: 'Hay un producto no disponible en tu carrito.' }
    const color = p.colors.find((c) => c.name === i.color)?.name
    const size = p.sizes.find((z) => z === i.size)
    total += p.salePrice * q
    const opts = [color && `Color: ${color}`, size && `Tamaño: ${size}`].filter(Boolean).join(' · ')
    lines.push(`• ${q} × ${p.name}${opts ? ` [${opts}]` : ''} (Ref. ${p.sku}) — $${(p.salePrice * q).toLocaleString('es-CO')}`)
  }
  let msg = `Hola Mundo Pinturas Diana, quiero hacer este pedido:\n${lines.join('\n')}\n\nTotal estimado: $${total.toLocaleString('es-CO')}\nSede: ${branch.name}\nNombre: ${name}\nTeléfono: ${phone}\n\nPrecios sujetos a confirmación y disponibilidad.`
  if (encodeURIComponent(msg).length > 1800) {
    msg = `Hola Mundo Pinturas Diana, quiero hacer un pedido de ${lines.length} productos, total estimado $${total.toLocaleString('es-CO')}. Soy ${name}, tel. ${phone}. Precios sujetos a confirmación y disponibilidad.`
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({ collection: 'site-events', overrideAccess: true, data: { type: 'whatsapp_cart', path: '/carrito', day: bogotaDay() } })
  } catch {}
  return { ok: true as const, url: `https://wa.me/${(await getSiteSettings()).whatsapp}?text=${encodeURIComponent(msg)}`, id: 0 }
}
