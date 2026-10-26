'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CalendarDays, PartyPopper } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'
import { bogotaDay } from '@/lib/schedule'
import type { PublicEvent } from '@/lib/data'

const fmt = (iso: string) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
const LABEL: Record<string, string> = { promocion: 'Promoción', capacitacion: 'Capacitación', entrega: 'Entrega', festivo: 'Festivo', social: 'Evento social', atipico: 'Especial', otro: 'Evento' }

export function EventsSection({ events, today: serverToday }: { events: PublicEvent[]; today: string }) {
  const [today, setToday] = useState(serverToday)
  useEffect(() => setToday(bogotaDay()), [])
  const list = events.filter((e) => e.endDate >= today).slice(0, 6)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-10" aria-labelledby="eventos">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Pasa por la tienda</p>
        <h2 id="eventos" className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">Eventos</h2>
      </Reveal>
      {list.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((e, i) => (
            <Reveal key={e.id} delay={i * 90}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-plum/15 bg-white transition hover:-translate-y-1 hover:border-plum hover:shadow-[8px_8px_0_0_#00ACC1]">
                <div className="relative aspect-[16/10] bg-plum-soft">
                  {e.image ? <Image src={e.image} alt={e.title} fill sizes="(max-width:768px) 100vw, 400px" className="object-cover" /> : <div className="dots grid h-full place-items-center"><CalendarDays className="size-10 text-plum/30" aria-hidden /></div>}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-dark">{LABEL[e.type] ?? 'Evento'}</p>
                  <h3 className="mt-1.5 font-display text-xl font-bold text-plum">{e.title}</h3>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand"><CalendarDays className="size-4" aria-hidden />{e.endDate !== e.startDate ? `Del ${fmt(e.startDate)} al ${fmt(e.endDate)}` : fmt(e.startDate)}</p>
                  {e.description && <p className="mt-3 text-ink/70">{e.description}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal>
          <div className="stripes mt-10 rounded-3xl border-2 border-dashed border-plum/30 p-12 text-center">
            <PartyPopper className="mx-auto size-10 text-brand" aria-hidden />
            <p className="mt-4 font-display text-2xl font-bold text-plum">Aún no hay eventos programados</p>
            <p className="mt-1 text-ink/65">Cuando tengamos talleres, jornadas o celebraciones, los verás aquí.</p>
          </div>
        </Reveal>
      )}
    </section>
  )
}
