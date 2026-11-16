import { isValidEmail } from './url'

export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
  /** Honeypot — must stay empty. Hidden from real visitors. */
  website: string
}

export type ContactErrors = Partial<Record<keyof ContactForm, string>>

export const CONTACT_LIMITS = { name: 100, email: 254, subject: 150, message: 5000, messageMin: 10 } as const

/** Mirrors the database CHECK constraints on public.contact_messages. */
export function validateContact(f: ContactForm): ContactErrors {
  const e: ContactErrors = {}
  const name = f.name.trim(), email = f.email.trim(), subject = f.subject.trim(), message = f.message.trim()
  if (!name) e.name = 'Please enter your name.'
  else if (name.length > CONTACT_LIMITS.name) e.name = `Name must be ${CONTACT_LIMITS.name} characters or fewer.`
  if (!email) e.email = 'Please enter your email address.'
  else if (!isValidEmail(email) || email.length > CONTACT_LIMITS.email) e.email = 'Please enter a valid email address.'
  if (!subject) e.subject = 'Please add a subject.'
  else if (subject.length > CONTACT_LIMITS.subject) e.subject = `Subject must be ${CONTACT_LIMITS.subject} characters or fewer.`
  if (!message) e.message = 'Please enter a message.'
  else if (message.length < CONTACT_LIMITS.messageMin) e.message = `Your message should be at least ${CONTACT_LIMITS.messageMin} characters.`
  else if (message.length > CONTACT_LIMITS.message) e.message = `Message must be ${CONTACT_LIMITS.message} characters or fewer.`
  return e
}

/** Heuristic bot checks: filled honeypot, or submitted implausibly fast after the form appeared. */
export function looksLikeSpam(f: ContactForm, renderedAt: number, now = Date.now()): boolean {
  return f.website.trim() !== '' || now - renderedAt < 2500
}
