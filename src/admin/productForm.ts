import { SLUG_PATTERN } from '@/lib/slug'
import { isValidHttpUrl } from '@/lib/url'
import type { Product } from '@/types/content'

export interface ProductFormState {
  name: string
  slug: string
  short_description: string
  description: string
  category_id: string
  main_image: string | null
  gallery_images: string[]
  dimensions: string
  material_description: string
  ready_to_paint: boolean
  featured: boolean
  published: boolean
  shopify_url: string
  etsy_url: string
  display_order: number
}

export const EMPTY_PRODUCT: ProductFormState = {
  name: '', slug: '', short_description: '', description: '', category_id: '', main_image: null, gallery_images: [],
  dimensions: '', material_description: 'Supplied unpainted in a neutral finish, ready for priming and painting. Paints and tools are not included.',
  ready_to_paint: true, featured: false, published: false, shopify_url: '', etsy_url: '', display_order: 0,
}

export const productToForm = (p: Product): ProductFormState => ({
  name: p.name, slug: p.slug, short_description: p.short_description ?? '', description: p.description ?? '', category_id: p.category_id ?? '',
  main_image: p.main_image, gallery_images: p.gallery_images ?? [], dimensions: p.dimensions ?? '', material_description: p.material_description ?? '',
  ready_to_paint: p.ready_to_paint, featured: p.featured, published: p.published, shopify_url: p.shopify_url ?? '', etsy_url: p.etsy_url ?? '', display_order: p.display_order,
})

export type ProductErrors = Partial<Record<keyof ProductFormState, string>>

export function validateProduct(f: ProductFormState): ProductErrors {
  const e: ProductErrors = {}
  if (!f.name.trim()) e.name = 'Name is required.'
  else if (f.name.length > 160) e.name = 'Keep the name under 160 characters.'
  if (!f.slug) e.slug = 'Slug is required.'
  else if (!SLUG_PATTERN.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens only.'
  if (f.short_description.length > 300) e.short_description = 'Keep the short description under 300 characters.'
  if (f.description.length > 8000) e.description = 'Description is too long.'
  if (f.dimensions.length > 200) e.dimensions = 'Keep dimensions under 200 characters.'
  if (f.shopify_url.trim() && !isValidHttpUrl(f.shopify_url)) e.shopify_url = 'Enter a full URL starting with https://'
  if (f.etsy_url.trim() && !isValidHttpUrl(f.etsy_url)) e.etsy_url = 'Enter a full URL starting with https://'
  return e
}

