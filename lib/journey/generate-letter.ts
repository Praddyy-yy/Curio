import Groq from "groq-sdk"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { CommunicationProfile } from "@/lib/supabase/types"

/**
 * Checks whether a milestone letter is due for the given session count.
 * Letters are generated at sessions 25, 50, 100, 150, 200, …
 */
export function isLetterDue(totalSessions: number): boolean {
  if (totalSessions === 25) return true
  if (totalSessions >= 50 && totalSessions % 50 === 0) return true
  return false
}

const SYSTEM_PROMPT = `You are Curio, a thoughtful speaking practice companion.

Write a personal letter to the user reflecting on their growth as a communicator.

Rules:
- The letter must be 150–250 words.
- Tone: warm, reflective, honest. Not motivational. Not exaggerated.
- Ground observations in the profile and sessions provided.
- Do not invent progress. Only note what the data shows.
- Do not mention voice quality, pronunciation, or tone.
- Refer to the user in second person ("you").
- Do not sign off with "Curio" — end with a closing thought, not a signature.
- Write plain prose. No bullet points. No headers. No markdown.

Return the letter as a plain text string only. No JSON. No code fences.`

function buildLetterPrompt(
  profile: CommunicationProfile | null,
  totalSessions: number
): string {
  const lines: string[] = [
    `The user has completed ${totalSessions} speaking sessions.`,
  ]

  if (profile?.profile_summary) {
    lines.push(`\nCommunication Profile:\n${profile.profile_summary}`)
  }
  if (profile?.current_focus) {
    lines.push(`\nCurrent Focus:\n${profile.current_focus}`)
  }

  lines.push(
    "\nWrite a letter that acknowledges this milestone, reflects on their journey so far, and encourages thoughtful continued practice."
  )

  return lines.join("\n")
}

/**
 * Generates a milestone letter from Curio and inserts it into journey_letters.
 *
 * Guards against duplicate letters using the UNIQUE(user_id, milestone_session) constraint.
 * Best-effort — errors are logged but never thrown.
 */
export async function maybeGenerateLetter(
  supabase: SupabaseClient,
  userId: string,
  totalSessions: number
): Promise<void> {
  if (!isLetterDue(totalSessions)) return

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  try {
    // Guard: check if the letter for this milestone already exists
    const { data: existing } = await db
      .from("journey_letters")
      .select("id")
      .eq("user_id", userId)
      .eq("milestone_session", totalSessions)
      .single()

    if (existing) return // Already generated — skip

    // Fetch current profile for context
    const { data: profile } = await db
      .from("communication_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildLetterPrompt(profile as CommunicationProfile | null, totalSessions),
        },
      ],
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!content || content.length < 100) {
      console.warn("[generate-letter] AI returned an empty or too-short letter")
      return
    }

    await db.from("journey_letters").insert({
      user_id: userId,
      milestone_session: totalSessions,
      content,
    })
  } catch (err) {
    console.error("[generate-letter] Failed:", err instanceof Error ? err.message : err)
  }
}
