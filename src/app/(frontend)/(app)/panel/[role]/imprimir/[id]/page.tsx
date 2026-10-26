import { notFound, redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import { effectiveFor } from '@/lib/permissions'
import { InvoicePrint, type PrintSale } from '@/components/panel/invoice-print'

export const metadata = { title: 'Imprimir venta · Mundo Pinturas Diana', robots: { index: false, follow: false } }

export default async function PrintPage({ params, searchParams }: { params: Promise<{ role: string; id: string }>; searchParams: Promise<{ formato?: string }> }) {
  const { role, id } = await params
  const { formato } = await searchParams
  const user = await appAuth.currentUser()
  if (!user) redirect('/login')
  if (user.role !== role) redirect(`/panel/${user.role}`)
  const eff = (await effectiveFor(user.role, user.id)).ventas
  if (eff.mode === 'none') redirect(`/panel/${user.role}`)

  const payload = await getPayloadClient()
  const s: any = await payload.findByID({ collection: 'sales', id, depth: 2, user, overrideAccess: eff.viaGrant }).catch(() => null)
  if (!s) notFound()

  const sale: PrintSale = {
    number: s.number, createdAt: s.createdAt, status: s.status, sellerName: s.sellerName ?? '',
    branch: { name: s.branch?.name ?? '', address: s.branch?.address ?? '', phone: s.branch?.phone ?? '', city: s.branch?.city ?? '' },
    client: s.client ? { name: s.client.name ?? '', document: s.client.document ?? '', phone: s.client.phone ?? '', address: s.client.address ?? '' } : null,
    lines: (s.lines ?? []).map((l: any) => ({ name: l.name, color: l.color ?? '', size: l.size ?? '', quantity: l.quantity, unitPrice: l.unitPrice ?? 0, discountPct: l.discountPct ?? 0, lineTotal: l.lineTotal ?? 0, artistic: l.affectsSales === false })),
    subtotal: s.subtotal ?? 0, discountTotal: s.discountTotal ?? 0, total: s.total ?? 0, artisticTotal: s.artisticTotal ?? 0,
    payments: (s.payments ?? []).map((p: any) => ({ method: p.method, bank: p.bankAccount?.name ?? '', amount: p.amount })),
    notes: s.notes ?? '',
  }
  return <InvoicePrint sale={sale} formato={formato === 'termico' ? 'termico' : 'carta'} backHref={`/panel/${role}/ventas?numero=${s.number}`} />
}
