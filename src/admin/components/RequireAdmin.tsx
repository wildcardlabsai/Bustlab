import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/env'
import { PageLoader } from '@/components/ui/States'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SetupNotice } from './SetupNotice'

/**
 * Client-side route guard for a good user experience. Real protection is enforced by
 * Supabase Row Level Security: without an admin JWT, every write (and every read of
 * drafts/messages) is refused by the database regardless of what the browser does.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading, signOut } = useAuth()
  const location = useLocation()
  if (!isSupabaseConfigured) return <SetupNotice />
  if (loading) return <div className="min-h-screen bg-bg"><PageLoader /></div>
  if (!session) return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="card max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" aria-hidden />
          <h1 className="mt-4 font-display text-xl font-bold text-white">Administrator access required</h1>
          <p className="mt-2 text-sm text-muted">You&rsquo;re signed in as {session.user.email}, but this account doesn&rsquo;t have administrator permissions.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => signOut()}>Sign out</Button>
            <ButtonLink to="/" size="sm" variant="ghost">Back to site</ButtonLink>
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
