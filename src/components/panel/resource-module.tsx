'use client'
import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { ResourceCfg, FieldDef } from '@/lib/panel-config'
import { removeRow } from '@/lib/panel-actions'
import { saveResource, uploadImage } from '@/lib/actions-admin'
import type { ModuleKey } from '@/lib/access'
import { toast } from '@/components/ui/toaster'
import { Badge, Chips, Confirm, Empty, Modal, Pager, btnGhost, btnPrimary, dateOnly, dt, input, label, money, useDebounced, useDo, type Opt, type Row } from './kit'

type PageInfo = { page: number; totalPages: number; totalDocs: number }

const safeSrc = (u?: string | null) => {
  const s = String(u ?? '').trim()
  if (!s) return null
  if (s.startsWith('/')) return s
  try {
    const p = new URL(s)
    return p.protocol === 'https:' || p.protocol === 'http:' ? s : null
  } catch {
    return null
  }
}

export function ResourceModule({ moduleKey, cfg, rows, pageInfo, sp, q, options, canWrite, canDelete }: {
  moduleKey: ModuleKey
  cfg: ResourceCfg
  rows: Row[]
  pageInfo: PageInfo
  sp: Record<string, string | string[] | undefined>
  q: string
  options: Record<string, Opt[]>
  canWrite: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const path = usePathname()
  const [text, setText] = useState(q)
  const debounced = useDebounced(text, 400)
  const [edit, setEdit] = useState<Row | 'new' | null>(null)
  const [del, setDel] = useState<Row | null>(null)
  const { run, pending } = useDo()

  useEffect(() => {
    if (debounced.trim() === q) return
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (v != null && k !== 'page' && k !== 'q') next.set(k, Array.isArray(v) ? v[0] : v)
    if (debounced.trim()) next.set('q', debounced.trim())
    const qs = next.toString()
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const cell = (r: Row, c: ResourceCfg['cols'][number]) => {
    const v = r[c.key] ?? (c.alt ? r[c.alt] : undefined)
    if (c.kind === 'money') return money(v)
    if (c.kind === 'date') return dateOnly(v)
    if (c.kind === 'datetime') return dt(v)
    if (c.kind === 'badge') return v ? <Badge v={v} /> : '—'
    if (c.kind === 'tags') return <Chips text={v} />
    if (c.kind === 'num') return v ?? 0
    if (c.kind === 'bool') return <span className={v ? 'font-bold text-cyan-dark' : 'text-ink/40'}>{v ? 'Sí' : 'No'}</span>
    if (c.kind === 'thumb') {
      const src = safeSrc((typeof v === 'object' && v ? v.url : null) ?? r.imageUrl)
      return src ? <Image src={src} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" /> : <span className="block size-10 rounded-lg bg-plum-soft" />
    }
    return label(v)
  }

  const hasActions = (canWrite || canDelete) && cfg.fields.length > 0
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Buscar</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Buscar ${cfg.title.toLowerCase()}…`} className={`${input} !mt-0 pl-10`} />
        </label>
        {canWrite && !cfg.noCreate && <button onClick={() => setEdit('new')} className={btnPrimary}><Plus size={16} /> Nuevo {cfg.singular}</button>}
      </div>

      {rows.length === 0 ? (
        <Empty text={q ? 'Ningún resultado coincide con tu búsqueda.' : `Aún no hay ${cfg.title.toLowerCase()} registrados.`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                {cfg.cols.map((c) => <th key={c.key} scope="col" className="px-4 py-3 font-bold">{c.label}</th>)}
                {hasActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-paper">
                  {cfg.cols.map((c) => <td key={c.key} className="px-4 py-3">{cell(r, c)}</td>)}
                  {hasActions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {canWrite && <button onClick={() => setEdit(r)} aria-label={`Editar ${label(r[cfg.cols.find((c) => !c.kind || c.kind === 'text')?.key ?? cfg.cols[0].key])}`} className="rounded-lg p-2 text-plum hover:bg-plum-soft"><Pencil size={16} /></button>}
                      {canDelete && !cfg.noDelete && <button onClick={() => setDel(r)} aria-label={`Eliminar ${label(r[cfg.cols.find((c) => !c.kind || c.kind === 'text')?.key ?? cfg.cols[0].key])}`} className="rounded-lg p-2 text-brand hover:bg-brand/10"><Trash2 size={16} /></button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager {...pageInfo} sp={sp} />

      <FormModal key={edit === 'new' ? 'new' : (edit as Row | null)?.id ?? 'none'} moduleKey={moduleKey} cfg={cfg} row={edit} options={options} onClose={() => setEdit(null)} />
      <Confirm open={!!del} danger busy={pending} title={`Eliminar ${cfg.singular}`} text={`¿Eliminar "${del ? label(del[cfg.cols.find((c) => !c.kind || c.kind === 'text')?.key ?? cfg.cols[0].key]) : ''}"? Esta acción queda registrada en auditoría y no se puede deshacer.`} yes="Eliminar" onNo={() => setDel(null)} onYes={() => run(() => removeRow(cfg.collection, del!.id), () => setDel(null))} />
    </div>
  )
}

const initial = (f: FieldDef, row: Row | null, moduleKey: string) => {
  const v = row?.[f.name]
  if (f.type === 'checkbox') return v ?? (f.name === 'active' || (f.name === 'visible' && moduleKey === 'productos'))
  if (f.type === 'relation') return typeof v === 'object' && v ? v.id : v ?? ''
  if (f.type === 'image') return typeof v === 'object' && v ? v.id : v ?? ''
  if (f.type === 'array') return (Array.isArray(v) ? v : []).map((it: any) => Object.fromEntries(f.items!.map((i) => [i.name, it?.[i.name] ?? (i.type === 'color' ? '#e5e7eb' : '')])))
  if (f.type === 'date') return v ? String(v).slice(0, 10) : ''
  return v ?? (f.type === 'select' ? f.options?.[0] ?? '' : '')
}

function FormModal({ moduleKey, cfg, row, options, onClose }: { moduleKey: ModuleKey; cfg: ResourceCfg; row: Row | 'new' | null; options: Record<string, Opt[]>; onClose: () => void }) {
  const isNew = row === 'new'
  const data = row && row !== 'new' ? row : null
  const [v, setV] = useState<Record<string, any>>(() => {
    const base = Object.fromEntries(cfg.fields.map((f) => [f.name, initial(f, data, moduleKey)]))
    for (const f of cfg.fields) if (f.type === 'image' && f.urlField) base[f.urlField] = data?.[f.urlField] ?? ''
    return base
  })
  const { run, pending } = useDo()
  const set = (k: string, val: any) => setV((s) => ({ ...s, [k]: val }))
  const wideTypes = ['textarea', 'image', 'array']
  return (
    <Modal open={!!row} onClose={onClose} title={isNew ? `Nuevo ${cfg.singular}` : `Editar ${cfg.singular}`} wide>
      <form onSubmit={(e) => { e.preventDefault(); run(() => saveResource(moduleKey, data?.id ?? null, v), onClose) }} className="grid gap-4 sm:grid-cols-2">
        {cfg.fields.filter((f) => !(f.createOnly && !isNew)).map((f) => {
          const span = wideTypes.includes(f.type) || f.wide ? 'sm:col-span-2' : ''
          if (f.type === 'checkbox')
            return (
              <label key={f.name} className="flex items-center gap-2 self-end text-sm font-semibold">
                <input type="checkbox" checked={!!v[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="size-5 accent-brand" /> {f.label}
              </label>
            )
          if (f.type === 'image')
            return <div key={f.name} className={`${span} text-sm font-semibold`}><ImageField f={f} v={v} set={set} initialUrl={typeof data?.[f.name] === 'object' ? data?.[f.name]?.url : undefined} /></div>
          if (f.type === 'array')
            return <div key={f.name} className={`${span} text-sm font-semibold`}><ArrayField f={f} value={v[f.name]} onChange={(val) => set(f.name, val)} /></div>
          return (
            <label key={f.name} className={`block text-sm font-semibold ${span}`}>
              {f.label}{f.required && <span className="text-brand"> *</span>}
              {f.type === 'textarea' ? (
                <textarea rows={3} value={v[f.name]} onChange={(e) => set(f.name, e.target.value)} className={input} />
              ) : f.type === 'select' ? (
                <select value={v[f.name]} onChange={(e) => set(f.name, e.target.value)} className={input}>{f.options!.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}</select>
              ) : f.type === 'relation' && f.searchable ? (
                <Combo value={v[f.name]} onChange={(val) => set(f.name, val)} opts={options[f.relation!] ?? []} required={f.required} />
              ) : f.type === 'relation' ? (
                <select value={v[f.name]} onChange={(e) => set(f.name, e.target.value)} className={input} required={f.required}>
                  <option value="">— Ninguna —</option>
                  {(options[f.relation!] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              ) : f.type === 'tags' ? (
                <>
                  <input value={v[f.name]} placeholder="#ColorCali #Oferta" required={f.required} onChange={(e) => set(f.name, e.target.value)} className={input} />
                  <span className="mt-2 block"><Chips text={v[f.name]} /></span>
                </>
              ) : (
                <input type={f.type === 'password' ? 'password' : f.type} autoComplete={f.type === 'password' ? 'new-password' : 'off'} value={v[f.name]} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined} required={f.required} onChange={(e) => set(f.name, e.target.value)} className={input} />
              )}
              {f.help && <span className="mt-1 block text-xs font-normal text-ink/55">{f.help}</span>}
            </label>
          )
        })}
        <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
          <button type="button" onClick={onClose} className={btnGhost}>Cancelar</button>
          <button disabled={pending} className={btnPrimary}>{pending ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Selector con buscador (datalist): escribe y elige. */
function Combo({ value, onChange, opts, required }: { value: string; onChange: (v: string) => void; opts: Opt[]; required?: boolean }) {
  const id = useId()
  const [text, setText] = useState(opts.find((o) => o.id === value)?.label ?? '')
  return (
    <>
      <input
        list={id} value={text} required={required} placeholder="Escribe para buscar…" autoComplete="off" className={input}
        onChange={(e) => { setText(e.target.value); onChange(opts.find((o) => o.label === e.target.value)?.id ?? '') }}
        onBlur={() => { if (!opts.some((o) => o.id === value)) { setText(''); onChange('') } }}
      />
      <datalist id={id}>{opts.map((o) => <option key={o.id} value={o.label} />)}</datalist>
    </>
  )
}

/** Reduce la imagen en el navegador (máx. 1600 px) para no superar el límite de envío. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k)
    c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/webp', 0.82))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

function ImageField({ f, v, set, initialUrl }: { f: FieldDef; v: Record<string, any>; set: (k: string, val: any) => void; initialUrl?: string }) {
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(initialUrl)
  const ref = useRef<HTMLInputElement>(null)
  const urlKey = f.urlField!
  const shown = safeSrc(v[f.name] ? preview : v[urlKey])
  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const small = await shrink(file)
      const fd = new FormData()
      fd.set('file', small)
      fd.set('alt', String(v.name ?? v.title ?? file.name))
      const r = await uploadImage(fd)
      if (!r.ok) throw new Error(r.error)
      const d = r.data as { id: string; url: string }
      set(f.name, d.id)
      setPreview(d.url)
    } catch (e: any) {
      toast(e?.message || 'No se pudo subir la imagen.', 'error')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div>
      <span className="block">{f.label}</span>
      <div className="mt-1.5 flex flex-wrap items-start gap-4 rounded-xl border-2 border-dashed border-plum/15 p-3">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-plum-soft text-plum/50">
          {shown ? <Image src={shown} alt="" width={96} height={96} className="size-24 object-cover" /> : <ImagePlus size={28} />}
        </div>
        <div className="min-w-48 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={btnGhost}>{busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Subir imagen</button>
            {(v[f.name] || v[urlKey]) && <button type="button" onClick={() => { set(f.name, ''); set(urlKey, ''); setPreview(undefined) }} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"><X size={14} /> Quitar</button>}
            <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <label className="block text-xs">
            O pega el enlace de una imagen
            <input value={v[urlKey]} onChange={(e) => set(urlKey, e.target.value)} placeholder="https://…" inputMode="url" className={input} />
          </label>
        </div>
      </div>
    </div>
  )
}

function ArrayField({ f, value, onChange }: { f: FieldDef; value: Record<string, string>[]; onChange: (v: Record<string, string>[]) => void }) {
  const items = f.items!
  const blank = () => Object.fromEntries(items.map((i) => [i.name, i.type === 'color' ? '#e5e7eb' : '']))
  const upd = (idx: number, k: string, val: string) => onChange(value.map((r, i) => (i === idx ? { ...r, [k]: val } : r)))
  return (
    <div>
      <div className="flex items-center justify-between">
        <span>{f.label}</span>
        <button type="button" onClick={() => onChange([...value, blank()])} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-plum hover:bg-plum-soft"><Plus size={14} /> Agregar</button>
      </div>
      {value.length === 0 ? (
        <p className="mt-1.5 rounded-xl border-2 border-dashed border-plum/15 p-3 text-center text-xs font-normal text-ink/55">Sin elementos.</p>
      ) : (
        <ul className="mt-1.5 space-y-2">
          {value.map((r, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {items.map((i) =>
                i.type === 'color' ? (
                  <input key={i.name} type="color" aria-label={i.label} value={r[i.name]} onChange={(e) => upd(idx, i.name, e.target.value)} className="size-10 shrink-0 cursor-pointer rounded-lg border-2 border-plum/15 bg-white p-0.5" />
                ) : (
                  <input key={i.name} aria-label={i.label} placeholder={i.label} value={r[i.name]} onChange={(e) => upd(idx, i.name, e.target.value)} className={`${input} !mt-0 flex-1`} />
                ),
              )}
              <button type="button" aria-label="Quitar" onClick={() => onChange(value.filter((_, j) => j !== idx))} className="rounded-lg p-2 text-brand hover:bg-brand/10"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
