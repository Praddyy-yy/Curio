import { useState, useEffect, useCallback, useRef } from "react"

interface UseTimerResult {
  timeLeft: number
  isRunning: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

/**
 * A simple countdown timer hook.
 *
 * @param durationInSeconds The duration to count down from.
 * @param onComplete Optional callback fired when the timer reaches 0.
 */
export function useTimer(
  durationInSeconds: number,
  onComplete?: () => void
): UseTimerResult {
  const [timeLeft, setTimeLeft] = useState(durationInSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const onCompleteRef = useRef(onComplete)

  // Keep the ref updated with the latest callback to avoid stale closures
  // without needing it in the dependency array
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset time left when duration changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(durationInSeconds)
  }, [durationInSeconds])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(durationInSeconds)
  }, [durationInSeconds])

  useEffect(() => {
    if (!isRunning) return

    if (timeLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRunning(false)
      onCompleteRef.current?.()
      return
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timerId)
  }, [isRunning, timeLeft])

  return { timeLeft, isRunning, start, stop, reset }
}
