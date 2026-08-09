import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import type { AIFeedback } from "@/lib/session"
import type { DiscoveryMode } from "@/components/discovery/mode-selector"

/**
 * POST /api/analyze
 *
 * Accepts JSON: { transcript: string, topic: string, mode: DiscoveryMode }
 *
 * Returns:
 *   - 200 { feedback: AIFeedback } on success
 *   - 400 { error: string } for invalid/missing input
 *   - 502 { error: string } if Groq returns an error or invalid JSON
 */

const VALID_MODES: DiscoveryMode[] = ["off_the_cuff", "research"]

const SYSTEM_PROMPT = `You are a precise speaking coach analyzing a written transcript of a spoken explanation.

Your role is to provide structured, honest, and actionable feedback based ONLY on what is present in the transcript.

STRICT RULES:
- Analyze only the actual transcript text provided.
- Never invent examples, points, or context not present in the transcript.
- Never infer pronunciation, tone, accent, pitch, emotion, or confidence from text alone.
- Never comment on speaking pace or speed unless it is directly evident from the transcript structure (e.g. very fragmented, incomplete sentences).
- Do not give generic or motivational praise. Be specific to what was actually said.
- If the transcript contains fewer than 50 words, set each feedback field to exactly: "Insufficient transcript length for detailed feedback on this dimension." — except summary, which should briefly describe what little was said. For betterVersion, still write a short natural spoken example of roughly 2–3 sentences.
- strengths and improvements must each contain 1–4 concise, specific items.
- All prose fields (summary, clarity, structure, vocabulary, fillerObservations, confidenceObservations, practiceAgainSuggestion) must be 1–3 sentences maximum.
- practiceAgainSuggestion must be a single actionable sentence about what to try differently next time.

BETTER VERSION RULES:
- betterVersion is a natural, conversational spoken example that addresses the SAME topic as the transcript.
- It must directly address the specific weaknesses identified in improvements — better structure, clearer reasoning, more specific examples, or stronger transitions, as relevant.
- It should be 45–90 seconds of spoken content (roughly 110–220 words).
- It must sound like something a real student could actually say aloud — not an essay, not a lecture, not a perfect model answer.
- Do NOT make it unrealistically polished. Leave some natural spoken quality.
- Do NOT introduce arguments or facts absent from the original transcript.
- Do NOT say "In conclusion" or use formal essay language.
- Write it as continuous prose as the speaker would naturally say it, not as bullet points.

OUTPUT FORMAT:
Return ONLY a valid JSON object. No markdown. No code fences. No text before or after the JSON.

Required JSON shape:
{
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "clarity": string,
  "structure": string,
  "vocabulary": string,
  "fillerObservations": string,
  "confidenceObservations": string,
  "practiceAgainSuggestion": string,
  "betterVersion": string
}`

function buildUserPrompt(transcript: string, topic: string, mode: DiscoveryMode): string {
  const modeLabel =
    mode === "off_the_cuff"
      ? "Rawdog (no preparation time — speaker responded immediately)"
      : "Research (speaker had 3 minutes to research before speaking)"

  return `Topic: ${topic}
Mode: ${modeLabel}

Transcript:
${transcript}`
}

/** Validate the parsed JSON matches the AIFeedback shape. */
function validateFeedback(obj: unknown): obj is AIFeedback {
  if (typeof obj !== "object" || obj === null) return false
  const f = obj as Record<string, unknown>
  const requiredStrings = [
    "summary",
    "clarity",
    "structure",
    "vocabulary",
    "fillerObservations",
    "confidenceObservations",
    "practiceAgainSuggestion",
    "betterVersion",
  ]
  const requiredArrays = ["strengths", "improvements"]

  for (const key of requiredStrings) {
    if (typeof f[key] !== "string") return false
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(f[key])) return false
    if (!(f[key] as unknown[]).every((item) => typeof item === "string")) return false
  }
  return true
}

export async function POST(request: Request) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: { transcript?: unknown; topic?: unknown; mode?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { transcript, topic, mode } = body

  // ── 2. Validate inputs ─────────────────────────────────────────────────────
  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json({ error: "transcript is required and must be a non-empty string." }, { status: 400 })
  }
  if (typeof topic !== "string" || topic.trim().length === 0) {
    return NextResponse.json({ error: "topic is required and must be a non-empty string." }, { status: 400 })
  }
  if (!VALID_MODES.includes(mode as DiscoveryMode)) {
    return NextResponse.json({ error: `mode must be one of: ${VALID_MODES.join(", ")}.` }, { status: 400 })
  }

  // ── 3. Validate environment ────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error("[analyze] GROQ_API_KEY is not set.")
    return NextResponse.json({ error: "AI analysis service is not configured." }, { status: 500 })
  }

  // ── 4. Call Groq chat completion ───────────────────────────────────────────
  const groq = new Groq({ apiKey })

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3, // lower temperature for more consistent structured output
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(transcript as string, topic as string, mode as DiscoveryMode),
        },
      ],
    })

    const rawContent = completion.choices[0]?.message?.content ?? ""

    // ── 5. Parse and validate the JSON response ────────────────────────────
    let parsed: unknown
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      console.error("[analyze] Failed to parse Groq JSON response:", rawContent.slice(0, 200))
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      )
    }

    if (!validateFeedback(parsed)) {
      console.error("[analyze] Groq response missing required fields:", JSON.stringify(parsed).slice(0, 200))
      return NextResponse.json(
        { error: "AI response was incomplete. Please try again." },
        { status: 502 }
      )
    }

    return NextResponse.json({ feedback: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis service returned an error."
    console.error("[analyze] Groq API error:", message)
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 502 }
    )
  }
}
