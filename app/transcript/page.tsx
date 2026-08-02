"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Nav } from "@/components/nav"
import { TranscriptDisplay } from "./transcript-display"
import type { DiscoveryMode } from "@/components/discovery/mode-selector"

/**
 * The key used to store/retrieve transcript data in sessionStorage.
 * Defined once here and in action-button.tsx to stay in sync.
 */
export const TRANSCRIPT_STORAGE_KEY = "curio_transcript_result"

interface TranscriptResult {
  topic: string
  mode: DiscoveryMode
  transcript: string
}

/**
 * Transcript results page — /transcript
 *
 * Client Component that reads the transcript result from sessionStorage.
 * If no result is found (e.g. direct URL access), redirects to the home page.
 * The result is cleared from storage after reading to keep things ephemeral.
 */
export default function TranscriptPage() {
  const router = useRouter()
  const [result, setResult] = useState<TranscriptResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TRANSCRIPT_STORAGE_KEY)
      if (!raw) {
        router.replace("/")
        return
      }
      const parsed = JSON.parse(raw) as TranscriptResult
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(parsed)
      // Clear after reading — this page is intentionally ephemeral
      sessionStorage.removeItem(TRANSCRIPT_STORAGE_KEY)
    } catch {
      router.replace("/")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading || !result) {
    // Show nothing while determining whether to redirect or render
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
          <Link
            href="/"
            className="back-link"
            style={{ display: "inline-flex" }}
          >
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

        <TranscriptDisplay
          topic={result.topic}
          mode={result.mode}
          transcript={result.transcript}
        />
      </main>
    </div>
  )
}
