import { Seo, DEFAULT_DESCRIPTION } from '@/components/seo/Seo'
import { Hero } from '@/components/home/Hero'
import { FeaturedCollections } from '@/components/home/FeaturedCollections'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { ReadyToPaintTeaser } from '@/components/home/ReadyToPaintTeaser'
import { WhyBustlab } from '@/components/home/WhyBustlab'
import { GalleryPreview } from '@/components/home/GalleryPreview'
import { FinalCta } from '@/components/home/FinalCta'
import { env } from '@/lib/env'

export default function Home() {
  return (
    <>
      <Seo
        description={DEFAULT_DESCRIPTION}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'BUSTLAB',
          url: env.siteUrl,
          logo: `${env.siteUrl}/images/brand/bustlab-logo.png`,
          description: DEFAULT_DESCRIPTION,
        }}
      />
      <Hero />
      <FeaturedCollections />
      <FeaturedProducts />
      <ReadyToPaintTeaser />
      <WhyBustlab />
      <GalleryPreview />
      <FinalCta />
    </>
  )
}
