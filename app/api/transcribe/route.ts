import { NextResponse } from "next/server"
import Groq from "groq-sdk"

/**
 * POST /api/transcribe
 *
 * Accepts a multipart/form-data request containing:
 *   - audio: Blob — the recorded audio file
 *   - mimeType: string — the MIME type reported by MediaRecorder
 *
 * Returns:
 *   - 200 { transcript: string } on success
 *   - 400 { error: string } for invalid/missing input
 *   - 502 { error: string } if Groq returns an error
 */
export async function POST(request: Request) {
  // ── 1. Parse multipart form data ─────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 })
  }

  const audioEntry = formData.get("audio")
  const mimeType = (formData.get("mimeType") as string | null) ?? "audio/webm"

  // ── 2. Validate the audio file ────────────────────────────────────────────────
  if (!audioEntry || !(audioEntry instanceof File)) {
    return NextResponse.json({ error: "No audio file received." }, { status: 400 })
  }

  const audioFile = audioEntry

  // Reject recordings that are too short to contain meaningful speech.
  // ~1000 bytes ≈ ~0.1 seconds — effectively silence or empty.
  if (audioFile.size < 1000) {
    return NextResponse.json(
      { error: "Recording is too short. Please speak for at least a few seconds." },
      { status: 400 }
    )
  }

  // ── 3. Validate environment ───────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error("[transcribe] GROQ_API_KEY is not set.")
    return NextResponse.json(
      { error: "Transcription service is not configured." },
      { status: 500 }
    )
  }

  // ── 4. Call Groq Whisper ──────────────────────────────────────────────────────
  const groq = new Groq({ apiKey })

  // Determine file extension from MIME type so Groq can identify the codec
  const ext = mimeType.startsWith("audio/mp4") ? "m4a"
    : mimeType.startsWith("audio/ogg") ? "ogg"
    : mimeType.startsWith("audio/wav") ? "wav"
    : "webm"

  // The Groq SDK expects a File object. We reconstruct one with the right name/type.
  const namedFile = new File([audioFile], `recording.${ext}`, { type: mimeType })

  try {
    const response = await groq.audio.transcriptions.create({
      file: namedFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    })

    const transcript = response.text?.trim() ?? ""

    return NextResponse.json({ transcript })
  } catch (err) {
    // Surface Groq API errors without leaking internal details
    const message =
      err instanceof Error ? err.message : "Transcription service returned an error."
    console.error("[transcribe] Groq API error:", message)
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 502 }
    )
  }
}
