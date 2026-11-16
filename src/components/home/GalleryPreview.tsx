import { useState } from 'react'
import { fetchGallery } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { Lightbox } from '@/components/gallery/Lightbox'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/States'

export function GalleryPreview() {
  const { data, loading } = useAsync(fetchGallery, [])
  const [open, setOpen] = useState<number | null>(null)
  const images = (data ?? []).slice(0, 6)
  if (!loading && !images.length) return null
  return (
    <section className="container-x py-24 sm:py-32" aria-labelledby="gallery-title">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading eyebrow="Gallery" title={<span id="gallery-title">In the studio</span>}>
          A closer look at the details — plus painted inspiration from the BUSTLAB community.
        </SectionHeading>
      </div>
      <div className="mt-12">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>
        ) : (
          <MasonryGrid images={images} onOpen={setOpen} />
        )}
      </div>
      <div className="mt-10 flex justify-center">
        <ButtonLink to="/gallery" variant="outline" size="lg">View full gallery</ButtonLink>
      </div>
      <Lightbox
        items={images.map((i) => ({ src: i.image_url, alt: i.alt_text || i.caption || 'BUSTLAB bust', caption: i.caption, painted: i.is_painted_example }))}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </section>
  )
}
