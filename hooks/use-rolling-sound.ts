import { useCallback, useRef, useEffect } from "react"

export function useRollingSound(uiSounds: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseBufferRef = useRef<AudioBuffer | null>(null)

  // Eagerly initialize AudioContext and pre-compute the buffer on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    
    const ctx = new AudioCtx()
    audioContextRef.current = ctx

    // Precompute a short white noise buffer for crisp clicks
    const bufferSize = ctx.sampleRate * 0.05 // 50ms of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    noiseBufferRef.current = buffer

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [])

  const playTick = useCallback((isFinal: boolean = false) => {
    if (!uiSounds) return
    try {
      const ctx = audioContextRef.current
      const buffer = noiseBufferRef.current
      if (!ctx || !buffer) return

      // Resume context if suspended (browsers suspend AudioContexts created without user gesture)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }

      const t = ctx.currentTime

      // Create noise source (must create a new BufferSource for every playback in Web Audio API)
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      // Use a bandpass filter to shape the noise into a crisp "tak"
      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.setValueAtTime(isFinal ? 4000 : 6000, t)
      filter.Q.setValueAtTime(1.5, t)
      
      const duration = isFinal ? 0.04 : 0.02
      const peakVolume = isFinal ? 0.8 : 0.5 // Satisfying, clear volume

      // Create gain node for a sharp transient envelope
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(peakVolume, t) // Instant attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration) // Fast decay

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start(t)
      noise.stop(t + duration)
    } catch {
      // Fail silently to continue the animation without throwing errors
    }
  }, [uiSounds])

  return { playTick }
}
