import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, Images, LayoutDashboard, LogOut, Mail, Menu, Package, Settings, Shapes, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/format'
import { ToastProvider } from './Toast'

const NAV = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/collections', label: 'Collections', Icon: Shapes },
  { to: '/admin/gallery', label: 'Gallery', Icon: Images },
  { to: '/admin/messages', label: 'Messages', Icon: Mail },
  { to: '/admin/settings', label: 'Website Settings', Icon: Settings },
]

export function AdminLayout() {
  const { session, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/admin" onClick={() => setOpen(false)} aria-label="Admin overview"><Logo className="h-10" /></Link>
        <button className="rounded-lg p-1.5 text-muted hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted/70">Content</p>
      <nav aria-label="Admin" className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-purple/15 text-white ring-1 ring-inset ring-purple/40' : 'text-silver/80 hover:bg-white/5 hover:text-white')}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-silver/80 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden /> View website
        </a>
        <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-silver/80 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-muted" title={session?.user.email}>{session?.user.email}</p>
      </div>
    </div>
  )

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-bg-2 lg:block">{sidebar}</aside>
        <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
          <div className={cn('absolute inset-0 bg-black/70 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
          <aside className={cn('absolute inset-y-0 left-0 w-72 border-r border-line bg-bg-2 transition-transform', open ? 'translate-x-0' : '-translate-x-full')}>{sidebar}</aside>
        </div>
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-silver hover:bg-white/5" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
            <Logo className="h-8" />
            <span className="ml-auto rounded-full bg-purple/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d9a3ff]">Admin</span>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
