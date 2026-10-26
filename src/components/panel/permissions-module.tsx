'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Lock, RotateCcw } from 'lucide-react'
import { GRANT_MODE, LOCKED_FOR_ADMIN, MODULES, PERMISSIONS, type AppRole, type Mode, type ModuleKey } from '@/lib/access'
import { resetPermissions, setPermission, type PermValue } from '@/lib/actions-admin'
import { Badge, Confirm, Empty, Panel, UrlTabs, btnGhost, input, useDo, type Opt } from './kit'

type Ov = Record<string, boolean>
const ROLES: AppRole[] = ['admin', 'gerente', 'empleado']
const MODE_LABEL: Record<Mode, string> = { total: 'Editar', ver: 'Ver', propio: 'Solo lo propio', none: 'Sin acceso' }

const modeFor = (role: AppRole, m: ModuleKey, ov: boolean | undefined): Mode => {
  const base = PERMISSIONS[m][role]
  if (m === 'resumen' || (role === 'admin' && LOCKED_FOR_ADMIN.includes(m))) return base
  if (ov === false) return 'none'
  if (ov === true && base === 'none') return GRANT_MODE[m]
  return base
}
const isLocked = (role: AppRole, m: ModuleKey) => m === 'resumen' || (role === 'admin' && LOCKED_FOR_ADMIN.includes(m))
const valueOf = (ov: boolean | undefined): PermValue => (ov === undefined ? 'default' : ov ? 'allow' : 'deny')

export function PermissionsModule({ tab, labels, roleOv, users, selected, userOv, sp, selfId }: {
  tab: 'rol' | 'usuario'
  labels: Record<string, string>
  roleOv: Record<string, Ov>
  users: (Opt & { role: AppRole })[]
  selected: (Opt & { role: AppRole }) | null
  userOv: Ov
  sp: Record<string, string | string[] | undefined>
  selfId: string
}) {
  const router = useRouter()
  const path = usePathname()
  const { run, pending } = useDo()
  const [reset, setReset] = useState<{ scope: 'role' | 'user'; subject: string; name: string } | null>(null)

  const change = (scope: 'role' | 'user', subject: string, m: string, value: PermValue) => run(() => setPermission(scope, subject, m, value))

  const cellSelect = (scope: 'role' | 'user', subject: string, role: AppRole, m: ModuleKey, ov: boolean | undefined, inheritedOv?: boolean) => {
    const eff = modeFor(role, m, ov === undefined ? inheritedOv : ov)
    const locked = isLocked(role, m)
    if (locked) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55"><Lock size={13} /> {MODE_LABEL[eff]} · fijo</span>
    const defaultMode = scope === 'role' ? modeFor(role, m, undefined) : modeFor(role, m, inheritedOv)
    const selfLock = scope === 'user' && subject === selfId && ['permisos', 'usuarios'].includes(m)
    return (
      <select
        aria-label={`${labels[m]}: permiso`} disabled={pending} value={valueOf(ov)}
        onChange={(e) => change(scope, subject, m, e.target.value as PermValue)}
        className={`${input} !mt-0 !py-1.5 text-xs font-semibold ${ov !== undefined ? 'border-brand bg-brand/5' : ''}`}
      >
        <option value="default">{scope === 'role' ? 'Por defecto' : 'Heredar'} · {MODE_LABEL[defaultMode]}</option>
        <option value="allow">Habilitado{PERMISSIONS[m][role] === 'none' ? ` · ${MODE_LABEL[GRANT_MODE[m]]}` : ''}</option>
        {!selfLock && <option value="deny">Sin acceso</option>}
      </select>
    )
  }

  return (
    <div>
      <UrlTabs value={tab} sp={sp} tabs={[{ id: 'rol', label: 'Por rol' }, { id: 'usuario', label: 'Por usuario' }]} />
      <p className="mb-4 max-w-3xl text-sm text-ink/60">
        Habilitado: el módulo aparece en el menú y la ruta es accesible. Sin acceso: se oculta y la ruta redirige al resumen. Los ajustes marcados en rosa reemplazan el valor por defecto. Resumen, Permisos y Usuarios no se pueden quitar al administrador.
      </p>

      {tab === 'rol' ? (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="py-2 pr-4 font-bold">Módulo</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-2 py-2 font-bold">
                      <span className="flex items-center gap-2"><Badge v={r} />
                        {Object.keys(roleOv[r] ?? {}).length > 0 && <button disabled={pending} onClick={() => setReset({ scope: 'role', subject: r, name: r })} aria-label={`Restablecer ${r}`} title="Restablecer" className="rounded p-1 text-plum/60 hover:bg-plum-soft"><RotateCcw size={14} /></button>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {MODULES.map((m) => (
                  <tr key={m}>
                    <th scope="row" className="py-2 pr-4 font-semibold">{labels[m]}</th>
                    {ROLES.map((r) => <td key={r} className="px-2 py-2">{cellSelect('role', r, r, m, roleOv[r]?.[m])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <>
          <label className="mb-4 block max-w-md text-sm font-semibold">
            Usuario
            <select value={selected?.id ?? ''} onChange={(e) => router.push(e.target.value ? `${path}?tab=usuario&user=${encodeURIComponent(e.target.value)}` : `${path}?tab=usuario`)} className={input}>
              <option value="">— Elige un usuario —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.label} · {u.role}</option>)}
            </select>
          </label>
          {!selected ? (
            <Empty text="Elige un usuario para ver y ajustar sus permisos." />
          ) : (
            <Panel
              title={`Permisos de ${selected.label}`}
              action={Object.keys(userOv).length > 0 ? <button disabled={pending} onClick={() => setReset({ scope: 'user', subject: selected.id, name: selected.label })} className={btnGhost}><RotateCcw size={16} /> Restablecer</button> : undefined}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-plum">
                    <tr><th className="py-2 pr-4 font-bold">Módulo</th><th className="px-2 py-2 font-bold">Acceso actual</th><th className="px-2 py-2 font-bold">Permiso</th></tr>
                  </thead>
                  <tbody className="divide-y divide-plum/10">
                    {MODULES.map((m) => {
                      const eff = modeFor(selected.role, m, userOv[m] ?? roleOv[selected.role]?.[m])
                      return (
                        <tr key={m}>
                          <th scope="row" className="py-2 pr-4 font-semibold">{labels[m]}</th>
                          <td className="px-2 py-2"><span className={eff === 'none' ? 'text-ink/40' : 'font-bold text-cyan-dark'}>{MODE_LABEL[eff]}</span>{userOv[m] !== undefined && <span className="ml-2 text-xs font-bold text-brand">ajustado</span>}</td>
                          <td className="px-2 py-2">{cellSelect('user', selected.id, selected.role, m, userOv[m], roleOv[selected.role]?.[m])}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}

      <Confirm
        open={!!reset} busy={pending} title="Restablecer permisos" yes="Restablecer"
        text={reset?.scope === 'role' ? `Se quitarán todos los ajustes del rol «${reset?.name}» y volverá a la matriz por defecto.` : `Se quitarán todos los ajustes de ${reset?.name}; heredará los permisos de su rol.`}
        onNo={() => setReset(null)}
        onYes={() => run(() => resetPermissions(reset!.scope, reset!.subject), () => setReset(null))}
      />
    </div>
  )
}
