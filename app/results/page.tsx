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
 * Client Component that reads the session result from sessionStorage.
 * Redirects to / on direct access (no stored result).
 * The result is cleared from sessionStorage after reading — this page is ephemeral.
 *
 * Phase 7: fires a fire-and-forget POST /api/save-session after the result is read.
 */
export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const hasSaved = useRef(false)

  const saveSession = async (parsed: SessionResult) => {
    if (isSaving || !parsed.feedback) return
    setIsSaving(true)
    setSaveError(false)

    try {
      const res = await fetch("/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: parsed.topic,
          mode: parsed.mode,
          durationSeconds: parsed.durationSeconds ?? 0,
          feedback: parsed.feedback,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }
      
      hasSaved.current = true
    } catch (err) {
      console.error("[results] save-session failed:", err)
      setSaveError(true)
      hasSaved.current = false
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULTS_STORAGE_KEY)
      if (!raw) {
        router.replace("/")
        return
      }
      const parsed = JSON.parse(raw) as SessionResult
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(parsed)
      // Clear after reading — result is intentionally ephemeral
      sessionStorage.removeItem(RESULTS_STORAGE_KEY)

      // Guard: run exactly once per mount. Strict mode double-invoke safe.
      if (!hasSaved.current && parsed.feedback) {
        saveSession(parsed)
      }
    } catch {
      router.replace("/")
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  if (isLoading || !result) {
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
        <div style={{ background: "var(--error)", color: "var(--background)", padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 500 }}>
            Session could not be saved to your journey.
          </span>
          <button
            onClick={() => saveSession(result)}
            disabled={isSaving}
            style={{
              background: "transparent",
              border: "1px solid var(--background)",
              color: "var(--background)",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: "13px",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {/* Back link */}
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

