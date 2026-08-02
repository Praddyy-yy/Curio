import { createClient } from "@/lib/supabase/server"
import type { Topic } from "@/lib/supabase/types"
import { Nav } from "@/components/nav"
import { DiscoveryApp } from "@/components/discovery/discovery-app"

interface HomePageProps {
  searchParams: Promise<{ topic?: string; mode?: string }>
}

/**
 * Home page — Single-Topic Discovery Experience
 *
 * Server Component. Fetches all enriched topics and passes them to
 * the DiscoveryApp Client Component which manages the interaction flow.
 *
 * Accepts optional `topic` and `mode` search params for the Practice Again flow.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const { topic: initialTopic, mode: initialMode } = await searchParams
  const supabase = await createClient()

  // Fetch enriched topics
  const topicsResult = await supabase
    .from("topics")
    .select("id, slug, title, category")
    .eq("status", "enriched")
    .order("category")

  const topics = (topicsResult.data as Pick<Topic, "id" | "slug" | "title" | "category">[] | null) ?? []

  return (
    <div style={{ minHeight: "100svh", background: "var(--background)", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, position: "relative" }}>
        <DiscoveryApp topics={topics} initialTopic={initialTopic} initialMode={initialMode} />
      </main>
    </div>
  )
}

