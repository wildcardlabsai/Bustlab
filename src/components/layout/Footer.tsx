import { Link } from 'react-router-dom'
import { ExternalLink, Paintbrush } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useSettings } from '@/context/SettingsContext'
import { SocialLinks } from './SocialLinks'
import { NAV_LINKS } from './nav'

export function Footer() {
  const { settings } = useSettings()
  const stores = [
    { name: 'Shopify store', href: settings.shop.shopify },
    { name: 'Etsy store', href: settings.shop.etsy },
  ].filter((s) => s.href)
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg-2">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-purple/10 blur-3xl" aria-hidden />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo src={settings.logo_url} className="h-9" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            {settings.footer_tagline || 'Premium collectible busts and sculptures, supplied ready to paint.'}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9a3ff] ring-1 ring-purple/30">
            <Paintbrush className="h-3.5 w-3.5" aria-hidden /> Supplied unpainted · Ready to paint
          </p>
          <SocialLinks className="mt-6" />
        </div>
        <nav className="md:col-span-3" aria-label="Footer">
          <p className="eyebrow mb-4 !text-silver">Explore</p>
          <ul className="space-y-2.5 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted transition hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="eyebrow mb-4 !text-silver">Shop</p>
          {stores.length ? (
            <ul className="space-y-2.5 text-sm">
              {stores.map((s) => (
                <li key={s.name}>
                  <a href={s.href!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted transition hover:text-white">
                    {s.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Our online stores are opening soon.</p>
          )}
          <p className="mt-6 text-xs leading-relaxed text-muted/80">
            BUSTLAB.com is our brand showcase. Purchases are completed securely on our official Shopify and Etsy stores.
          </p>
        </div>
      </div>
      <div className="relative border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted/70 sm:flex-row sm:items-center">
          <p>© {year} BUSTLAB. All rights reserved.</p>
          <p>Painted pieces shown are inspiration examples. Busts are supplied unpainted.</p>
        </div>
      </div>
    </footer>
  )
}
