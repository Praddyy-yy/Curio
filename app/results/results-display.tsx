"use client"

import { useState } from "react"
import Link from "next/link"
import type { AIFeedback, SessionResult } from "@/lib/session"

const MODE_LABEL: Record<string, string> = {
  off_the_cuff: "Rawdog",
  research: "Research",
}

// ── Shared layout primitives ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--foreground-secondary)",
        margin: "0 0 12px 0",
      }}
    >
      {children}
    </p>
  )
}

function ProseSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`section-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <SectionLabel>{label}</SectionLabel>
      <div>{children}</div>
    </section>
  )
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "17px",
        lineHeight: "175%",
        color: "var(--foreground)",
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "0",
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "17px",
            lineHeight: "170%",
            color: "var(--foreground)",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              marginTop: "8px",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "var(--accent-gold)",
            }}
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Divider() {
  return (
    <div
      style={{ height: "1px", background: "var(--border)" }}
      aria-hidden="true"
    />
  )
}

// ── Transcript section (collapsible) ─────────────────────────────────────────

function TranscriptSection({ transcript }: { transcript: string }) {
  const [expanded, setExpanded] = useState(false)
  const LINES_TO_SHOW = 6
  const lines = transcript.split("\n")
  const isLong = lines.length > LINES_TO_SHOW || transcript.length > 600

  return (
    <ProseSection label="Transcript">
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          maxHeight: expanded || !isLong ? "none" : "144px", // ~6 lines at 24px line-height
          transition: "max-height 0.3s ease",
        }}
      >
        <p
          style={{
            fontSize: "15px",
            lineHeight: "170%",
            color: "var(--foreground-secondary)",
            margin: 0,
            whiteSpace: "pre-wrap",
            fontStyle: "italic",
          }}
        >
          {transcript || "No speech was detected."}
        </p>
        {isLong && !expanded && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "48px",
              background: "linear-gradient(to bottom, transparent, var(--background))",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginTop: "10px",
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--accent-gold)",
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          {expanded ? "Collapse transcript" : "Show full transcript"}
        </button>
      )}
    </ProseSection>
  )
}

// ── Feedback fallback (when AI analysis failed) ───────────────────────────────

function FeedbackUnavailable() {
  return (
    <div
      style={{
        padding: "20px 24px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--card)",
      }}
    >
      <p
        style={{
          fontSize: "15px",
          color: "var(--foreground-secondary)",
          margin: 0,
          fontStyle: "italic",
        }}
      >
        AI feedback could not be generated for this session. Your transcript is shown above.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ResultsDisplayProps {
  result: SessionResult
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const { topic, mode, transcript, feedback } = result
  const f: AIFeedback | null = feedback

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "56px 32px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
      }}
    >
      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
      </header>

      <Divider />

      {/* ── Transcript ── */}
      <TranscriptSection transcript={transcript} />

      <Divider />

      {/* ── AI Feedback ── */}
      {f ? (
        <>
          {/* Summary */}
          <ProseSection label="Summary">
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "20px",
                lineHeight: "160%",
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              {f.summary}
            </p>
          </ProseSection>

          <Divider />

          {/* Strengths */}
          <ProseSection label="What worked well">
            <BulletList items={f.strengths} />
          </ProseSection>

          {/* Areas to improve */}
          <ProseSection label="Areas to improve">
            <BulletList items={f.improvements} />
          </ProseSection>

          <Divider />

          {/* Clarity */}
          <ProseSection label="Clarity">
            <BodyText>{f.clarity}</BodyText>
          </ProseSection>

          {/* Structure */}
          <ProseSection label="Structure">
            <BodyText>{f.structure}</BodyText>
          </ProseSection>

          {/* Vocabulary */}
          <ProseSection label="Vocabulary">
            <BodyText>{f.vocabulary}</BodyText>
          </ProseSection>

          <Divider />

          {/* Filler & Confidence — side by side on wider screens */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "40px",
            }}
          >
            <ProseSection label="Filler words">
              <BodyText>{f.fillerObservations}</BodyText>
            </ProseSection>
            <ProseSection label="Confidence signals">
              <BodyText>{f.confidenceObservations}</BodyText>
            </ProseSection>
          </div>

          <Divider />

          {/* Practice again suggestion */}
          <ProseSection label="Try next time">
            <BodyText>{f.practiceAgainSuggestion}</BodyText>
          </ProseSection>
        </>
      ) : (
        <FeedbackUnavailable />
      )}

      <Divider />

      {/* ── Practice Again ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <SectionLabel>Ready to go again?</SectionLabel>
        <Link
          href={`/?topic=${encodeURIComponent(topic)}&mode=${mode}`}
          style={{
            display: "inline-block",
            padding: "13px 32px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "var(--foreground)",
            color: "var(--background)",
            fontSize: "16px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "opacity var(--duration-fast) var(--ease-out)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Practice again
        </Link>
      </div>
    </div>
  )
}
