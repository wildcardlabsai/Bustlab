import { Check, Paintbrush, SprayCan, Sparkles, Trophy, X } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SmartImage } from '@/components/ui/SmartImage'
import { ButtonLink } from '@/components/ui/Button'
import { PaintedExampleTag } from '@/components/gallery/PaintedExampleTag'
import { Reveal } from '@/components/ui/Reveal'

const STEPS = [
  { title: 'Unbox & prepare', body: 'Your bust arrives unpainted in a neutral finish. Check it over and gently remove any dust so your primer adheres evenly.', img: '/images/ready-to-paint/step-1-unpainted-1200.webp', alt: 'Unpainted grey bust as supplied', Icon: Sparkles, label: 'As supplied' },
  { title: 'Prime', body: 'Apply a primer suited to your paints — spray or brush-on. Dark, grey or white primers each set a different mood for the final piece.', img: '/images/ready-to-paint/step-2-primed-1200.webp', alt: 'The same bust coated in dark primer', Icon: SprayCan, label: 'Primed' },
  { title: 'Paint & detail', body: 'Block in base colours, then build up shading, highlights and detail. Washes, dry-brushing and metallics bring the sculpt to life.', img: '/images/ready-to-paint/step-3-basecoat-1200.webp', alt: 'The bust with flat base colours applied', Icon: Paintbrush, label: 'Base coats' },
  { title: 'Finish & display', body: 'Seal your work if you wish, then give it pride of place. Your colours, your story — a one-of-a-kind display piece.', img: '/images/ready-to-paint/step-4-finished-1200.webp', alt: 'The bust fully painted as an inspiration example', Icon: Trophy, label: 'Painted example' },
]

const STYLES = [
  { title: 'Realistic', body: 'Natural skin tones, worn leather and believable metal.' },
  { title: 'Bold colour', body: 'Vivid, graphic schemes that pop on any shelf.' },
  { title: 'Weathered', body: 'Rust, grime, chipping and battle damage.' },
  { title: 'Metallic', body: 'True-metal and non-metallic-metal finishes.' },
]

const INSPIRATION = [
  { src: '/images/painted/vanguard-painted-1600.webp', caption: 'Vanguard Mk II', alt: 'Vanguard Mk II painted in navy, bone and orange' },
  { src: '/images/painted/thornhorn-painted-1600.webp', caption: 'Thornhorn', alt: 'Thornhorn painted in deep red with bone horns' },
  { src: '/images/painted/diver-painted-1600.webp', caption: 'Abyss Diver', alt: 'Abyss Diver painted in brass and teal' },
  { src: '/images/painted/warden-painted-1600.webp', caption: 'Iron Warden', alt: 'Iron Warden painted with steel, crimson and gold' },
]

const FAQ = [
  { q: 'Are BUSTLAB busts painted?', a: 'No. Every BUSTLAB bust is supplied unpainted in a neutral finish, ready for you to prime and paint. Painted pieces on this website are clearly labelled inspiration examples.' },
  { q: 'Are paints or tools included?', a: 'No. Paints, primer, brushes and tools are not included — you are free to use whichever hobby supplies you prefer.' },
  { q: 'Do I need to prime my bust?', a: 'Priming is strongly recommended. It helps paint grip the surface and makes colours look more even.' },
  { q: 'Can I display a bust unpainted?', a: 'Absolutely. Many collectors enjoy the clean sculptural look of an unpainted piece — paint it now, later, or not at all.' },
]

