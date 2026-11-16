import { Link } from 'react-router-dom'
import { ArrowRight, Images, Mail, Package, Plus, Shapes } from 'lucide-react'
import { fetchOverview } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { ButtonLink } from '@/components/ui/Button'
import { formatDateTime, cn } from '@/lib/format'
import { AdminPageHeader, Panel, StatusPill } from '../components/ui'

export default function Overview() {
  const { data, error, loading, reload } = useAsync(fetchOverview, [])
  const stats = data && [
    { label: 'Published products', value: data.publishedProducts, sub: `${data.draftProducts} draft${data.draftProducts === 1 ? '' : 's'}`, to: '/admin/products', Icon: Package },
    { label: 'Collections', value: data.collections, to: '/admin/collections', Icon: Shapes },
    { label: 'Gallery images', value: data.galleryImages, to: '/admin/gallery', Icon: Images },
    { label: 'New messages', value: data.newMessages, to: '/admin/messages', Icon: Mail },
  ]
  return (
    <>
      <Seo title="Admin overview" noindex />
      <AdminPageHeader
        title="Overview"
        description="A snapshot of your BUSTLAB website content."
        actions={<ButtonLink to="/admin/products/new" size="sm"><Plus className="h-4 w-4" aria-hidden /> New product</ButtonLink>}
      />
      {error != null && <ErrorState error={error} onRetry={reload} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        {stats?.map(({ label, value, sub, to, Icon }) => (
          <Link key={label} to={to} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-purple/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <Icon className="h-4 w-4 text-purple-bright" aria-hidden />
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
          </Link>
        ))}
      </div>

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Recent additions" actions={<Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-purple-bright hover:text-white">All products <ArrowRight className="h-3 w-3" aria-hidden /></Link>}>
            {data.recentProducts.length ? (
              <ul className="divide-y divide-line">
                {data.recentProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg-2">{p.main_image && <img src={p.main_image} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/products/${p.id}`} className="block truncate text-sm font-medium text-white hover:text-purple-bright">{p.name}</Link>
                      <p className="text-xs text-muted">Added {formatDateTime(p.created_at)}</p>
                    </div>
                    <StatusPill on={p.published} onLabel="Published" offLabel="Draft" />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No products yet. <Link className="text-purple-bright" to="/admin/products/new">Add your first product</Link>.</p>}
          </Panel>
          <Panel title="Recent messages" actions={<Link to="/admin/messages" className="inline-flex items-center gap-1 text-xs text-purple-bright hover:text-white">All messages <ArrowRight className="h-3 w-3" aria-hidden /></Link>}>
            {data.recentMessages.length ? (
              <ul className="divide-y divide-line">
                {data.recentMessages.map((m) => (
                  <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                    <Link to={`/admin/messages?open=${m.id}`} className="group block">
                      <div className="flex items-center justify-between gap-3">
                        <p className={cn('truncate text-sm', m.status === 'new' ? 'font-semibold text-white' : 'text-silver')}>{m.subject}</p>
                        {m.status === 'new' && <span className="h-2 w-2 shrink-0 rounded-full bg-purple-bright" aria-label="Unread" />}
                      </div>
                      <p className="truncate text-xs text-muted">{m.name} · {formatDateTime(m.created_at)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No contact messages yet.</p>}
          </Panel>
        </div>
      )}
    </>
  )
}
