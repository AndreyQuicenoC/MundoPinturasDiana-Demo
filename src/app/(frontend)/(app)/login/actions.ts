'use server'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'

const isRedirectError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && 'digest' in e && String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')

export type LoginState = { error?: string }

const safeNext = (n: unknown, role: string) => {
  const s = typeof n === 'string' ? n : ''
  return s.startsWith('/panel/') && !s.startsWith('//') && s.startsWith(`/panel/${role}`) ? s : `/panel/${role}`
}

export async function loginAction(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa tu correo y tu contraseña.' }
  let role: string
  try {
    const user = await appAuth.login(email, password)
    if (user.status !== 'activo') {
      await appAuth.logout()
      return { error: 'Correo o contraseña incorrectos.' }
    }
    role = user.role
  } catch (e) {
    if (isRedirectError(e)) throw e
    return { error: 'Correo o contraseña incorrectos.' }
  }
  redirect(safeNext(fd.get('next'), role))
}

export async function logoutAction() {
  await appAuth.logout()
  redirect('/login')
}
