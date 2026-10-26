import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from './login-form'
import { Blob, Squiggle, Star } from '@/components/ui/splash'

export const metadata: Metadata = { title: 'Ingresar · Mundo Pinturas Diana', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-plum p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Blob color="#E11D74" className="absolute -right-24 -top-24 size-96 animate-float opacity-80" />
        <Blob color="#00ACC1" className="absolute -bottom-32 -left-20 size-[28rem] opacity-70" />
        <Star className="absolute right-24 top-1/2 size-14 animate-spin-slow" />
        <Image src="/brand/logo.png" alt="Mundo Pinturas Diana" width={88} height={88} className="relative rounded-full bg-white p-1" />
        <div className="relative">
          <h2 className="font-display text-6xl font-extrabold leading-[0.95]">Todo el negocio,<br />en un solo lugar.</h2>
          <Squiggle color="#FFC93C" className="mt-6 h-5 w-48" />
          <p className="mt-6 max-w-md text-white/75">Ventas, inventario, caja y clientes conectados para decidir mejor.</p>
        </div>
        <p className="relative text-sm text-white/60">Acceso exclusivo para personal autorizado.</p>
      </section>
      <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-plum hover:text-brand"><ArrowLeft size={16} /> Volver al sitio</Link>
        <LoginForm next={next} />
      </section>
    </main>
  )
}
