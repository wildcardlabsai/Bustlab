import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/format'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-[0.14em] transition duration-200 select-none disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap'
const variants: Record<ButtonVariant, string> = {
  primary:
    'clip-angle bg-gradient-to-r from-purple to-purple-bright text-white shadow-[0_0_30px_-6px_rgba(161,0,255,0.7)] hover:shadow-[0_0_40px_-4px_rgba(192,0,255,0.9)] hover:brightness-110',
  secondary: 'clip-angle bg-white/[0.06] text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-white/[0.12] hover:ring-white/30',
  outline: 'clip-angle text-white ring-1 ring-inset ring-purple/70 hover:bg-purple/15 hover:ring-purple-bright',
  ghost: 'rounded-lg text-silver hover:bg-white/5 hover:text-white',
  danger: 'rounded-lg bg-red-600/90 text-white hover:bg-red-500',
}
const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[11px]',
  md: 'h-11 px-6 text-xs',
  lg: 'h-14 px-8 text-[13px]',
}

// eslint-disable-next-line react-refresh/only-export-components
export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className)

interface Common {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant, size, className, type = 'button', ...rest }, ref) => (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />
  ),
)
Button.displayName = 'Button'

export function ButtonLink({ variant, size, className, ...rest }: Common & LinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

/** External link button — always opens in a new tab with noopener. */
export function ExternalButton({ variant, size, className, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest} />
}
