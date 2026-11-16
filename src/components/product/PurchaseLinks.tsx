import { Link } from 'react-router-dom'
import { ExternalLink, ShoppingBag, Store } from 'lucide-react'
import { ExternalButton } from '@/components/ui/Button'
import { useSettings } from '@/context/SettingsContext'
import { safeExternalUrl } from '@/lib/url'
import type { Product } from '@/types/content'

/**
 * External purchase buttons. Product-specific URLs take priority; otherwise the
 * global store URLs are used. Nothing is rendered for a store with no valid URL.
 */
export function PurchaseLinks({ product }: { product: Product }) {
  const { settings } = useSettings()
  const shopifyDirect = safeExternalUrl(product.shopify_url)
  const etsyDirect = safeExternalUrl(product.etsy_url)
  const shopify = shopifyDirect ?? settings.shop.shopify
  const etsy = etsyDirect ?? settings.shop.etsy

  if (!shopify && !etsy) {
    return (
      <div className="rounded-xl border border-line bg-bg-2 p-5 text-sm text-muted">
        Online purchasing for this piece is coming soon. <Link to="/contact" className="font-semibold text-purple-bright hover:text-white">Contact us</Link> to register your interest.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {shopify && (
          <ExternalButton href={shopify} size="lg" className="flex-1" aria-label={`${shopifyDirect ? `Buy ${product.name}` : 'Visit our store'} on Shopify (opens in a new tab)`}>
            <ShoppingBag className="h-4 w-4" aria-hidden /> {shopifyDirect ? 'Buy on Shopify' : 'Shop on Shopify'}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </ExternalButton>
        )}
        {etsy && (
          <ExternalButton href={etsy} size="lg" variant="secondary" className="flex-1" aria-label={`${etsyDirect ? `Buy ${product.name}` : 'Visit our store'} on Etsy (opens in a new tab)`}>
            <Store className="h-4 w-4" aria-hidden /> {etsyDirect ? 'Buy on Etsy' : 'Shop on Etsy'}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </ExternalButton>
        )}
      </div>
      <p className="text-xs text-muted">Purchases are completed securely on our official external stores. Links open in a new tab.</p>
    </div>
  )
}
