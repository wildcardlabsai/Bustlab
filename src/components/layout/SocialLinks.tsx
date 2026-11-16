import { Mail } from 'lucide-react'
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/brand/SocialIcons'
import { useSettings } from '@/context/SettingsContext'
import { safeExternalUrl, isValidEmail } from '@/lib/url'
import { cn } from '@/lib/format'

export function SocialLinks({ className }: { className?: string }) {
  const { settings } = useSettings()
  const links = [
    { label: 'Instagram', href: safeExternalUrl(settings.instagram_url), Icon: InstagramIcon },
    { label: 'TikTok', href: safeExternalUrl(settings.tiktok_url), Icon: TikTokIcon },
    { label: 'Facebook', href: safeExternalUrl(settings.facebook_url), Icon: FacebookIcon },
    { label: 'YouTube', href: safeExternalUrl(settings.youtube_url), Icon: YouTubeIcon },
  ].filter((l) => l.href)
  const email = settings.contact_email && isValidEmail(settings.contact_email) ? settings.contact_email : null
  if (!links.length && !email) return null
  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a href={href!} target="_blank" rel="noopener noreferrer" aria-label={`BUSTLAB on ${label} (opens in a new tab)`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-silver ring-1 ring-line transition hover:text-white hover:ring-purple">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </a>
        </li>
      ))}
      {email && (
        <li>
          <a href={`mailto:${email}`} aria-label={`Email BUSTLAB at ${email}`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-silver ring-1 ring-line transition hover:text-white hover:ring-purple">
            <Mail className="h-[18px] w-[18px]" aria-hidden />
          </a>
        </li>
      )}
    </ul>
  )
}
