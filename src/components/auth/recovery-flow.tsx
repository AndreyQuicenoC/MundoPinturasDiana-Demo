'use client'
import { useEffect, useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { requestRecovery, resetPassword } from '@/lib/actions-recovery'

const field = 'mt-2 w-full rounded-xl border-2 border-plum/15 bg-white px-4 py-3.5 text-ink outline-none transition focus:border-cyan'
const primary = 'mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-[4px_4px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60'
const COOLDOWN = 60

export function RecoveryFlow({ onDone, onBack }: { onDone: (msg: string, email: string) => void; onBack: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [hint, setHint] = useState('')
  const [cool, setCool] = useState(0)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (cool <= 0) return
    const t = setTimeout(() => setCool((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cool])

  const send = (resend = false) => {
    setError('')
    start(async () => {
      const r = await requestRecovery(email)
      if (!r.ok) return setError(r.error ?? 'No se pudo enviar el código.')
      setInfo(r.message ?? '')
      setHint(r.devHint ?? '')
      setCool(COOLDOWN)
      if (!resend) setStep(2)
    })
  }

  const submitReset = () => {
    setError('')
    start(async () => {
      const r = await resetPassword({ email, code, password, confirm })
      if (!r.ok) return setError(r.error ?? 'No se pudo restablecer la contraseña.')
      onDone(r.message ?? 'Contraseña actualizada.', email)
    })
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-bold uppercase tracking-widest text-brand">Recuperar acceso · Paso {step} de 2</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-plum">{step === 1 ? '¿Olvidaste tu contraseña?' : 'Crea una nueva contraseña'}</h1>
      <p className="mt-2 text-sm text-ink/60">
        {step === 1 ? 'Escribe tu correo y te enviaremos un código de 6 dígitos.' : `Ingresa el código que enviamos a ${email} y elige tu nueva contraseña.`}
      </p>
      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-medium text-brand-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      {step === 2 && info && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-cyan bg-cyan/5 p-3 text-sm font-medium text-plum">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {info}
        </p>
      )}
      {step === 2 && hint && (
        <p role="status" className="mt-3 rounded-xl border-2 border-dashed border-plum/30 p-3 text-sm font-semibold text-plum">Modo desarrollo: el código es {hint}</p>
      )}

      {step === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); send() }} noValidate>
          <label className="mt-7 block text-sm font-semibold">
            Correo electrónico
            <input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" autoComplete="username" required className={field} />
          </label>
          <button disabled={pending} title="Enviar código" aria-label="Enviar código de recuperación" className={primary}>
            {pending && <Loader2 size={18} className="animate-spin" />} Enviar código
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submitReset() }} noValidate>
          <label className="mt-7 block text-sm font-semibold">
            Código de 6 dígitos
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={`${field} tracking-[0.5em]`} />
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Nueva contraseña
            <span className="relative block">
              <input value={password} onChange={(e) => setPassword(e.target.value)} name="password" type={show ? 'text' : 'password'} autoComplete="new-password" required className={`${field} pr-12`} />
              <button type="button" title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-plum/70 hover:bg-plum-soft">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            <span className="mt-1 block text-xs font-normal text-ink/50">Mínimo 8 caracteres, con letras y números.</span>
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Confirmar contraseña
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} name="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" required className={field} />
          </label>
          <button disabled={pending} title="Restablecer contraseña" aria-label="Restablecer contraseña" className={primary}>
            {pending && <Loader2 size={18} className="animate-spin" />} Restablecer contraseña
          </button>
          <button type="button" disabled={pending || cool > 0} onClick={() => send(true)} title="Reenviar código" aria-label="Reenviar código" className="mt-4 w-full rounded-xl border-2 border-plum/15 px-5 py-3 text-sm font-bold text-plum transition hover:bg-plum-soft disabled:opacity-60">
            {cool > 0 ? `Reenviar código en ${cool} s` : 'Reenviar código'}
          </button>
        </form>
      )}
      <button type="button" onClick={step === 2 ? () => { setStep(1); setError('') } : onBack} title={step === 2 ? 'Cambiar correo' : 'Volver a iniciar sesión'} aria-label={step === 2 ? 'Cambiar correo' : 'Volver a iniciar sesión'} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-plum hover:text-brand">
        <ArrowLeft size={16} /> {step === 2 ? 'Cambiar correo' : 'Volver a iniciar sesión'}
      </button>
    </div>
  )
}
