import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Info, Paintbrush, Ruler, Layers } from 'lucide-react'
import { fetchProductBySlug, fetchProducts } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { Seo, absoluteUrl } from '@/components/seo/Seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ErrorState, PageLoader } from '@/components/ui/States'
import { ProductGallery } from '@/components/product/ProductGallery'
import { PurchaseLinks } from '@/components/product/PurchaseLinks'
import { ProductCard } from '@/components/product/ProductCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { env } from '@/lib/env'
import { safeExternalUrl } from '@/lib/url'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const product = useAsync(() => fetchProductBySlug(slug), [slug])
  const p = product.data
  const related = useAsync(
    () => (p?.category_id ? fetchProducts({ collectionId: p.category_id, excludeId: p.id, limit: 3 }) : Promise.resolve([])),
    [p?.id, p?.category_id],
  )

  if (product.loading) return <PageLoader />
  if (product.error) return <div className="container-x py-24"><ErrorState error={product.error} onRetry={product.reload} /></div>
  if (!p) return <NotFound title="Piece not found" message="This bust may have been renamed or is no longer listed." />

  const images = [p.main_image, ...(p.gallery_images ?? [])].filter((x): x is string => Boolean(x))
  const description = p.short_description || p.description?.slice(0, 155) || `${p.name} — a BUSTLAB collectible bust supplied unpainted and ready to paint.`
  const offersUrl = safeExternalUrl(p.shopify_url) ?? safeExternalUrl(p.etsy_url)

  return (
    <>
      <Seo
        title={p.collection ? `${p.name} — ${p.collection.name}` : p.name}
        description={description}
        image={p.main_image}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: p.description || p.short_description || undefined,
          image: images.map(absoluteUrl),
          brand: { '@type': 'Brand', name: 'BUSTLAB' },
          category: p.collection?.name,
          url: `${env.siteUrl}/products/${p.slug}`,
          ...(offersUrl ? { sameAs: offersUrl } : {}),
        }}
      />
      <div className="container-x pt-10">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Collections', to: '/collections' },
            ...(p.collection ? [{ label: p.collection.name, to: `/collections/${p.collection.slug}` }] : []),
            { label: p.name },
          ]}
        />
      </div>

      <article className="container-x grid gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14">
        <ProductGallery images={images} name={p.name} readyToPaint={p.ready_to_paint} />

        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          {p.collection && (
            <Link to={`/collections/${p.collection.slug}`} className="eyebrow hover:text-white">{p.collection.name}</Link>
          )}
          <h1 className="display mt-3 text-4xl sm:text-5xl">{p.name}</h1>
          {p.short_description && <p className="mt-5 text-lg leading-relaxed text-silver">{p.short_description}</p>}

          {p.ready_to_paint && (
            <div className="mt-8 flex gap-4 rounded-xl border border-purple/40 bg-purple/10 p-5">
              <span className="clip-angle flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-br from-purple to-purple-bright text-white">
                <Paintbrush className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">Ready to paint</p>
                <p className="mt-1 text-sm leading-relaxed text-silver/85">
                  Supplied unpainted in a neutral finish, ready for you to prime, paint and customise. Paints and tools are not included.{' '}
                  <Link to="/ready-to-paint" className="font-semibold text-purple-bright hover:text-white">Learn more</Link>
                </p>
              </div>
            </div>
          )}

          <div className="mt-8"><PurchaseLinks product={p} /></div>

          {p.description && (
            <section className="mt-10" aria-labelledby="about-piece">
              <h2 id="about-piece" className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">About this piece</h2>
              <div className="mt-3 space-y-4 whitespace-pre-line text-base leading-relaxed text-muted">{p.description}</div>
            </section>
          )}

          {(p.dimensions || p.material_description) && (
            <section className="mt-10" aria-labelledby="details">
              <h2 id="details" className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">Details</h2>
              <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
                {p.dimensions && (
                  <div className="flex gap-4 p-4">
                    <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-purple-bright" aria-hidden />
                    <div><dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Dimensions</dt><dd className="mt-1 text-sm text-white">{p.dimensions}</dd></div>
                  </div>
                )}
                {p.material_description && (
                  <div className="flex gap-4 p-4">
                    <Layers className="mt-0.5 h-5 w-5 shrink-0 text-purple-bright" aria-hidden />
                    <div><dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Material &amp; finish</dt><dd className="mt-1 text-sm text-white">{p.material_description}</dd></div>
                  </div>
                )}
              </dl>
            </section>
          )}

          <p className="mt-8 flex gap-2 text-xs leading-relaxed text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Images show the unpainted bust as supplied unless clearly labelled as a painted example.
          </p>
          <Link to={p.collection ? `/collections/${p.collection.slug}` : '/collections'} className="mt-8 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to {p.collection ? p.collection.name : 'collections'}
          </Link>
        </div>
      </article>

      {!!related.data?.length && (
        <section className="border-t border-line bg-bg-2 py-16 sm:py-20" aria-labelledby="related-title">
          <div className="container-x">
            <SectionHeading eyebrow="From the same collection" title={<span id="related-title">You may also like</span>} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.data.map((r) => <li key={r.id}><ProductCard product={r} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
