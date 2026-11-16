/**
 * Validates an external URL for safe use in an <a href>. Only http(s) URLs are allowed,
 * which rules out javascript:, data: and other dangerous schemes. Returns a normalised
 * string or null when the URL is missing or invalid (callers then hide the link).
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isValidHttpUrl(value: string): boolean {
  return safeExternalUrl(value) !== null
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** Props for anchors that open an external site safely in a new tab. */
export const externalLinkProps = { target: '_blank', rel: 'noopener noreferrer' } as const
