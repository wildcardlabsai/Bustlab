import { ArrowDown } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { ShopMenu } from '@/components/layout/ShopMenu'
import { useSettings } from '@/context/SettingsContext'
import { buildSrcSet } from '@/lib/images'

const DEFAULT_HERO = '/images/hero/hero-2400.webp'

export function Hero() {
  const { settings } = useSettings()
  const src = settings.hero_image_url || DEFAULT_HERO
  return (
    <section className="relative isolate -mt-[var(--header-h)] flex min-h-[100svh] items-end overflow-hidden pt-[var(--header-h)] lg:items-center" aria-labelledby="hero-title">
      <img
        src={src}
        srcSet={buildSrcSet(src)}
        sizes="100vw"
        alt="Unpainted BUSTLAB collectible busts on illuminated display pedestals in a dark studio"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-20 h-full w-full animate-slow-zoom object-cover object-[60%_50%] lg:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/75 to-bg/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-transparent to-bg/40" />
      <div className="absolute -left-40 top-1/3 -z-10 h-[28rem] w-[28rem] animate-glow rounded-full bg-purple/30 blur-[120px]" aria-hidden />

      <div className="container-x relative pb-20 pt-24 lg:pb-0 lg:pt-0">
        <div className="max-w-2xl">
          <p className="eyebrow mb-6 animate-fade-up">Premium collectible busts</p>
          <h1 id="hero-title" className="display text-[clamp(3.25rem,10vw,7.5rem)]">
            <span className="block animate-fade-up [animation-delay:80ms]">Collect.</span>
            <span className="block animate-fade-up [animation-delay:160ms]">Create.</span>
            <span className="text-gradient-purple block animate-fade-up pb-2 [animation-delay:240ms]">Customise.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-silver/85 [animation-delay:320ms] sm:text-lg">
            Discover detailed collectible busts and sculptures designed for collectors, enthusiasts and creative minds. Explore our growing collection of character-inspired designs and original creations, all supplied ready to paint.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:400ms]">
            <ButtonLink to="/collections" size="lg">Explore collections</ButtonLink>
            <ShopMenu label="Shop BUSTLAB" variant="secondary" size="lg" align="left" />
          </div>
          <ul className="mt-12 flex animate-fade-up flex-wrap gap-x-8 gap-y-3 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-muted [animation-delay:480ms]">
            {['Supplied unpainted', 'Ready to paint', 'Built for display'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rotate-45 bg-purple-bright" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <a href="#collections" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted transition hover:text-white lg:flex">
        Scroll <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden />
      </a>
    </section>
  )
}
