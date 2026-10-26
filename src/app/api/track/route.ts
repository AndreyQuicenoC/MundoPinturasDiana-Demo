import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { bogotaDay } from '@/lib/schedule'

const TYPES = ['visit', 'whatsapp_cart', 'whatsapp_promo'] as const
type EventType = (typeof TYPES)[number]

const hits = new Map<string, number[]>()
const LIMIT = 40
const WINDOW = 60_000

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW)
  if (recent.length >= LIMIT) return NextResponse.json({ ok: false }, { status: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k)

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const type = body?.type as EventType
  if (!TYPES.includes(type)) return NextResponse.json({ ok: false }, { status: 400 })

  let path: string | undefined
  if (typeof body.path === 'string' && body.path.startsWith('/') && !body.path.startsWith('//')) path = body.path.split(/[?#]/)[0].slice(0, 200)

  let promotion: string | undefined
  if (type === 'whatsapp_promo') {
    if (typeof body.promotion !== 'string' && typeof body.promotion !== 'number') return NextResponse.json({ ok: false }, { status: 400 })
    promotion = String(body.promotion).slice(0, 64)
    if (!/^[\w-]+$/.test(promotion)) return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'site-events',
      overrideAccess: true,
      data: { type, path, day: bogotaDay(), ...(promotion ? { promotion } : {}) },
    })
  } catch {
    // Un fallo de métricas nunca debe afectar al visitante.
    return NextResponse.json({ ok: false }, { status: 202 })
  }
  return NextResponse.json({ ok: true })
}
