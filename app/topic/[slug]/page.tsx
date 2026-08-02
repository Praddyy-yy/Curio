import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import type { Topic } from "@/lib/supabase/types"
import { Nav } from "@/components/nav"
import { SaveButton } from "@/components/save-button"

interface TopicPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const result = await supabase
    .from("topics")
    .select("title, category")
    .eq("slug", slug)
    .eq("status", "enriched")
    .single()

  const topic = result.data as Pick<Topic, "title" | "category"> | null

  if (!topic) return { title: "Topic not found — Curio" }

  return {
    title: `${topic.title} — Curio`,
    description: `Explore ${topic.title} in the ${topic.category} collection on Curio.`,
  }
}

/**
 * Topic detail page — /topic/[slug]
 *
 * Server Component. Fetches the topic and the user's saved state.
 * Renders the title, category, and placeholder sections for future AI content.
 */
export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the topic (RLS: only enriched topics are readable)
  const topicResult = await supabase
    .from("topics")
    .select("id, slug, title, category, status, description, summary, key_concepts, created_at, updated_at")
    .eq("slug", slug)
    .eq("status", "enriched")
    .single()

  const topic = topicResult.data as Topic | null

  if (!topic) notFound()

  // Fetch saved state for current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const savedResult = user
    ? await supabase
        .from("user_topics")
        .select("id")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .maybeSingle()
    : { data: null }

  const isSaved = !!savedResult.data

  return (
    <div style={{ minHeight: "100svh", background: "var(--background)" }}>
      <Nav />

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "64px 32px 96px" }}>

        {/* Back */}
        <Link
          href="/"
          className="back-link"
          style={{ marginBottom: "48px" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          All topics
        </Link>

        {/* Category */}
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--foreground-secondary)",
            marginBottom: "16px",
          }}
        >
          {topic.category}
        </p>

        {/* Title + save button */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-0.01em",
              color: "var(--foreground)",
              margin: 0,
              flex: "1 1 auto",
            }}
          >
            {topic.title}
          </h1>

          <div style={{ flexShrink: 0, paddingTop: "6px" }}>
            <SaveButton topicId={topic.id} isSaved={isSaved} />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            marginBottom: "48px",
          }}
          aria-hidden="true"
        />

        {/* AI Summary placeholder */}
        <section style={{ marginBottom: "48px" }} aria-labelledby="summary-heading">
          <h2
            id="summary-heading"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground-secondary)",
              marginBottom: "16px",
            }}
          >
            Summary
          </h2>

          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground)",
                lineHeight: "160%",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              A curated summary will appear here once this topic has been enriched.
            </p>
          </div>
        </section>

        {/* Key Concepts placeholder */}
        <section aria-labelledby="concepts-heading">
          <h2
            id="concepts-heading"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground-secondary)",
              marginBottom: "16px",
            }}
          >
            Key Concepts
          </h2>

          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground)",
                lineHeight: "160%",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              Key concepts will appear here after AI enrichment is complete.
            </p>
          </div>
        </section>

      </main>
    </div>
  )
}
