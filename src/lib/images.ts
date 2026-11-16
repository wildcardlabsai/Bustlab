/**
 * Responsive image helpers.
 * Bundled placeholder renders are published as `name-<width>.webp` pairs; for those we
 * can emit a srcset. Uploaded images are resized client-side before upload (see
 * prepareImageForUpload) so they are already delivered at a sensible size.
 */
const VARIANT = /^(.*)-(\d{3,4})\.webp$/

const KNOWN_WIDTHS: Record<string, number[]> = {
  '/images/hero/hero': [1200, 2400],
  '/images/about/lineup': [1000, 2000],
  '/images/ready-to-paint/workbench': [1000, 2000],
}

export function buildSrcSet(src: string | null | undefined): string | undefined {
  if (!src || !src.startsWith('/images/')) return undefined
  const m = src.match(VARIANT)
  if (!m) return undefined
  const base = m[1]
  const widths =
    KNOWN_WIDTHS[base] ??
    (base.startsWith('/images/collections/') || base.startsWith('/images/ready-to-paint/') ? [600, 1200] : [800, 1600])
  return widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ')
}

export interface PreparedImage {
  blob: Blob
  width: number
  height: number
  type: string
  extension: string
}

/**
 * Downscales large images and re-encodes them as WebP in the browser before upload.
 * SVG and GIF files are passed through untouched.
 */
export async function prepareImageForUpload(file: File, maxDimension = 2000, quality = 0.86): Promise<PreparedImage> {
  const passthrough = file.type === 'image/svg+xml' || file.type === 'image/gif'
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  if (passthrough || typeof createImageBitmap !== 'function') {
    return { blob: file, width: 0, height: 0, type: file.type, extension: ext }
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    if (!blob || blob.type !== 'image/webp') return { blob: file, width, height, type: file.type, extension: ext }
    return { blob, width, height, type: 'image/webp', extension: 'webp' }
  } catch {
    return { blob: file, width: 0, height: 0, type: file.type, extension: ext }
  }
}
