/**
 * Admin data access. Every call runs with the signed-in user's JWT; the database
 * (RLS + constraints) decides what is allowed — the UI checks are for convenience only.
 */
import { env } from '@/lib/env'
import { MEDIA_BUCKET, requireSupabase } from '@/lib/supabase'
import { prepareImageForUpload } from '@/lib/images'
import type { Database } from '@/types/database'
import type { Collection, ContactMessage, GalleryImage, MessageStatus, Product, SiteSettings } from '@/types/content'

type Tables = Database['public']['Tables']
export type ProductInput = Tables['products']['Insert']
export type CollectionInput = Tables['collections']['Insert']
export type GalleryInput = Tables['gallery_images']['Insert']
export type SettingsInput = Tables['site_settings']['Update']

/** Converts Postgres error codes into messages an editor can act on. */
function friendly(error: { code?: string; message: string; details?: string | null }): Error {
  if (error.code === '23505') return new Error('That slug is already in use. Please choose a different one.')
  if (error.code === '23514') return new Error('Some values were rejected by validation (check URLs, slugs and text lengths).')
  if (error.code === '42501' || /row-level security/i.test(error.message)) return new Error('You do not have permission to do that. Please sign in as an administrator.')
  if (error.code === 'PGRST116') return new Error('That item no longer exists.')
  return new Error(error.message)
}

const unwrap = <T,>(res: { data: T | null; error: { code?: string; message: string } | null }): T => {
  if (res.error) throw friendly(res.error)
  return res.data as T
}

/* --------------------------------------------------------------- overview */

export async function fetchOverview() {
  const sb = requireSupabase()
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const { count, error } = await q
    if (error) throw friendly(error)
    return count ?? 0
  }
  const [publishedProducts, draftProducts, collections, galleryImages, newMessages, recentProducts, recentMessages] = await Promise.all([
    count(sb.from('products').select('id', { count: 'exact', head: true }).eq('published', true)),
    count(sb.from('products').select('id', { count: 'exact', head: true }).eq('published', false)),
    count(sb.from('collections').select('id', { count: 'exact', head: true })),
    count(sb.from('gallery_images').select('id', { count: 'exact', head: true })),
    count(sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    sb.from('products').select('id, name, slug, main_image, published, created_at').order('created_at', { ascending: false }).limit(5).then(unwrap),
    sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5).then(unwrap),
  ])
  return { publishedProducts, draftProducts, collections, galleryImages, newMessages, recentProducts, recentMessages: recentMessages as ContactMessage[] }
}

/* --------------------------------------------------------------- products */

export async function listAllProducts(): Promise<Product[]> {
  const sb = requireSupabase()
  return unwrap(await sb.from('products').select('*').order('display_order').order('created_at', { ascending: false }))
}

export async function getProduct(id: string): Promise<Product> {
  return unwrap(await requireSupabase().from('products').select('*').eq('id', id).single())
}

export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  const sb = requireSupabase()
  const res = id ? await sb.from('products').update(input).eq('id', id).select().single() : await sb.from('products').insert(input).select().single()
  return unwrap(res)
}

export async function updateProductFlags(id: string, patch: Partial<Pick<Product, 'published' | 'featured'>>): Promise<void> {
  unwrap(await requireSupabase().from('products').update(patch).eq('id', id).select('id').single())
}

export async function deleteProduct(product: Product): Promise<void> {
  unwrap(await requireSupabase().from('products').delete().eq('id', product.id).select('id').single())
  await removeStoredFiles([product.main_image, ...product.gallery_images])
}

/* ------------------------------------------------------------ collections */

export async function listAllCollections(): Promise<Collection[]> {
  return unwrap(await requireSupabase().from('collections').select('*').order('display_order').order('name'))
}

export async function saveCollection(input: CollectionInput, id?: string): Promise<Collection> {
  const sb = requireSupabase()
  const res = id ? await sb.from('collections').update(input).eq('id', id).select().single() : await sb.from('collections').insert(input).select().single()
  return unwrap(res)
}

export async function deleteCollection(c: Collection): Promise<void> {
  unwrap(await requireSupabase().from('collections').delete().eq('id', c.id).select('id').single())
  await removeStoredFiles([c.cover_image])
}

