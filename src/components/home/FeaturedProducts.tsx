import { fetchProducts } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { ProductCard } from '@/components/product/ProductCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function FeaturedProducts() {
  const { data, error, loading, reload } = useAsync(async () => {
    const featured = await fetchProducts({ featured: true, limit: 6 })
    // Top up with the latest published pieces if fewer than four are featured.
    if (featured.length >= 4) return featured
    const latest = await fetchProducts({ limit: 6 })
    const ids = new Set(featured.map((p) => p.id))
    return [...featured, ...latest.filter((p) => !ids.has(p.id))].slice(0, 6)
  }, [])

  if (!loading && !error && !data?.length) return null
  return (
    <section className="relative border-y border-line bg-bg-2 py-24 sm:py-32" aria-labelledby="latest-title">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="New & featured" title={<span id="latest-title">The latest from BUSTLAB</span>}>
            Detailed busts, supplied unpainted and ready for primer.
          </SectionHeading>
          <ButtonLink to="/collections" variant="outline" className="shrink-0">View all</ButtonLink>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 6 }, (_, i) => <li key={i}><Skeleton className="aspect-[4/6]" /></li>)}
          {error != null && <li className="sm:col-span-2 lg:col-span-3"><ErrorState error={error} onRetry={reload} /></li>}
          {data?.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
