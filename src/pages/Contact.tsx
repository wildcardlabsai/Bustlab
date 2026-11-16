import { useState, useRef, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Mail, Send, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { useSettings } from '@/context/SettingsContext'
import { contactBackendAvailable, submitContactMessage } from '@/services/api'
import { CONTACT_LIMITS, looksLikeSpam, validateContact, type ContactErrors, type ContactForm } from '@/lib/contactValidation'
import { isValidEmail } from '@/lib/url'
import { cn, errorMessage } from '@/lib/format'

const EMPTY: ContactForm = { name: '', email: '', subject: '', message: '', website: '' }

export default function Contact() {
  const { settings } = useSettings()
  const [form, setForm] = useState<ContactForm>(EMPTY)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [renderedAt] = useState(() => Date.now())
  const formRef = useRef<HTMLFormElement>(null)
  const backend = contactBackendAvailable()
  const email = settings.contact_email && isValidEmail(settings.contact_email) ? settings.contact_email : null

  const update = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validateContact(form)
    setErrors(v)
    if (Object.keys(v).length) {
      const first = Object.keys(v)[0]
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    if (looksLikeSpam(form, renderedAt)) {
      // Silently accept to avoid tipping off bots; nothing is stored.
      setStatus('sent')
      return
    }
    setStatus('sending')
    setSubmitError('')
    try {
      await submitContactMessage(form)
      setStatus('sent')
      setForm(EMPTY)
    } catch (err) {
      setStatus('error')
      setSubmitError(errorMessage(err))
    }
  }

  const field = (k: 'name' | 'email' | 'subject', label: string, type = 'text', autoComplete?: string) => (
    <div>
      <label htmlFor={`c-${k}`} className="label">{label} <span className="text-purple-bright" aria-hidden>*</span></label>
      <input
        id={`c-${k}`}
        name={k}
        type={type}
        autoComplete={autoComplete}
        value={form[k]}
        onChange={update(k)}
        maxLength={CONTACT_LIMITS[k]}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `c-${k}-err` : undefined}
        aria-required="true"
        disabled={!backend || status === 'sending'}
        className={cn('input', errors[k] && 'border-red-400/70 focus:border-red-400 focus:ring-red-400/30')}
      />
      {errors[k] && <p id={`c-${k}-err`} className="mt-1.5 text-xs text-red-300">{errors[k]}</p>}
    </div>
  )

  return (
    <>
      <Seo title="Contact" description="Get in touch with BUSTLAB about our collectible busts, collections, painting questions or wholesale and collaboration enquiries." />
      <PageHeader eyebrow="Contact" title={<>Get in <span className="text-gradient-purple">touch</span></>} crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}>
        Questions about a piece, a collection or painting your bust? Send us a message and we&rsquo;ll get back to you.
      </PageHeader>

      <section className="container-x grid gap-10 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <div className="card relative overflow-hidden p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-purple/15 blur-3xl" aria-hidden />
            {status === 'sent' ? (
              <div className="relative flex flex-col items-center py-10 text-center" role="status">
                <CheckCircle2 className="h-14 w-14 text-emerald-400" aria-hidden />
                <h2 className="mt-5 text-2xl font-bold uppercase">Message sent</h2>
                <p className="mt-3 max-w-sm text-muted">Thanks for getting in touch. We&rsquo;ve received your message and will reply as soon as we can.</p>
                <Button variant="secondary" className="mt-8" onClick={() => setStatus('idle')}>Send another message</Button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-5" aria-describedby={!backend ? 'contact-unavailable' : undefined}>
                <h2 className="text-2xl font-bold uppercase">Send a message</h2>
                {!backend && (
                  <div id="contact-unavailable" className="flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
                    <p>
                      The contact form isn&rsquo;t connected yet, so messages can&rsquo;t be sent from here.
                      {email ? <> Please email us at <a className="font-semibold underline" href={`mailto:${email}`}>{email}</a>.</> : ' Please reach us through our social channels or store pages for now.'}
                    </p>
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  {field('name', 'Name', 'text', 'name')}
                  {field('email', 'Email', 'email', 'email')}
                </div>
                {field('subject', 'Subject')}
                <div>
                  <label htmlFor="c-message" className="label">Message <span className="text-purple-bright" aria-hidden>*</span></label>
                  <textarea
                    id="c-message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={update('message')}
                    maxLength={CONTACT_LIMITS.message}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'c-message-err' : 'c-message-count'}
                    aria-required="true"
                    disabled={!backend || status === 'sending'}
                    className={cn('input resize-y', errors.message && 'border-red-400/70 focus:border-red-400 focus:ring-red-400/30')}
                  />
                  <div className="mt-1.5 flex justify-between text-xs">
                    {errors.message ? <p id="c-message-err" className="text-red-300">{errors.message}</p> : <span />}
                    <span id="c-message-count" className="text-muted">{form.message.length}/{CONTACT_LIMITS.message}</span>
                  </div>
                </div>
                {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
                <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="c-website">Website</label>
                  <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
                </div>
                {status === 'error' && (
                  <p role="alert" className="flex gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden /> {submitError}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-muted">We only use your details to reply to your message.</p>
                  <Button type="submit" size="lg" disabled={!backend || status === 'sending'}>
                    {status === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…</> : <><Send className="h-4 w-4" aria-hidden /> Send message</>}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:col-span-5">
          {email && (
            <div className="card p-6">
              <p className="eyebrow mb-3">Email</p>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 break-all font-display text-lg font-semibold text-white hover:text-purple-bright">
                <Mail className="h-5 w-5 shrink-0 text-purple-bright" aria-hidden /> {email}
              </a>
            </div>
          )}
          <div className="card p-6">
            <p className="eyebrow mb-3">Before you ask</p>
            <ul className="space-y-3 text-sm text-muted">
              <li><strong className="text-white">Are busts painted?</strong> No — every bust is supplied unpainted and ready to paint. <Link to="/ready-to-paint" className="text-purple-bright hover:text-white">Learn more</Link>.</li>
              <li><strong className="text-white">Orders &amp; delivery:</strong> purchases are made through our Shopify and Etsy stores — please contact the relevant store for order-specific questions.</li>
            </ul>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-3">Follow BUSTLAB</p>
            <SocialLinks />
            <p className="mt-3 text-sm text-muted">New releases, works in progress and painted showcases.</p>
          </div>
        </aside>
      </section>
    </>
  )
}
