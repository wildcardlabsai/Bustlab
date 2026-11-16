import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Images } from 'lucide-react'
import { fetchCollections, fetchGallery } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterChips } from '@/components/ui/FilterChips'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { Lightbox } from '@/components/gallery/Lightbox'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

const PAINTED = 'painted'
const UNPAINTED = 'unpainted'

export default function Gallery() {
  const gallery = useAsync(fetchGallery, [])
  const collections = useAsync(fetchCollections, [])
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') ?? 'all'
  const [open, setOpen] = useState<number | null>(null)

  const images = useMemo(() => gallery.data ?? [], [gallery.data])
  const options = useMemo(() => {
    const used = (collections.data ?? []).filter((c) => images.some((i) => i.collection_id === c.id))
    const opts = [{ value: 'all', label: 'All', count: images.length }]
    opts.push(...used.map((c) => ({ value: c.slug, label: c.name, count: images.filter((i) => i.collection_id === c.id).length })))
    const paintedCount = images.filter((i) => i.is_painted_example).length
    if (paintedCount) {
      opts.push({ value: UNPAINTED, label: 'As supplied', count: images.length - paintedCount })
      opts.push({ value: PAINTED, label: 'Painted examples', count: paintedCount })
    }
    return opts
  }, [images, collections.data])

  const visible = useMemo(() => {
    if (filter === 'all') return images
    if (filter === PAINTED) return images.filter((i) => i.is_painted_example)
    if (filter === UNPAINTED) return images.filter((i) => !i.is_painted_example)
    const c = collections.data?.find((c) => c.slug === filter)
    return c ? images.filter((i) => i.collection_id === c.id) : images
  }, [filter, images, collections.data])

  const setFilter = (v: string) => {
    setOpen(null)
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete('filter')
    else next.set('filter', v)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <Seo title="Gallery" description="Explore the BUSTLAB gallery — studio photography of our unpainted collectible busts, plus clearly labelled painted inspiration examples." />
      <PageHeader eyebrow="Gallery" title={<>Up close with <span className="text-gradient-purple">BUSTLAB</span></>} crumbs={[{ label: 'Home', to: '/' }, { label: 'Gallery' }]}>
        Studio shots of our busts as supplied, alongside painted inspiration. Painted pieces are clearly labelled — every bust is supplied unpainted.
      </PageHeader>
      <section className="container-x py-12 sm:py-16" aria-label="Gallery images">
        <div className="mb-10"><FilterChips label="Filter gallery" options={options} value={filter} onChange={setFilter} /></div>
        {gallery.error != null && <ErrorState error={gallery.error} onRetry={gallery.reload} />}
        {gallery.loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>}
        {!gallery.loading && !gallery.error && (visible.length ? (
          <MasonryGrid key={filter} images={visible} onOpen={setOpen} className="animate-fade-up" />
        ) : (
          <EmptyState title="No images yet" icon={<Images className="h-8 w-8 text-purple-bright" aria-hidden />}>New photography is on its way.</EmptyState>
        ))}
      </section>
      <Lightbox
        items={visible.map((i) => ({ src: i.image_url, alt: i.alt_text || i.caption || 'BUSTLAB bust', caption: i.caption, painted: i.is_painted_example }))}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </>
  )
}
