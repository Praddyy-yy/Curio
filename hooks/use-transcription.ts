import { useState, useCallback } from "react"

interface UseTranscriptionResult {
  transcript: string | null
  isProcessing: boolean
  error: string | null
  /** Upload the recorded blob to /api/transcribe and return the transcript string (or null on failure). */
  transcribe: (blob: Blob, mimeType: string) => Promise<string | null>
  reset: () => void
}

/**
 * Hook that handles uploading audio and fetching the transcript from the server.
 *
 * Intentionally separated from useAudioRecorder: recording and
 * upload/transcription are two distinct concerns.
 */
export function useTranscription(): UseTranscriptionResult {
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(async (blob: Blob, mimeType: string): Promise<string | null> => {
    setIsProcessing(true)
    setError(null)
    setTranscript(null)

    try {
      // Determine a sensible file extension from the MIME type
      const ext = mimeType.startsWith("audio/mp4") ? "m4a"
        : mimeType.startsWith("audio/ogg") ? "ogg"
        : mimeType.startsWith("audio/wav") ? "wav"
        : "webm"

      const formData = new FormData()
      formData.append("audio", blob, `recording.${ext}`)
      formData.append("mimeType", mimeType)

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = (await res.json()) as { transcript?: string; error?: string }

      if (!res.ok || data.error) {
        const msg = data.error ?? `Server error (${res.status})`
        setError(msg)
        return null
      }

      const text = data.transcript ?? ""
      setTranscript(text)
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process recording."
      setError(msg)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setTranscript(null)
    setIsProcessing(false)
    setError(null)
  }, [])

  return { transcript, isProcessing, error, transcribe, reset }
}
