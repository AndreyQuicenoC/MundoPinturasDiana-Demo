'use server'
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { mailProviderConfigured, sendRecoveryCode } from '@/lib/mailer'

export type RecoveryResult = { ok: boolean; message?: string; error?: string; devHint?: string }

const TTL_MIN = 15
const MAX_ATTEMPTS = 5
const GENERIC = 'Si el correo está registrado, te enviamos un código de 6 dígitos. Vence en 15 minutos.'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Límite en memoria: máx. 5 solicitudes por hora por correo y por IP; 60 s entre solicitudes del mismo correo.
const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= max) { hits.set(key, arr); return true }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  return false
}

async function clientIp() {
  const h = await headers()
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim()
}

const hashCode = (code: string, salt: string, userId: string | number) =>
  createHmac('sha256', process.env.PAYLOAD_SECRET ?? '').update(`${salt}:${userId}:${code}`).digest('hex')

export async function requestRecovery(rawEmail: string): Promise<RecoveryResult> {
  const email = String(rawEmail ?? '').trim().toLowerCase().slice(0, 200)
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Ingresa un correo válido.' }
  const ip = await clientIp()
  if (limited(`ip:${ip}`, 20, 3600_000) || limited(`em:${email}`, 5, 3600_000)) {
    return { ok: false, error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
  }
  const dev = process.env.NODE_ENV !== 'production'
  let devHint: string | undefined
  try {
    const payload = await getPayloadClient()
    const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
    const user = found.docs[0] as any
    if (user && user.status === 'activo') {
      await payload.update({
        collection: 'recovery-tokens', where: { and: [{ user: { equals: user.id } }, { used: { equals: false } }] },
        data: { used: true }, overrideAccess: true, context: { skipAudit: true },
      })
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
      const salt = randomBytes(16).toString('hex')
      await payload.create({
        collection: 'recovery-tokens',
        data: { user: user.id, tokenHash: `${salt}$${hashCode(code, salt, user.id)}`, expiresAt: new Date(Date.now() + TTL_MIN * 60_000).toISOString(), used: false, attempts: 0 },
        overrideAccess: true, context: { skipAudit: true },
      })
      const res = await sendRecoveryCode(email, user.name || 'equipo', code, TTL_MIN)
      if (!res.sent) {
        if (dev && !mailProviderConfigured()) {
          console.info(`[recuperación] código generado para ${email}: ${code}`)
          devHint = code
        } else console.info(`[recuperación] código generado para ${email}`)
      }
    }
  } catch (e) {
    console.error('[recuperación] error al generar el código', e instanceof Error ? e.message : 'desconocido')
  }
  return { ok: true, message: GENERIC, devHint }
}

export async function resetPassword(input: { email: string; code: string; password: string; confirm: string }): Promise<RecoveryResult> {
  const email = String(input.email ?? '').trim().toLowerCase().slice(0, 200)
  const code = String(input.code ?? '').trim()
  const password = String(input.password ?? '')
  const bad = 'El código es incorrecto o ya venció. Solicita uno nuevo.'
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Ingresa un correo válido.' }
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'El código debe tener 6 dígitos.' }
  if (password.length < 8) return { ok: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { ok: false, error: 'La contraseña debe combinar letras y números.' }
  if (password !== input.confirm) return { ok: false, error: 'Las contraseñas no coinciden.' }
  if (limited(`rs:${await clientIp()}`, 30, 3600_000)) return { ok: false, error: 'Demasiados intentos. Intenta más tarde.' }

  try {
    const payload = await getPayloadClient()
    const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
    const user = found.docs[0] as any
    if (!user || user.status !== 'activo') return { ok: false, error: bad }
    const tk = await payload.find({
      collection: 'recovery-tokens', where: { and: [{ user: { equals: user.id } }, { used: { equals: false } }] },
      sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true,
    })
    const token = tk.docs[0] as any
    if (!token || new Date(token.expiresAt).getTime() < Date.now() || (token.attempts ?? 0) >= MAX_ATTEMPTS) return { ok: false, error: bad }
    const attempts = (token.attempts ?? 0) + 1
    const [salt, stored] = String(token.tokenHash).split('$')
    const a = Buffer.from(hashCode(code, salt ?? '', user.id)), b = Buffer.from(stored ?? '')
    const match = a.length === b.length && timingSafeEqual(a, b)
    if (!match) {
      await payload.update({ collection: 'recovery-tokens', id: token.id, data: { attempts, used: attempts >= MAX_ATTEMPTS }, overrideAccess: true, context: { skipAudit: true } })
      return { ok: false, error: attempts >= MAX_ATTEMPTS ? 'Demasiados intentos. Solicita un código nuevo.' : bad }
    }
    await payload.update({ collection: 'recovery-tokens', id: token.id, data: { used: true, attempts }, overrideAccess: true, context: { skipAudit: true } })
    await payload.update({ collection: 'users', id: user.id, data: { password, mustChangePassword: false }, overrideAccess: true, context: { skipAudit: true } })
    try { await payload.unlock({ collection: 'users', data: { email } as any, overrideAccess: true }) } catch {}
    await payload.create({
      collection: 'audit-logs',
      data: { actor: email, entity: 'Usuarios', action: 'editar', docId: String(user.id), summary: 'Recuperación de contraseña' },
      overrideAccess: true,
    })
    return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
  } catch (e) {
    console.error('[recuperación] error al restablecer', e instanceof Error ? e.message : 'desconocido')
    return { ok: false, error: 'No se pudo restablecer la contraseña. Intenta de nuevo.' }
  }
}
