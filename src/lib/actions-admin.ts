'use server'
import { RESOURCES, type FieldDef } from './panel-config'
import { run, type Res } from './action-kit'
import { LOCKED_FOR_ADMIN, MODULES, type ModuleKey } from './access'

const HEX = /^#[0-9a-fA-F]{6}$/
const ROLES = ['admin', 'gerente', 'empleado'] as const
const str = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max)

function cleanUrl(v: unknown) {
  const s = str(v, 1000)
  if (!s) return null
  if (s.startsWith('/') && !s.startsWith('//')) return s
  let u: URL
  try { u = new URL(s) } catch { throw new Error('El enlace de la imagen no es válido.') }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('El enlace de la imagen debe empezar por http:// o https://')
  return s
}

function normalizeTags(v: unknown) {
  const tags = str(v, 300).split(/[\s,]+/).filter(Boolean).map((t) => '#' + t.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter((t) => t.length > 1)
  return [...new Set(tags)].join(' ')
}

/** Lista blanca de campos: solo se guarda lo declarado en RESOURCES, validado por tipo. */
function clean(f: FieldDef, raw: unknown, id: string | null, data: Record<string, unknown>, values: Record<string, unknown>) {
  const label = f.label.replace(/\s*\(.*\)\s*$/, '')
  switch (f.type) {
    case 'number': {
      if (raw === '' || raw == null) { if (f.required) throw new Error(`${label} es obligatorio.`); data[f.name] = id ? null : undefined; return }
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) throw new Error(`${label} debe ser un número válido.`)
      data[f.name] = n; return
    }
    case 'checkbox': data[f.name] = !!raw; return
    case 'relation': {
      const r = str(raw, 64)
      if (!r && f.required) throw new Error(`${label} es obligatorio.`)
      data[f.name] = r || null; return
    }
    case 'select': {
      const s = str(raw, 60)
      if (s && !f.options!.includes(s)) throw new Error(`${label}: opción no válida.`)
      data[f.name] = s || undefined; return
    }
    case 'date': {
      const s = str(raw, 10)
      if (!s) { if (f.required) throw new Error(`${label} es obligatorio.`); data[f.name] = id ? null : undefined; return }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(s).getTime())) throw new Error(`${label}: fecha no válida.`)
      data[f.name] = `${s}T12:00:00.000Z`; return
    }
    case 'image': {
      const m = str(raw, 64)
      data[f.name] = m || null
      if (f.urlField) data[f.urlField] = cleanUrl(values[f.urlField])
      return
    }
    case 'array': {
      const arr = Array.isArray(raw) ? raw.slice(0, 100) : []
      const out = arr.map((it: any) => {
        const o: Record<string, string> = {}
        for (const i of f.items!) {
          const val = str(it?.[i.name], 120)
          if (i.type === 'color' && !HEX.test(val)) throw new Error(`${label}: color no válido.`)
          o[i.name] = val
        }
        return o
      })
      for (const o of out) for (const i of f.items!) if (i.type === 'text' && !o[i.name]) {
        if (f.name === 'colors') throw new Error('Cada color necesita un nombre.')
        if (f.name === 'sizes') throw new Error('Cada tamaño necesita una etiqueta.')
      }
      data[f.name] = out; return
    }
    case 'tags': {
      const t = normalizeTags(raw)
      if (!t && f.required) throw new Error(`${label} es obligatorio.`)
      data[f.name] = t || (id ? null : undefined); return
    }
    default: {
      let s = str(raw, f.type === 'textarea' ? 4000 : 300)
      if (f.type === 'email' && s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error('Correo no válido.')
      if (!s && f.required) throw new Error(`${label} es obligatorio.`)
      if (f.type === 'password') { if (id) return; s = str(raw, 200) }
      data[f.name] = s === '' ? (id ? null : undefined) : s
    }
  }
}

