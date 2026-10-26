import 'server-only'
import { cookies } from 'next/headers'
import { demoUserPublic, findDemoUser, signDemoSessionToken } from './demo/demo-auth'
import { isDemoMock } from './demo/env'
import { getPayloadClient } from './payload'
import type { User } from '@/payload-types'

export const SESSION_COOKIE = 'app-session'
const MAX_AGE = 60 * 60 * 10

export function createAppAuth(collection: 'users') {
  return {
    async currentUser(): Promise<User | null> {
      const token = (await cookies()).get(SESSION_COOKIE)?.value
      if (!token) return null
      const payload = await getPayloadClient()
      const { user } = await payload.auth({ headers: new Headers({ Authorization: `Bearer ${token}` }) })
      if (!user || user.collection !== collection) return null
      if ((user as User).status !== 'activo') return null
      return user as unknown as User
    },
    async login(email: string, password: string) {
      let token: string
      let user: User

      if (isDemoMock()) {
        const row = findDemoUser(email, password)
        if (!row) throw new Error('invalid-credentials')
        token = await signDemoSessionToken(row)
        user = demoUserPublic(row) as unknown as User
      } else {
        const payload = await getPayloadClient()
        const res = await payload.login({ collection, data: { email, password } })
        if (!res.token) throw new Error('no-token')
        token = res.token
        user = res.user as unknown as User
      }

      ;(await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
      })
      return user
    },
    async logout() {
      ;(await cookies()).delete(SESSION_COOKIE)
    },
  }
}

export const appAuth = createAppAuth('users')
