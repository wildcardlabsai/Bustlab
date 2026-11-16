import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

export function SectionHeading({ eyebrow, title, children, align = 'left', className, as: Tag = 'h2' }: {
  eyebrow?: string
  title: ReactNode
  children?: ReactNode
  align?: 'left' | 'center'
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <Tag className="display text-3xl sm:text-4xl lg:text-5xl">{title}</Tag>
      {children && <div className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{children}</div>}
    </div>
  )
}
