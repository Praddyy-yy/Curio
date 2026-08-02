import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { JourneyDisplay } from "./journey-display"
import type { SpeakingSession, CommunicationProfile, JourneyLetter } from "@/lib/supabase/types"

/**
 * Journey page — /journey
 *
 * Server Component. Fetches the user's communication profile, recent sessions,
 * and any milestone letters. Renders the JourneyDisplay Client Component.
 *
 * Auth is handled by proxy.ts (unauthenticated users are redirected to /login).
 */
export default async function JourneyPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // user is guaranteed non-null here (proxy.ts handles redirect)
  const userId = user?.id ?? ""

  // Fetch all three data sources in parallel
  const [profileResult, sessionsResult, lettersResult] = await Promise.all([
    db
      .from("communication_profiles")
      .select("*")
      .eq("user_id", userId)
      .single(),

    db
      .from("speaking_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),

    db
      .from("journey_letters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ])

  const profile = profileResult.data as CommunicationProfile | null
  const sessions = (sessionsResult.data ?? []) as SpeakingSession[]
  const letters = (lettersResult.data ?? []) as JourneyLetter[]

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav />
      <main style={{ flex: 1 }}>
        <JourneyDisplay profile={profile} sessions={sessions} letters={letters} />
      </main>
    </div>
  )
}
