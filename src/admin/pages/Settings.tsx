import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { getSettings, removeStoredFiles, saveSettings } from '@/services/admin'
import { useAsync } from '@/hooks/useAsync'
import { useSettings } from '@/context/SettingsContext'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { ErrorState, PageLoader } from '@/components/ui/States'
import { Logo } from '@/components/brand/Logo'
import { isValidEmail, isValidHttpUrl } from '@/lib/url'
import { errorMessage } from '@/lib/format'
import type { SiteSettings } from '@/types/content'
import { AdminPageHeader, Field, Panel, Toggle } from '../components/ui'
import { ImageUploadField } from '../components/ImageUpload'
import { useToast } from '../components/Toast'

type Form = {
  shopify_url: string; etsy_url: string; instagram_url: string; facebook_url: string; tiktok_url: string; youtube_url: string
  contact_email: string; logo_url: string | null; hero_image_url: string | null
  announcement_enabled: boolean; announcement_text: string; announcement_link: string; footer_tagline: string
}

const URL_FIELDS = ['shopify_url', 'etsy_url', 'instagram_url', 'facebook_url', 'tiktok_url', 'youtube_url'] as const

const toForm = (s: SiteSettings): Form => ({
  shopify_url: s.shopify_url ?? '', etsy_url: s.etsy_url ?? '', instagram_url: s.instagram_url ?? '', facebook_url: s.facebook_url ?? '',
  tiktok_url: s.tiktok_url ?? '', youtube_url: s.youtube_url ?? '', contact_email: s.contact_email ?? '', logo_url: s.logo_url, hero_image_url: s.hero_image_url,
  announcement_enabled: s.announcement_enabled, announcement_text: s.announcement_text ?? '', announcement_link: s.announcement_link ?? '', footer_tagline: s.footer_tagline ?? '',
})

