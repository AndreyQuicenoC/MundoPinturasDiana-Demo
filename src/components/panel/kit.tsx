'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { formatCOPClient } from '@/lib/format'

export type Row = Record<string, any>
export type Opt = { id: string; label: string }

export const label = (v: any): string => {
  if (v == null || v === '') return '—'
  if (typeof v === 'object') return v.name ?? v.title ?? v.email ?? v.number ?? v.id ?? '—'
  return String(v)
}
export const money = (n: number | null | undefined) => (n == null ? '—' : formatCOPClient(n))
export const dt = (v?: string) => (v ? new Date(v).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }) : '—')
export const dateOnly = (v?: string) => (v ? new Date(v).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium' }) : '—')

const tones: Record<string, string> = {
  activo: 'bg-cyan/15 text-cyan-dark', entregado: 'bg-cyan/15 text-cyan-dark', confirmado: 'bg-cyan/15 text-cyan-dark', emitida: 'bg-cyan/15 text-cyan-dark', cerrado: 'bg-cyan/15 text-cyan-dark',
  inactivo: 'bg-ink/10 text-ink/70', archivada: 'bg-ink/10 text-ink/70', agotado: 'bg-sun/30 text-ink', pendiente: 'bg-sun/30 text-ink', nuevo: 'bg-sun/30 text-ink', devolucion_parcial: 'bg-sun/30 text-ink',
  bloqueado: 'bg-brand/15 text-brand-dark', cancelado: 'bg-brand/15 text-brand-dark', anulada: 'bg-brand/15 text-brand-dark', 
  admin: 'bg-plum text-white',
  crear: 'bg-emerald-100 text-emerald-800', editar: 'bg-sky-100 text-sky-800', eliminar: 'bg-red-100 text-red-800', login: 'bg-violet-100 text-violet-800', logout: 'bg-slate-200 text-slate-700', anular: 'bg-amber-100 text-amber-800',
  vigente: 'bg-cyan/15 text-cyan-dark', programada: 'bg-sky-100 text-sky-800', pausada: 'bg-sun/30 text-ink', clave: 'bg-brand/15 text-brand-dark',
  solicitada: 'bg-sun/30 text-ink', en_proceso: 'bg-cyan/15 text-cyan-dark', generada: 'bg-cyan/15 text-cyan-dark', rechazada: 'bg-brand/15 text-brand-dark', en_ruta: 'bg-cyan/15 text-cyan-dark', gerente: 'bg-plum-soft text-plum', empleado: 'bg-paper text-plum ring-1 ring-plum/20',
}
export const Badge = ({ v }: { v: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${tones[v] ?? 'bg-plum-soft text-plum'}`}>{String(v).replace(/_/g, ' ')}</span>
)

export function useDo() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn()
      if (r.ok) {
        if (r.message) toast(r.message, 'ok')
        after?.()
        router.refresh()
      } else toast((r as any).error ?? 'No se pudo completar la acción.', 'error')
    })
  return { run, pending }
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="modal-title"
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border-2 border-plum bg-white p-0 text-ink shadow-[8px_8px_0_0_var(--color-plum)] backdrop:bg-plum/50 backdrop:backdrop-blur-sm`}>
      {open && (
        <div className="max-h-[85dvh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="font-display text-2xl font-extrabold text-plum">{title}</h2>
            <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 hover:bg-plum-soft"><X size={20} /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Confirm({ open, title, text, danger, busy, onYes, onNo, yes = 'Confirmar' }: { open: boolean; title: string; text: string; danger?: boolean; busy?: boolean; onYes: () => void; onNo: () => void; yes?: string }) {
  return (
    <Modal open={open} onClose={onNo} title={title}>
      <p className="text-sm text-ink/70">{text}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onNo} className={btnGhost}>Cancelar</button>
        <button onClick={onYes} disabled={busy} className={danger ? btnDanger : btnPrimary}>{busy && <Loader2 size={16} className="animate-spin" />} {yes}</button>
      </div>
    </Modal>
  )
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 focus-visible:outline-2'
export const btnPrimary = `${btn} bg-brand text-white shadow-[3px_3px_0_0_var(--color-plum)] hover:-translate-y-0.5 hover:bg-brand-dark`
export const btnDanger = `${btn} bg-ink text-white hover:bg-brand-dark`
export const btnGhost = `${btn} border-2 border-plum/20 text-plum hover:bg-plum-soft`
export const input = 'mt-1.5 w-full rounded-xl border-2 border-plum/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan disabled:bg-ink/5'

export const Panel = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-2xl border-2 border-plum/10 bg-white p-5">
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-display text-lg font-extrabold text-plum">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
)

export const Select = ({ value, onChange, opts, empty, ...p }: { value: string; onChange: (v: string) => void; opts: Opt[]; empty?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'>) => (
  <select {...p} value={value} onChange={(e) => onChange(e.target.value)} className={input}>
    {empty !== undefined && <option value="">{empty}</option>}
    {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
  </select>
)

export const Empty = ({ text }: { text: string }) => (
  <p className="rounded-xl border-2 border-dashed border-plum/15 p-8 text-center text-sm text-ink/55">{text}</p>
)

export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t) }, [v, ms])
  return d
}

