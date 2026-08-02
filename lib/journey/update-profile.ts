import Groq from "groq-sdk"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SpeakingSession, CommunicationProfile } from "@/lib/supabase/types"

/**
 * Determines whether a profile update is due given the current session count.
 *
 * Cadence (ADR-023):
 *   Sessions 1–10  → every session
 *   Sessions 11–30 → every 5 sessions
 *   Sessions 31+   → every 10 sessions
 */
export function isProfileUpdateDue(totalSessions: number): boolean {
  if (totalSessions <= 10) return true
  if (totalSessions <= 30) return totalSessions % 5 === 0
  return totalSessions % 10 === 0
}

const SYSTEM_PROMPT = `You are a thoughtful communication coach writing a short evolving profile of a speaker.

Rules:
- Build on the existing profile. Do NOT rewrite it from scratch.
- Identify genuine patterns across recent sessions.
- Avoid generic praise or motivational language.
- Never mention voice quality, pronunciation, or speaking speed unless it is explicitly evident from the transcript summaries.
- Do not invent progress. Only note what the sessions actually show.
- Write in third person. Use the speaker's patterns, not their name.
- The tone should feel like a thoughtful mentor writing a private note.

Return ONLY a valid JSON object with exactly these fields:
{
  "profile_summary": string,
  "current_focus": string
}

- profile_summary: 2–4 sentences describing how this person communicates overall, referencing recent changes.
- current_focus: 1 specific, actionable sentence about what to work on next.

No markdown. No code fences. No text outside the JSON.`

function buildUpdatePrompt(
  existing: CommunicationProfile | null,
  recentSessions: SpeakingSession[]
): string {
  const lines: string[] = []

  if (existing?.profile_summary) {
    lines.push(`EXISTING PROFILE:\n${existing.profile_summary}`)
    if (existing.current_focus) {
      lines.push(`\nEXISTING FOCUS:\n${existing.current_focus}`)
    }
  } else {
    lines.push("EXISTING PROFILE:\n(None — this is the user's first profile generation.)")
  }

  lines.push("\nRECENT SESSIONS:")
  for (const s of recentSessions) {
    lines.push(
      `\nTopic: ${s.topic} (${s.mode === "off_the_cuff" ? "Rawdog" : "Research"})` +
      `\nSummary: ${s.summary}` +
      `\nStrengths: ${s.strengths.join("; ")}` +
      `\nImprovements: ${s.improvements.join("; ")}` +
      `\nClarity: ${s.clarity_feedback}` +
      `\nStructure: ${s.structure_feedback}`
    )
  }

  return lines.join("\n")
}

/**
 * Fetches recent sessions, calls Groq to evolve the communication profile,
 * and upserts the result into communication_profiles.
 *
 * This function is best-effort: errors are logged but do not throw,
 * so a failure here never blocks the session save response.
 */
export async function maybeUpdateProfile(
  supabase: SupabaseClient,
  userId: string,
  totalSessions: number
): Promise<void> {
  if (!isProfileUpdateDue(totalSessions)) return

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  try {
    // Fetch existing profile
    const { data: existing } = await db
      .from("communication_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Fetch last 5 sessions for context
    const { data: recent } = await db
      .from("speaking_sessions")
      .select("topic, mode, summary, strengths, improvements, clarity_feedback, structure_feedback")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (!recent || recent.length === 0) return

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUpdatePrompt(
            existing as CommunicationProfile | null,
            recent as SpeakingSession[]
          ),
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw) as { profile_summary?: string; current_focus?: string }

    if (!parsed.profile_summary || !parsed.current_focus) {
      console.warn("[update-profile] AI returned incomplete profile fields")
      return
    }

    await db
      .from("communication_profiles")
      .upsert(
        {
          user_id: userId,
          profile_summary: parsed.profile_summary,
          current_focus: parsed.current_focus,
          total_sessions: totalSessions,
        },
        { onConflict: "user_id" }
      )
  } catch (err) {
    console.error("[update-profile] Failed:", err instanceof Error ? err.message : err)
  }
}