export default function Settings() {
  const loaded = useAsync(getSettings, [])
  const { reload: reloadPublic } = useSettings()
  const notify = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [original, setOriginal] = useState<SiteSettings | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loaded.data) { setForm(toForm(loaded.data)); setOriginal(loaded.data) } // eslint-disable-line react-hooks/set-state-in-effect
  }, [loaded.data])

  if (loaded.loading || (!form && !loaded.error)) return <PageLoader />
  if (loaded.error || !form) return <ErrorState error={loaded.error} onRetry={loaded.reload} />

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => (f ? { ...f, [k]: v } : f)); setErrors((e) => ({ ...e, [k]: undefined })) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const er: typeof errors = {}
    for (const k of URL_FIELDS) if (form[k].trim() && !isValidHttpUrl(form[k])) er[k] = 'Enter a full URL starting with https://'
    if (form.contact_email.trim() && !isValidEmail(form.contact_email)) er.contact_email = 'Enter a valid email address.'
    const link = form.announcement_link.trim()
    if (link && !(link.startsWith('/') && !link.startsWith('//')) && !isValidHttpUrl(link)) er.announcement_link = 'Use a site path like /collections or a full https:// URL.'
    if (form.announcement_text.length > 200) er.announcement_text = 'Keep the announcement under 200 characters.'
    setErrors(er)
    if (Object.keys(er).length) { notify('Please fix the highlighted fields.', 'error'); return }
    setSaving(true)
    const n = (v: string) => v.trim() || null
    try {
      const saved = await saveSettings({
        shopify_url: n(form.shopify_url), etsy_url: n(form.etsy_url), instagram_url: n(form.instagram_url), facebook_url: n(form.facebook_url),
        tiktok_url: n(form.tiktok_url), youtube_url: n(form.youtube_url), contact_email: n(form.contact_email), logo_url: form.logo_url,
        hero_image_url: form.hero_image_url, announcement_enabled: form.announcement_enabled, announcement_text: n(form.announcement_text),
        announcement_link: n(form.announcement_link), footer_tagline: n(form.footer_tagline),
      })
      if (original) {
        const stale = [original.logo_url, original.hero_image_url].filter((u) => u && u !== saved.logo_url && u !== saved.hero_image_url)
        await removeStoredFiles(stale).catch(() => {})
      }
      setOriginal(saved)
      reloadPublic()
      notify('Website settings saved. Changes are live.')
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const url = (k: (typeof URL_FIELDS)[number], label: string, hint?: string) => (
    <Field label={label} htmlFor={`s-${k}`} error={errors[k]} hint={hint}>
      <input id={`s-${k}`} type="url" inputMode="url" placeholder="https://" className="input" value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={Boolean(errors[k])} />
    </Field>
  )

  return (
    <>
      <Seo title="Website settings · Admin" noindex />
      <form onSubmit={submit} noValidate>
        <AdminPageHeader
          title="Website settings"
          description="Store links, social profiles, branding and announcements. Changes update the website immediately."
          actions={<Button type="submit" size="sm" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} Save settings</Button>}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Online stores">
            <div className="space-y-5">
              {url('shopify_url', 'Shopify store URL', 'Used by the SHOP menu and as the fallback for products without their own Shopify link.')}
              {url('etsy_url', 'Etsy store URL', 'Used by the SHOP menu and as the fallback for products without their own Etsy link.')}
              <p className="text-xs text-muted">Leave a store blank to hide its buttons across the website.</p>
            </div>
          </Panel>
          <Panel title="Social & contact">
            <div className="space-y-5">
              {url('instagram_url', 'Instagram')}
              {url('tiktok_url', 'TikTok')}
              {url('facebook_url', 'Facebook')}
              {url('youtube_url', 'YouTube')}
              <Field label="Contact email" htmlFor="s-contact_email" error={errors.contact_email} hint="Shown on the contact page and footer.">
                <input id="s-contact_email" type="email" className="input" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} aria-invalid={Boolean(errors.contact_email)} />
              </Field>
            </div>
          </Panel>
          <Panel title="Announcement bar">
            <div className="space-y-5">
              <Toggle id="s-ann-on" label="Show announcement bar" checked={form.announcement_enabled} onChange={(v) => set('announcement_enabled', v)} />
              <Field label="Announcement text" htmlFor="s-announcement_text" error={errors.announcement_text} hint={`${form.announcement_text.length}/200`}>
                <input id="s-announcement_text" className="input" value={form.announcement_text} onChange={(e) => set('announcement_text', e.target.value)} maxLength={200} />
              </Field>
              <Field label="Announcement link (optional)" htmlFor="s-announcement_link" error={errors.announcement_link} hint="A page on this site (e.g. /collections) or a full https:// URL.">
                <input id="s-announcement_link" className="input" value={form.announcement_link} onChange={(e) => set('announcement_link', e.target.value)} aria-invalid={Boolean(errors.announcement_link)} />
              </Field>
            </div>
          </Panel>
          <Panel title="Branding">
            <div className="space-y-5">
              <div>
                <p className="label">Website logo</p>
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-bg-2 p-4">
                  <Logo src={form.logo_url} className="h-12" />
                  <span className="text-xs text-muted">{form.logo_url ? 'Uploaded logo' : 'Official BUSTLAB logo (default)'}</span>
                </div>
                <ImageUploadField id="s-logo" label="Website logo" value={form.logo_url} onChange={(v) => set('logo_url', v)} folder="branding" aspect="aspect-[4/1] object-contain p-4" />
                <p className="mt-1.5 text-xs text-muted">Upload a transparent PNG or SVG of the official logo. Remove it to use the official BUSTLAB logo.</p>
              </div>
              <div>
                <p className="label">Homepage hero image</p>
                <ImageUploadField id="s-hero" label="Homepage hero image" value={form.hero_image_url} onChange={(v) => set('hero_image_url', v)} folder="branding" aspect="aspect-video" />
                <p className="mt-1.5 text-xs text-muted">Wide landscape image (at least 2000px). Leave empty to use the default studio image.</p>
              </div>
              <Field label="Footer tagline" htmlFor="s-footer_tagline">
                <input id="s-footer_tagline" className="input" value={form.footer_tagline} onChange={(e) => set('footer_tagline', e.target.value)} maxLength={300} />
              </Field>
            </div>
          </Panel>
        </div>
      </form>
    </>
  )
}