/** Paginación por URL: conserva los demás parámetros y sobrevive a recargas. */
export function Pager({ page, totalPages, totalDocs, sp, param = 'page' }: { page: number; totalPages: number; totalDocs: number; sp: Record<string, string | string[] | undefined>; param?: string }) {
  const path = usePathname()
  const href = (n: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (v != null && k !== param) q.set(k, Array.isArray(v) ? v[0] : v)
    if (n > 1) q.set(param, String(n))
    const qs = q.toString()
    return qs ? `${path}?${qs}` : path
  }
  if (totalDocs === 0) return null
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
  const cell = 'inline-flex size-9 items-center justify-center rounded-lg text-sm font-bold transition'
  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink/55">{totalDocs} registro{totalDocs === 1 ? '' : 's'} · página {page} de {totalPages}</p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? <Link href={href(page - 1)} scroll={false} aria-label="Página anterior" className={`${cell} border-2 border-plum/15 text-plum hover:bg-plum-soft`}><ChevronLeft size={16} /></Link> : <span className={`${cell} opacity-30`}><ChevronLeft size={16} /></span>}
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-ink/40">…</span>}
              <Link href={href(n)} scroll={false} aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined} className={`${cell} ${n === page ? 'bg-plum text-white' : 'border-2 border-plum/15 text-plum hover:bg-plum-soft'}`}>{n}</Link>
            </span>
          ))}
          {page < totalPages ? <Link href={href(page + 1)} scroll={false} aria-label="Página siguiente" className={`${cell} border-2 border-plum/15 text-plum hover:bg-plum-soft`}><ChevronRight size={16} /></Link> : <span className={`${cell} opacity-30`}><ChevronRight size={16} /></span>}
        </div>
      )}
    </nav>
  )
}

/** Pestañas / filtros guardados en la URL (?tab=). */
export function UrlTabs({ param = 'tab', value, tabs, sp }: { param?: string; value: string; tabs: { id: string; label: string }[]; sp: Record<string, string | string[] | undefined> }) {
  const path = usePathname()
  const href = (id: string) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (v != null && k !== param && k !== 'page') q.set(k, Array.isArray(v) ? v[0] : v)
    q.set(param, id)
    return `${path}?${q.toString()}`
  }
  return (
    <div role="tablist" className="mb-4 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link key={t.id} role="tab" aria-selected={t.id === value} href={href(t.id)} scroll={false} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${t.id === value ? 'bg-plum text-white' : 'border-2 border-plum/15 text-plum hover:bg-plum-soft'}`}>{t.label}</Link>
      ))}
    </div>
  )
}

/** Hashtags como chips (#ColorCali #DECO). */
export const Chips = ({ text }: { text?: string | null }) => {
  const tags = String(text ?? '').split(/[\s,]+/).filter(Boolean)
  if (!tags.length) return <>—</>
  return <span className="flex flex-wrap gap-1">{tags.map((t) => <span key={t} className="rounded-full bg-plum-soft px-2 py-0.5 text-xs font-bold text-plum">{t.startsWith('#') ? t : `#${t}`}</span>)}</span>
}
