import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Coffee, ImagePlus } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'
import { Blob, Squiggle, Star, Sticker } from '@/components/ui/splash'
import { getSiteImages, getSiteSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Sobre nosotros | Mundo Pinturas Diana',
  description: 'La historia de Mundo Pinturas Diana: cerca de 17 años en San Nicolás, Cali, y la decisión de seguir adelante tras el terremoto del 10 de agosto de 2026.',
}

const team = [
  { n: 'Diana Ivón Cabrera Marín', r: 'Jefe', q: 'Cada color cuenta una historia; yo solo me aseguro de que la tuya se vea tal como la imaginaste.', c: 'bg-brand' },
  { n: 'Yoselyn Ramírez', r: 'Equipo', q: 'Si lo puedes soñar, lo podemos mezclar.', c: 'bg-cyan' },
  { n: 'Johana Dueñas', r: 'Equipo', q: 'Una buena asesoría es el primer pincel de cualquier proyecto.', c: 'bg-plum' },
  { n: 'Sahir Collazos', r: 'Equipo', q: 'Entre rodillos, tonos y esmaltes, mi meta es que te lleves la solución exacta.', c: 'bg-sun text-plum' },
]

export default async function About() {
  const [s, imgs] = await Promise.all([getSiteSettings(), getSiteImages()])
  const steps = [
    { t: 'Cerca de 17 años en San Nicolás', d: 'Mundo Pinturas Diana funcionó durante aproximadamente 17 años en la calle 15 #7-79, en el sector de San Nicolás, Cali. Allí se construyó una clientela y una rutina de trabajo diaria.', c: 'bg-plum' },
    { t: '10 de agosto de 2026', d: 'Un terremoto hizo caer una pared colindante sobre la cubierta del local. Las intervenciones posteriores y la lluvia agravaron las afectaciones en mobiliario, exhibidores, pinturas y materias primas.', c: 'bg-brand' },
    { t: 'Un nuevo lugar', d: `El negocio tuvo que trasladarse y hoy atiende en ${s.address}. Cambió la dirección; las ganas de seguir pintando Cali, no.`, c: 'bg-cyan' },
  ]
  return (
    <>
      <section className="relative overflow-hidden">
        <Blob className="absolute -right-20 -top-20 size-[440px] opacity-[.1]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-10">
          <Sticker>Sobre nosotros</Sticker>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-extrabold leading-[.98] tracking-tight text-plum">Detrás de cada dirección hay años de trabajo.</h1>
          <Squiggle className="mt-5 h-5 w-60" color="#E11D74" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-10" aria-labelledby="pasion">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-plum bg-white p-8 shadow-[10px_10px_0_0_#E11D74] md:p-14">
            <Star className="absolute right-8 top-8 size-10 animate-float" />
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Nuestra Historia</p>
            <h2 id="pasion" className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-tight text-plum md:text-5xl">Pasión por el Color y Raíces Caleñas</h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink/75">Más de una década y media transformando fachadas, hogares y proyectos de infraestructura en el Valle del Cauca con precisión cromática, calidez humana y compromiso genuino.</p>
            <p className="mt-6 inline-flex rounded-full bg-plum px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white">Cali, Colombia · Fundada en 2009 · Sede Centro</p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-10" aria-labelledby="historia">
        <h2 id="historia" className="sr-only">Nuestra historia</h2>
        <ol className="relative grid gap-8 md:grid-cols-3">
          {steps.map((st, i) => (
            <Reveal as="li" key={st.t} delay={i * 130}>
              <div className="h-full rounded-3xl border-2 border-plum bg-white p-7 shadow-[6px_6px_0_0_#4A154B]">
                <span className={`grid size-12 place-items-center rounded-full font-display text-xl font-extrabold text-white ${st.c}`}>{i + 1}</span>
                <h3 className="mt-5 font-display text-2xl font-bold text-plum">{st.t}</h3>
                <p className="mt-3 leading-relaxed text-ink/75">{st.d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10 max-w-3xl">
          <p className="text-lg leading-relaxed text-ink/75">Esta historia no es una queja ni una campaña: es el recuerdo de una comunidad de clientes, vecinos y colegas que acompañó al negocio, y la decisión de continuar.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-10" aria-labelledby="cafe">
        <Reveal>
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-sun p-8 md:grid-cols-[auto_1fr] md:p-14">
            <Blob className="absolute -right-16 -top-16 size-64 opacity-30" color="#E11D74" />
            <div className="relative grid size-28 place-items-center rounded-full border-4 border-plum bg-white shadow-[6px_6px_0_0_#4A154B] md:size-36"><Coffee className="size-14 text-plum md:size-16" aria-hidden /></div>
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-widest text-plum/70">Un detalle de casa</p>
              <h2 id="cafe" className="mt-2 font-display text-3xl font-extrabold text-plum md:text-4xl">El tintico de cada día</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-plum/90">Durante estos 17 años, a quien cruzaba nuestra puerta le recibimos con un pocillo de café caliente. No era una estrategia: era la manera de decir «siéntese, aquí lo atendemos como en su casa». Entre un tinto y otro se escogieron colores, se contaron historias y nacieron amistades que todavía nos acompañan. Ese gesto sencillo sigue siendo parte de lo que somos.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-paper py-20" aria-labelledby="emblema">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-10 lg:grid-cols-2">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Emblema de calidad y compromiso</p>
            <h2 id="emblema" className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">«Los que le ponen color a Cali»</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/75">Este distintivo representa nuestro compromiso con Cali y con cada persona que confía en nosotros. Trabajamos para ofrecer productos de calidad, asesoría cercana y soluciones de pintura que acompañen cada proyecto, desde las pequeñas mejoras del hogar hasta las iniciativas que llenan de color nuestra ciudad.</p>
            <ul className="mt-6 space-y-3">
              {['Preparación de color a tu medida', 'Asesoría cercana y especializada', 'Atención comprometida con cada proyecto'].map((t) => (
                <li key={t} className="flex items-center gap-3 font-semibold text-plum"><span className="grid size-7 place-items-center rounded-full bg-brand text-white"><Check className="size-4" aria-hidden /></span>{t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-3 rotate-3 rounded-[2.5rem] bg-cyan" aria-hidden />
              {/* REEMPLAZABLE: sustituir este recuadro por la imagen real del sticker de los empleados. */}
              <div data-replaceable="sticker-empleados" className="stripes relative grid aspect-square place-items-center rounded-[2rem] border-2 border-dashed border-plum/50 bg-white p-6 text-center">
                <div>
                  <ImagePlus className="mx-auto size-10 text-plum/50" aria-hidden />
                  <p className="mt-3 font-display text-xl font-bold text-plum">[Sticker de empleados]</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-plum/60">Espacio reemplazable por la imagen oficial</p>
                </div>
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full border-2 border-plum bg-sun px-5 py-2 font-mono text-xs font-medium uppercase tracking-widest text-plum shadow-[4px_4px_0_0_#4A154B]">Sello original caleño</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-20" aria-labelledby="diana">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-10 lg:grid-cols-2">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Quién está al frente</p>
            <h2 id="diana" className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">Diana Ivón Cabrera Marín</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">«[Mensaje de presentación de Diana: aquí irá el saludo que ella quiera compartir con sus clientes, con sus palabras.]»</p>
            <Sticker className="mt-5">Texto reemplazable · pendiente de Diana</Sticker>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border-2 border-plum bg-plum-soft">
              {imgs.team && <Image src={imgs.team.url} alt={imgs.team.alt} fill sizes="(max-width:1024px) 90vw, 600px" className="object-cover" />}
              <Sticker className="absolute bottom-4 left-4 bg-white">Imagen de referencia</Sticker>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-10" aria-labelledby="equipo">
        <h2 id="equipo" className="font-display text-4xl font-extrabold text-plum">El equipo</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal as="li" key={m.n} delay={i * 80}>
              <div className="flex h-full flex-col rounded-3xl border-2 border-plum bg-white p-6 shadow-[6px_6px_0_0_#00ACC1]">
                <span className={`grid size-16 place-items-center rounded-full font-display text-2xl font-extrabold text-white ${m.c}`} aria-hidden>{m.n[0]}</span>
                <h3 className="mt-5 font-display text-xl font-bold text-plum">{m.n}</h3>
                <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-dark">{m.r}</p>
                <p className="mt-4 text-ink/75">«{m.q}»</p>
              </div>
            </Reveal>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Link href="/sedes" className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-bold text-white">Visítanos <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
        </div>
      </section>
    </>
  )
}
