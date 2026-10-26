import { NextResponse, type NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('app-session')?.value
  let role: string | null = null
  if (token) {
    try {
      const p = decodeJwt(token) as { role?: string; exp?: number }
      if (!p.exp || p.exp * 1000 > Date.now()) role = p.role ?? null
    } catch {}
  }
  if (pathname.startsWith('/panel')) {
    if (!role) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    const seg = pathname.split('/')[2]
    if (seg && ['admin', 'gerente', 'empleado'].includes(seg) && seg !== role) {
      return NextResponse.redirect(new URL(`/panel/${role}`, req.url))
    }
  }
  if (pathname === '/login' && role) return NextResponse.redirect(new URL(`/panel/${role}`, req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/panel/:path*', '/login'] }
