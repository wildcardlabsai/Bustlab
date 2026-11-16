import { useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import { buildSrcSet } from '@/lib/images'
import { cn } from '@/lib/format'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  alt: string
  sizes?: string
  priority?: boolean
  wrapperClassName?: string
}

/** Lazy, responsive image with a fade-in and a graceful placeholder when missing or broken. */
export function SmartImage({ src, alt, sizes = '100vw', priority, className, wrapperClassName, ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-surface text-muted', wrapperClassName)} role="img" aria-label={alt}>
        <ImageOff className="h-8 w-8 opacity-40" aria-hidden />
      </div>
    )
  }
  return (
    <img
      src={src}
      srcSet={buildSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn('transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', className)}
      {...rest}
    />
  )
}
