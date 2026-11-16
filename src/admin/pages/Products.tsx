import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit3, ExternalLink, Plus, Search, Star, Trash2 } from 'lucide-react'
import { deleteProduct, listAllCollections, listAllProducts, updateProductFlags } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { errorMessage, formatDate, cn } from '@/lib/format'
import type { Product } from '@/types/content'
import { AdminPageHeader, ConfirmDialog, StatusPill } from '../components/ui'
import { useToast } from '../components/Toast'

export default function Products() {
  const products = useAsync(listAllProducts, [])
  const collections = useAsync(listAllCollections, [])
  const notify = useToast()
  const [q, setQ] = useState('')
  const [collection, setCollection] = useState('all')
  const [status, setStatus] = useState('all')
  const [pending, setPending] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, Partial<Product>>>({})
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const collName = useMemo(() => new Map((collections.data ?? []).map((c) => [c.id, c.name])), [collections.data])
  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (products.data ?? [])
      .filter((p) => !removed.has(p.id))
      .map((p) => ({ ...p, ...overrides[p.id] }))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.slug.includes(term))
      .filter((p) => collection === 'all' || (collection === 'none' ? !p.category_id : p.category_id === collection))
      .filter((p) => status === 'all' || (status === 'published' ? p.published : status === 'draft' ? !p.published : p.featured))
  }, [products.data, overrides, removed, q, collection, status])

  const toggle = async (p: Product, key: 'published' | 'featured') => {
    const value = !p[key]
    setOverrides((o) => ({ ...o, [p.id]: { ...o[p.id], [key]: value } }))
    try {
      await updateProductFlags(p.id, { [key]: value })
      notify(`${p.name} ${key === 'published' ? (value ? 'published' : 'moved to drafts') : value ? 'featured' : 'unfeatured'}.`)
    } catch (e) {
      setOverrides((o) => ({ ...o, [p.id]: { ...o[p.id], [key]: !value } }))
      notify(errorMessage(e), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await deleteProduct(pending)
      setRemoved((r) => new Set(r).add(pending.id))
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
      <Seo title="Products · Admin" noindex />
      <AdminPageHeader
        title="Products"
        description="Add, edit and publish the busts shown on the website."
        actions={<ButtonLink to="/admin/products/new" size="sm"><Plus className="h-4 w-4" aria-hidden /> New product</ButtonLink>}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" placeholder="Search products…" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" aria-label="Filter by collection" value={collection} onChange={(e) => setCollection(e.target.value)}>
          <option value="all">All collections</option>
          {collections.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">Uncategorised</option>
        </select>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {products.error != null && <ErrorState error={products.error} onRetry={products.reload} />}
      {products.loading && <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {!products.loading && !products.error && (list.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-bg-2">{p.main_image && <img src={p.main_image} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
              <div className="min-w-0 flex-1">
                <Link to={`/admin/products/${p.id}`} className="block truncate font-medium text-white hover:text-purple-bright">{p.name}</Link>
                <p className="mt-0.5 truncate text-xs text-muted">{p.category_id ? collName.get(p.category_id) ?? '—' : 'Uncategorised'} · Updated {formatDate(p.updated_at)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusPill on={p.published} onLabel="Published" offLabel="Draft" />
                  {!p.shopify_url && !p.etsy_url && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">No product store links</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(p, 'featured')} className={cn('rounded-lg p-2 hover:bg-white/5', p.featured ? 'text-amber-300' : 'text-muted')} aria-pressed={p.featured} aria-label={`${p.featured ? 'Unfeature' : 'Feature'} ${p.name}`} title={p.featured ? 'Featured on homepage' : 'Feature on homepage'}>
                  <Star className={cn('h-4 w-4', p.featured && 'fill-current')} />
                </button>
                <button onClick={() => toggle(p, 'published')} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-silver ring-1 ring-line hover:text-white" aria-label={`${p.published ? 'Unpublish' : 'Publish'} ${p.name}`}>
                  {p.published ? 'Unpublish' : 'Publish'}
                </button>
                {p.published && <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label={`View ${p.name} on the website`}><ExternalLink className="h-4 w-4" /></a>}
                <Link to={`/admin/products/${p.id}`} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label={`Edit ${p.name}`}><Edit3 className="h-4 w-4" /></Link>
                <button onClick={() => setPending(p)} className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-300" aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={products.data?.length ? 'No products match your filters' : 'No products yet'}>
          {!products.data?.length && <Link to="/admin/products/new" className="text-purple-bright">Create your first product</Link>}
        </EmptyState>
      ))}
      <ConfirmDialog
        open={pending !== null}
        title="Delete product?"
        message={<>Permanently delete <strong className="text-white">{pending?.name}</strong>? Its uploaded images will also be removed. This cannot be undone.</>}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
        busy={busy}
      />
    </>
  )
}
