import { useRef, useState, type DragEvent } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { uploadImage, validateImageFile } from '@/services/admin'
import { errorMessage, cn } from '@/lib/format'
import { useToast } from './Toast'

interface Uploading { name: string; pct: number }

function useUploader(folder: string) {
  const [uploads, setUploads] = useState<Uploading[]>([])
  const notify = useToast()
  const run = async (files: File[]): Promise<string[]> => {
    const valid: File[] = []
    for (const f of files) {
      const err = validateImageFile(f)
      if (err) notify(err, 'error')
      else valid.push(f)
    }
    setUploads(valid.map((f) => ({ name: f.name, pct: 0 })))
    const results = await Promise.all(
      valid.map((f, i) =>
        uploadImage(f, folder, (pct) => setUploads((u) => u.map((x, j) => (j === i ? { ...x, pct } : x)))).catch((e) => {
          notify(errorMessage(e), 'error')
          return null
        }),
      ),
    )
    setUploads([])
    return results.filter((u): u is string => Boolean(u))
  }
  return { uploads, run }
}

function Progress({ uploads }: { uploads: Uploading[] }) {
  if (!uploads.length) return null
  return (
    <ul className="mt-3 space-y-2" aria-label="Upload progress">
      {uploads.map((u, i) => (
        <li key={i} className="text-xs text-muted">
          <div className="mb-1 flex justify-between"><span className="truncate">{u.name}</span><span>{u.pct}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-purple to-purple-bright transition-all" style={{ width: `${u.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function DropZone({ onFiles, multiple, busy, id, label }: { onFiles: (f: File[]) => void; multiple?: boolean; busy: boolean; id: string; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (busy) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition', over ? 'border-purple bg-purple/10' : 'border-white/15 bg-bg-2')}
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin text-purple-bright" aria-hidden /> : <UploadCloud className="h-6 w-6 text-purple-bright" aria-hidden />}
      <p className="text-sm text-silver">
        Drag &amp; drop or{' '}
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="font-semibold text-purple-bright hover:text-white disabled:opacity-50">browse</button>
      </p>
      <p className="text-xs text-muted">JPG, PNG, WebP, AVIF, GIF or SVG. Large photos are optimised automatically.</p>
      <input
        ref={input}
        id={id}
        aria-label={label}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </div>
  )
}

/** Single image field with preview, replace and remove. */
export function ImageUploadField({ value, onChange, folder, id, label, aspect = 'aspect-[4/5]' }: { value: string | null; onChange: (url: string | null) => void; folder: string; id: string; label: string; aspect?: string }) {
  const { uploads, run } = useUploader(folder)
  const busy = uploads.length > 0
  const handle = async (files: File[]) => {
    const [url] = await run(files.slice(0, 1))
    if (url) onChange(url)
  }
  return (
    <div>
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-line bg-bg-2">
          <img src={value} alt={`${label} preview`} className={cn('w-full object-cover', aspect)} />
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden /> Replace
              <input type="file" accept="image/*" className="sr-only" aria-label={`Replace ${label}`} disabled={busy} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) handle(f) }} />
            </label>
            <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/30">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
            </button>
          </div>
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden /></div>}
        </div>
      ) : (
        <DropZone id={id} label={label} onFiles={handle} busy={busy} />
      )}
      <Progress uploads={uploads} />
    </div>
  )
}

/** Ordered list of images with multi-upload, reordering and removal. */
export function MultiImageField({ value, onChange, folder, id, label }: { value: string[]; onChange: (urls: string[]) => void; folder: string; id: string; label: string }) {
  const { uploads, run } = useUploader(folder)
  const handle = async (files: File[]) => {
    const urls = await run(files)
    if (urls.length) onChange([...value, ...urls])
  }
  const move = (i: number, d: number) => {
    const next = [...value]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-xl border border-line bg-bg-2">
              <img src={url} alt={`${label} ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md bg-white/10 p-1.5 text-white disabled:opacity-30" aria-label={`Move image ${i + 1} earlier`}><ArrowLeft className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded-md bg-white/10 p-1.5 text-white disabled:opacity-30" aria-label={`Move image ${i + 1} later`}><ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-md bg-red-500/30 p-1.5 text-red-100" aria-label={`Remove image ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DropZone id={id} label={label} onFiles={handle} multiple busy={uploads.length > 0} />
      <Progress uploads={uploads} />
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { useUploader }
