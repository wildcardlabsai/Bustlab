/** Centralised, typed access to public build-time configuration. */
const read = (v: string | undefined) => (v ?? '').trim()

export const env = {
  supabaseUrl: read(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: read(import.meta.env.VITE_SUPABASE_ANON_KEY),
  siteUrl: read(import.meta.env.VITE_SITE_URL).replace(/\/$/, '') || 'https://www.bustlab.com',
  shopifyFallback: read(import.meta.env.VITE_SHOPIFY_STORE_URL),
  etsyFallback: read(import.meta.env.VITE_ETSY_STORE_URL),
}

/** True when a Supabase project is configured. Without it the public site shows bundled demo content. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
