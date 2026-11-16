import { ButtonLink } from '@/components/ui/Button'
import { ShopMenu } from '@/components/layout/ShopMenu'

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-t border-line py-28 sm:py-36" aria-labelledby="cta-title">
      <img src="/images/about/lineup-2000.webp" srcSet="/images/about/lineup-1000.webp 1000w, /images/about/lineup-2000.webp 2000w" sizes="100vw" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg via-bg/70 to-bg" />
      <div className="container-x text-center">
        <p className="eyebrow mb-5">Start your collection</p>
        <h2 id="cta-title" className="display mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
          Your next display piece <span className="text-gradient-purple">starts here.</span>
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/collections" size="lg">Explore collections</ButtonLink>
          <ShopMenu label="Visit our shop" variant="secondary" size="lg" align="left" />
        </div>
      </div>
    </section>
  )
}
