import { useState, useCallback } from "react"
import type { AIFeedback } from "@/lib/session"
import type { DiscoveryMode } from "@/components/discovery/mode-selector"

interface UseAnalysisResult {
  /** Call to run AI analysis. Returns the feedback object or null on failure. */
  analyze: (transcript: string, topic: string, mode: DiscoveryMode) => Promise<AIFeedback | null>
  isAnalyzing: boolean
  error: string | null
  reset: () => void
}

/**
 * Hook that posts to /api/analyze and returns structured AI feedback.
 *
 * Intentionally separated from useTranscription — analysis is a
 * distinct responsibility with its own loading/error state.
 */
export function useAnalysis(): UseAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (transcript: string, topic: string, mode: DiscoveryMode): Promise<AIFeedback | null> => {
      setIsAnalyzing(true)
      setError(null)

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, topic, mode }),
        })

        const data = (await res.json()) as { feedback?: AIFeedback; error?: string }

        if (!res.ok || data.error) {
          const msg = data.error ?? `Analysis failed (${res.status})`
          setError(msg)
          return null
        }

        return data.feedback ?? null
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to analyze recording."
        setError(msg)
        return null
      } finally {
        setIsAnalyzing(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setIsAnalyzing(false)
    setError(null)
  }, [])

  return { analyze, isAnalyzing, error, reset }
}
