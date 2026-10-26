import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/components/cart/cart-provider'
import { Toaster } from '@/components/ui/toaster'
import { VisitTracker } from '@/components/site/visit-tracker'
import { getSiteSettings } from '@/lib/data'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <CartProvider>
      <SiteHeader whatsapp={settings.whatsapp} />
      <main id="contenido">{children}</main>
      <SiteFooter settings={settings} />
      <Toaster />
      <VisitTracker />
    </CartProvider>
  )
}
