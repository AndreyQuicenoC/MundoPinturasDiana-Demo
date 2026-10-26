import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { mapEmbedSrc } from './map-embed'
import { TodayStatus } from './today-status'
import { prettyPhone } from './phone'
import { waLink } from '@/lib/format'
import { CLOSED_DAYS_TEXT, SCHEDULE_TEXT } from '@/lib/schedule'

// Acentos de la paleta de marca (clases completas para que Tailwind las detecte).
const ACCENTS = [
  { shadow: 'shadow-[8px_8px_0_0_#00ACC1]', dot: 'bg-cyan', ring: 'border-plum' },
  { shadow: 'shadow-[8px_8px_0_0_#E11D74]', dot: 'bg-brand', ring: 'border-plum' },
  { shadow: 'shadow-[8px_8px_0_0_#ffc93c]', dot: 'bg-sun', ring: 'border-plum' },
  { shadow: 'shadow-[8px_8px_0_0_#4A154B]', dot: 'bg-plum', ring: 'border-plum' },
]

export type BranchView = { id: string | number; name: string; address: string; city?: string | null; schedule?: string | null; mapsUrl?: string | null; mapQuery?: string | null }

export function BranchCard({ b, index, whatsapp, variant, mirror }: { b: BranchView; index: number; whatsapp: string; variant: 'featured' | 'tile'; mirror?: boolean }) {
  const a = ACCENTS[index % ACCENTS.length]
  const featured = variant === 'featured'
  return (
    <article className={`grid gap-6 ${featured ? 'lg:grid-cols-[1fr_1.2fr] lg:gap-8' : ''}`}>
      <div className={`rounded-3xl border-2 bg-white p-7 md:p-8 ${a.ring} ${a.shadow} ${featured && mirror ? 'lg:order-2' : ''}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-full font-display text-sm font-extrabold ${a.dot} ${index % 4 === 2 ? 'text-plum' : 'text-white'}`}>{index + 1}</span>
          {featured && <span className="rounded-full border-2 border-dashed border-plum/40 bg-sun/30 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-plum">Sede principal</span>}
        </div>
        <h2 className={`mt-4 font-display font-extrabold text-plum ${featured ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{b.name}</h2>
        <div className="mt-3"><TodayStatus /></div>
        <ul className="mt-6 space-y-4">
          <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />{b.address}, {b.city ?? 'Cali'}</li>
          <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /><a className="hover:underline" href={`tel:+${whatsapp}`}>{prettyPhone(`${whatsapp}`)}</a></li>
          <li className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /><span>{b.schedule || SCHEDULE_TEXT}<span className="mt-1 block text-sm text-ink/60">{CLOSED_DAYS_TEXT}</span></span></li>
        </ul>
        <a href={waLink(whatsapp, `Hola, quisiera información de la sede ${b.name}.`)} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1FA855] px-6 py-3.5 font-bold text-white transition hover:brightness-110"><MessageCircle className="size-5" aria-hidden />Escribir por WhatsApp</a>
      </div>
      <div className={`overflow-hidden rounded-3xl border-2 border-plum bg-plum-soft ${featured ? 'min-h-[360px]' : 'h-72'}`}>
        <iframe title={`Mapa de ${b.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full min-h-[280px]" src={mapEmbedSrc(b.mapsUrl, `${b.address}, ${b.city ?? 'Cali'}`, b.mapQuery)} />
      </div>
    </article>
  )
}
