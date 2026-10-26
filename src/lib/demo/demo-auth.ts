import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { getDemoStore, type DemoUser } from './fixtures'

export function demoJwtSecret() {
  return new TextEncoder().encode(process.env.PAYLOAD_SECRET || 'demo-mock-secret-minimum-32-characters!!')
}

export function normalizeDemoEmail(email: string) {
  return email.trim().toLowerCase()
}

export function findDemoUser(email: string, password: string): DemoUser | null {
  const e = normalizeDemoEmail(email)
  const users = getDemoStore().collections.users ?? []
  const u = users.find((x) => normalizeDemoEmail(x.email) === e && x.password === password)
  return u ?? null
}

export async function signDemoSessionToken(user: DemoUser) {
  return new SignJWT({ collection: 'users', role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setExpirationTime('10h')
    .sign(demoJwtSecret())
}

export async function verifyDemoSessionToken(token: string) {
  const { payload } = await jwtVerify(token, demoJwtSecret())
  const uid = payload.sub as string
  const user = getDemoStore().collections.users?.find((u) => u.id === uid)
  if (!user) return null
  const { password: _, ...safe } = user
  return { ...safe, collection: 'users' as const }
}

export function demoUserPublic(user: DemoUser) {
  const { password: _, ...safe } = user
  return { ...safe, collection: 'users' as const }
}
