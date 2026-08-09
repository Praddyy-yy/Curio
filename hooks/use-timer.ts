import { useState, useEffect, useCallback, useRef } from "react"

interface UseTimerResult {
  timeLeft: number
  isRunning: boolean
  start: () => void
  stop: () => void
  reset: () => void
  /** Extend the running timer by `seconds` without restarting the MediaRecorder or resetting state. */
  extend: (seconds: number) => void
}

/**
 * A reliable countdown timer hook based on Date.now().
 * Immune to browser tab throttling or device sleep.
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
  const [endTime, setEndTime] = useState<number | null>(null)

  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset time left when duration changes (only if not running)
  useEffect(() => {
    if (!isRunning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(durationInSeconds)
    }
  }, [durationInSeconds, isRunning])

  const start = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    setEndTime(Date.now() + timeLeft * 1000)
  }, [isRunning, timeLeft])

  const stop = useCallback(() => {
    setIsRunning(false)
    setEndTime(null)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setEndTime(null)
    setTimeLeft(durationInSeconds)
  }, [durationInSeconds])

  const extend = useCallback((seconds: number) => {
    if (!isRunning) return
    setEndTime((prev) => (prev !== null ? prev + seconds * 1000 : null))
    setTimeLeft((prev) => prev + seconds)
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || !endTime) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining <= 0) {
        setIsRunning(false)
        setEndTime(null)
        onCompleteRef.current?.()
      }
    }

    // Call immediately to sync
    tick()

    // 100ms interval ensures crisp updates without missing seconds due to throttling
    const timerId = setInterval(tick, 100)
    return () => clearInterval(timerId)
  }, [isRunning, endTime])

  return { timeLeft, isRunning, start, stop, reset, extend }
}