export default function ReadyToPaint() {
  return (
    <>
      <Seo
        title="Ready to Paint"
        description="Every BUSTLAB bust is supplied unpainted and ready to paint. Learn how to prime, paint and customise your collectible bust, and get inspired by painted examples."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />
      <PageHeader eyebrow="Ready to paint" title={<>Ready to paint. <span className="text-gradient-purple">Ready to make yours.</span></>} image="/images/ready-to-paint/workbench-2000.webp" crumbs={[{ label: 'Home', to: '/' }, { label: 'Ready to Paint' }]}>
        BUSTLAB busts are supplied unpainted, giving you a blank canvas to prime, paint and customise however you like.
      </PageHeader>

      {/* What you receive */}
      <section className="container-x grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28" aria-labelledby="receive-title">
        <Reveal className="relative">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <SmartImage src="/images/ready-to-paint/step-1-unpainted-1200.webp" alt="An unpainted BUSTLAB bust exactly as supplied" sizes="(min-width:1024px) 50vw, 100vw" className="aspect-[4/5] w-full object-cover" />
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur">Exactly as supplied</span>
        </Reveal>
        <Reveal delay={100}>
          <SectionHeading eyebrow="What you receive" title={<span id="receive-title">A blank canvas for your creativity</span>}>
            Your bust arrives unpainted in a neutral finish so every detail of the sculpt is ready for your primer and paint. No factory colours to strip back — just a clean starting point.
          </SectionHeading>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-purple/40 bg-purple/10 p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">You receive</p>
              <ul className="mt-3 space-y-2 text-sm text-silver">
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-purple-bright" aria-hidden /> An unpainted BUSTLAB bust</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-purple-bright" aria-hidden /> A neutral finish ready for priming</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">Not included</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li className="flex gap-2"><X className="h-4 w-4 shrink-0" aria-hidden /> Paints or primer</li>
                <li className="flex gap-2"><X className="h-4 w-4 shrink-0" aria-hidden /> Brushes or hobby tools</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Process */}
      <section className="border-y border-line bg-bg-2 py-20 lg:py-28" aria-labelledby="process-title">
        <div className="container-x">
          <SectionHeading eyebrow="The process" title={<span id="process-title">From grey to great</span>} align="center">
            A typical journey from unpainted bust to finished display piece.
          </SectionHeading>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 90} className="flex">
                <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="relative">
                    <SmartImage src={s.img} alt={s.alt} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="aspect-[4/5] w-full object-cover" />
                    <span className="absolute left-3 top-3">
                      {i === 3 ? <PaintedExampleTag /> : <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur">{s.label}</span>}
                    </span>
                  </div>
                  <div className="flex-1 p-6">
                    <p className="font-display text-sm font-bold text-purple-bright">Step 0{i + 1}</p>
                    <h3 className="mt-1 flex items-center gap-2 text-xl font-bold uppercase"><s.Icon className="h-5 w-5 text-purple-bright" aria-hidden /> {s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
          <p className="mt-8 text-center text-xs text-muted">Steps 2–4 show how a hobbyist might paint the piece. Busts are supplied unpainted (step 1).</p>
        </div>
      </section>

      {/* Inspiration */}
      <section className="container-x py-20 lg:py-28" aria-labelledby="inspo-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Painting inspiration" title={<span id="inspo-title">What will you create?</span>}>
            These painted examples show just a few of the directions you could take. They are for inspiration only — your bust arrives unpainted.
          </SectionHeading>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INSPIRATION.map((p, i) => (
            <Reveal as="li" key={p.src} delay={i * 80}>
              <figure className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
                <SmartImage src={p.src} alt={`${p.alt} — painted inspiration example`} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
                <PaintedExampleTag className="absolute left-3 top-3" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10 font-display text-sm font-bold uppercase tracking-wider text-white">{p.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STYLES.map((s) => (
            <div key={s.title} className="rounded-xl border border-line bg-surface p-5">
              <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hobby setup */}
      <section className="border-y border-line bg-bg-2 py-20 lg:py-28" aria-labelledby="setup-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
              <SmartImage src="/images/ready-to-paint/workbench-2000.webp" alt="A primed bust on a painting grip surrounded by hobby paints, brushes and a palette" sizes="(min-width:1024px) 60vw, 100vw" className="aspect-[16/10] w-full object-cover" />
              <figcaption className="border-t border-line px-5 py-3 text-xs text-muted">Hobby painting setup shown for illustration. Paints, brushes and tools are not included.</figcaption>
            </figure>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-2">
            <SectionHeading eyebrow="Your workbench" title={<span id="setup-title">Bring your own tools</span>}>
              Use the primers, paints and brushes you already love — acrylics, airbrush, washes or oils. A steady grip or painting handle makes detailed work easier.
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x py-20 lg:py-28" aria-labelledby="faq-title">
        <SectionHeading eyebrow="Questions" title={<span id="faq-title">Ready-to-paint FAQ</span>} align="center" />
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-white">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-purple-bright transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/collections" size="lg">Choose your bust</ButtonLink>
          <ButtonLink to="/gallery?filter=painted" variant="secondary" size="lg">More inspiration</ButtonLink>
        </div>
      </section>
    </>
  )
}
