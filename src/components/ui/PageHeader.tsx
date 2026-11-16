import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'

export function PageHeader({ eyebrow, title, children, crumbs, image }: { eyebrow?: string; title: ReactNode; children?: ReactNode; crumbs?: Crumb[]; image?: string | null }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%] opacity-50" decoding="async" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/85 to-bg/30" />
        </>
      )}
      <div className="grid-bg absolute inset-0 -z-10 opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/4 -z-10 h-96 w-96 rounded-full bg-purple/20 blur-[120px]" aria-hidden />
      <div className="container-x py-16 sm:py-24">
        {crumbs && <Breadcrumbs items={crumbs} className="mb-8" />}
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="display max-w-4xl text-4xl sm:text-6xl lg:text-7xl">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{children}</div>}
      </div>
    </section>
  )
}
