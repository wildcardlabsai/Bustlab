import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Edit3, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { deleteCollection, listAllCollections, removeStoredFiles, reorder, saveCollection } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { SLUG_PATTERN, slugify } from '@/lib/slug'
import { errorMessage } from '@/lib/format'
import type { Collection } from '@/types/content'
import { AdminPageHeader, ConfirmDialog, Field, Modal, StatusPill, Toggle } from '../components/ui'
import { ImageUploadField } from '../components/ImageUpload'
import { useToast } from '../components/Toast'

interface Draft { name: string; slug: string; description: string; cover_image: string | null; active: boolean }
const blank: Draft = { name: '', slug: '', description: '', cover_image: null, active: true }

export default function Collections() {
  const { data, error, loading, reload } = useAsync(listAllCollections, [])
  const notify = useToast()
  const [items, setItems] = useState<Collection[]>([])
  const [editing, setEditing] = useState<Collection | 'new' | null>(null)
  const [pending, setPending] = useState<Collection | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (data) setItems(data) }, [data]) // eslint-disable-line react-hooks/set-state-in-effect

  const move = async (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    try {
      await reorder('collections', next.map((c) => c.id))
    } catch (e) {
      notify(errorMessage(e), 'error')
      reload()
    }
  }

  const toggleActive = async (c: Collection) => {
    try {
      const saved = await saveCollection({ name: c.name, slug: c.slug, active: !c.active }, c.id)
      setItems((list) => list.map((x) => (x.id === c.id ? saved : x)))
      notify(`${c.name} ${saved.active ? 'activated' : 'hidden from the website'}.`)
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await deleteCollection(pending)
      setItems((list) => list.filter((x) => x.id !== pending.id))
      notify(`${pending.name} deleted.`)
      setPending(null)
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Seo title="Collections · Admin" noindex />
      <AdminPageHeader
        title="Collections"
        description="Organise products into collections. Order here controls the order on the website."
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden /> New collection</Button>}
      />
      {error != null && <ErrorState error={error} onRetry={reload} />}
      {loading && <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {!loading && !error && (items.length ? (
        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {items.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted hover:text-white disabled:opacity-25" aria-label={`Move ${c.name} up`}><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1 text-muted hover:text-white disabled:opacity-25" aria-label={`Move ${c.name} down`}><ArrowDown className="h-4 w-4" /></button>
              </div>
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-bg-2">{c.cover_image && <img src={c.cover_image} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{c.name}</p>
                <p className="truncate text-xs text-muted">/collections/{c.slug}</p>
                <div className="mt-1.5"><StatusPill on={c.active} onLabel="Active" offLabel="Inactive" /></div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(c)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-silver ring-1 ring-line hover:text-white">{c.active ? 'Deactivate' : 'Activate'}</button>
                {c.active && <a href={`/collections/${c.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label={`View ${c.name} on the website`}><ExternalLink className="h-4 w-4" /></a>}
                <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label={`Edit ${c.name}`}><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => setPending(c)} className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-300" aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ol>
      ) : <EmptyState title="No collections yet">Create a collection to start organising your products.</EmptyState>)}

      {editing && (
        <CollectionForm
          collection={editing === 'new' ? null : editing}
          nextOrder={items.length + 1}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((list) => (list.some((x) => x.id === saved.id) ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]))
            setEditing(null)
          }}
        />
      )}
      <ConfirmDialog
        open={pending !== null}
        title="Delete collection?"
        message={<>Delete <strong className="text-white">{pending?.name}</strong>? Products in this collection are kept but become uncategorised. This cannot be undone.</>}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
        busy={busy}
      />
    </>
  )
}

function CollectionForm({ collection, nextOrder, onClose, onSaved }: { collection: Collection | null; nextOrder: number; onClose: () => void; onSaved: (c: Collection) => void }) {
  const notify = useToast()
  const [d, setD] = useState<Draft>(collection ? { name: collection.name, slug: collection.slug, description: collection.description ?? '', cover_image: collection.cover_image, active: collection.active } : blank)
  const [slugTouched, setSlugTouched] = useState(Boolean(collection))
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(String(v)) } : {}) }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const er: typeof errors = {}
    if (!d.name.trim()) er.name = 'Name is required.'
    if (!SLUG_PATTERN.test(d.slug)) er.slug = 'Use lowercase letters, numbers and single hyphens only.'
    if (d.description.length > 2000) er.description = 'Keep the description under 2000 characters.'
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(true)
    try {
      const saved = await saveCollection(
        { name: d.name.trim(), slug: d.slug, description: d.description.trim() || null, cover_image: d.cover_image, active: d.active, ...(collection ? {} : { display_order: nextOrder }) },
        collection?.id,
      )
      if (collection?.cover_image && collection.cover_image !== saved.cover_image) await removeStoredFiles([collection.cover_image]).catch(() => {})
      notify(`${saved.name} saved.`)
      onSaved(saved)
    } catch (err) {
      const msg = errorMessage(err)
      notify(msg, 'error')
      if (/slug/i.test(msg)) setErrors({ slug: 'This slug is already used by another collection.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={collection ? `Edit ${collection.name}` : 'New collection'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="collection-form" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save collection</Button>
        </>
      }
    >
      <form id="collection-form" onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-[1fr_14rem]">
        <div className="space-y-5">
          <Field label="Name" htmlFor="c-name" required error={errors.name}>
            <input id="c-name" className="input" value={d.name} onChange={(e) => set('name', e.target.value)} maxLength={120} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="URL slug" htmlFor="c-slug" required error={errors.slug} hint={`/collections/${d.slug || 'your-slug'}`}>
            <input id="c-slug" className="input font-mono" value={d.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} maxLength={120} aria-invalid={Boolean(errors.slug)} />
          </Field>
          <Field label="Description" htmlFor="c-description" error={errors.description}>
            <textarea id="c-description" rows={4} className="input" value={d.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} />
          </Field>
          <Toggle id="c-active" label="Active" description="Inactive collections are hidden from the website." checked={d.active} onChange={(v) => set('active', v)} />
        </div>
        <div>
          <p className="label">Cover image</p>
          <ImageUploadField id="c-cover" label="Cover image" value={d.cover_image} onChange={(v) => set('cover_image', v)} folder="collections" />
        </div>
      </form>
    </Modal>
  )
}
