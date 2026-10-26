'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { money } from './kit'

export type PrintSale = {
  number: number; createdAt: string; status: string; sellerName: string
  branch: { name: string; address: string; phone: string; city: string }
  client: { name: string; document: string; phone: string; address: string } | null
  lines: { name: string; color: string; size: string; quantity: number; unitPrice: number; discountPct: number; lineTotal: number; artistic: boolean }[]
  subtotal: number; discountTotal: number; total: number; artisticTotal: number
  payments: { method: string; bank: string; amount: number }[]
  notes: string
}

const when = (v: string) => new Date(v).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })
const variant = (l: { color: string; size: string }) => [l.color, l.size].filter(Boolean).join(' / ')
const LEGAL = 'Documento de venta — no es factura electrónica DIAN'

export function InvoicePrint({ sale, formato, backHref }: { sale: PrintSale; formato: 'carta' | 'termico'; backHref: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => setHost(document.body), [])
  if (!host) return null
  const normal = sale.lines.filter((l) => !l.artistic)
  const art = sale.lines.filter((l) => l.artistic)
  const carta = formato === 'carta'
  const tab = 'rounded-full px-4 py-1.5 text-sm font-bold transition'

  return createPortal(
    <div className="inv-portal">
      <style>{`
        .inv-portal{position:fixed;inset:0;z-index:2000;overflow:auto;background:#e5e5e5;color:#111;font-family:ui-sans-serif,system-ui,sans-serif}
        .inv-bar{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;padding:.75rem 1rem;background:#fff;border-bottom:1px solid #ccc}
        .inv-sheet{margin:1.5rem auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.2)}
        .inv-carta{width:8.5in;min-height:11in;padding:.6in;font-size:12px}
        .inv-termico{width:80mm;padding:4mm;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;line-height:1.35}
        .inv-sheet table{width:100%;border-collapse:collapse}
        .inv-carta th{background:#f3f0f7;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase}
        .inv-carta td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
        .inv-r{text-align:right}
        .inv-termico hr{border:0;border-top:1px dashed #000;margin:6px 0}
        .inv-termico td{padding:1px 0;vertical-align:top}
        @media print{
          @page{${carta ? 'size:letter;margin:0' : 'size:80mm auto;margin:0'}}
          body>*:not(.inv-portal){display:none!important}
          .inv-portal{position:static;overflow:visible;background:#fff}
          .inv-bar{display:none!important}
          .inv-sheet{margin:0;box-shadow:none}
          ${carta ? '.inv-carta{width:100%;min-height:0}' : ''}
          html,body{background:#fff!important}
        }
      `}</style>
      <div className="inv-bar">
        <Link href={backHref} className={`${tab} border-2 border-plum/20 text-plum`} title="Volver a ventas" aria-label="Volver a ventas"><ArrowLeft size={14} className="inline" /> Volver</Link>
        <div className="flex gap-2" role="tablist" aria-label="Formato de impresión">
          <Link role="tab" aria-selected={carta} href="?formato=carta" replace className={`${tab} ${carta ? 'bg-plum text-white' : 'border-2 border-plum/20 text-plum'}`} title="Factura tamaño carta" aria-label="Formato carta">Carta</Link>
          <Link role="tab" aria-selected={!carta} href="?formato=termico" replace className={`${tab} ${!carta ? 'bg-plum text-white' : 'border-2 border-plum/20 text-plum'}`} title="Tiquete térmico de 80 mm" aria-label="Formato térmico 80 mm">Térmico 80 mm</Link>
        </div>
        <button onClick={() => window.print()} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white" title="Imprimir este documento" aria-label="Imprimir"><Printer size={15} /> Imprimir</button>
      </div>

      {carta ? (
        <article className="inv-sheet inv-carta">
          <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, borderBottom: '2px solid #333', paddingBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Mundo Pinturas Diana" style={{ height: 56, width: 'auto' }} />
              <div><h1 style={{ fontSize: 20, fontWeight: 800 }}>Mundo Pinturas Diana</h1><p>{sale.branch.name}{sale.branch.address ? ` · ${sale.branch.address}` : ''}{sale.branch.city ? `, ${sale.branch.city}` : ''}</p>{sale.branch.phone && <p>Tel. {sale.branch.phone}</p>}</div>
            </div>
            <div className="inv-r"><p style={{ fontSize: 11, textTransform: 'uppercase' }}>Venta N.º</p><p style={{ fontSize: 24, fontWeight: 800 }}>{sale.number}</p><p>{when(sale.createdAt)}</p>{sale.status === 'anulada' && <p style={{ fontWeight: 800, color: '#b00' }}>ANULADA</p>}</div>
          </header>
          <section style={{ display: 'flex', justifyContent: 'space-between', gap: 24, margin: '14px 0' }}>
            <div><p style={{ fontWeight: 700 }}>Cliente</p><p>{sale.client?.name || 'Cliente de mostrador'}</p>{sale.client?.document && <p>Doc. {sale.client.document}</p>}{sale.client?.phone && <p>Tel. {sale.client.phone}</p>}{sale.client?.address && <p>{sale.client.address}</p>}</div>
            <div className="inv-r"><p style={{ fontWeight: 700 }}>Atendió</p><p>{sale.sellerName || '—'}</p></div>
          </section>
          <table>
            <thead><tr><th>Producto</th><th>Color / tamaño</th><th className="inv-r">Cant.</th><th className="inv-r">Precio unit.</th><th className="inv-r">Desc.</th><th className="inv-r">Total</th></tr></thead>
            <tbody>
              {normal.map((l, i) => <tr key={i}><td>{l.name}</td><td>{variant(l) || '—'}</td><td className="inv-r">{l.quantity}</td><td className="inv-r">{money(l.unitPrice)}</td><td className="inv-r">{l.discountPct ? `${l.discountPct}%` : '—'}</td><td className="inv-r">{money(l.lineTotal)}</td></tr>)}
              {art.length > 0 && <tr><td colSpan={6} style={{ background: '#fafafa', fontWeight: 700, paddingTop: 10 }}>Productos artísticos (se facturan pero no suman a las ventas)</td></tr>}
              {art.map((l, i) => <tr key={`a${i}`}><td>{l.name} <em>(artístico)</em></td><td>{variant(l) || '—'}</td><td className="inv-r">{l.quantity}</td><td className="inv-r">{money(l.unitPrice)}</td><td className="inv-r">{l.discountPct ? `${l.discountPct}%` : '—'}</td><td className="inv-r">{money(l.lineTotal)}</td></tr>)}
            </tbody>
          </table>
          <section style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 16 }}>
            <div><p style={{ fontWeight: 700 }}>Forma de pago</p>{sale.payments.map((p, i) => <p key={i} style={{ textTransform: 'capitalize' }}>{p.method}{p.bank ? ` (${p.bank})` : ''}: {money(p.amount)}</p>)}{sale.notes && <p style={{ marginTop: 8 }}>Notas: {sale.notes}</p>}</div>
            <table style={{ width: '3in' }}><tbody>
              <tr><td>Subtotal</td><td className="inv-r">{money(sale.subtotal)}</td></tr>
              <tr><td>Descuento</td><td className="inv-r">−{money(sale.discountTotal)}</td></tr>
              <tr><td style={{ fontWeight: 800, fontSize: 15 }}>Total</td><td className="inv-r" style={{ fontWeight: 800, fontSize: 15 }}>{money(sale.total)}</td></tr>
              {sale.artisticTotal > 0 && <tr><td colSpan={2} style={{ fontSize: 11 }}>Incluye {money(sale.artisticTotal)} en productos artísticos.</td></tr>}
            </tbody></table>
          </section>
          <footer style={{ marginTop: 40, borderTop: '1px solid #999', paddingTop: 8, fontSize: 10, textAlign: 'center' }}>
            <p style={{ fontWeight: 700 }}>{LEGAL}</p>
            <p>[Texto legal por definir con la administración.] Gracias por su compra.</p>
          </footer>
        </article>
      ) : (
        <article className="inv-sheet inv-termico">
          <div style={{ textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Mundo Pinturas Diana" style={{ height: 40, width: 'auto', margin: '0 auto 4px', filter: 'grayscale(1)' }} />
            <p style={{ fontWeight: 700 }}>MUNDO PINTURAS DIANA</p><p>{sale.branch.name}</p>{sale.branch.address && <p>{sale.branch.address}</p>}{sale.branch.phone && <p>Tel. {sale.branch.phone}</p>}
          </div>
          <hr />
          <p>Venta N.º {sale.number}{sale.status === 'anulada' ? ' (ANULADA)' : ''}</p><p>{when(sale.createdAt)}</p><p>Atendió: {sale.sellerName || '—'}</p>
          <p>Cliente: {sale.client?.name || 'Mostrador'}{sale.client?.document ? ` · ${sale.client.document}` : ''}</p>
          <hr />
          <table><tbody>
            {normal.map((l, i) => <tr key={i}><td colSpan={2}>{l.name}{variant(l) ? ` (${variant(l)})` : ''}<br />{l.quantity} x {money(l.unitPrice)}{l.discountPct ? ` -${l.discountPct}%` : ''}</td><td className="inv-r">{money(l.lineTotal)}</td></tr>)}
            {art.length > 0 && <tr><td colSpan={3}><b>ARTISTICOS (no suman a ventas)</b></td></tr>}
            {art.map((l, i) => <tr key={`a${i}`}><td colSpan={2}>{l.name}{variant(l) ? ` (${variant(l)})` : ''}<br />{l.quantity} x {money(l.unitPrice)}{l.discountPct ? ` -${l.discountPct}%` : ''}</td><td className="inv-r">{money(l.lineTotal)}</td></tr>)}
          </tbody></table>
          <hr />
          <table><tbody>
            <tr><td>Subtotal</td><td className="inv-r">{money(sale.subtotal)}</td></tr>
            <tr><td>Descuento</td><td className="inv-r">-{money(sale.discountTotal)}</td></tr>
            <tr><td><b>TOTAL</b></td><td className="inv-r"><b>{money(sale.total)}</b></td></tr>
          </tbody></table>
          <hr />
          {sale.payments.map((p, i) => <p key={i} style={{ textTransform: 'capitalize' }}>{p.method}{p.bank ? ` (${p.bank})` : ''}: {money(p.amount)}</p>)}
          <hr />
          <p style={{ textAlign: 'center' }}>{LEGAL}</p><p style={{ textAlign: 'center' }}>Gracias por su compra</p>
        </article>
      )}
    </div>,
    host,
  )
}
