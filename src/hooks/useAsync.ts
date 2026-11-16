import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

interface Settled<T> {
  key: string | null
  data: T | undefined
  error: unknown
}

/**
 * Runs an async loader whenever `deps` (primitives) change. Loading state is derived
 * from whether the latest settled result matches the current dependency key, so stale
 * responses are ignored and no synchronous state updates happen inside effects.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [tick, setTick] = useState(0)
  const key = JSON.stringify([...deps, tick])
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: undefined, error: null })
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let active = true
    loaderRef.current().then(
      (data) => { if (active) setSettled({ key, data, error: null }) },
      (error) => { if (active) setSettled({ key, data: undefined, error }) },
    )
    return () => { active = false }
  }, [key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const loading = settled.key !== key
  return { data: settled.data, error: loading ? null : settled.error, loading, reload }
}
