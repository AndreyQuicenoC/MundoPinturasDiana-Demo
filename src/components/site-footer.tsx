import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, MessageCircle } from 'lucide-react'
import type { SiteSettingsData } from '@/lib/data'

const Ig = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
)
const Fb = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>
)
const Tt = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.5 2 4 5 4" /></svg>
)

export function SiteFooter({ settings }: { settings: SiteSettingsData }) {
  const socials = [
    { label: 'Instagram', url: settings.instagram, Icon: Ig },
    { label: 'Facebook', url: settings.facebook, Icon: Fb },
    { label: 'TikTok', url: settings.tiktok, Icon: Tt },
  ]
  const pretty = settings.whatsapp.replace(/^57(\d{3})(\d{3})(\d{4})$/, '+57 $1 $2 $3')
  return (
    <footer className="relative mt-24 overflow-hidden bg-plum text-white">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#E11D74_0_50%,#00ACC1_50%)]" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:px-10">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="" width={56} height={56} className="size-14 rounded-full bg-white object-cover" />
            <p className="font-display text-xl font-extrabold leading-tight">Mundo Pinturas<br /><span className="text-[#69E8FE]">Diana</span></p>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">Pinturas y asesoría en Cali. Atención por WhatsApp y en tienda.</p>
          <div className="mt-6 flex gap-3">
            {socials.map(({ label, url, Icon }) =>
              url ? (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-white/25 transition hover:-translate-y-1 hover:bg-brand">
                  <Icon className="size-5" />
                </a>
              ) : (
                <span key={label} role="img" aria-label={`${label} (próximamente)`} title="Próximamente" className="grid size-11 place-items-center rounded-full border border-dashed border-white/20 text-white/40">
                  <Icon className="size-5" />
                </span>
              ),
            )}
          </div>
        </div>
        <nav aria-label="Pie de página">
          <p className="font-mono text-xs uppercase tracking-widest text-[#69E8FE]">Explora</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {[['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/carrito', 'Carrito'], ['/sobre-nosotros', 'Nosotros'], ['/sedes', 'Sedes y contacto'], ['/mapa-del-sitio', 'Mapa del sitio']].map(([h, l]) => (
              <li key={h}><Link href={h} className="text-white/80 transition hover:text-white hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4">{l}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#69E8FE]">Equipo</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link href="/login" className="text-white/80 hover:text-white hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4">Ingreso del personal</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#69E8FE]">Contacto</p>
          <ul className="mt-4 space-y-3 text-[15px] text-white/85">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />{settings.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /><a href={`tel:+${settings.whatsapp}`} className="hover:underline">{pretty}</a></li>
            <li className="flex gap-3"><MessageCircle className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /><a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-white/55 md:flex-row md:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Mundo Pinturas Diana · Cali, Colombia</p>
          <p>Precios sujetos a confirmación y disponibilidad. Tus datos se tratan conforme a la Ley 1581 de 2012 (Habeas Data).</p>
        </div>
      </div>
    </footer>
  )
}
