import { fetchCollections } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { CollectionCard } from '@/components/product/CollectionCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/format'

const span = ['lg:col-span-3', 'lg:col-span-3', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2']

export function FeaturedCollections() {
  const { data, error, loading, reload } = useAsync(fetchCollections, [])
  const items = (data ?? []).slice(0, 5)
  return (
    <section id="collections" className="container-x py-24 sm:py-32" aria-labelledby="collections-title">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading eyebrow="Collections" title={<span id="collections-title">Explore the collection</span>}>
          From futuristic armour to gothic nightmares — every design is sculpted for display and supplied unpainted, ready for your finish.
        </SectionHeading>
        <ButtonLink to="/collections" variant="outline" className="shrink-0">All collections</ButtonLink>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
        {loading && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className={cn('h-[22rem]', span[i])} />)}
        {error != null && <ErrorState error={error} onRetry={reload} className="lg:col-span-6" />}
        {!loading && !error && items.map((c, i) => (
          <Reveal key={c.id} delay={i * 80} className={cn(span[i], i === 4 && 'sm:col-span-2 lg:col-span-2')}>
            <CollectionCard collection={c} index={i} size={i < 2 ? 'lg' : 'md'} className="h-full" />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
