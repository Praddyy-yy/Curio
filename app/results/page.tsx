"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Nav } from "@/components/nav"
import { ResultsDisplay } from "./results-display"
import { RESULTS_STORAGE_KEY, type SessionResult } from "@/lib/session"

/**
 * Results page — /results
 *
 * Reads the session result from sessionStorage (written by action-button).
 * Navigates to / only if there is genuinely no result (direct URL access).
 *
 * Critical design: the result is stored in a ref (resultRef) before being
 * removed from sessionStorage. This prevents React Strict Mode's double-
 * invocation from seeing an empty sessionStorage on the second run and
 * incorrectly redirecting to /.
 *
 * Session saving is fire-and-forget background work. It NEVER controls
 * whether the user sees their results.
 */
export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /**
   * Stores the parsed result from sessionStorage so the second Strict Mode
   * effect invocation can still access it even after sessionStorage is cleared.
   */
  const resultRef = useRef<SessionResult | null>(null)

  /**
   * Prevents save from firing more than once per mount cycle.
   * hasSavedRef is never reset — retry is explicit via button.
   */
  const hasSavedRef = useRef(false)

  const saveSession = async (parsed: SessionResult) => {
    if (!parsed.feedback) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch("/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: parsed.sessionId,
          topic: parsed.topic,
          mode: parsed.mode,
          durationSeconds: parsed.durationSeconds ?? 0,
          transcript: parsed.transcript ?? "",
          feedback: parsed.feedback,
        }),
      })

      if (!res.ok) {
        // Capture the actual server error message instead of hiding it
        let serverError = `HTTP ${res.status}`
        try {
          const body = await res.json()
          serverError = body.error ?? serverError
        } catch {
          try { serverError = await res.text() } catch { /* ignore */ }
        }
        console.error("[results] save-session server error:", serverError)
        throw new Error(serverError)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error("[results] save-session failed:", msg)
      setSaveError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // If we already have the result from a previous Strict Mode run, don't
    // re-read sessionStorage (it has already been cleared).
    if (resultRef.current) {
      setResult(resultRef.current)
      setIsLoading(false)
      return
    }

    try {
      const raw = sessionStorage.getItem(RESULTS_STORAGE_KEY)

      if (!raw) {
        // Genuinely no result — user accessed /results directly
        router.replace("/")
        return
      }

      const parsed = JSON.parse(raw) as SessionResult
      resultRef.current = parsed        // store before clearing
      setResult(parsed)

      // Clear sessionStorage — results are ephemeral.
      // resultRef is the source of truth from here on.
      sessionStorage.removeItem(RESULTS_STORAGE_KEY)

      // Fire save exactly once. Database enforces UNIQUE(user_id, session_id)
      // as the final idempotency guarantee.
      if (!hasSavedRef.current && parsed.feedback) {
        hasSavedRef.current = true
        saveSession(parsed)
      }
    } catch (err) {
      console.error("[results] Failed to parse session result:", err)
      router.replace("/")
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return null
  }

  if (!result) {
    // Will redirect via useEffect — render nothing
    return null
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav />

      {saveError && (
        <div
          style={{
            background: "var(--error)",
            color: "var(--background)",
            padding: "10px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            gap: "16px",
          }}
        >
          <span style={{ fontWeight: 500 }}>
            Session could not be saved to your journey.{" "}
            <span style={{ fontWeight: 400, opacity: 0.85 }}>({saveError})</span>
          </span>
          <button
            onClick={() => {
              if (result) saveSession(result)
            }}
            disabled={isSaving}
            style={{
              background: "transparent",
              border: "1px solid var(--background)",
              color: "var(--background)",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isSaving ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      <main style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            padding: "40px 32px 0",
          }}
        >
          <Link href="/" className="back-link" style={{ display: "inline-flex" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            New session
          </Link>
        </div>

        <ResultsDisplay result={result} />
      </main>
    </div>
  )
}
