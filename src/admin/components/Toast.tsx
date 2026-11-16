import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/format'

interface Toast { id: number; tone: 'success' | 'error'; text: string }
type Notify = (text: string, tone?: Toast['tone']) => void

const ToastContext = createContext<Notify>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const notify = useCallback<Notify>((text, tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tone, text }])
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 3500)
  }, [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border p-4 text-sm shadow-2xl backdrop-blur-xl animate-fade-up', t.tone === 'success' ? 'border-emerald-400/30 bg-emerald-950/90 text-emerald-100' : 'border-red-400/30 bg-red-950/90 text-red-100')}>
            {t.tone === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> : <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />}
            <p className="flex-1">{t.text}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
