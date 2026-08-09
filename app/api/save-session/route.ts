import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { maybeUpdateProfile } from "@/lib/journey/update-profile"
import { maybeGenerateLetter } from "@/lib/journey/generate-letter"
import type { AIFeedback } from "@/lib/session"

/**
 * POST /api/save-session
 *
 * Saves a completed speaking session to the database.
 *
 * Idempotency:
 *   - If the session_id column exists (migration applied), duplicate calls
 *     for the same (user_id, session_id) are silently ignored via
 *     upsert + onConflict("session_id").
 *   - If the migration has NOT been applied yet, the route falls back to a
 *     plain insert using only the original columns.
 *
 * The entire payload goes in ONE INSERT — there is no separate UPDATE step.
 * A separate UPDATE would require an UPDATE RLS policy which does not exist
 * on speaking_sessions. All new columns are included in the initial INSERT.
 *
 * Input JSON:
 * {
 *   sessionId?: string   — client UUID (idempotency key)
 *   topic: string
 *   mode: "off_the_cuff" | "research"
 *   durationSeconds: number
 *   transcript?: string
 *   feedback: AIFeedback | null
 * }
 */
export async function POST(request: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: {
    sessionId?: unknown
    topic?: unknown
    mode?: unknown
    durationSeconds?: unknown
    transcript?: unknown
    feedback?: AIFeedback | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { sessionId, topic, mode, durationSeconds, transcript, feedback } = body

  // ── 3. Validate required fields ────────────────────────────────────────────
  if (typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required." }, { status: 400 })
  }
  if (mode !== "off_the_cuff" && mode !== "research") {
    return NextResponse.json({ error: "mode must be off_the_cuff or research." }, { status: 400 })
  }
  if (typeof durationSeconds !== "number" || durationSeconds < 0) {
    return NextResponse.json({ error: "durationSeconds must be a non-negative number." }, { status: 400 })
  }

  const hasSessionId = typeof sessionId === "string" && sessionId.trim().length > 0
  const hasTranscript = typeof transcript === "string"

  // ── 4. Build insert payload ────────────────────────────────────────────────
  // Always include the base columns (guaranteed to exist since original migration).
  // New columns (session_id, transcript) are added only when present — if the
  // column doesn't exist, Postgres will return error code 42703 and we retry
  // with the base payload only.
  const basePayload = {
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

  // ── 5. Insert (with new columns if migration applied) ──────────────────────
  let session: { id: string } | null = null
  let insertError: { code?: string; message?: string; details?: string } | null = null

  if (hasSessionId && hasTranscript) {
    const fullPayload = {
      ...basePayload,
      session_id: (sessionId as string).trim(),
      transcript: transcript as string,
    }

    // Try with full payload first.
    // maybeSingle() returns null data (not error) on 0 rows — handles conflict
    // when UNIQUE constraint is active post-migration.
    const result = await db
      .from("speaking_sessions")
      .insert(fullPayload)
      .select("id")
      .maybeSingle()

    session = result.data
    insertError = result.error

    // 42703 = undefined_column — migration not applied yet, fall back
    if (insertError?.code === "42703") {
      console.warn("[save-session] New columns missing (migration pending) — falling back")
      const fallback = await db
        .from("speaking_sessions")
        .insert(basePayload)
        .select("id")
        .single()
      session = fallback.data
      insertError = fallback.error
    }

    // 23505 = unique_violation — duplicate session_id, already saved
    if (insertError?.code === "23505") {
      console.log("[save-session] Duplicate session_id — already saved, returning success")
      return NextResponse.json({ ok: true, created: false })
    }

    // maybeSingle() with ON CONFLICT returns null data and null error — already saved
    if (!insertError && !session) {
      console.log("[save-session] Insert returned 0 rows (conflict) — already saved")
      return NextResponse.json({ ok: true, created: false })
    }
  } else {
    // No sessionId/transcript — simple insert with base payload
    const result = await db
      .from("speaking_sessions")
      .insert(basePayload)
      .select("id")
      .single()
    session = result.data
    insertError = result.error
  }

  if (insertError || !session) {
    console.error(
      "[save-session] Insert failed — code:", insertError?.code,
      "message:", insertError?.message,
      "details:", insertError?.details
    )
    return NextResponse.json(
      {
        error: insertError?.message ?? "Failed to save session.",
        code: insertError?.code,
      },
      { status: 500 }
    )
  }

  const rowId = (session as { id: string }).id

  // ── 6. Increment total_sessions ────────────────────────────────────────────
  try {
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

    // ── 7. AI side-effects (best-effort, errors don't fail the response) ──────
    await maybeUpdateProfile(supabase, user.id, newTotal)
    await maybeGenerateLetter(supabase, user.id, newTotal)
  } catch (err) {
    console.error("[save-session] Profile/letter update error (non-fatal):", err)
  }

  return NextResponse.json({ ok: true, sessionId: rowId, created: true })
}
