'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, ShoppingBag, MessageCircle, LogIn } from 'lucide-react'
import { useCart } from './cart/cart-provider'

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/sobre-nosotros', label: 'Nosotros' },
  { href: '/sedes', label: 'Sedes y contacto' },
]

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  const path = usePathname()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h))

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_8px_30px_-12px_rgba(74,21,75,.25)]' : ''}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-5 md:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="Mundo Pinturas Diana, inicio">
          <Image src="/brand/logo.png" alt="" width={52} height={52} priority className="size-12 rounded-full object-cover ring-2 ring-plum/10 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105" />
          <span className="hidden font-display text-[17px] font-extrabold leading-[1.05] text-plum sm:block">
            Mundo Pinturas
            <br />
            <span className="text-brand">Diana</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? 'page' : undefined} className="group relative px-4 py-2 text-[15px] font-semibold text-ink/80 transition-colors hover:text-plum aria-[current=page]:text-plum">
              {l.label}
              <span className="absolute inset-x-4 -bottom-0.5 h-[3px] origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full bg-[#1FA855] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg md:inline-flex">
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
          <Link href="/carrito" aria-label={`Carrito, ${count} productos`} className="relative grid size-11 place-items-center rounded-full border-2 border-plum/15 text-plum transition hover:border-brand hover:text-brand">
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span key={count} className="absolute -right-1 -top-1 grid min-w-5 animate-pop place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <Link href="/login" className="hidden items-center gap-2 rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand sm:inline-flex">
            <LogIn className="size-4" aria-hidden /> Ingresar
          </Link>
          <button type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen((v) => !v)} className="grid size-11 place-items-center rounded-full border-2 border-plum/15 text-plum lg:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-[linear-gradient(90deg,#4A154B_0_33%,#E11D74_33%_66%,#00ACC1_66%)]" aria-hidden />

      {open && (
        <div id="menu-movil" className="fixed inset-x-0 top-[76px] bottom-0 animate-pop overflow-y-auto bg-white px-5 pb-10 pt-6 lg:hidden">
          <ul className="space-y-1">
            {LINKS.map((l, i) => (
              <li key={l.href} style={{ animationDelay: `${i * 50}ms` }} className="animate-rise">
                <Link href={l.href} aria-current={active(l.href) ? 'page' : undefined} className="block rounded-2xl px-4 py-4 font-display text-3xl font-extrabold text-plum aria-[current=page]:bg-plum-soft aria-[current=page]:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-[#1FA855] py-4 font-bold text-white">
              <MessageCircle className="size-5" aria-hidden /> Escríbenos por WhatsApp
            </a>
            <Link href="/login" className="flex items-center justify-center gap-2 rounded-2xl bg-plum py-4 font-bold text-white">
              <LogIn className="size-5" aria-hidden /> Ingresar al sistema
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
