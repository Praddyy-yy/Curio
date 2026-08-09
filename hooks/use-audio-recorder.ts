import { useState, useCallback, useRef } from "react"

interface UseAudioRecorderResult {
  isRecording: boolean
  isPermissionGranted: boolean
  /** The recorded audio blob, available after stopRecording() is called. Null while recording or before first recording. */
  audioBlob: Blob | null
  /** The MIME type reported by MediaRecorder (e.g. "audio/webm;codecs=opus"). */
  mimeType: string | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  /**
   * Preflight check: requests microphone permission and immediately releases
   * the stream. Returns true if permission was granted, false if denied.
   * The browser caches the grant so startRecording() won't prompt again.
   */
  checkMicPermission: () => Promise<boolean>
}

/**
 * Hook to manage microphone permissions and MediaRecorder.
 *
 * Collects audio chunks as they arrive and assembles them into a Blob
 * when stopRecording() is called. The blob is available via `audioBlob`
 * and is consumed by the transcription flow.
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [mimeType, setMimeType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const requestPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setIsPermissionGranted(true)
      setError(null)
      return true
    } catch {
      setIsPermissionGranted(false)
      setError("Microphone permission denied or not available.")
      return false
    }
  }

  const checkMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      // If the Permissions API is available, check without prompting first
      if (typeof navigator.permissions?.query === "function") {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName })
        if (status.state === "granted") {
          setIsPermissionGranted(true)
          setError(null)
          return true
        }
        if (status.state === "denied") {
          setIsPermissionGranted(false)
          setError("Microphone access needed.")
          return false
        }
      }
      // Prompt for permission, then immediately release the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setIsPermissionGranted(true)
      setError(null)
      return true
    } catch {
      setIsPermissionGranted(false)
      setError("Microphone access needed.")
      return false
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Reset blob from any previous recording
    setAudioBlob(null)
    chunksRef.current = []

    let stream = streamRef.current

    if (!stream) {
      const granted = await requestPermission()
      if (!granted) return
      stream = streamRef.current
    }

    if (!stream) return

    try {
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      // Capture the MIME type the browser chose
      setMimeType(mediaRecorder.mimeType)

      // Collect every chunk as it arrives
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Assemble the final blob when the recorder stops
      mediaRecorder.onstop = () => {
        const type = mediaRecorderRef.current?.mimeType ?? "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        setAudioBlob(blob)
      }

      // Request data every 250ms so we don't lose data on abrupt stops
      mediaRecorder.start(250)
      setIsRecording(true)
    } catch {
      setError("Failed to start recording.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop() // triggers onstop → sets audioBlob
    }

    // Stop all tracks to release the microphone indicator
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsRecording(false)
    setIsPermissionGranted(false)
  }, [])

  return {
    isRecording,
    isPermissionGranted,
    audioBlob,
    mimeType,
    error,
    startRecording,
    stopRecording,
    checkMicPermission,
  }
}
