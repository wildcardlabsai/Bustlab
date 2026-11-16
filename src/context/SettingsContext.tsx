import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { fetchSettings } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { demoSettings } from '@/data/demo'
import { env } from '@/lib/env'
import { safeExternalUrl } from '@/lib/url'
import type { SiteSettings } from '@/types/content'

export interface ResolvedSettings extends SiteSettings {
  /** Validated store links (null when missing/invalid). */
  shop: { shopify: string | null; etsy: string | null }
}

interface Ctx {
  settings: ResolvedSettings
  loading: boolean
  reload: () => void
}

const SettingsContext = createContext<Ctx | null>(null)

function resolve(s: SiteSettings): ResolvedSettings {
  return {
    ...s,
    shop: {
      shopify: safeExternalUrl(s.shopify_url) ?? safeExternalUrl(env.shopifyFallback),
      etsy: safeExternalUrl(s.etsy_url) ?? safeExternalUrl(env.etsyFallback),
    },
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useAsync(fetchSettings, [])
  const value = useMemo(() => ({ settings: resolve(data ?? demoSettings), loading, reload }), [data, loading, reload])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