export async function saveResource(key: ModuleKey, id: string | null, values: Record<string, unknown>): Promise<Res> {
  const cfg = RESOURCES[key]
  if (!cfg || cfg.fields.length === 0) return { ok: false, error: 'Módulo desconocido.' }
  return run(key, async ({ payload, acc }) => {
    const data: Record<string, unknown> = {}
    for (const f of cfg.fields) {
      if (f.createOnly && id) continue
      clean(f, values[f.name], id, data, values)
    }
    if (key === 'usuarios' && !id && String(data.password ?? '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
    if (key === 'clientes' && data.habeasData) data.habeasDataDate = new Date().toISOString()
    if (data.startDate && data.endDate && String(data.endDate) < String(data.startDate)) throw new Error('La fecha de fin no puede ser anterior a la de inicio.')
    if (key === 'promociones' && !data.image && !data.imageUrl) throw new Error('Agrega una imagen o el enlace de una imagen.')
    const base = { collection: cfg.collection as any, data: data as any, ...acc, depth: 0 }
    if (id) await payload.update({ ...base, id })
    else await payload.create(base)
    return { ok: true, message: id ? 'Cambios guardados.' : `Se creó el ${cfg.singular}.` }
  })
}

/** Sube una imagen a Media (admin / gerente). Devuelve { id, url }. */
export async function uploadImage(fd: FormData): Promise<Res> {
  return run(undefined, async ({ role, user, payload }) => {
    if (role === 'empleado') throw new Error('No tienes permiso para subir imágenes.')
    const file = fd.get('file')
    if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona una imagen.')
    if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) throw new Error('Formato no permitido. Usa PNG, JPG, WEBP, GIF o AVIF.')
    if (file.size > 4 * 1024 * 1024) throw new Error('La imagen supera los 4 MB.')
    const alt = str(fd.get('alt'), 150) || file.name
    const buf = Buffer.from(await file.arrayBuffer())
    const doc = await payload.create({
      collection: 'media', user, overrideAccess: true, depth: 0,
      data: { alt },
      file: { data: buf, mimetype: file.type, name: file.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'imagen', size: buf.length },
    })
    return { ok: true, data: { id: String(doc.id), url: (doc as any).url as string } }
  }, { write: false })
}

/* ───────── Permisos ───────── */

export type PermValue = 'default' | 'allow' | 'deny'
const VALUES: PermValue[] = ['default', 'allow', 'deny']

function checkModule(m: string, adminSubject: boolean) {
  if (!(MODULES as readonly string[]).includes(m)) throw new Error('Módulo no válido.')
  if (m === 'resumen') throw new Error('El resumen siempre está disponible.')
  if (adminSubject && LOCKED_FOR_ADMIN.includes(m as ModuleKey)) throw new Error('Este módulo no se puede restringir al administrador.')
}

/** Ajusta el permiso de un módulo para un rol (`scope: 'role'`) o para un usuario (`scope: 'user'`). */
export async function setPermission(scope: 'role' | 'user', subject: string, module: string, value: PermValue): Promise<Res> {
  return run('permisos', async ({ role, user, payload }) => {
    if (role !== 'admin') throw new Error('Solo el administrador puede cambiar permisos.')
    if (!VALUES.includes(value)) throw new Error('Valor no válido.')
    const common = { overrideAccess: true, user, depth: 0, limit: 1 } as const
    if (scope === 'role') {
      if (!(ROLES as readonly string[]).includes(subject)) throw new Error('Rol no válido.')
      checkModule(module, subject === 'admin')
      const found = await payload.find({ collection: 'role-permissions', where: { and: [{ role: { equals: subject } }, { module: { equals: module } }] }, ...common })
      const cur = found.docs[0]
      if (value === 'default') { if (cur) await payload.delete({ collection: 'role-permissions', id: cur.id, overrideAccess: true, user }) }
      else if (cur) await payload.update({ collection: 'role-permissions', id: cur.id, data: { granted: value === 'allow' }, overrideAccess: true, user })
      else await payload.create({ collection: 'role-permissions', data: { role: subject as any, module, granted: value === 'allow' }, overrideAccess: true, user })
    } else {
      const target = await payload.findByID({ collection: 'users', id: subject, depth: 0, overrideAccess: true }).catch(() => null)
      if (!target) throw new Error('Usuario no encontrado.')
      checkModule(module, target.role === 'admin')
      if (String(target.id) === String(user.id) && value === 'deny' && ['permisos', 'usuarios'].includes(module)) throw new Error('No puedes quitarte a ti mismo el acceso a Permisos o Usuarios.')
      const found = await payload.find({ collection: 'user-permissions', where: { and: [{ user: { equals: subject } }, { module: { equals: module } }] }, ...common })
      const cur = found.docs[0]
      if (value === 'default') { if (cur) await payload.delete({ collection: 'user-permissions', id: cur.id, overrideAccess: true, user }) }
      else if (cur) await payload.update({ collection: 'user-permissions', id: cur.id, data: { granted: value === 'allow' }, overrideAccess: true, user })
      else await payload.create({ collection: 'user-permissions', data: { user: subject, module, granted: value === 'allow' }, overrideAccess: true, user })
    }
    return { ok: true, message: value === 'default' ? 'Permiso restablecido.' : 'Permiso actualizado.' }
  })
}

/** Quita todos los ajustes de un usuario o de un rol y vuelve a la matriz por defecto. */
export async function resetPermissions(scope: 'role' | 'user', subject: string): Promise<Res> {
  return run('permisos', async ({ role, user, payload }) => {
    if (role !== 'admin') throw new Error('Solo el administrador puede cambiar permisos.')
    if (scope === 'role') {
      if (!(ROLES as readonly string[]).includes(subject)) throw new Error('Rol no válido.')
      await payload.delete({ collection: 'role-permissions', where: { role: { equals: subject } }, overrideAccess: true, user })
    } else {
      await payload.delete({ collection: 'user-permissions', where: { user: { equals: subject } }, overrideAccess: true, user })
    }
    return { ok: true, message: 'Permisos restablecidos a los valores por defecto.' }
  })
}
