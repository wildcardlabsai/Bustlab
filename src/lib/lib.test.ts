import { describe, expect, it } from 'vitest'
import { isValidEmail, safeExternalUrl } from './url'
import { slugify, SLUG_PATTERN } from './slug'
import { buildSrcSet } from './images'
import { looksLikeSpam, validateContact } from './contactValidation'
import { validateProduct, EMPTY_PRODUCT } from '@/admin/productForm'

describe('safeExternalUrl', () => {
  it('accepts http(s) store links', () => {
    expect(safeExternalUrl('https://bustlab.myshopify.com')).toBe('https://bustlab.myshopify.com/')
    expect(safeExternalUrl('  https://www.etsy.com/shop/Bustlab  ')).toBe('https://www.etsy.com/shop/Bustlab')
  })
  it('rejects dangerous or malformed links', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://x.com', 'https://localhost', 'not a url', '', null, undefined]) {
      expect(safeExternalUrl(bad as string)).toBeNull()
    }
  })
})

describe('slugify', () => {
  it('creates SEO-friendly slugs', () => {
    expect(slugify('Horror & Dark Art')).toBe('horror-and-dark-art')
    expect(slugify('  Nova Unit-07 ')).toBe('nova-unit-07')
    expect(slugify('Ëxøtic Bust!!')).toMatch(SLUG_PATTERN)
  })
})

describe('buildSrcSet', () => {
  it('builds srcset for bundled renders only', () => {
    expect(buildSrcSet('/images/products/thornhorn-1-1600.webp')).toBe('/images/products/thornhorn-1-800.webp 800w, /images/products/thornhorn-1-1600.webp 1600w')
    expect(buildSrcSet('/images/collections/sci-fi-future-1200.webp')).toContain('600w')
    expect(buildSrcSet('https://x.supabase.co/storage/v1/object/public/media/a.webp')).toBeUndefined()
  })
})

describe('contact validation', () => {
  const ok = { name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: 'A long enough message.', website: '' }
  it('accepts a valid message', () => expect(validateContact(ok)).toEqual({}))
  it('reports each problem', () => {
    const e = validateContact({ name: ' ', email: 'nope', subject: '', message: 'short', website: '' })
    expect(Object.keys(e).sort()).toEqual(['email', 'message', 'name', 'subject'])
  })
  it('flags honeypot and too-fast submissions as spam', () => {
    expect(looksLikeSpam({ ...ok, website: 'http://spam' }, 0, 10_000)).toBe(true)
    expect(looksLikeSpam(ok, 9_000, 10_000)).toBe(true)
    expect(looksLikeSpam(ok, 0, 10_000)).toBe(false)
  })
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
  })
})

describe('product form validation', () => {
  it('requires name and a valid slug and safe URLs', () => {
    const e = validateProduct({ ...EMPTY_PRODUCT, slug: 'Bad Slug', shopify_url: 'javascript:alert(1)' })
    expect(e.name).toBeTruthy()
    expect(e.slug).toBeTruthy()
    expect(e.shopify_url).toBeTruthy()
    expect(validateProduct({ ...EMPTY_PRODUCT, name: 'Bust', slug: 'bust', etsy_url: 'https://etsy.com/listing/1' })).toEqual({})
  })
})
