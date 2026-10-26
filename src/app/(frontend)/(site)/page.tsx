import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MessageCircle, Palette, ShoppingBag, Send, MapPin } from 'lucide-react'
import { getBestSellerIds, getBranches, getProducts, getPromotions, getPublicEvents, getSiteImages, getSiteSettings, serverToday, type PublicProduct } from '@/lib/data'
import { Reveal } from '@/components/ui/reveal'
import { Blob, BrushUnderline, Squiggle, Star, Sticker } from '@/components/ui/splash'
import { ProductCard } from '@/components/product-card'
import { waLink } from '@/lib/format'
import { ProductCarousel } from '@/components/site/product-carousel'
import { PromotionsSection } from '@/components/site/promotions-section'
import { EventsSection } from '@/components/site/events-section'
import { Brush, Building2, Droplets, Layers, Paintbrush, Sun } from 'lucide-react'


export default async function Home() {
  const [products, settings, branches, imgs, bestIds, promotions, events] = await Promise.all([getProducts(), getSiteSettings(), getBranches(), getSiteImages(), getBestSellerIds(), getPromotions(), getPublicEvents()])
  const today = serverToday()
  const flagship = products.filter((p) => p.featured).slice(0, 8)
  const words = ['Vinilos DECO', 'Interiores', 'Exteriores', 'Esmaltes', 'Lacas', 'Pintura de tráfico', 'Murales', 'Asesoría de color']

  const norm = (s?: string | null) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const slugOf = (re: RegExp, fallback: string) => products.find((p) => p.categorySlug && re.test(norm(p.category)))?.categorySlug ?? fallback
  const byRank = new Map(bestIds.map((id, i) => [id, i]))
  const bestSellers = bestIds.length
    ? products.filter((p) => byRank.has(String(p.id))).sort((a, b) => byRank.get(String(a.id))! - byRank.get(String(b.id))!).slice(0, 10)
    : [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 10)
  const pick = (f: (p: PublicProduct) => boolean) => products.filter(f).slice(0, 10)
  const carousels = [
    { id: 'mas-vendidos', kicker: 'Lo que más se lleva Cali', title: 'Los más vendidos', href: '/catalogo', products: bestSellers, color: '#E11D74' },
    { id: 'artisticos', kicker: 'Para crear', title: 'Artísticos', href: '/catalogo?tipo=artistico', products: pick((p) => p.artistic || /artistic/.test(norm(p.category))), color: '#00ACC1' },
    { id: 'ferreteria', kicker: 'Todo para el trabajo', title: 'Ferretería', href: `/catalogo?categoria=${slugOf(/ferreter/, 'ferreteria')}`, products: pick((p) => /ferreter/.test(norm(p.category))), color: '#FFC93C' },
    { id: 'esmaltes', kicker: 'Protección y acabado', title: 'Esmaltes, lacas y anticorrosivos', href: `/catalogo?categoria=${slugOf(/esmalte|laca|anticorros/, 'esmaltes-lacas-y-anticorrosivos')}`, products: pick((p) => /esmalte|laca|anticorros/.test(norm(`${p.category} ${p.productType}`))), color: '#4A154B' },
  ]

  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <Blob className="pointer-events-none absolute -left-32 top-24 size-[420px] opacity-[.12]" color="#00ACC1" />
        <Blob className="pointer-events-none absolute -right-24 -top-10 size-[520px] animate-spin-slow opacity-[.10]" color="#E11D74" />
        <Star className="absolute right-[8%] top-[18%] hidden size-10 animate-float md:block" />
        <Star className="absolute bottom-[14%] left-[6%] hidden size-7 animate-float md:block" color="#00ACC1" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 md:px-10 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
          <div>
            <Sticker className="animate-rise">Cali, Colombia</Sticker>
            <h1 className="mt-6 animate-rise font-display text-[clamp(2.8rem,7.4vw,6.2rem)] font-extrabold leading-[.95] tracking-tight text-plum [animation-delay:80ms]">
              Llenamos tus
              <br />
              espacios de{' '}
              <span className="relative inline-block text-brand">
                color
                <BrushUnderline className="absolute -bottom-3 left-0 h-4 w-full" color="#00ACC1" />
              </span>
              .
            </h1>
            <p className="mt-8 max-w-xl animate-rise text-lg leading-relaxed text-ink/75 [animation-delay:160ms]">
              Fabricamos nuestra propia marca de pintura, DECO, y te ofrecemos acabados para renovar tu casa, tu negocio o tu mural. Elige en el catálogo, arma tu pedido y confírmalo con nosotros por WhatsApp.
            </p>
            <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/catalogo" className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-bold text-white shadow-[5px_5px_0_0_#4A154B] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#4A154B]">
                Ver catálogo <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <a href={waLink(settings.whatsapp, 'Hola, quisiera información sobre pinturas.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-plum px-7 py-4 font-bold text-plum transition hover:bg-plum hover:text-white">
                <MessageCircle className="size-5" aria-hidden /> Escribir por WhatsApp
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-pop [animation-delay:200ms]">
            <div className="absolute -inset-3 rotate-3 rounded-[2.5rem] bg-cyan" aria-hidden />
            <div className="absolute -inset-3 -rotate-2 rounded-[2.5rem] border-2 border-dashed border-plum/40" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-plum-soft">
              {imgs.hero && <Image src={imgs.hero.url} alt={imgs.hero.alt} fill priority sizes="(max-width:1024px) 90vw, 440px" className="object-cover" />}
            </div>
            <div className="absolute -bottom-7 -left-6 grid size-28 rotate-[-8deg] place-items-center rounded-full border-4 border-white bg-white shadow-xl animate-float">
              <Image src="/brand/logo.png" alt="Logo Mundo Pinturas Diana" width={96} height={96} className="size-24 rounded-full object-cover" />
            </div>
            <Sticker className="absolute -right-2 top-6 rotate-6 bg-white">Imagen de referencia</Sticker>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y-2 border-plum bg-plum py-4 text-white" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl font-bold">
          {[...words, ...words, ...words, ...words].map((w, i) => (
            <span key={i} className="flex items-center gap-10">{w}<Star className="size-5" color={i % 2 ? '#00ACC1' : '#E11D74'} /></span>
          ))}
        </div>
      </div>

      <section className="bg-paper py-24" aria-labelledby="deco">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Marca propia</p>
            <h2 id="deco" className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight text-plum md:text-5xl">DECO: pintura hecha por nosotros, para Cali</h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink/75">En Mundo Pinturas Diana fabricamos DECO, nuestra marca de pinturas. Nuestra fortaleza son los <strong className="text-plum">vinilos</strong>, y también producimos lacas, esmaltes, pintura de tráfico y otros acabados. Además preparamos el color a tu medida con nuestro servicio de mezcla.</p>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { t: 'Interiores', d: 'Vinilos para salas, cuartos y oficinas.', I: Paintbrush, c: 'bg-brand' },
              { t: 'Exteriores', d: 'Protección para fachadas bajo el sol y la lluvia.', I: Sun, c: 'bg-cyan' },
              { t: 'Murales', d: 'Color vivo para arte urbano y proyectos de ciudad.', I: Brush, c: 'bg-plum' },
              { t: 'Pintura de casas', d: 'Renovamos hogares, locales y obras.', I: Building2, c: 'bg-brand' },
              { t: 'Mezcla de colores', d: 'Entrega el tono que imaginaste.', I: Droplets, c: 'bg-cyan' },
            ].map((x, i) => (
              <Reveal key={x.t} as="li" delay={i * 80}>
                <div className="h-full rounded-3xl border-2 border-plum bg-white p-6 shadow-[6px_6px_0_0_#4A154B] transition hover:-translate-y-1">
                  <span className={`grid size-12 place-items-center rounded-2xl text-white ${x.c}`}><x.I className="size-6" aria-hidden /></span>
                  <h3 className="mt-5 font-display text-xl font-bold text-plum">{x.t}</h3>
                  <p className="mt-1.5 text-sm text-ink/70">{x.d}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal>
            <p className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-plum"><Layers className="size-4 text-brand" aria-hidden />También: lacas · esmaltes · pintura de tráfico · acabados especiales</p>
          </Reveal>
        </div>
      </section>

      {flagship.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-24 md:px-10" aria-labelledby="insignia">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Del catálogo</p>
                <h2 id="insignia" className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">Productos insignia</h2>
                <Squiggle className="mt-3 h-4 w-44" />
              </div>
              <Link href="/catalogo" className="group inline-flex items-center gap-2 font-bold text-brand">Ver todo <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {flagship.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard p={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {carousels.map((c) => (
        <ProductCarousel key={c.id} {...c} />
      ))}

      <PromotionsSection promotions={promotions} today={today} whatsapp={settings.whatsapp} />

      <EventsSection events={events} today={today} />

      <section className="bg-paper py-24" aria-labelledby="como">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal><h2 id="como" className="font-display text-4xl font-extrabold text-plum md:text-5xl">Así pides, sin filas</h2></Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Elige', d: 'Busca por nombre, marca o categoría y agrega al carrito.', I: Palette, c: 'bg-brand' },
              { n: '02', t: 'Revisa', d: 'Verificamos precios y disponibilidad antes de enviar tu pedido.', I: ShoppingBag, c: 'bg-cyan' },
              { n: '03', t: 'Confirma por WhatsApp', d: 'Te llega el resumen listo para enviar a la sede que prefieras.', I: Send, c: 'bg-plum' },
            ].map((s, i) => (
              <Reveal key={s.n} as="li" delay={i * 120}>
                <div className="h-full rounded-3xl border-2 border-plum bg-white p-7 shadow-[6px_6px_0_0_#4A154B] transition hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`grid size-14 place-items-center rounded-2xl text-white ${s.c}`}><s.I className="size-7" aria-hidden /></span>
                    <span className="font-display text-5xl font-extrabold text-plum/15">{s.n}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-plum">{s.t}</h3>
                  <p className="mt-2 text-ink/70">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink/60">Precios sujetos a confirmación y disponibilidad.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:px-10 lg:grid-cols-2" aria-labelledby="historia">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-3 -rotate-3 rounded-[2rem] bg-brand/90" aria-hidden />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] bg-plum-soft">
              {imgs.mural && <Image src={imgs.mural.url} alt={imgs.mural.alt} fill sizes="(max-width:1024px) 90vw, 600px" className="object-cover" />}
            </div>
            <Sticker className="absolute -bottom-4 right-4 rotate-3 bg-white">Imagen de referencia</Sticker>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Nuestra historia</p>
          <h2 id="historia" className="mt-2 font-display text-4xl font-extrabold leading-tight text-plum md:text-5xl">17 años pintando Cali. Y seguimos.</h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/75">Después de cerca de 17 años en San Nicolás, un terremoto nos obligó a empezar de nuevo en otro lugar. Aquí contamos cómo seguimos adelante.</p>
          <Link href="/sobre-nosotros" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-plum px-6 py-3.5 font-bold text-white transition hover:bg-brand">Conocer la historia <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
        </Reveal>
      </section>

      <section className="px-5 pb-8 md:px-10">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-plum p-10 text-white md:p-16">
            <Blob className="absolute -right-16 -top-16 size-80 opacity-30" color="#E11D74" />
            <Blob className="absolute -bottom-24 left-1/3 size-72 opacity-25" color="#00ACC1" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display text-4xl font-extrabold md:text-5xl">Visítanos en Cali</h2>
                <p className="mt-4 flex items-start gap-3 text-lg text-white/85"><MapPin className="mt-1 size-5 shrink-0 text-[#69E8FE]" aria-hidden />{branches[0]?.address ?? settings.address}</p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/sedes" className="rounded-full bg-white px-6 py-3.5 font-bold text-plum transition hover:bg-[#69E8FE]">Cómo llegar</Link>
                <a href={waLink(settings.whatsapp, 'Hola, quisiera hacer un pedido.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1FA855] px-6 py-3.5 font-bold text-white transition hover:brightness-110"><MessageCircle className="size-5" aria-hidden />WhatsApp</a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
