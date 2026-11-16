import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { env } from '@/lib/env'

export const DEFAULT_TITLE = 'BUSTLAB | Collectible Busts & Ready-to-Paint Sculptures'
export const DEFAULT_DESCRIPTION =
  'Discover BUSTLAB collectible busts and sculptures. Explore sci-fi, fantasy, gaming, horror and original designs, supplied ready to paint.'
const DEFAULT_IMAGE = '/images/og/og-image.webp'

interface SeoProps {
  title?: string
  description?: string
  image?: string | null
  type?: 'website' | 'product' | 'article'
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${env.siteUrl}${url.startsWith('/') ? '' : '/'}${url}`)

function upsert(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  apply(el)
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  upsert(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute(attr, key)
    return m
  }, (m) => m.setAttribute('content', content))
}

/** Per-page title, description, canonical URL, Open Graph/Twitter tags and JSON-LD. */
export function Seo({ title, description = DEFAULT_DESCRIPTION, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const { pathname } = useLocation()
  const fullTitle = title ? `${title} | BUSTLAB` : DEFAULT_TITLE
  const canonical = `${env.siteUrl}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`
  const ogImage = absolute(image || DEFAULT_IMAGE)
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', ogImage)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)
    upsert('link[rel="canonical"]', () => {
      const l = document.createElement('link')
      l.rel = 'canonical'
      return l
    }, (l) => l.setAttribute('href', canonical))

    const existing = document.getElementById('page-jsonld')
    if (ld) {
      const s = existing ?? Object.assign(document.createElement('script'), { id: 'page-jsonld', type: 'application/ld+json' })
      s.textContent = ld
      if (!existing) document.head.appendChild(s)
    } else existing?.remove()
  }, [fullTitle, description, canonical, ogImage, type, noindex, ld])

  return null
}

// eslint-disable-next-line react-refresh/only-export-components
export const absoluteUrl = absolute
