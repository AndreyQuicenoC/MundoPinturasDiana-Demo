'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

export function AnalyticsPdfDownload({ href, fileName, disabled, disabledHint }: { href: string; fileName: string; disabled?: boolean; disabledHint?: string }) {
  const [busy, setBusy] = useState(false)

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled) {
      if (disabledHint) toast(disabledHint, 'error')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(href, { credentials: 'include' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Error ${res.status}`)
      }
      const blob = await res.blob()
      if (!blob.size || blob.type.includes('text/html')) throw new Error('El servidor no devolvió un PDF válido.')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo generar el PDF.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      title={disabled ? disabledHint : 'Descargar reporte en PDF'}
      aria-label="Descargar reporte en PDF"
      className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-plum/20 px-4 py-2.5 text-sm font-bold text-plum transition hover:bg-plum-soft disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}
      Descargar PDF
    </button>
  )
}
