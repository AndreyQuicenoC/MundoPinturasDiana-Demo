'use client'
import { useState } from 'react'
import { changePassword, updateProfile } from '@/lib/panel-actions'
import { Panel, btnPrimary, input, useDo } from './kit'

export type Profile = { name: string; email: string; role: string; phone: string; document: string; bloodType: string; birthDate: string; address: string; emergencyContactName: string; emergencyContactPhone: string }

const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export function AccountForm({ user }: { user: Profile }) {
  const [cur, setCur] = useState('')
  const [nw, setNw] = useState('')
  const [p, setP] = useState(user)
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP((x) => ({ ...x, [k]: e.target.value }))
  const { run, pending } = useDo()
  const lab = 'block text-sm font-semibold'
  return (
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <Panel title="Tu perfil">
        <form onSubmit={(e) => { e.preventDefault(); run(() => updateProfile({ name: p.name, phone: p.phone, document: p.document, bloodType: p.bloodType, birthDate: p.birthDate, address: p.address, emergencyContactName: p.emergencyContactName, emergencyContactPhone: p.emergencyContactPhone })) }} className="grid gap-4 sm:grid-cols-2">
          <label className={`${lab} sm:col-span-2`}>Nombre completo<input required value={p.name} onChange={set('name')} className={input} /></label>
          <div><span className="text-xs text-ink/55">Correo</span><p className="font-bold">{p.email}</p></div>
          <div><span className="text-xs text-ink/55">Rol</span><p className="font-bold capitalize">{p.role}</p></div>
          <label className={lab}>Cédula<input value={p.document} onChange={set('document')} inputMode="numeric" className={input} /></label>
          <label className={lab}>Teléfono<input value={p.phone} onChange={set('phone')} type="tel" className={input} /></label>
          <label className={lab}>Tipo de sangre
            <select value={p.bloodType} onChange={set('bloodType')} className={input}><option value="">Sin indicar</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>
          </label>
          <label className={lab}>Fecha de nacimiento<input type="date" value={p.birthDate} onChange={set('birthDate')} className={input} /></label>
          <label className={`${lab} sm:col-span-2`}>Dirección<input value={p.address} onChange={set('address')} className={input} /></label>
          <label className={lab}>Contacto de emergencia<input value={p.emergencyContactName} onChange={set('emergencyContactName')} className={input} /></label>
          <label className={lab}>Teléfono de emergencia<input value={p.emergencyContactPhone} onChange={set('emergencyContactPhone')} type="tel" className={input} /></label>
          <div className="sm:col-span-2"><button disabled={pending} className={btnPrimary}>Guardar perfil</button></div>
        </form>
      </Panel>
      <Panel title="Cambiar contraseña">
        <form onSubmit={(e) => { e.preventDefault(); run(() => changePassword(cur, nw), () => { setCur(''); setNw('') }) }} className="space-y-4">
          <label className={lab}>Contraseña actual<input type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} className={input} /></label>
          <label className={lab}>Nueva contraseña (mín. 8)<input type="password" autoComplete="new-password" minLength={8} required value={nw} onChange={(e) => setNw(e.target.value)} className={input} /></label>
          <button disabled={pending} className={btnPrimary}>Actualizar</button>
        </form>
      </Panel>
    </div>
  )
}
