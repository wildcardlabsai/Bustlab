import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useSettings } from '@/context/SettingsContext'
import { NAV_LINKS } from './nav'
import { cn } from '@/lib/format'
import { SocialLinks } from './SocialLinks'

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSettings()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const stores = [
    { name: 'Shop Shopify', href: settings.shop.shopify },
    { name: 'Shop Etsy', href: settings.shop.etsy },
  ].filter((s) => s.href)

  return (
    <div className={cn('fixed inset-0 z-[60] lg:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          'absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-line bg-bg-2 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-purple/25 blur-3xl" />
        <div className="relative flex h-[var(--header-h)] items-center justify-between px-5">
          <Logo src={settings.logo_url} className="h-10" />
          <button onClick={onClose} className="rounded-lg p-2 text-silver hover:bg-white/5 hover:text-white" aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
          <ul className="space-y-1">
            {NAV_LINKS.map((l, i) => (
              <li key={l.to} style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }} className={cn('transition duration-300', open ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0')}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn('flex items-center justify-between rounded-lg px-3 py-3.5 font-display text-2xl font-bold uppercase tracking-tight', isActive ? 'text-white' : 'text-silver/70 hover:text-white')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && <span className="h-2 w-2 rotate-45 bg-purple-bright" aria-hidden />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-line pt-6">
            <p className="eyebrow mb-3">Shop BUSTLAB</p>
            {stores.length ? (
              <div className="grid gap-2">
                {stores.map((s) => (
                  <a key={s.name} href={s.href!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider text-white ring-1 ring-line hover:ring-purple">
                    {s.name} <ExternalLink className="h-4 w-4 text-muted" aria-hidden />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Our online stores are opening soon.</p>
            )}
          </div>
        </nav>
        <div className="relative border-t border-line px-5 py-5">
          <SocialLinks />
        </div>
      </div>
    </div>
  )
}
