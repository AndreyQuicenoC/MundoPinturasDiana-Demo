'use client'
import { useActionState, useState } from 'react'
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { loginAction, type LoginState } from './actions'
import { RecoveryFlow } from '@/components/auth/recovery-flow'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {})
  const [show, setShow] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [success, setSuccess] = useState('')
  const [prefill, setPrefill] = useState('')
  const field = 'mt-2 w-full rounded-xl border-2 border-plum/15 bg-white px-4 py-3.5 text-ink outline-none transition focus:border-cyan'
  if (recovering) {
    return <RecoveryFlow onBack={() => setRecovering(false)} onDone={(msg, email) => { setSuccess(msg); setPrefill(email); setRecovering(false) }} />
  }
  return (
    <form action={action} className="w-full max-w-md" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <p className="text-sm font-bold uppercase tracking-widest text-brand">Portal del equipo</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-plum">Inicia sesión</h1>
      <p className="mt-2 text-sm text-ink/60">Usa las credenciales que te asignó administración.</p>
      {success && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-cyan bg-cyan/5 p-3 text-sm font-medium text-plum">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {success}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-medium text-brand-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      <label className="mt-7 block text-sm font-semibold">
        Correo electrónico
        <input name="email" type="email" defaultValue={prefill} autoComplete="username" required className={field} />
      </label>
      <label className="mt-5 block text-sm font-semibold">
        Contraseña
        <span className="relative block">
          <input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className={`${field} pr-12`} />
          <button type="button" title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-plum/70 hover:bg-plum-soft">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <button disabled={pending} title="Ingresar al sistema" aria-label="Ingresar al sistema" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-[4px_4px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60">
        {pending && <Loader2 size={18} className="animate-spin" />} Ingresar al sistema
      </button>
      <button type="button" onClick={() => setRecovering(true)} title="Recuperar contraseña" aria-label="¿Olvidaste tu contraseña?" className="mt-5 text-sm font-semibold text-plum underline-offset-4 hover:text-brand hover:underline">¿Olvidaste tu contraseña?</button>
      <details className="mt-6 rounded-xl border-2 border-plum/10 bg-plum-soft/40 p-4 text-xs text-ink/70">
        <summary className="cursor-pointer font-bold text-plum">Credenciales demo</summary>
        <ul className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed">
          <li><strong>Admin:</strong> admin@mundopinturasdiana.test · Admin#2026demo</li>
          <li><strong>Gerente:</strong> gerente@mundopinturasdiana.test · Gerente#2026demo</li>
          <li><strong>Empleado:</strong> empleado@mundopinturasdiana.test · Empleado#2026demo</li>
        </ul>
      </details>
      <p className="mt-4 text-xs leading-relaxed text-ink/50">
        Tras 5 intentos fallidos la cuenta se bloquea 15 minutos. El acceso queda registrado en auditoría.
      </p>
    </form>
  )
}
