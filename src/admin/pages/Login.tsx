import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams, Link } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/url'
import { errorMessage } from '@/lib/format'
import { SetupNotice } from '../components/SetupNotice'

export default function Login() {
  const { session, isAdmin, loading, signIn, sendPasswordReset } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const next = params.get('next')
  const target = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
  const [recovery, setRecovery] = useState(() => typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
  const [newPassword, setNewPassword] = useState('')

  if (!isSupabaseConfigured) return <SetupNotice />
  if (!loading && session && isAdmin && !recovery) return <Navigate to={target} replace />

  const onSetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 10) return setError('Use at least 10 characters for your new password.')
    setBusy(true)
    const { error: err } = await supabase!.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (err) return setError(err.message)
    window.history.replaceState(null, '', window.location.pathname)
    setRecovery(false)
  }

  if (recovery && session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <Seo title="Set a new password" noindex />
        <form onSubmit={onSetPassword} noValidate className="card w-full max-w-sm space-y-5 p-7">
          <h1 className="font-display text-lg font-semibold text-white">Choose a new password</h1>
          <div>
            <label htmlFor="new-password" className="label">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>Save password</Button>
        </form>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isValidEmail(email)) return setError('Please enter a valid email address.')
    if (!password) return setError('Please enter your password.')
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setError('')
    if (!isValidEmail(email)) return setError('Enter your email address above, then choose “Forgot password”.')
    try {
      await sendPasswordReset(email)
      setInfo('If an account exists for that address, a password reset link is on its way.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-4">
      <Seo title="Admin sign in" noindex />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-purple/20 blur-[140px]" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo className="h-10" /></div>
        <form onSubmit={onSubmit} noValidate className="card space-y-5 p-7" aria-labelledby="login-title">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-bright" aria-hidden />
            <h1 id="login-title" className="font-display text-lg font-semibold text-white">Admin sign in</h1>
          </div>
          {session && !isAdmin && !loading && (
            <p role="alert" className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">This account does not have administrator access.</p>
          )}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {info && <p role="status" className="text-sm text-emerald-300">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Sign in
          </Button>
          <button type="button" onClick={onReset} className="w-full text-center text-xs text-muted hover:text-white">Forgot password?</button>
        </form>
        <p className="mt-6 text-center text-xs text-muted"><Link to="/" className="hover:text-white">← Back to website</Link></p>
      </div>
    </div>
  )
}
