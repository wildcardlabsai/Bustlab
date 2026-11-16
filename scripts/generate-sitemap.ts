// Writes dist/sitemap.xml and dist/robots.txt after `vite build`.
// Uses live published content from Supabase when VITE_SUPABASE_URL/ANON_KEY are set,
// otherwise the bundled starter content.
import { existsSync, writeFileSync } from 'node:fs'
import { demoCollections, demoProducts } from '../src/data/demo.ts'

if (existsSync('.env')) process.loadEnvFile('.env')
const SITE = (process.env.VITE_SITE_URL || 'https://www.bustlab.com').replace(/\/$/, '')
const SB = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY

type Row = { slug: string; updated_at: string }
async function load(): Promise<{ collections: Row[]; products: Row[] }> {
  if (SB && KEY) {
    try {
      const get = async (path: string) => {
        const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
        if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
        return (await r.json()) as Row[]
      }
      return {
        collections: await get('collections?select=slug,updated_at&active=eq.true'),
        products: await get('products?select=slug,updated_at&published=eq.true'),
      }
    } catch (e) {
      console.warn('Sitemap: could not reach Supabase, using starter content.', e)
    }
  }
  return {
    collections: demoCollections.filter((c) => c.active),
    products: demoProducts.filter((p) => p.published),
  }
}

const { collections, products } = await load()
const today = new Date().toISOString().slice(0, 10)
const urls = [
  { loc: '/', priority: '1.0', lastmod: today },
  ...['/collections', '/gallery', '/ready-to-paint', '/about', '/contact'].map((loc) => ({ loc, priority: '0.8', lastmod: today })),
  ...collections.map((c) => ({ loc: `/collections/${c.slug}`, priority: '0.7', lastmod: c.updated_at.slice(0, 10) })),
  ...products.map((p) => ({ loc: `/products/${p.slug}`, priority: '0.6', lastmod: p.updated_at.slice(0, 10) })),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync('dist/sitemap.xml', xml)
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`Sitemap: ${urls.length} URLs written to dist/sitemap.xml`)
