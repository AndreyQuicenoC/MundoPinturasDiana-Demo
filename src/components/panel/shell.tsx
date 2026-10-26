'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Boxes, CalendarDays, CalendarCheck, ClipboardList, Contact, FileCheck2, Gift, History, Tags, KeyRound, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Package, Receipt, ShieldCheck, ShoppingBag, Store, Truck, Users, Wallet, X, Handshake, ReceiptText, type LucideIcon } from 'lucide-react'
import { logoutAction } from '@/app/(frontend)/(app)/login/actions'
import { Modal, btnPrimary, btnGhost } from './kit'

const ICONS: Record<string, LucideIcon> = {
  resumen: LayoutDashboard, usuarios: Users, permisos: ShieldCheck, sedes: Store, productos: Package, inventario: Boxes, clientes: Contact, proveedores: Handshake,
  ventas: Receipt, pos: ShoppingBag, domicilios: Truck, caja: Wallet, cierre: CalendarCheck, eventos: CalendarDays, facturacion: FileCheck2, conceptos: ReceiptText, categorias: Tags, promociones: Gift, auditoria: History, analitica: BarChart3, cuenta: KeyRound,
}
const IDLE_MS = 15 * 60_000
const WARN_MS = 2 * 60_000

export function PanelShell({ user, items, children }: { user: { name: string; role: string }; items: { key: string; label: string; href: string }[]; children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [warn, setWarn] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { try { setCollapsed(localStorage.getItem('panel-collapsed') === '1') } catch {} }, [])
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem('panel-collapsed', c ? '0' : '1') } catch {} return !c })
  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    let warnT: ReturnType<typeof setTimeout>, outT: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(warnT); clearTimeout(outT)
      warnT = setTimeout(() => setWarn(true), IDLE_MS - WARN_MS)
      outT = setTimeout(() => logoutAction(), IDLE_MS)
    }
    const evs = ['pointerdown', 'keydown', 'scroll'] as const
    const on = () => { if (!warn) reset() }
    reset()
    evs.forEach((e) => window.addEventListener(e, on, { passive: true }))
    return () => { clearTimeout(warnT); clearTimeout(outT); evs.forEach((e) => window.removeEventListener(e, on)) }
  }, [warn])

  const render = (mini: boolean) => (
    <div className="flex h-full flex-col bg-plum text-white">
      <div className={`flex shrink-0 items-center gap-3 border-b border-white/10 bg-plum ${mini ? 'justify-center p-3' : 'p-5'}`}>
        <Image src="/brand/logo.png" alt="" width={44} height={44} className="rounded-full bg-white p-0.5" />
        {!mini && <div className="leading-tight"><p className="font-display text-base font-extrabold">Mundo Pinturas</p><p className="text-xs text-white/60">Panel interno</p></div>}
      </div>
      <NavList items={items} path={path} mini={mini} />
      <div className={`shrink-0 border-t border-white/15 bg-plum ${mini ? 'p-2' : 'p-4'}`}>
        {!mini && <><p className="truncate text-sm font-bold">{user.name}</p>
        <p className="mb-3 text-xs capitalize text-cyan">{user.role}</p></>}
        <form action={logoutAction}><button title="Cerrar sesión" aria-label="Cerrar sesión" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 py-2 text-sm font-semibold hover:bg-white/10"><LogOut size={16} />{!mini && ' Cerrar sesión'}</button></form>
        <button onClick={toggle} title={mini ? 'Expandir menú' : 'Contraer menú'} aria-label={mini ? 'Expandir menú' : 'Contraer menú'} className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white lg:flex">
          {mini ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Contraer</>}
        </button>
      </div>
    </div>
  )
  const side = render(false)

  return (
    <div className={`min-h-dvh bg-paper transition-[grid-template-columns] duration-200 lg:grid ${collapsed ? 'lg:grid-cols-[4.5rem_1fr]' : 'lg:grid-cols-[17rem_1fr]'}`}>
      <a href="#panel-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Saltar al contenido</a>
      <aside className="sticky top-0 hidden h-dvh lg:block">{render(collapsed)}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-plum/10 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="rounded-lg p-2 hover:bg-plum-soft"><Menu /></button>
        <span className="font-display font-extrabold text-plum">Mundo Pinturas Diana</span>
        <span className="w-10" />
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button aria-label="Cerrar menú" className="absolute inset-0 bg-plum/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85%]">{side}<button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-3 rounded-lg p-2 text-white"><X /></button></div>
        </div>
      )}
      <main id="panel-main" className="min-w-0 p-4 sm:p-8">{children}</main>
      <Modal open={warn} onClose={() => setWarn(false)} title="¿Sigues ahí?">
        <p className="text-sm text-ink/70">Por seguridad cerraremos tu sesión en menos de 2 minutos por inactividad.</p>
        <div className="mt-6 flex justify-end gap-3">
          <form action={logoutAction}><button className={btnGhost}>Salir ahora</button></form>
          <button onClick={() => setWarn(false)} className={btnPrimary}>Seguir trabajando</button>
        </div>
      </Modal>
    </div>
  )
}

/** Lista de módulos con scroll propio: barra fina que aparece al pasar el cursor o desplazar, y degradados en los bordes. */
function NavList({ items, path, mini }: { items: { key: string; label: string; href: string }[]; path: string; mini: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [edge, setEdge] = useState({ top: false, bottom: false })
  const [scrolling, setScrolling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdge({ top: el.scrollTop > 4, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4 })
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => { window.removeEventListener('resize', measure); clearTimeout(timer.current) }
  }, [measure, items.length])
  const onScroll = () => {
    measure()
    setScrolling(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setScrolling(false), 900)
  }
  const thumb = scrolling ? '[scrollbar-color:rgb(255_255_255/0.35)_transparent]' : '[scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(255_255_255/0.3)_transparent]'
  return (
    <div className="relative min-h-0 flex-1">
      <nav ref={ref} onScroll={onScroll} aria-label="Módulos" className={`h-full space-y-0.5 overflow-y-auto overscroll-contain py-3 [scrollbar-width:thin] ${mini ? 'px-2' : 'px-3'} ${thumb}`}>
        {items.map((it) => {
          const I = ICONS[it.key] ?? ClipboardList
          const active = path === it.href
          return (
            <Link key={it.key} href={it.href} title={it.label} aria-label={it.label} aria-current={active ? 'page' : undefined} className={`flex items-center ${mini ? 'justify-center px-0' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-semibold transition ${active ? 'bg-white text-plum shadow-[3px_3px_0_0_var(--color-brand)]' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
              <I size={18} />{!mini && <> {it.label}</>}
            </Link>
          )
        })}
      </nav>
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-plum to-transparent transition-opacity ${edge.top ? 'opacity-100' : 'opacity-0'}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-plum to-transparent transition-opacity ${edge.bottom ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
