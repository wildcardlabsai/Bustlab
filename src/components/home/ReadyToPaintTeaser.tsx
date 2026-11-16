import { ButtonLink } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'
import { PaintedExampleTag } from '@/components/gallery/PaintedExampleTag'
import { Reveal } from '@/components/ui/Reveal'

export function ReadyToPaintTeaser() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32" aria-labelledby="rtp-title">
      <div className="pointer-events-none absolute right-0 top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 translate-x-1/3 rounded-full bg-purple/15 blur-[140px]" aria-hidden />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-4">Ready to paint</p>
          <h2 id="rtp-title" className="display text-4xl sm:text-5xl lg:text-6xl">
            Your design.<br />
            <span className="text-gradient-purple">Your finish.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Every BUSTLAB bust is supplied unpainted and ready for you to make it your own. Whether you love realistic finishes, bold colours or weathered effects, the final creation is in your hands.
          </p>
          <ol className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-center">
            {['Prime', 'Paint', 'Display'].map((s, i) => (
              <li key={s} className="rounded-xl border border-line bg-surface px-3 py-4">
                <span className="block font-display text-2xl font-bold text-purple-bright">0{i + 1}</span>
                <span className="mt-1 block font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">{s}</span>
              </li>
            ))}
          </ol>
          <ButtonLink to="/ready-to-paint" size="lg" className="mt-10">Discover ready to paint</ButtonLink>
        </Reveal>
        <Reveal delay={120} className="grid grid-cols-2 gap-4">
          <figure className="relative mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
            <SmartImage src="/images/ready-to-paint/step-1-unpainted-1200.webp" alt="Unpainted grey Vanguard Mk II bust as supplied" sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[4/5] w-full object-cover" />
            <figcaption className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur">As supplied</figcaption>
          </figure>
          <figure className="relative overflow-hidden rounded-2xl border border-line bg-surface">
            <SmartImage src="/images/ready-to-paint/step-4-finished-1200.webp" alt="The same bust painted by a hobbyist as an inspiration example" sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[4/5] w-full object-cover" />
            <figcaption className="absolute left-3 top-3"><PaintedExampleTag /></figcaption>
          </figure>
          <p className="col-span-2 text-center text-xs text-muted">Painted example for inspiration only — your bust arrives unpainted.</p>
        </Reveal>
      </div>
    </section>
  )
}
