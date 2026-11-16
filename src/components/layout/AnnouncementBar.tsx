import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { safeExternalUrl } from '@/lib/url'

export function AnnouncementBar() {
  const { settings } = useSettings()
  const text = settings.announcement_text?.trim()
  if (!settings.announcement_enabled || !text) return null
  const link = settings.announcement_link?.trim() || ''
  const inner = (
    <span className="inline-flex items-center gap-2">
      {text}
      {link && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
    </span>
  )
  const cls = 'block bg-gradient-to-r from-purple via-purple-bright to-purple px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs'
  if (link.startsWith('/') && !link.startsWith('//')) return <Link to={link} className={cls}>{inner}</Link>
  const ext = safeExternalUrl(link)
  if (ext) return <a href={ext} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  return <p className={cls}>{inner}</p>
}
