"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTimer } from "@/hooks/use-timer"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { useTranscription } from "@/hooks/use-transcription"
import { useAnalysis } from "@/hooks/use-analysis"
import { DiscoveryMode } from "./mode-selector"
import { ProcessingScreen } from "./processing-screen"
import { RESULTS_STORAGE_KEY } from "@/lib/session"

interface ActionButtonProps {
  mode: DiscoveryMode
  researchDuration: number
  speakingDuration: number
  /** The title of the currently displayed topic. Forwarded to the results page. */
  currentTopicTitle: string | null
  onPhaseChange?: (phase: Phase) => void
}

type Phase =
  | "idle"
  | "researching"
  | "researchComplete"
  | "speaking"
  | "processing" // transcription + AI analysis running
  | "error"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function ActionButton({
  mode,
  researchDuration,
  speakingDuration,
  currentTopicTitle,
  onPhaseChange,
}: ActionButtonProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")
  const [pipelineError, setPipelineError] = useState<string | null>(null)

  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    mimeType,
    error: micError,
  } = useAudioRecorder()

  const { transcribe, isProcessing: isTranscribing } = useTranscription()
  const { analyze } = useAnalysis()

  const onResearchComplete = () => setPhase("researchComplete")

  const onSpeakingComplete = () => {
    // Timer ended — stop recording. audioBlob arrives async via MediaRecorder.onstop.
    setPhase("processing")
    stopRecording()
  }

  const researchTimer = useTimer(researchDuration, onResearchComplete)
  const speakingTimer = useTimer(speakingDuration, onSpeakingComplete)

  // Notify parent of phase changes
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  // Reset when mode/durations change while idle
  useEffect(() => {
    if (phase === "idle") {
      researchTimer.reset()
      speakingTimer.reset()
    }
  }, [mode, researchDuration, speakingDuration, phase, researchTimer, speakingTimer])

  // ── Main pipeline: transcription → analysis → navigate ────────────────────
  // Runs when phase="processing" AND audioBlob is ready (set async by MediaRecorder.onstop).
  useEffect(() => {
    if (phase !== "processing" || isTranscribing) return
    if (!audioBlob) return // still waiting for MediaRecorder.onstop

    const run = async () => {
      const resolvedMimeType = mimeType ?? "audio/webm"

      // Step 1: Transcription
      const transcript = await transcribe(audioBlob, resolvedMimeType)
      if (transcript === null) {
        setPipelineError("Transcription failed. Please try again.")
        setPhase("error")
        return
      }

      const topicTitle = currentTopicTitle ?? "Unknown Topic"

      // Step 2: AI Analysis (best-effort — failure doesn't block results)
      const feedback = await analyze(transcript, topicTitle, mode)
      // feedback === null means analysis failed; results page still renders transcript

      // Step 3: Write result and navigate
      try {
        sessionStorage.setItem(
          RESULTS_STORAGE_KEY,
          JSON.stringify({
            topic: topicTitle,
            mode,
            transcript,
            feedback,
            durationSeconds: speakingDuration,
          })
        )
      } catch {
        // sessionStorage unavailable (e.g. private browsing quota exceeded)
      }

      router.push("/results")
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, audioBlob, isTranscribing])

  const handleStart = async () => {
    setPipelineError(null)
    if (mode === "off_the_cuff") {
      setPhase("speaking")
      speakingTimer.start()
      await startRecording()
    } else {
      setPhase("researching")
      researchTimer.start()
    }
  }

  const handleSkipResearch = () => {
    researchTimer.stop()
    setPhase("researchComplete")
  }

  const handleReset = () => {
    stopRecording()
    researchTimer.reset()
    speakingTimer.reset()
    setPipelineError(null)
    setPhase("idle")
  }

  // ── Processing ─────────────────────────────────────────────────────────────
  if (phase === "processing") {
    return <ProcessingScreen />
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "24px",
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          Something went wrong
        </p>
        <p style={{ fontSize: "14px", color: "var(--foreground-secondary)", margin: 0 }}>
          {pipelineError ?? "An unexpected error occurred."}
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <button
            onClick={handleStart}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: "var(--foreground)",
              color: "var(--background)",
              fontSize: "15px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--foreground-secondary)",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Research Complete ──────────────────────────────────────────────────────
  if (phase === "researchComplete") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "28px",
            margin: 0,
            color: "var(--foreground)",
          }}
        >
          Research Complete
        </p>
        <button
          onClick={async () => {
            setPhase("speaking")
            speakingTimer.start()
            await startRecording()
          }}
          style={{
            padding: "14px 32px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "var(--foreground)",
            color: "var(--background)",
            fontSize: "18px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "transform var(--duration-fast) var(--ease-out)",
            marginTop: "4px",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Start {Math.floor(speakingDuration / 60)} min Timer
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "transparent",
            color: "var(--muted-foreground)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        {(micError || pipelineError) && (
          <p style={{ color: "var(--error)", fontSize: "14px", margin: 0 }}>
            {micError ?? pipelineError}
          </p>
        )}
      </div>
    )
  }

  // ── Researching / Speaking ─────────────────────────────────────────────────
  if (phase === "speaking" || phase === "researching") {
    const isSpeaking = phase === "speaking"
    const currentTimer = isSpeaking ? speakingTimer : researchTimer

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isSpeaking ? "var(--accent-gold)" : "var(--foreground-secondary)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isSpeaking && isRecording && (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--error)",
                display: "inline-block",
              }}
            />
          )}
          {isSpeaking ? "Speaking" : "Researching"}
        </p>

        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "48px",
            color: "var(--foreground)",
            lineHeight: 1,
          }}
        >
          {formatTime(currentTimer.timeLeft)}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          {phase === "researching" && (
            <button
              onClick={handleSkipResearch}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--accent-gold)",
                background: "transparent",
                color: "var(--accent-gold)",
                fontSize: "14px",
                cursor: "pointer",
                transition: "opacity var(--duration-fast)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Skip
            </button>
          )}
          <button
            onClick={handleReset}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted-foreground)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Idle ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <button
        onClick={handleStart}
        aria-label={`Start ${mode === 'off_the_cuff' ? 'Rawdog' : 'Research'} — ${mode === 'off_the_cuff' ? Math.floor(speakingDuration / 60) : Math.floor(researchDuration / 60)} min timer`}
        style={{
          padding: "14px 32px",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: "var(--foreground)",
          color: "var(--background)",
          fontSize: "18px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "transform var(--duration-fast) var(--ease-out)",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Start{" "}
        {mode === "off_the_cuff"
          ? Math.floor(speakingDuration / 60)
          : Math.floor(researchDuration / 60)}{" "}
        min Timer
      </button>
      {(micError || pipelineError) && (
        <p style={{ color: "var(--error)", fontSize: "14px", margin: 0 }}>
          {micError ?? pipelineError}
        </p>
      )}
    </div>
  )
}
