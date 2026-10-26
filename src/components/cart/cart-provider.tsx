'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CartLine = { key: string; id: string | number; slug: string; name: string; sku: string; price: number; image?: string | null; color?: string | null; size?: string | null; quantity: number }
export const lineKey = (id: string | number, color?: string | null, size?: string | null) => `${id}|${color ?? ''}|${size ?? ''}`
type Ctx = {
  lines: CartLine[]
  count: number
  subtotal: number
  ready: boolean
  add: (l: Omit<CartLine, 'quantity' | 'key'>, q?: number) => void
  setQty: (key: string, q: number) => void
  remove: (key: string) => void
  replace: (l: CartLine[]) => void
  clear: () => void
}

const KEY = 'mpd-cart-v1'
const CartCtx = createContext<Ctx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
      if (Array.isArray(raw)) setLines(raw.filter((l) => l && l.id != null && l.quantity > 0).map((l) => ({ ...l, key: l.key ?? lineKey(l.id, l.color, l.size) })))
    } catch {}
    setReady(true)
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) try { setLines(JSON.parse(e.newValue || '[]')) } catch {}
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines))
  }, [lines, ready])

  const add = useCallback((l: Omit<CartLine, 'quantity' | 'key'>, q = 1) => {
    setLines((s) => {
      const key = lineKey(l.id, l.color, l.size)
      const i = s.findIndex((x) => x.key === key)
      if (i >= 0) return s.map((x, j) => (j === i ? { ...x, quantity: Math.min(999, x.quantity + q) } : x))
      return [...s, { ...l, key, quantity: q }]
    })
  }, [])
  const setQty = useCallback((key: string, q: number) => setLines((s) => s.map((x) => (x.key === key ? { ...x, quantity: Math.max(1, Math.min(999, Math.floor(q) || 1)) } : x))), [])
  const remove = useCallback((key: string) => setLines((s) => s.filter((x) => x.key !== key)), [])
  const replace = useCallback((l: CartLine[]) => setLines(l), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: lines.reduce((a, l) => a + l.quantity * l.price, 0),
      add,
      setQty,
      remove,
      replace,
      clear,
    }),
    [lines, ready, add, setQty, remove, replace, clear],
  )
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const useCart = () => {
  const c = useContext(CartCtx)
  if (!c) throw new Error('useCart fuera de CartProvider')
  return c
}
