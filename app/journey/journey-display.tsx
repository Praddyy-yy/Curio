"use client"

import { useState } from "react"
import type { SpeakingSession, CommunicationProfile, JourneyLetter } from "@/lib/supabase/types"

// ── Shared primitives ─────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)" }} aria-hidden="true" />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--foreground-secondary)",
        margin: "0 0 20px 0",
      }}
    >
      {children}
    </p>
  )
}

function EmptyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "17px",
        lineHeight: "175%",
        color: "var(--foreground-secondary)",
        fontStyle: "italic",
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

// ── Communication Profile section ─────────────────────────────────────────────

function ProfileSection({ profile }: { profile: CommunicationProfile | null }) {
  return (
    <section aria-labelledby="profile-heading">
      <SectionLabel>Communication Profile</SectionLabel>

      {profile?.profile_summary ? (
        <>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(18px, 2.5vw, 22px)",
              lineHeight: "160%",
              color: "var(--foreground)",
              margin: "0 0 24px 0",
            }}
          >
            {profile.profile_summary}
          </p>

          {profile.current_focus && (
            <div
              style={{
                borderLeft: "2px solid var(--accent-gold)",
                paddingLeft: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--accent-gold)",
                  margin: "0 0 6px 0",
                }}
              >
                Current Focus
              </p>
              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "155%",
                  color: "var(--foreground)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                {profile.current_focus}
              </p>
            </div>
          )}
        </>
      ) : (
        <EmptyNotice>
          Your communication profile will appear here after your first session.
        </EmptyNotice>
      )}
    </section>
  )
}

// ── Session card ──────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const MODE_LABEL: Record<string, string> = {
  off_the_cuff: "Rawdog",
  research: "Research",
}

function SessionCard({ session }: { session: SpeakingSession }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "20px",
        paddingBottom: "4px",
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
        aria-expanded={expanded}
      >
        {/* Mode + date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--accent-gold)",
            }}
          >
            {MODE_LABEL[session.mode] ?? session.mode}
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "var(--foreground-secondary)",
            }}
          >
            {formatDate(session.created_at)}
          </span>
        </div>

        {/* Topic */}
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 400,
            color: "var(--foreground)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {session.topic}
        </p>

        {/* Summary (always visible) */}
        {session.summary && (
          <p
            style={{
              fontSize: "14px",
              lineHeight: "165%",
              color: "var(--foreground-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            {session.summary}
          </p>
        )}

        {/* Expand toggle */}
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--accent-gold)",
            margin: "8px 0 0 0",
          }}
        >
          {expanded ? "Show less" : "Show feedback"}
        </p>
      </button>

      {/* Expanded feedback */}
      {expanded && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {session.strengths?.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--foreground-secondary)", margin: "0 0 8px 0" }}>
                Strengths
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {session.strengths.map((s, i) => (
                  <li key={i} style={{ fontSize: "15px", lineHeight: "165%", color: "var(--foreground)", display: "flex", gap: "10px" }}>
                    <span style={{ flexShrink: 0, marginTop: "9px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-gold)" }} aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.improvements?.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--foreground-secondary)", margin: "0 0 8px 0" }}>
                Areas to improve
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {session.improvements.map((s, i) => (
                  <li key={i} style={{ fontSize: "15px", lineHeight: "165%", color: "var(--foreground)", display: "flex", gap: "10px" }}>
                    <span style={{ flexShrink: 0, marginTop: "9px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--border)" }} aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {[
            { label: "Clarity", value: session.clarity_feedback },
            { label: "Structure", value: session.structure_feedback },
            { label: "Vocabulary", value: session.vocabulary_feedback },
            { label: "Filler words", value: session.filler_feedback },
          ]
            .filter((f) => f.value)
            .map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--foreground-secondary)", margin: "0 0 6px 0" }}>
                  {label}
                </p>
                <p style={{ fontSize: "15px", lineHeight: "165%", color: "var(--foreground)", margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
        </div>
      )}

      <div style={{ marginTop: "20px" }} />
    </div>
  )
}

// ── Letters section ───────────────────────────────────────────────────────────

function LetterCard({ letter }: { letter: JourneyLetter }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
        aria-expanded={open}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--accent-gold)",
              margin: "0 0 4px 0",
            }}
          >
            Session {letter.milestone_session}
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "17px",
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            A letter from Curio
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--foreground-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            {formatDate(letter.created_at)}
          </p>
        </div>
        <span style={{ fontSize: "20px", color: "var(--foreground-secondary)", flexShrink: 0, marginTop: "2px" }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <p
          style={{
            marginTop: "20px",
            fontSize: "16px",
            lineHeight: "175%",
            color: "var(--foreground)",
            whiteSpace: "pre-wrap",
          }}
        >
          {letter.content}
        </p>
      )}
      <div style={{ marginTop: "20px" }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface JourneyDisplayProps {
  profile: CommunicationProfile | null
  sessions: SpeakingSession[]
  letters: JourneyLetter[]
}

export function JourneyDisplay({ profile, sessions, letters }: JourneyDisplayProps) {
  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "56px 32px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "56px",
      }}
    >
      {/* Page heading */}
      <header>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 400,
            lineHeight: 1.05,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          Your Journey
        </h1>
        {profile && profile.total_sessions > 0 && (
          <p
            style={{
              marginTop: "10px",
              fontSize: "14px",
              color: "var(--foreground-secondary)",
            }}
          >
            {profile.total_sessions} session{profile.total_sessions !== 1 ? "s" : ""} completed
          </p>
        )}
      </header>

      <Divider />

      {/* Communication Profile */}
      <ProfileSection profile={profile} />

      <Divider />

      {/* Recent Sessions */}
      <section aria-labelledby="sessions-heading">
        <SectionLabel>Recent Sessions</SectionLabel>
        {sessions.length === 0 ? (
          <EmptyNotice>Your journey begins with your first session.</EmptyNotice>
        ) : (
          <div>
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>

      {/* Letters — only show if any exist */}
      {letters.length > 0 && (
        <>
          <Divider />
          <section aria-labelledby="letters-heading">
            <SectionLabel>Letters from Curio</SectionLabel>
            <div>
              {letters.map((l) => (
                <LetterCard key={l.id} letter={l} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
