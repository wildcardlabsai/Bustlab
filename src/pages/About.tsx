import { Layers, Palette, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SmartImage } from '@/components/ui/SmartImage'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { fetchCollections } from '@/services/api'
import { useAsync } from '@/hooks/useAsync'

const PILLARS = [
  { title: 'Collectible sculpture', body: 'Busts designed first and foremost as display pieces — strong silhouettes and detail that rewards a closer look.', Icon: Layers },
  { title: 'Creative expression', body: 'Supplied ready to paint so every collector can put their own stamp on each piece.', Icon: Palette },
  { title: 'Distinctive designs', body: 'Character-inspired themes alongside original BUSTLAB creations you won’t find anywhere else.', Icon: Sparkles },
]

export default function About() {
  const collections = useAsync(fetchCollections, [])
  return (
    <>
      <Seo title="About" description="BUSTLAB is built around collectible sculpture, creative expression and distinctive display pieces — detailed busts supplied ready to paint." />
      <PageHeader eyebrow="About BUSTLAB" title={<>More than a bust. <span className="text-gradient-purple">It&rsquo;s a collectible.</span></>} crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]} />

      <section className="container-x grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-7">
          <div className="space-y-6 text-lg leading-relaxed text-silver sm:text-xl">
            <p className="font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">BUSTLAB is built around collectible sculpture, creative expression and distinctive display pieces.</p>
            <p>From sci-fi and fantasy-inspired designs to horror, gaming and original creations, we&rsquo;re passionate about bringing detailed busts to collectors and enthusiasts.</p>
            <p>Our pieces are supplied ready to paint, giving every customer the freedom to create something uniquely their own.</p>
            <p className="font-display text-2xl font-bold uppercase tracking-tight text-white">Welcome to <span className="text-gradient-purple">BUSTLAB.</span></p>
          </div>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
            <SmartImage src="/images/products/the-revenant-1-1600.webp" alt="An unpainted BUSTLAB gothic bust on a display pedestal" sizes="(min-width:1024px) 40vw, 100vw" className="aspect-[4/5] w-full object-cover" />
          </div>
        </Reveal>
      </section>

      <section className="relative isolate overflow-hidden border-y border-line" aria-label="The BUSTLAB line-up">
        <SmartImage src="/images/about/lineup-2000.webp" alt="A line-up of unpainted BUSTLAB busts on illuminated pedestals" sizes="100vw" className="aspect-[2/1] w-full object-cover sm:aspect-[21/9]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
      </section>

      <section className="container-x py-20 lg:py-28" aria-labelledby="pillars-title">
        <SectionHeading eyebrow="What drives us" title={<span id="pillars-title">Sculpted for collectors</span>} align="center" />
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {PILLARS.map(({ title, body, Icon }, i) => (
            <Reveal as="li" key={title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-line bg-surface p-8">
                <span className="clip-angle flex h-12 w-12 items-center justify-center bg-gradient-to-br from-purple to-purple-bright text-white"><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-6 text-xl font-bold uppercase">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {!!collections.data?.length && (
        <section className="border-t border-line bg-bg-2 py-20 lg:py-24" aria-labelledby="themes-title">
          <div className="container-x grid gap-10 lg:grid-cols-2 lg:items-center">
            <SectionHeading eyebrow="Our worlds" title={<span id="themes-title">What we make</span>}>
              Our growing range spans multiple themes, with new designs and collections added as BUSTLAB grows.
            </SectionHeading>
            <ul className="flex flex-wrap gap-3">
              {collections.data.map((c) => (
                <li key={c.id}>
                  <Link to={`/collections/${c.slug}`} className="inline-flex rounded-full border border-line bg-surface px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:border-purple hover:bg-purple/15">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container-x py-20 text-center lg:py-28">
        <h2 className="display mx-auto max-w-3xl text-4xl sm:text-5xl">Start your <span className="text-gradient-purple">collection</span></h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/collections" size="lg">Explore collections</ButtonLink>
          <ButtonLink to="/contact" variant="secondary" size="lg">Get in touch</ButtonLink>
        </div>
      </section>
    </>
  )
}
