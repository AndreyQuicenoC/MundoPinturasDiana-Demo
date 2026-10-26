'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type T = { id: number; kind: 'ok' | 'error' | 'info'; text: string }
const EVT = 'mpd:toast'

export const toast = (text: string, kind: T['kind'] = 'ok') => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT, { detail: { text, kind } }))
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    const on = (e: Event) => {
      const { text, kind } = (e as CustomEvent).detail
      const id = Date.now() + Math.random()
      setItems((s) => [...s.slice(-3), { id, kind, text }])
      setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 5000)
    }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  const Icon = { ok: CheckCircle2, error: AlertTriangle, info: Info }
  const tone = { ok: 'border-cyan text-cyan-dark', error: 'border-brand text-brand-dark', info: 'border-plum text-plum' }
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {items.map((t) => {
        const I = Icon[t.kind]
        return (
          <div key={t.id} className={`pointer-events-auto flex max-w-sm animate-pop items-start gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-sm font-medium shadow-[6px_6px_0_0_rgba(74,21,75,.14)] ${tone[t.kind]}`}>
            <I className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span className="text-ink">{t.text}</span>
            <button aria-label="Cerrar aviso" onClick={() => setItems((s) => s.filter((i) => i.id !== t.id))} className="ml-1 text-ink/50 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
