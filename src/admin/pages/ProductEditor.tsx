import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2, Save } from 'lucide-react'
import { getProduct, listAllCollections, removeStoredFiles, saveProduct, type ProductInput } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { ErrorState, PageLoader } from '@/components/ui/States'
import { slugify } from '@/lib/slug'
import { errorMessage } from '@/lib/format'
import type { Product } from '@/types/content'
import { EMPTY_PRODUCT, productToForm, validateProduct, type ProductErrors, type ProductFormState as FormState } from '../productForm'
import { AdminPageHeader, Field, Panel, Toggle } from '../components/ui'
import { ImageUploadField, MultiImageField } from '../components/ImageUpload'
import { useToast } from '../components/Toast'

const nullIfEmpty = (v: string) => (v.trim() ? v.trim() : null)

export default function ProductEditor() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const notify = useToast()
  const collections = useAsync(listAllCollections, [])
  const existing = useAsync(() => (isNew ? Promise.resolve(null) : getProduct(id!)), [id])
  const [form, setForm] = useState<FormState>(EMPTY_PRODUCT)
  const [original, setOriginal] = useState<Product | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [saving, setSaving] = useState(false)

  // Load the product into the form once fetched (keyed by id).
  const loadedId = existing.data?.id
  useEffect(() => {
    if (existing.data) {
      setForm(productToForm(existing.data)) // eslint-disable-line react-hooks/set-state-in-effect
      setOriginal(existing.data)
      setSlugTouched(true)
    }
  }, [loadedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(String(v)) } : {}) }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validateProduct(form)
    setErrors(v)
    if (Object.keys(v).length) {
      notify('Please fix the highlighted fields.', 'error')
      document.getElementById(`p-${Object.keys(v)[0]}`)?.focus()
      return
    }
    setSaving(true)
    const payload: ProductInput = {
      name: form.name.trim(), slug: form.slug, short_description: nullIfEmpty(form.short_description), description: nullIfEmpty(form.description),
      category_id: form.category_id || null, main_image: form.main_image, gallery_images: form.gallery_images, dimensions: nullIfEmpty(form.dimensions),
      material_description: nullIfEmpty(form.material_description), ready_to_paint: form.ready_to_paint, featured: form.featured, published: form.published,
      shopify_url: nullIfEmpty(form.shopify_url), etsy_url: nullIfEmpty(form.etsy_url), display_order: Number(form.display_order) || 0,
    }
    try {
      const saved = await saveProduct(payload, isNew ? undefined : id)
      if (original) {
        const keep = new Set([saved.main_image, ...saved.gallery_images])
        await removeStoredFiles([original.main_image, ...original.gallery_images].filter((u) => u && !keep.has(u))).catch(() => {})
      }
      setOriginal(saved)
      notify(isNew ? `${saved.name} created.` : `${saved.name} saved.`)
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true })
    } catch (err) {
      notify(errorMessage(err), 'error')
      if (/slug/i.test(errorMessage(err))) setErrors((x) => ({ ...x, slug: 'This slug is already used by another product.' }))
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && existing.loading) return <PageLoader />
  if (!isNew && existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />
  if (!isNew && !existing.data) return <ErrorState error="Product not found." />

  const err = (k: keyof FormState) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `p-${k}-error` : undefined })

  return (
    <>
      <Seo title={`${isNew ? 'New product' : form.name || 'Edit product'} · Admin`} noindex />
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden /> Products</Link>
      <form onSubmit={onSubmit} noValidate>
        <AdminPageHeader
          title={isNew ? 'New product' : form.name || 'Edit product'}
          description={isNew ? 'Products are saved as drafts until you publish them.' : `/products/${form.slug}`}
          actions={
            <>
              {!isNew && original?.published && (
                <a href={`/products/${original.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-silver ring-1 ring-line hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View live
                </a>
              )}
              <Button type="submit" size="sm" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} Save</Button>
            </>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Details">
              <div className="space-y-5">
                <Field label="Name" htmlFor="p-name" required error={errors.name}>
                  <input id="p-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={160} {...err('name')} />
                </Field>
                <Field label="URL slug" htmlFor="p-slug" required error={errors.slug} hint={`Used in the page address: /products/${form.slug || 'your-slug'}`}>
                  <input id="p-slug" className="input font-mono" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} maxLength={160} {...err('slug')} />
                </Field>
                <Field label="Short description" htmlFor="p-short_description" error={errors.short_description} hint={`${form.short_description.length}/300 — shown on product cards and in search results.`}>
                  <textarea id="p-short_description" rows={2} className="input" value={form.short_description} onChange={(e) => set('short_description', e.target.value)} maxLength={300} {...err('short_description')} />
                </Field>
                <Field label="Full description" htmlFor="p-description" error={errors.description}>
                  <textarea id="p-description" rows={7} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} {...err('description')} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Dimensions" htmlFor="p-dimensions" error={errors.dimensions} hint="Only enter measured values, e.g. “Height 18 cm”. Leave blank to hide.">
                    <input id="p-dimensions" className="input" value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} maxLength={200} {...err('dimensions')} />
                  </Field>
                  <Field label="Collection" htmlFor="p-category_id">
                    <select id="p-category_id" className="input" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                      <option value="">Uncategorised</option>
                      {collections.data?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Material & finish" htmlFor="p-material_description" hint="Describe what customers receive. Do not list paints or tools as included.">
                  <textarea id="p-material_description" rows={2} className="input" value={form.material_description} onChange={(e) => set('material_description', e.target.value)} maxLength={1000} />
                </Field>
              </div>
            </Panel>

            <Panel title="Images">
              <div className="space-y-6">
                <div>
                  <p className="label">Main image</p>
                  <div className="max-w-xs"><ImageUploadField id="p-main-image" label="Main image" value={form.main_image} onChange={(v) => set('main_image', v)} folder="products" /></div>
                </div>
                <div>
                  <p className="label">Additional images</p>
                  <MultiImageField id="p-gallery" label="Additional product images" value={form.gallery_images} onChange={(v) => set('gallery_images', v)} folder="products" />
                </div>
                <p className="text-xs text-muted">Show the bust as supplied (unpainted). If you add painted photos, say so in the description.</p>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Visibility">
              <div className="space-y-5">
                <Toggle id="p-published" label="Published" description="Visible on the public website." checked={form.published} onChange={(v) => set('published', v)} />
                <Toggle id="p-featured" label="Featured" description="Shown on the homepage." checked={form.featured} onChange={(v) => set('featured', v)} />
                <Toggle id="p-rtp" label="Ready to paint" description="Shows the READY TO PAINT label." checked={form.ready_to_paint} onChange={(v) => set('ready_to_paint', v)} />
                <Field label="Display order" htmlFor="p-order" hint="Lower numbers appear first.">
                  <input id="p-order" type="number" className="input" value={form.display_order} onChange={(e) => set('display_order', Number(e.target.value))} />
                </Field>
              </div>
            </Panel>
            <Panel title="Store links">
              <div className="space-y-5">
                <Field label="Shopify product URL" htmlFor="p-shopify_url" error={errors.shopify_url} hint="Leave blank to link to the main Shopify store instead.">
                  <input id="p-shopify_url" type="url" inputMode="url" className="input" placeholder="https://" value={form.shopify_url} onChange={(e) => set('shopify_url', e.target.value)} {...err('shopify_url')} />
                </Field>
                <Field label="Etsy listing URL" htmlFor="p-etsy_url" error={errors.etsy_url} hint="Leave blank to link to the main Etsy shop instead.">
                  <input id="p-etsy_url" type="url" inputMode="url" className="input" placeholder="https://" value={form.etsy_url} onChange={(e) => set('etsy_url', e.target.value)} {...err('etsy_url')} />
                </Field>
              </div>
            </Panel>
          </div>
        </div>
      </form>
    </>
  )
}
