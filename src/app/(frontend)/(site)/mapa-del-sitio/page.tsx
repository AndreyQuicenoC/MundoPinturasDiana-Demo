import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mapa del sitio | Mundo Pinturas Diana' }

const groups = [
  { t: 'Público', l: [['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/carrito', 'Carrito'], ['/sobre-nosotros', 'Sobre nosotros'], ['/sedes', 'Sedes y contacto']] },
  { t: 'Equipo', l: [['/login', 'Ingreso del personal']] },
  { t: 'Información', l: [['/mapa-del-sitio', 'Mapa del sitio']] },
]

export default function SiteMap() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-8 pt-14 md:px-10">
      <h1 className="font-display text-5xl font-extrabold text-plum">Mapa del sitio</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {groups.map((g) => (
          <nav key={g.t} aria-label={g.t} className="rounded-3xl border-2 border-plum/15 p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-cyan-dark">{g.t}</h2>
            <ul className="mt-4 space-y-2">{g.l.map(([h, n]) => <li key={h}><Link className="font-semibold text-plum hover:text-brand hover:underline" href={h}>{n}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
    </div>
  )
}
