import type { Metadata } from 'next'
import { getBranches } from '@/lib/data'
import { CartClient } from '@/components/cart/cart-client'

export const metadata: Metadata = { title: 'Carrito | Mundo Pinturas Diana', robots: { index: false } }

export default async function CartPage() {
  const branches = (await getBranches()).map((b) => ({ id: b.id, name: b.name, address: b.address, whatsapp: b.whatsapp }))
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <h1 className="font-display text-5xl font-extrabold text-plum md:text-6xl">Tu carrito</h1>
      <div className="mt-10"><CartClient branches={branches} /></div>
    </div>
  )
}
