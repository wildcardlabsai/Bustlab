import { Gem, Paintbrush, Sparkles, Trophy } from 'lucide-react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'

const FEATURES = [
  { title: 'Detailed designs', body: 'Distinctive sculptural designs with impressive detail.', Icon: Gem },
  { title: 'Ready to paint', body: 'Supplied unpainted, ready for priming and painting.', Icon: Paintbrush },
  { title: 'Made for collectors', body: 'Display pieces designed for enthusiasts.', Icon: Trophy },
  { title: 'Always evolving', body: 'New designs and collections added as BUSTLAB grows.', Icon: Sparkles },
]

export function WhyBustlab() {
  return (
    <section className="border-y border-line bg-bg-2 py-24 sm:py-32" aria-labelledby="why-title">
      <div className="container-x">
        <SectionHeading eyebrow="The BUSTLAB difference" title={<span id="why-title">Why BUSTLAB?</span>} align="center" />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, body, Icon }, i) => (
            <Reveal as="li" key={title} delay={i * 90}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-surface p-7 transition duration-300 hover:-translate-y-1 hover:border-purple/50">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple/20 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" aria-hidden />
                <span className="clip-angle flex h-12 w-12 items-center justify-center bg-gradient-to-br from-purple to-purple-bright text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-6 text-lg font-bold uppercase tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
