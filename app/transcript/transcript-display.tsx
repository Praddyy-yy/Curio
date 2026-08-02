import { type DiscoveryMode } from "@/components/discovery/mode-selector"

interface TranscriptDisplayProps {
  topic: string
  mode: DiscoveryMode
  transcript: string
}

const MODE_LABEL: Record<string, string> = {
  off_the_cuff: "Rawdog",
  research: "Research",
}

/**
 * Renders the transcript results: topic title, mode badge, and transcript body.
 * Pure presentational component — no data fetching.
 */
export function TranscriptDisplay({ topic, mode, transcript }: TranscriptDisplayProps) {
  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "64px 32px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Mode badge */}
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            margin: 0,
          }}
        >
          {MODE_LABEL[mode]}
        </p>

        {/* Topic title */}
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "var(--foreground)",
            margin: 0,
            textWrap: "balance",
          }}
        >
          {topic}
        </h1>
      </div>

      {/* Divider */}
      <div
        style={{ height: "1px", background: "var(--border)" }}
        aria-hidden="true"
      />

      {/* Transcript */}
      <section aria-labelledby="transcript-heading">
        <h2
          id="transcript-heading"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--foreground-secondary)",
            marginBottom: "20px",
          }}
        >
          Transcript
        </h2>

        {transcript ? (
          <p
            style={{
              fontSize: "17px",
              lineHeight: "175%",
              color: "var(--foreground)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {transcript}
          </p>
        ) : (
          <p
            style={{
              fontSize: "15px",
              color: "var(--muted-foreground)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            No speech was detected in the recording.
          </p>
        )}
      </section>
    </div>
  )
}
