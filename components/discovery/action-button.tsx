"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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

type MicCheckState = "idle" | "checking" | "ready" | "denied"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

/** Generate a RFC-4122 v4 UUID using the Web Crypto API. */
function generateSessionId(): string {
  return crypto.randomUUID()
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
  const [micCheckState, setMicCheckState] = useState<MicCheckState>("idle")

  // Tracks total seconds added via +10 sec so the saved duration is accurate
  const extraSecondsRef = useRef(0)

  /**
   * Single-flight guard for the transcription→analysis→navigate pipeline.
   * Set to true the moment run() begins; never reset within a session.
   * Prevents duplicate pipeline executions from React Strict Mode double-invocation
   * or from isTranscribing state changes re-triggering the effect.
   */
  const pipelineRunningRef = useRef(false)

  /**
   * Client-generated UUID for this session. Created when recording begins.
   * Sent to /api/save-session as an idempotency key. The database enforces
   * UNIQUE(user_id, session_id) so duplicate saves are silently ignored.
   */
  const sessionIdRef = useRef<string>("")

  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    mimeType,
    error: micError,
    checkMicPermission,
  } = useAudioRecorder()

  const { transcribe } = useTranscription()
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
  //
  // CRITICAL: `isTranscribing` is intentionally NOT in the dependency array.
  // Including it caused the effect to re-run mid-pipeline whenever transcription
  // state changed, leading to duplicate pipeline executions and multiple
  // navigations to /results and multiple saved sessions.
  //
  // The `pipelineRunningRef` boolean ref is the single authoritative gate.
  // It is set before any async work and is never reset within a session lifecycle.
  useEffect(() => {
    if (phase !== "processing") return
    if (!audioBlob) return // still waiting for MediaRecorder.onstop

    // Strict Mode / re-render guard: only one pipeline per session
    if (pipelineRunningRef.current) return
    pipelineRunningRef.current = true

    const run = async () => {
      const resolvedMimeType = mimeType ?? "audio/webm"
      const sessionId = sessionIdRef.current
      const topicTitle = currentTopicTitle ?? "Unknown Topic"

      // Step 1: Transcription
      const transcript = await transcribe(audioBlob, resolvedMimeType)
      if (transcript === null) {
        setPipelineError("Transcription failed. Please try again.")
        setPhase("error")
        pipelineRunningRef.current = false // allow retry
        return
      }

      // Step 2: AI Analysis (best-effort — failure doesn't block results)
      const feedback = await analyze(transcript, topicTitle, mode)
      // feedback === null means analysis failed; results page still renders transcript

      // Step 3: Write result to sessionStorage and navigate ONCE
      const totalDuration = speakingDuration + extraSecondsRef.current
      try {
        sessionStorage.setItem(
          RESULTS_STORAGE_KEY,
          JSON.stringify({
            sessionId,
            topic: topicTitle,
            mode,
            transcript,
            feedback,
            durationSeconds: totalDuration,
          })
        )
      } catch {
        // sessionStorage unavailable (e.g. private browsing quota exceeded)
      }

      router.push("/results")
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, audioBlob])

  const handleStart = async () => {
    setPipelineError(null)
    extraSecondsRef.current = 0
    pipelineRunningRef.current = false
    sessionIdRef.current = generateSessionId()

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
    extraSecondsRef.current = 0
    pipelineRunningRef.current = false
    sessionIdRef.current = ""
    setPhase("idle")
  }

  const handleExtend = useCallback(() => {
    speakingTimer.extend(10)
    extraSecondsRef.current += 10
  }, [speakingTimer])

  const handleCheckMic = useCallback(async () => {
    setMicCheckState("checking")
    const granted = await checkMicPermission()
    setMicCheckState(granted ? "ready" : "denied")
  }, [checkMicPermission])

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
            extraSecondsRef.current = 0
            pipelineRunningRef.current = false
            sessionIdRef.current = generateSessionId()
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
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
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

          {/* +10 sec — only shown during active speaking/recording */}
          {isSpeaking && isRecording && (
            <button
              onClick={handleExtend}
              aria-label="Add 10 seconds"
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--foreground-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "color var(--duration-fast), border-color var(--duration-fast)",
                alignSelf: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "var(--foreground)"
                e.currentTarget.style.borderColor = "var(--foreground)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "var(--foreground-secondary)"
                e.currentTarget.style.borderColor = "var(--border)"
              }}
            >
              +10 sec
            </button>
          )}
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

  // Mic check button label and color based on state
  const micLabel: Record<MicCheckState, string> = {
    idle: "Check microphone",
    checking: "Checking microphone\u2026",
    ready: "Microphone ready",
    denied: "Microphone access needed",
  }
  const micColor: Record<MicCheckState, string> = {
    idle: "var(--foreground-secondary)",
    checking: "var(--foreground-secondary)",
    ready: "var(--accent-gold)",
    denied: "var(--error)",
  }

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

      {/* Mic preflight — secondary, subtle */}
      <button
        onClick={handleCheckMic}
        disabled={micCheckState === "checking"}
        aria-label={micLabel[micCheckState]}
        style={{
          background: "none",
          border: "none",
          padding: "4px 0",
          fontSize: "13px",
          fontWeight: 450,
          color: micColor[micCheckState],
          cursor: micCheckState === "checking" ? "default" : "pointer",
          transition: "color var(--duration-fast)",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          opacity: micCheckState === "checking" ? 0.7 : 1,
        }}
      >
        {/* Icon changes per state */}
        {micCheckState === "ready" ? (
          // Checkmark
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : micCheckState === "denied" ? (
          // X
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Microphone
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
        {micLabel[micCheckState]}
      </button>

      {pipelineError && (
        <p style={{ color: "var(--error)", fontSize: "14px", margin: 0 }}>
          {pipelineError}
        </p>
      )}
    </div>
  )
}
