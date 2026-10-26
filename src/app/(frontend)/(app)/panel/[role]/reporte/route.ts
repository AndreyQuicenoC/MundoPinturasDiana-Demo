import { appAuth } from '@/lib/app-auth'
import { effectiveForUser } from '@/lib/permissions'
import { options } from '@/lib/panel-data'
import { buildReport } from '@/lib/analytics'
import { renderReportPdf } from '@/lib/analytics-pdf'
import { isAnalyticsProcessed, parseFilters, reportFileName } from '@/lib/analytics-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  const user = await appAuth.currentUser()
  if (!user) return new Response('No autenticado', { status: 401 })
  if (user.role !== role) return new Response('Prohibido', { status: 403 })
  const eff = await effectiveForUser(user as any)
  if (eff.analitica.mode === 'none') return new Response('Prohibido', { status: 403 })

  const sp = Object.fromEntries(new URL(req.url).searchParams)
  if (!isAnalyticsProcessed(sp)) return new Response('Procesa la analítica antes de generar el PDF.', { status: 400 })
  const f = parseFilters(sp)
  const branches = await options(user, 'branches', undefined, true)
  const sede = branches.some((b) => b.id === f.sede) ? f.sede : ''
  try {
    const report = await buildReport({ ...f, sede })
    const pdf = await renderReportPdf(report)
    const name = reportFileName(f.desde, f.hasta)
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdf.length),
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[reporte-pdf]', e)
    return new Response('No se pudo generar el PDF. Intenta de nuevo.', { status: 500 })
  }
}
