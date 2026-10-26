import type { Metadata } from 'next'
import { getBranches, getSiteSettings } from '@/lib/data'
import { Reveal } from '@/components/ui/reveal'
import { Sticker } from '@/components/ui/splash'
import { BranchCard, type BranchView } from '@/components/site/branch-card'

export const metadata: Metadata = { title: 'Sedes y contacto | Mundo Pinturas Diana', description: 'Dirección, teléfono y WhatsApp de Mundo Pinturas Diana en Cali.' }

export default async function Sedes() {
  const [branches, s] = await Promise.all([getBranches(), getSiteSettings()])
  const list: BranchView[] = branches.length ? branches : [{ id: 0, name: 'Sede actual', address: s.address }]
  const [first, ...rest] = list
  const ld = { '@context': 'https://schema.org', '@type': 'HardwareStore', name: 'Mundo Pinturas Diana', address: { '@type': 'PostalAddress', streetAddress: list[0].address, addressLocality: 'Cali', addressCountry: 'CO' }, telephone: `+${s.whatsapp}`, openingHours: ['Mo-Sa 08:00-17:00', 'Su 08:00-12:00'] }
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Sticker>Cali, Colombia</Sticker>
      <h1 className="mt-5 font-display text-5xl font-extrabold text-plum md:text-6xl">Sedes y contacto</h1>
      <p className="mt-4 max-w-2xl text-ink/70">Encuentra la sede más cercana, revisa si estamos abiertos hoy y escríbenos por WhatsApp.</p>
      <div className="mt-12 space-y-14">
        <Reveal><BranchCard b={first} index={0} whatsapp={s.whatsapp} variant="featured" /></Reveal>
        {rest.length === 1 && (
          <Reveal><BranchCard b={rest[0]} index={1} whatsapp={s.whatsapp} variant="featured" mirror /></Reveal>
        )}
        {rest.length > 1 && (
          <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
            {rest.map((b, i) => (
              <Reveal key={b.id} delay={(i % 2) * 120} className={`${i % 2 === 1 ? 'md:mt-16' : ''} ${rest.length % 2 === 1 && i === rest.length - 1 ? 'md:col-span-2' : ''}`}>
                <BranchCard b={b} index={i + 1} whatsapp={s.whatsapp} variant={rest.length % 2 === 1 && i === rest.length - 1 ? 'featured' : 'tile'} mirror={i % 2 === 0} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