/** Persists a new ordering by writing sequential display_order values. */
export async function reorder(table: 'collections' | 'gallery_images' | 'products', ids: string[]): Promise<void> {
  const sb = requireSupabase()
  const results = await Promise.all(ids.map((id, i) => sb.from(table).update({ display_order: i + 1 }).eq('id', id)))
  const failed = results.find((r) => r.error)
  if (failed?.error) throw friendly(failed.error)
}

/* ---------------------------------------------------------------- gallery */

export async function listAllGallery(): Promise<GalleryImage[]> {
  return unwrap(await requireSupabase().from('gallery_images').select('*').order('display_order').order('created_at', { ascending: false }))
}

export async function createGalleryImages(rows: GalleryInput[]): Promise<GalleryImage[]> {
  return unwrap(await requireSupabase().from('gallery_images').insert(rows).select())
}

export async function updateGalleryImage(id: string, patch: Tables['gallery_images']['Update']): Promise<GalleryImage> {
  return unwrap(await requireSupabase().from('gallery_images').update(patch).eq('id', id).select().single())
}

export async function deleteGalleryImage(img: GalleryImage): Promise<void> {
  unwrap(await requireSupabase().from('gallery_images').delete().eq('id', img.id).select('id').single())
  await removeStoredFiles([img.image_url])
}

/* --------------------------------------------------------------- messages */

export async function listMessages(): Promise<ContactMessage[]> {
  return unwrap(await requireSupabase().from('contact_messages').select('*').order('created_at', { ascending: false }).limit(500))
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<void> {
  unwrap(await requireSupabase().from('contact_messages').update({ status }).eq('id', id).select('id').single())
}

export async function deleteMessage(id: string): Promise<void> {
  unwrap(await requireSupabase().from('contact_messages').delete().eq('id', id).select('id').single())
}

/* --------------------------------------------------------------- settings */

export async function getSettings(): Promise<SiteSettings> {
  return unwrap(await requireSupabase().from('site_settings').select('*').eq('id', 1).single())
}

export async function saveSettings(input: SettingsInput): Promise<SiteSettings> {
  return unwrap(await requireSupabase().from('site_settings').update(input).eq('id', 1).select().single())
}

/* ---------------------------------------------------------------- storage */

const publicPrefix = () => `${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/`

export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const prefix = publicPrefix()
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null
}

/** Best-effort removal of files we uploaded; ignores bundled/external images. */
export async function removeStoredFiles(urls: Array<string | null | undefined>): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => Boolean(p))
  if (!paths.length) return
  await requireSupabase().storage.from(MEDIA_BUCKET).remove(paths)
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return `${file.name}: unsupported file type. Use JPG, PNG, WebP, AVIF, GIF or SVG.`
  if (file.size > MAX_UPLOAD_BYTES * 3) return `${file.name}: file is too large (max 30 MB before optimisation).`
  return null
}

/**
 * Uploads an image to the public `media` bucket with progress reporting.
 * Large images are resized and converted to WebP in the browser first.
 * Uses the Storage REST endpoint directly so upload progress can be shown.
 */
export async function uploadImage(file: File, folder: string, onProgress?: (pct: number) => void): Promise<string> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)
  const sb = requireSupabase()
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const prepared = await prepareImageForUpload(file)
  if (prepared.blob.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name}: image is still larger than 10 MB after optimisation.`)
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image'
  const path = `${folder}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}-${base}.${prepared.extension}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${env.supabaseUrl}/storage/v1/object/${MEDIA_BUCKET}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', env.supabaseAnonKey)
    xhr.setRequestHeader('Content-Type', prepared.type)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve() }
      else {
        let msg = `Upload failed (${xhr.status})`
        try { msg = JSON.parse(xhr.responseText).message || msg } catch { /* keep default */ }
        if (xhr.status === 403 || /row-level security/i.test(msg)) msg = 'Upload refused — your account does not have administrator access.'
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(prepared.blob)
  })
  return `${publicPrefix()}${path.split('/').map(encodeURIComponent).join('/')}`
}
