import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchCollectionBySlug, fetchCollections, fetchProducts } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProductCard } from '@/components/product/ProductCard'
import { CollectionCard } from '@/components/product/CollectionCard'
import { EmptyState, ErrorState, PageLoader, Skeleton } from '@/components/ui/States'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { env } from '@/lib/env'
import NotFound from './NotFound'

export default function CollectionDetail() {
  const { slug = '' } = useParams()
  const collection = useAsync(() => fetchCollectionBySlug(slug), [slug])
  const id = collection.data?.id
  const products = useAsync(() => (id ? fetchProducts({ collectionId: id }) : Promise.resolve([])), [id])
  const others = useAsync(fetchCollections, [])

  if (collection.loading) return <PageLoader />
  if (collection.error) return <div className="container-x py-24"><ErrorState error={collection.error} onRetry={collection.reload} /></div>
  const c = collection.data
  if (!c) return <NotFound title="Collection not found" message="This collection may have been renamed or is no longer available." />

  const related = (others.data ?? []).filter((o) => o.id !== c.id).slice(0, 3)
  return (
    <>
      <Seo
        title={`${c.name} Collection`}
        description={c.description || `Explore the ${c.name} collection from BUSTLAB — collectible busts supplied unpainted and ready to paint.`}
        image={c.cover_image}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${c.name} — BUSTLAB`,
          description: c.description ?? undefined,
          url: `${env.siteUrl}/collections/${c.slug}`,
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${env.siteUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Collections', item: `${env.siteUrl}/collections` },
              { '@type': 'ListItem', position: 3, name: c.name },
            ],
          },
        }}
      />
      <PageHeader eyebrow="Collection" title={c.name} image={c.cover_image} crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: c.name }]}>
        {c.description}
      </PageHeader>

      <section className="container-x py-16 sm:py-20" aria-label={`${c.name} pieces`}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/collections" className="inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All collections
          </Link>
          {products.data && <p className="text-sm text-muted">{products.data.length} {products.data.length === 1 ? 'piece' : 'pieces'}</p>}
        </div>
        {products.error != null && <ErrorState error={products.error} onRetry={products.reload} />}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.loading && Array.from({ length: 3 }, (_, i) => <li key={i}><Skeleton className="aspect-[4/6]" /></li>)}
          {products.data?.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
        </ul>
        {!products.loading && !products.error && !products.data?.length && (
          <EmptyState title="New pieces coming soon">
            We&rsquo;re sculpting new designs for this collection. <Link className="text-purple-bright hover:text-white" to="/collections">Browse other collections</Link>.
          </EmptyState>
        )}
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-bg-2 py-16 sm:py-20" aria-labelledby="more-collections">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow="Keep exploring" title={<span id="more-collections">More collections</span>} />
              <ButtonLink to="/collections" variant="outline">All collections</ButtonLink>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((o) => <CollectionCard key={o.id} collection={o} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
