'use client'
import { useEffect, useState } from 'react'
import { todayStatus, type TodayStatus as Status } from '@/lib/schedule'

/** Estado calculado en el navegador (la página es estática). */
export function TodayStatus() {
  const [s, setS] = useState<Status | null>(null)
  useEffect(() => {
    const tick = () => setS(todayStatus())
    tick()
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])
  if (!s) return <span className="inline-block h-7 w-36 rounded-full bg-plum/10" aria-hidden />
  return (
    <span role="status" className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider ${s.open ? 'bg-[#1FA855]/15 text-[#0f6b34]' : 'bg-brand/10 text-brand-dark'}`}>
      <span className={`size-2 rounded-full ${s.open ? 'bg-[#1FA855]' : 'bg-brand'}`} aria-hidden />
      {s.label}
      <span className="hidden normal-case tracking-normal text-ink/60 sm:inline">· {s.closedAllDay ? s.detail : s.detail}</span>
    </span>
  )
}
