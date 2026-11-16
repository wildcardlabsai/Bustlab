import { useId } from 'react'
import { cn } from '@/lib/format'

interface LogoProps {
  className?: string
  /** Uploaded logo (Admin > Website Settings). Falls back to the built-in wordmark. */
  src?: string | null
  title?: string
}

/**
 * BUSTLAB wordmark: bold italic lettering, BUST in silver/white, LAB in neon purple,
 * framed by angular purple brackets. Replace by uploading the official logo in the admin.
 */
export function Logo({ className, src, title = 'BUSTLAB' }: LogoProps) {
  const id = useId().replace(/:/g, '')
  if (src) {
    return <img src={src} alt={title} className={cn('h-8 w-auto object-contain', className)} decoding="async" />
  }
  return (
    <svg viewBox="0 0 248 56" role="img" aria-label={title} className={cn('h-8 w-auto', className)}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#C8CBD2" />
          <stop offset="1" stopColor="#8E919A" />
        </linearGradient>
        <linearGradient id={`${id}-purple`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#A100FF" />
          <stop offset="1" stopColor="#C000FF" />
        </linearGradient>
      </defs>
      <path d="M22 3H9L2 10v36l7 7h13" fill="none" stroke={`url(#${id}-purple)`} strokeWidth="4" strokeLinejoin="miter" />
      <path d="M226 3h13l7 7v36l-7 7h-13" fill="none" stroke={`url(#${id}-purple)`} strokeWidth="4" strokeLinejoin="miter" />
      <g transform="skewX(-12) translate(10 0)" fontFamily="'Space Grotesk Variable','Space Grotesk',ui-sans-serif,system-ui,sans-serif" fontWeight="700" fontSize="38">
        <text x="20" y="42" fill={`url(#${id}-silver)`} textLength="112" lengthAdjust="spacingAndGlyphs">BUST</text>
        <text x="136" y="42" fill={`url(#${id}-purple)`} textLength="76" lengthAdjust="spacingAndGlyphs">LAB</text>
      </g>
    </svg>
  )
}
