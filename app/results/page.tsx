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
  const hasSaved = useRef(false)

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

      // ── Fire-and-forget session save ────────────────────────────────────────
      // Guard: run exactly once per mount. Strict mode double-invoke safe.
      if (!hasSaved.current && parsed.feedback) {
        hasSaved.current = true
        fetch("/api/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: parsed.topic,
            mode: parsed.mode,
            durationSeconds: parsed.durationSeconds ?? 0,
            feedback: parsed.feedback,
          }),
        }).catch((err) => {
          // Silently catch — save failure should never surface to the user
          console.error("[results] save-session failed:", err?.message)
        })
      }
    } catch {
      router.replace("/")
    } finally {
      setIsLoading(false)
    }
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
