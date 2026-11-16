import { Database } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'

export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="card max-w-lg p-8">
        <Logo className="h-12" />
        <div className="mt-6 flex items-center gap-3">
          <Database className="h-6 w-6 text-purple-bright" aria-hidden />
          <h1 className="font-display text-xl font-bold text-white">Connect Supabase to use the admin</h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The admin dashboard stores products, collections, gallery images and settings in Supabase. Set <code className="rounded bg-white/10 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-white/10 px-1">VITE_SUPABASE_ANON_KEY</code>, apply the migrations in <code className="rounded bg-white/10 px-1">supabase/migrations</code>, then rebuild. See the README for step-by-step instructions.
        </p>
        <p className="mt-3 text-sm text-muted">Until then, the public website shows the bundled starter content in read-only mode.</p>
        <ButtonLink to="/" size="sm" variant="secondary" className="mt-6">Back to website</ButtonLink>
      </div>
    </div>
  )
}
