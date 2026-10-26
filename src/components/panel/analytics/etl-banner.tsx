'use client'

import { BarChart3, Cpu, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-70"
    >
      {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Cpu size={18} aria-hidden />}
      Procesar analítica
    </button>
  )
}

/** Simula la ejecución del pipeline ETL antes de mostrar métricas reales. */
export function AnalyticsEtlBanner({ action, sede, desde, hasta }: { action: string; sede: string; desde: string; hasta: string }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-plum/15 bg-gradient-to-br from-plum-soft via-white to-paper p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-plum text-sun" aria-hidden>
            <BarChart3 size={22} />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold text-plum">Indicadores en espera de procesamiento</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/65">
              Los gráficos se muestran en cero hasta que ejecutes el proceso de analítica. En producción, un ETL del backend consolidará ventas, caja, inventario y sitio web para el rango seleccionado.
            </p>
          </div>
        </div>
        <form method="get" action={action} className="shrink-0">
          <input type="hidden" name="procesar" value="1" />
          {sede ? <input type="hidden" name="sede" value={sede} /> : null}
          <input type="hidden" name="desde" value={desde} />
          <input type="hidden" name="hasta" value={hasta} />
          <SubmitBtn />
        </form>
      </div>
    </div>
  )
}

export function AnalyticsProcessedNote({ at }: { at: string }) {
  const when = new Date(at).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })
  return (
    <p className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-2.5 text-sm text-ink/75">
      <Cpu size={16} className="shrink-0 text-cyan-dark" aria-hidden />
      <span>Analítica procesada · actualizado el <strong className="font-semibold text-plum">{when}</strong></span>
    </p>
  )
}
