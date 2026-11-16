import { AlertTriangle, Loader2, PackageOpen, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, errorMessage } from '@/lib/format'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-muted', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-purple-bright" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('card mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center', className)}>
      <AlertTriangle className="h-8 w-8 text-amber-400" aria-hidden />
      <p className="font-display text-lg text-white">We couldn&rsquo;t load this content</p>
      <p className="text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-purple-bright hover:text-white">
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, icon, className }: { title: string; children?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('card mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center', className)}>
      {icon ?? <PackageOpen className="h-8 w-8 text-purple-bright" aria-hidden />}
      <p className="font-display text-lg text-white">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/[0.05]', className)} aria-hidden />
}
