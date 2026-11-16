import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCollections, fetchProducts } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { CollectionCard } from '@/components/product/CollectionCard'
import { ProductCard } from '@/components/product/ProductCard'
import { FilterChips } from '@/components/ui/FilterChips'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'

export default function Collections() {
  const collections = useAsync(fetchCollections, [])
  const products = useAsync(() => fetchProducts(), [])
  const [params, setParams] = useSearchParams()
  const filter = params.get('collection') ?? 'all'

  const options = useMemo(() => {
    const list = products.data ?? []
    return [
      { value: 'all', label: 'All', count: list.length },
      ...(collections.data ?? []).map((c) => ({ value: c.slug, label: c.name, count: list.filter((p) => p.category_id === c.id).length })),
    ]
  }, [collections.data, products.data])

  const visible = useMemo(() => {
    const list = products.data ?? []
    if (filter === 'all') return list
    const c = collections.data?.find((c) => c.slug === filter)
    return c ? list.filter((p) => p.category_id === c.id) : list
  }, [filter, products.data, collections.data])

  const setFilter = (v: string) => {
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete('collection')
    else next.set('collection', v)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <Seo title="Collections" description="Browse BUSTLAB collections — sci-fi, gaming and fantasy, horror and dark art, heroes and legends, and original creations. Every bust is supplied unpainted and ready to paint." />
      <PageHeader eyebrow="Collections" title={<>Find your next <span className="text-gradient-purple">display piece</span></>} crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections' }]}>
        Explore every BUSTLAB collection. All busts are supplied unpainted and ready for you to prime, paint and customise.
      </PageHeader>

      <section className="container-x py-16 sm:py-20" aria-label="All collections">
        {collections.error != null && <ErrorState error={collections.error} onRetry={collections.reload} />}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[22rem]" />)}
          {collections.data?.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 80}>
              <CollectionCard collection={c} index={i} className="h-full" />
            </Reveal>
          ))}
        </div>
        {!collections.loading && !collections.error && !collections.data?.length && <EmptyState title="Collections coming soon">New collections are on their way.</EmptyState>}
      </section>

      <section className="border-t border-line bg-bg-2 py-16 sm:py-20" aria-labelledby="browse-title">
        <div className="container-x">
          <SectionHeading eyebrow="Browse" title={<span id="browse-title">Every piece</span>} />
          <div className="mt-8">
            <FilterChips label="Filter by collection" options={options} value={filter} onChange={setFilter} />
          </div>
          {products.error != null && <ErrorState error={products.error} onRetry={products.reload} className="mt-10" />}
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite">
            {products.loading && Array.from({ length: 8 }, (_, i) => <li key={i}><Skeleton className="aspect-[4/6]" /></li>)}
            {visible.map((p) => (
              <li key={p.id}><ProductCard product={p} /></li>
            ))}
          </ul>
          {!products.loading && !products.error && !visible.length && <EmptyState title="No pieces here yet" className="mt-10">New designs are added regularly — check back soon.</EmptyState>}
        </div>
      </section>
    </>
  )
}
