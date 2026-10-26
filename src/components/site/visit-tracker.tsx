'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Registra una visita por ruta y por sesión del navegador. No renderiza nada. */
export function VisitTracker() {
  const path = usePathname()
  useEffect(() => {
    if (!path) return
    const key = `mpd-visit:${path}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'visit', path }),
      keepalive: true,
    }).catch(() => {})
  }, [path])
  return null
}
