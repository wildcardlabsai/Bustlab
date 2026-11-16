import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Edit3, EyeOff, Loader2, Palette, Trash2, UploadCloud } from 'lucide-react'
import { createGalleryImages, deleteGalleryImage, listAllCollections, listAllGallery, reorder, updateGalleryImage } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { errorMessage } from '@/lib/format'
import type { Collection, GalleryImage } from '@/types/content'
import { AdminPageHeader, ConfirmDialog, Field, Modal, Toggle } from '../components/ui'
import { useUploader } from '../components/ImageUpload'
import { useToast } from '../components/Toast'

export default function GalleryAdmin() {
  const { data, error, loading, reload } = useAsync(listAllGallery, [])
  const collections = useAsync(listAllCollections, [])
  const notify = useToast()
  const { uploads, run } = useUploader('gallery')
  const fileInput = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<GalleryImage[]>([])
  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [pending, setPending] = useState<GalleryImage | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (data) setItems(data) }, [data]) // eslint-disable-line react-hooks/set-state-in-effect

  const onFiles = async (files: File[]) => {
    const urls = await run(files)
    if (!urls.length) return
    try {
      const start = items.reduce((m, x) => Math.max(m, x.display_order), 0)
      const rows = await createGalleryImages(urls.map((image_url, i) => ({ image_url, display_order: start + i + 1, published: true })))
      setItems((list) => [...list, ...rows])
      notify(`${rows.length} image${rows.length === 1 ? '' : 's'} added. Add captions and categories below.`)
      if (rows.length === 1) setEditing(rows[0])
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  const move = async (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    try { await reorder('gallery_images', next.map((x) => x.id)) } catch (e) { notify(errorMessage(e), 'error'); reload() }
  }

  const confirmDelete = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await deleteGalleryImage(pending)
      setItems((l) => l.filter((x) => x.id !== pending.id))
      notify('Image deleted.')
      setPending(null)
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const collName = (id: string | null) => collections.data?.find((c) => c.id === id)?.name

  return (
    <>
      <Seo title="Gallery · Admin" noindex />
      <AdminPageHeader
        title="Gallery"
        description="Upload, caption, categorise and order the images on the gallery page."
        actions={
          <>
            <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploads.length > 0}>
              {uploads.length ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UploadCloud className="h-4 w-4" aria-hidden />} Upload images
            </Button>
            <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" aria-label="Upload gallery images" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) onFiles(f) }} />
          </>
        }
      />
      {uploads.length > 0 && (
        <div className="mb-6 space-y-2 rounded-xl border border-line bg-surface p-4">
          {uploads.map((u, i) => (
            <div key={i} className="text-xs text-muted">
              <div className="mb-1 flex justify-between"><span className="truncate">{u.name}</span><span>{u.pct}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-gradient-to-r from-purple to-purple-bright" style={{ width: `${u.pct}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      {error != null && <ErrorState error={error} onRetry={reload} />}
      {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>}
      {!loading && !error && (items.length ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="relative">
                <img src={img.image_url} alt={img.alt_text ?? ''} className="aspect-square w-full object-cover" loading="lazy" />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  {img.is_painted_example && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur"><Palette className="h-3 w-3" aria-hidden /> Painted</span>}
                  {!img.published && <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-silver backdrop-blur"><EyeOff className="h-3 w-3" aria-hidden /> Hidden</span>}
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm text-white">{img.caption || <span className="text-muted">No caption</span>}</p>
                <p className="line-clamp-1 text-xs text-muted">{collName(img.collection_id) ?? 'No category'}</p>
                {!img.alt_text && <p className="mt-1 text-[11px] text-amber-300">Missing alt text</p>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-muted hover:text-white disabled:opacity-25" aria-label="Move earlier"><ArrowLeft className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1.5 text-muted hover:text-white disabled:opacity-25" aria-label="Move later"><ArrowRight className="h-4 w-4" /></button>
                  </div>
                  <div className="flex">
                    <button onClick={() => setEditing(img)} className="rounded p-1.5 text-muted hover:text-white" aria-label={`Edit ${img.caption || 'image'}`}><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => setPending(img)} className="rounded p-1.5 text-muted hover:text-red-300" aria-label={`Delete ${img.caption || 'image'}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No gallery images yet">Use “Upload images” to add your first photos.</EmptyState>)}

      {editing && (
        <GalleryForm
          image={editing}
          collections={collections.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(saved) => { setItems((l) => l.map((x) => (x.id === saved.id ? saved : x))); setEditing(null) }}
        />
      )}
      <ConfirmDialog open={pending !== null} title="Delete image?" message="This removes the image from the gallery and deletes the uploaded file. This cannot be undone." onConfirm={confirmDelete} onCancel={() => setPending(null)} busy={busy} />
    </>
  )
}

function GalleryForm({ image, collections, onClose, onSaved }: { image: GalleryImage; collections: Collection[]; onClose: () => void; onSaved: (g: GalleryImage) => void }) {
  const notify = useToast()
  const [caption, setCaption] = useState(image.caption ?? '')
  const [alt, setAlt] = useState(image.alt_text ?? '')
  const [collectionId, setCollectionId] = useState(image.collection_id ?? '')
  const [painted, setPainted] = useState(image.is_painted_example)
  const [published, setPublished] = useState(image.published)
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = await updateGalleryImage(image.id, { caption: caption.trim() || null, alt_text: alt.trim() || null, collection_id: collectionId || null, is_painted_example: painted, published })
      notify('Image details saved.')
      onSaved(saved)
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open wide onClose={onClose} title="Edit gallery image" footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" type="submit" form="gallery-form" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save</Button></>}>
      <form id="gallery-form" onSubmit={submit} className="grid gap-5 sm:grid-cols-[14rem_1fr]">
        <img src={image.image_url} alt="" className="aspect-square w-full rounded-xl object-cover" />
        <div className="space-y-4">
          <Field label="Caption" htmlFor="g-caption" hint="Shown in the gallery and lightbox.">
            <input id="g-caption" className="input" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
          </Field>
          <Field label="Alt text" htmlFor="g-alt" hint="Describe the image for screen readers and search engines.">
            <input id="g-alt" className="input" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
          </Field>
          <Field label="Category" htmlFor="g-collection">
            <select id="g-collection" className="input" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              <option value="">No category</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Toggle id="g-painted" label="Painted example" description="Labels the image as painted inspiration (not as supplied)." checked={painted} onChange={setPainted} />
          <Toggle id="g-published" label="Visible on website" checked={published} onChange={setPublished} />
        </div>
      </form>
    </Modal>
  )
}
