import type { DiscoveryMode } from "@/components/discovery/mode-selector"

/**
 * sessionStorage key for passing the session result from the recording flow
 * to the /results page. Defined here so action-button and the results page
 * stay in sync without importing across app/ boundaries.
 */
export const RESULTS_STORAGE_KEY = "curio_session_result"

/**
 * AI-generated feedback for a speaking session.
 * All fields are required. The API will set a field to an
 * "Insufficient transcript" notice if the recording was too short.
 */
export interface AIFeedback {
  summary: string
  strengths: string[]
  improvements: string[]
  clarity: string
  structure: string
  vocabulary: string
  fillerObservations: string
  confidenceObservations: string
  practiceAgainSuggestion: string
  /** A natural, conversational example of a stronger spoken response to the same topic. */
  betterVersion: string
}

/**
 * The full result written to sessionStorage after a session completes.
 * feedback is null if the AI analysis step failed — the transcript is
 * still displayed so the user doesn't lose their recording.
 */
export interface SessionResult {
  /** Client-generated UUID assigned before recording begins. Acts as idempotency key for save-session. */
  sessionId: string
  topic: string
  mode: DiscoveryMode
  transcript: string
  feedback: AIFeedback | null
  /** Speaking timer duration in seconds (used when saving session to DB). */
  durationSeconds: number
}
