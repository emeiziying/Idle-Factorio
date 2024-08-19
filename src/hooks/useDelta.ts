import { useCallback, useRef } from 'react'

export const useDelta = () => {
  const timestamp = useRef(0)
  const getDelta = useCallback(() => {
    const now = Date.now()

    // set initial timestamp
    if (!timestamp.current) timestamp.current = now

    const delta = now - timestamp.current
    timestamp.current = now

    return delta
  }, [])

  return getDelta
}
