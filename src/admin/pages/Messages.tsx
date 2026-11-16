import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, Inbox, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import { deleteMessage, listMessages, setMessageStatus } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { Seo } from '@/components/seo/Seo'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { FilterChips } from '@/components/ui/FilterChips'
import { errorMessage, formatDateTime, cn } from '@/lib/format'
import type { ContactMessage, MessageStatus } from '@/types/content'
import { AdminPageHeader, ConfirmDialog } from '../components/ui'
import { useToast } from '../components/Toast'

export default function Messages() {
  const { data, error, loading, reload } = useAsync(listMessages, [])
  const notify = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'inbox' | 'archived'>('inbox')
  const [patches, setPatches] = useState<Record<string, MessageStatus | 'deleted'>>({})
  const [pending, setPending] = useState<ContactMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const openId = params.get('open')

  const all = useMemo(
    () => (data ?? []).filter((m) => patches[m.id] !== 'deleted').map((m) => ({ ...m, status: (patches[m.id] as MessageStatus) ?? m.status })),
    [data, patches],
  )
  const list = all.filter((m) => (filter === 'archived' ? m.status === 'archived' : m.status !== 'archived'))
  const open = all.find((m) => m.id === openId) ?? null

  const setStatus = async (m: ContactMessage, status: MessageStatus, quiet = false) => {
    const prev = m.status
    setPatches((p) => ({ ...p, [m.id]: status }))
    try {
      await setMessageStatus(m.id, status)
      if (!quiet) notify(status === 'archived' ? 'Message archived.' : status === 'new' ? 'Marked as unread.' : 'Marked as read.')
    } catch (e) {
      setPatches((p) => ({ ...p, [m.id]: prev }))
      notify(errorMessage(e), 'error')
    }
  }

  const select = (m: ContactMessage) => {
    setParams({ open: m.id }, { replace: true })
    if (m.status === 'new') setStatus(m, 'read', true)
  }

  const confirmDelete = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await deleteMessage(pending.id)
      setPatches((p) => ({ ...p, [pending.id]: 'deleted' }))
      if (openId === pending.id) setParams({}, { replace: true })
      notify('Message deleted.')
      setPending(null)
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const unread = all.filter((m) => m.status === 'new').length
  return (
    <>
      <Seo title="Messages · Admin" noindex />
      <AdminPageHeader title="Messages" description={`Enquiries sent through the contact form${unread ? ` · ${unread} unread` : ''}.`} />
      <div className="mb-5">
        <FilterChips label="Message folder" value={filter} onChange={(v) => setFilter(v as typeof filter)} options={[
          { value: 'inbox', label: 'Inbox', count: all.filter((m) => m.status !== 'archived').length },
          { value: 'archived', label: 'Archived', count: all.filter((m) => m.status === 'archived').length },
        ]} />
      </div>
      {error != null && <ErrorState error={error} onRetry={reload} />}
      {loading && <Skeleton className="h-96" />}
      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-surface">
            {list.length ? list.map((m) => (
              <li key={m.id}>
                <button onClick={() => select(m)} className={cn('block w-full p-4 text-left transition hover:bg-surface-hover', open?.id === m.id && 'bg-purple/10')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', m.status === 'new' ? 'font-semibold text-white' : 'text-silver')}>{m.name}</p>
                    <span className="shrink-0 text-[11px] text-muted">{formatDateTime(m.created_at)}</span>
                  </div>
                  <p className={cn('mt-0.5 truncate text-sm', m.status === 'new' ? 'text-white' : 'text-muted')}>{m.subject}</p>
                  {m.status === 'new' && <span className="mt-1 inline-block rounded-full bg-purple/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d9a3ff]">New</span>}
                </button>
              </li>
            )) : <li className="p-8 text-center text-sm text-muted"><Inbox className="mx-auto mb-2 h-6 w-6" aria-hidden />No messages here.</li>}
          </ul>
          <div className="rounded-2xl border border-line bg-surface">
            {open ? (
              <article className="p-6">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold text-white">{open.subject}</h2>
                    <p className="mt-1 text-sm text-muted">{open.name} · <a href={`mailto:${open.email}`} className="text-purple-bright hover:text-white">{open.email}</a></p>
                    <p className="text-xs text-muted">{formatDateTime(open.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-purple px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-bright"><Reply className="h-3.5 w-3.5" aria-hidden /> Reply</a>
                    {open.status === 'archived' ? (
                      <button onClick={() => setStatus(open, 'read')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-silver ring-1 ring-line hover:text-white"><Inbox className="h-3.5 w-3.5" aria-hidden /> Move to inbox</button>
                    ) : (
                      <button onClick={() => setStatus(open, 'archived')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-silver ring-1 ring-line hover:text-white"><Archive className="h-3.5 w-3.5" aria-hidden /> Archive</button>
                    )}
                    <button onClick={() => setStatus(open, open.status === 'new' ? 'read' : 'new')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-silver ring-1 ring-line hover:text-white">
                      {open.status === 'new' ? <MailOpen className="h-3.5 w-3.5" aria-hidden /> : <Mail className="h-3.5 w-3.5" aria-hidden />} {open.status === 'new' ? 'Mark read' : 'Mark unread'}
                    </button>
                    <button onClick={() => setPending(open)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete</button>
                  </div>
                </header>
                <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-silver">{open.message}</p>
              </article>
            ) : (
              <EmptyState title="Select a message" className="border-0 bg-transparent" icon={<Mail className="h-8 w-8 text-purple-bright" aria-hidden />}>Choose a message from the list to read it.</EmptyState>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog open={pending !== null} title="Delete message?" message="This permanently deletes the message." onConfirm={confirmDelete} onCancel={() => setPending(null)} busy={busy} />
    </>
  )
}
