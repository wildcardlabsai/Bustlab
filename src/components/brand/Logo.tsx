import { cn } from '@/lib/format'

interface LogoProps {
  className?: string
  /** Logo uploaded in Admin > Website Settings. Falls back to the official BUSTLAB logo. */
  src?: string | null
  title?: string
}

/** Official BUSTLAB logo (public/images/brand). Rendered at its natural aspect ratio — never stretched. */
export const OFFICIAL_LOGO = '/images/brand/bustlab-logo-720.webp'
const OFFICIAL_SRCSET = '/images/brand/bustlab-logo-360.webp 360w, /images/brand/bustlab-logo-720.webp 720w'

export function Logo({ className, src, title = 'BUSTLAB' }: LogoProps) {
  const custom = src && src !== OFFICIAL_LOGO
  return (
    <img
      src={custom ? src : OFFICIAL_LOGO}
      srcSet={custom ? undefined : OFFICIAL_SRCSET}
      sizes="(min-width: 640px) 180px, 140px"
      alt={title}
      width={1844}
      height={625}
      decoding="async"
      className={cn('h-10 w-auto object-contain', className)}
    />
  )
}
