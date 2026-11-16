/**
 * Public, read-only data access for the website.
 * Uses Supabase when configured (RLS only exposes published/active content to visitors);
 * otherwise falls back to bundled starter content so the site can be previewed locally.
 */
import { supabase } from '@/lib/supabase'
import { demoCollections, demoGallery, demoProducts, demoSettings } from '@/data/demo'
import type { Collection, GalleryImage, ProductWithCollection, SiteSettings } from '@/types/content'

const PRODUCT_SELECT = '*, collection:collections(id, name, slug)'

function attachDemoCollection(p: (typeof demoProducts)[number]): ProductWithCollection {
  const c = demoCollections.find((c) => c.id === p.category_id && c.active)
  return { ...p, collection: c ? { id: c.id, name: c.name, slug: c.slug } : null }
}

export async function fetchSettings(): Promise<SiteSettings> {
  if (!supabase) return demoSettings
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data ?? demoSettings
}

export async function fetchCollections(): Promise<Collection[]> {
  if (!supabase) return demoCollections.filter((c) => c.active)
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchCollectionBySlug(slug: string): Promise<Collection | null> {
  if (!supabase) return demoCollections.find((c) => c.slug === slug && c.active) ?? null
  const { data, error } = await supabase.from('collections').select('*').eq('slug', slug).eq('active', true).maybeSingle()
  if (error) throw error
  return data
}

export interface ProductQuery {
  collectionId?: string
  featured?: boolean
  limit?: number
  excludeId?: string
}

export async function fetchProducts(q: ProductQuery = {}): Promise<ProductWithCollection[]> {
  if (!supabase) {
    let list = demoProducts.filter((p) => p.published).map(attachDemoCollection)
    if (q.collectionId) list = list.filter((p) => p.category_id === q.collectionId)
    if (q.featured) list = list.filter((p) => p.featured)
    if (q.excludeId) list = list.filter((p) => p.id !== q.excludeId)
    return q.limit ? list.slice(0, q.limit) : list
  }
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (q.collectionId) query = query.eq('category_id', q.collectionId)
  if (q.featured) query = query.eq('featured', true)
  if (q.excludeId) query = query.neq('id', q.excludeId)
  if (q.limit) query = query.limit(q.limit)
  const { data, error } = await query
  if (error) throw error
  return data as unknown as ProductWithCollection[]
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithCollection | null> {
  if (!supabase) {
    const p = demoProducts.find((p) => p.slug === slug && p.published)
    return p ? attachDemoCollection(p) : null
  }
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('published', true).maybeSingle()
  if (error) throw error
  return data as unknown as ProductWithCollection | null
}

export async function fetchGallery(): Promise<GalleryImage[]> {
  if (!supabase) return demoGallery.filter((g) => g.published)
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

/** True when the contact form can actually deliver messages (stored in Supabase). */
export const contactBackendAvailable = () => supabase !== null

export async function submitContactMessage(input: ContactInput): Promise<void> {
  if (!supabase) throw new Error('The contact form is not connected to a backend yet.')
  // No .select() — visitors have insert-only access and cannot read messages back.
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  })
  if (error) {
    if (error.message?.toLowerCase().includes('too many')) throw new Error('You have sent several messages recently. Please wait a little while before trying again.')
    throw new Error('Sorry — your message could not be sent. Please try again shortly.')
  }
}
