'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { input, type Opt } from './kit'

/** Selector con búsqueda. Mantiene un input oculto con el id para formularios nativos. */
export function Combobox({ value, onChange, opts, placeholder = 'Buscar…', empty = 'Sin resultados', clearable = true, required, disabled, name, label }: {
  value: string; onChange: (id: string) => void; opts: (Opt & { hint?: string })[]; placeholder?: string; empty?: string; clearable?: boolean; required?: boolean; disabled?: boolean; name?: string; label?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const sel = opts.find((o) => o.id === value)
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (n ? opts.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(n)) : opts).slice(0, 60)
  }, [opts, q])

  useEffect(() => {
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])

  const pick = (id: string) => { onChange(id); setOpen(false); setQ('') }

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <input
          role="combobox" aria-expanded={open} aria-controls="cb-list" aria-label={label ?? placeholder} autoComplete="off" disabled={disabled}
          value={open ? q : sel?.label ?? ''} placeholder={sel ? sel.label : placeholder}
          onFocus={() => { setOpen(true); setHi(0) }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, list.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
            else if (e.key === 'Enter' && open) { e.preventDefault(); if (list[hi]) pick(list[hi].id) }
            else if (e.key === 'Escape') setOpen(false)
          }}
          className={`${input} pr-16`}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1 pt-1.5">
          {clearable && value && !disabled && <button type="button" aria-label="Quitar selección" title="Quitar selección" onClick={() => pick('')} className="rounded p-1 text-ink/50 hover:bg-plum-soft"><X size={14} /></button>}
          <ChevronDown size={16} className="text-ink/40" aria-hidden />
        </div>
      </div>
      {required && <input tabIndex={-1} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0" required value={value} onChange={() => {}} />}
      {name && <input type="hidden" name={name} value={value} />}
      {open && (
        <ul id="cb-list" role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-plum/15 bg-white p-1 shadow-lg">
          {list.length ? list.map((o, i) => (
            <li key={o.id} role="option" aria-selected={o.id === value} onMouseDown={(e) => { e.preventDefault(); pick(o.id) }} onMouseEnter={() => setHi(i)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === hi ? 'bg-plum-soft' : ''} ${o.id === value ? 'font-bold text-plum' : ''}`}>
              {o.label}{o.hint && <span className="ml-2 text-xs text-ink/50">{o.hint}</span>}
            </li>
          )) : <li className="px-3 py-2 text-sm text-ink/50">{empty}</li>}
        </ul>
      )}
    </div>
  )
}
