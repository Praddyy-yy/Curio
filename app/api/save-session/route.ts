import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { maybeUpdateProfile } from "@/lib/journey/update-profile"
import { maybeGenerateLetter } from "@/lib/journey/generate-letter"
import type { AIFeedback } from "@/lib/session"

/**
 * POST /api/save-session
 *
 * Saves a completed speaking session to the database.
 * Orchestrates profile update and letter generation as side effects.
 *
 * Input JSON:
 * {
 *   topic: string
 *   mode: "off_the_cuff" | "research"
 *   durationSeconds: number
 *   feedback: AIFeedback | null
 * }
 *
 * Returns:
 *   200 { ok: true, sessionId: string }
 *   400 { error: string }  — invalid input
 *   401 { error: string }  — unauthenticated
 *   500 { error: string }  — database error
 */
export async function POST(request: Request) {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const supabase = await createClient()

  // Use the underlying client as `any` for tables not yet in the cached types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: {
    topic?: unknown
    mode?: unknown
    durationSeconds?: unknown
    feedback?: AIFeedback | null
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { topic, mode, durationSeconds, feedback } = body

  // ── 3. Validate inputs ─────────────────────────────────────────────────────
  if (typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required." }, { status: 400 })
  }
  if (mode !== "off_the_cuff" && mode !== "research") {
    return NextResponse.json({ error: "mode must be off_the_cuff or research." }, { status: 400 })
  }
  if (typeof durationSeconds !== "number" || durationSeconds < 0) {
    return NextResponse.json({ error: "durationSeconds must be a non-negative number." }, { status: 400 })
  }

  // ── 4. Insert speaking session ─────────────────────────────────────────────
  const sessionPayload = {
    user_id: user.id,
    topic: (topic as string).trim(),
    mode: mode as "off_the_cuff" | "research",
    duration_seconds: Math.round(durationSeconds as number),
    summary: feedback?.summary ?? "",
    strengths: feedback?.strengths ?? [],
    improvements: feedback?.improvements ?? [],
    clarity_feedback: feedback?.clarity ?? "",
    vocabulary_feedback: feedback?.vocabulary ?? "",
    structure_feedback: feedback?.structure ?? "",
    filler_feedback: feedback?.fillerObservations ?? "",
  }

  const { data: session, error: insertError } = await db
    .from("speaking_sessions")
    .insert(sessionPayload)
    .select("id")
    .single()

  if (insertError || !session) {
    console.error("[save-session] Insert failed:", insertError?.message)
    return NextResponse.json({ error: "Failed to save session." }, { status: 500 })
  }

  // ── 5. Increment total_sessions on communication_profiles ─────────────────
  const { data: currentProfile } = await db
    .from("communication_profiles")
    .select("total_sessions")
    .eq("user_id", user.id)
    .single()

  const newTotal = ((currentProfile?.total_sessions as number | null) ?? 0) + 1

  if (currentProfile) {
    await db
      .from("communication_profiles")
      .update({ total_sessions: newTotal })
      .eq("user_id", user.id)
  } else {
    await db.from("communication_profiles").insert({
      user_id: user.id,
      total_sessions: newTotal,
      profile_summary: "",
      current_focus: "",
    })
  }

  // ── 6. Maybe update communication profile (AI) ─────────────────────────────
  await maybeUpdateProfile(supabase, user.id, newTotal)

  // ── 7. Maybe generate milestone letter (AI) ────────────────────────────────
  await maybeGenerateLetter(supabase, user.id, newTotal)

  return NextResponse.json({ ok: true, sessionId: (session as { id: string }).id })
}
