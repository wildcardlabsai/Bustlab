import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useSettings } from '@/context/SettingsContext'
import { ShopMenu } from './ShopMenu'
import { MobileMenu } from './MobileMenu'
import { NAV_LINKS } from './nav'
import { cn } from '@/lib/format'

export function Header() {
  const { settings } = useSettings()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-colors duration-300',
          scrolled ? 'border-line bg-bg/85 backdrop-blur-xl' : 'border-transparent bg-bg/40 backdrop-blur-md',
        )}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link to="/" className="shrink-0" aria-label="BUSTLAB home">
            <Logo src={settings.logo_url} className="h-10 sm:h-12" />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative px-3.5 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors',
                        "after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-gradient-to-r after:from-purple after:to-purple-bright after:transition-transform after:content-['']",
                        isActive ? 'text-white after:scale-x-100' : 'text-silver/75 hover:text-white after:scale-x-0 hover:after:scale-x-100',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <ShopMenu />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-silver transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
