'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'
import { Blob, Star } from '@/components/ui/splash'
import { bogotaDay } from '@/lib/schedule'
import { waLink } from '@/lib/format'
import type { PublicPromotion } from '@/lib/data'

const fmt = (iso: string) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

// Regla pública: tiene imagen, título, descripción y hashtags, ya comenzó (inicio <= hoy) y no ha terminado (hoy <= fin).
const isPublic = (p: PublicPromotion, today: string) => !!(p.image && p.title && p.description && p.hashtags) && p.startDate <= today && today <= p.endDate

const track = (promotion: string) => {
  try {
    fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'whatsapp_promo', path: window.location.pathname, promotion }), keepalive: true }).catch(() => {})
  } catch {}
}

export function PromotionsSection({ promotions, today: serverToday, whatsapp }: { promotions: PublicPromotion[]; today: string; whatsapp: string }) {
  const [today, setToday] = useState(serverToday)
  useEffect(() => setToday(bogotaDay()), [])
  const list = promotions.filter((p) => isPublic(p, today))

  return (
    <section className="relative overflow-hidden bg-plum-soft py-20" aria-labelledby="promos">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Hay color en juego</p>
          <h2 id="promos" className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">Promociones y sorteos</h2>
        </Reveal>

        {list.length ? (
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-plum bg-white shadow-[8px_8px_0_0_#E11D74]">
                  <div className="relative aspect-[4/3] bg-plum-soft">
                    <Image src={p.image} alt={p.title} fill sizes="(max-width:768px) 100vw, 400px" className="object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-sun px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-plum">{p.kind === 'sorteo' ? 'Sorteo' : 'Promoción'}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl font-bold leading-tight text-plum">{p.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-ink/75">{p.description}</p>
                    <p className="mt-3 text-sm font-bold text-brand">{p.hashtags}</p>
                    <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink/60">Válido hasta el {fmt(p.endDate)}</p>
                    <div className="mt-auto pt-6">
                    <a
                      href={waLink(whatsapp, `Hola, quiero participar en: ${p.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track(p.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1FA855] px-6 py-3.5 font-bold text-white transition hover:brightness-110"
                    >
                      <MessageCircle className="size-5" aria-hidden /> Quiero participar
                    </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="relative mx-auto mt-10 max-w-3xl rotate-[-1.5deg] overflow-hidden rounded-[2.5rem] border-4 border-dashed border-plum bg-sun p-10 text-center shadow-[10px_10px_0_0_#4A154B] md:p-14">
              <Blob className="absolute -left-10 -top-10 size-44 opacity-40" color="#E11D74" />
              <Blob className="absolute -bottom-12 -right-8 size-48 opacity-40" color="#00ACC1" />
              <Star className="absolute right-8 top-6 size-8 animate-float" color="#4A154B" />
              <div className="relative">
                <Sparkles className="mx-auto size-10 text-plum" aria-hidden />
                <p className="mt-3 font-display text-4xl font-extrabold leading-tight text-plum md:text-5xl">¡Mantente atento!</p>
                <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-plum/85">Estamos mezclando nuevas promociones y sorteos para que tu próximo proyecto salga con más color. Vuelve pronto o síguenos en redes: lo bueno se pinta despacio, pero llega.</p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
