import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ExternalLink, ShoppingBag, Store } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { buttonClass, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { cn } from '@/lib/format'

interface ShopMenuProps {
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'left' | 'right'
  className?: string
}

/** SHOP dropdown linking to the external Shopify and Etsy stores (configured in Website Settings). */
export function ShopMenu({ label = 'Shop', variant = 'primary', size = 'sm', align = 'right', className }: ShopMenuProps) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const stores = [
    { key: 'shopify', name: 'Shop Shopify', note: 'Official BUSTLAB store', href: settings.shop.shopify, Icon: ShoppingBag },
    { key: 'etsy', name: 'Shop Etsy', note: 'BUSTLAB on Etsy', href: settings.shop.etsy, Icon: Store },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass(variant, size)}
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div
        id={menuId}
        role="menu"
        hidden={!open}
        className={cn(
          'absolute top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-line bg-bg-2/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl',
          align === 'right' ? 'right-0' : 'left-0',
        )}
      >
        {stores.length ? (
          stores.map(({ key, name, note, href, Icon }) => (
            <a
              key={key}
              role="menuitem"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-surface-hover"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple/15 text-purple-bright ring-1 ring-purple/30">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-display text-sm font-semibold uppercase tracking-wider text-white">{name}</span>
                <span className="block text-xs text-muted">{note}</span>
              </span>
              <ExternalLink className="h-4 w-4 text-muted transition group-hover:text-white" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ))
        ) : (
          <p className="px-3 py-3 text-sm text-muted">Our online stores are opening soon. Check back shortly or get in touch for availability.</p>
        )}
      </div>
    </div>
  )
}
