import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Nav } from "@/components/nav"
import { unsaveTopicAction } from "@/lib/topics/actions"

import type { Topic } from "@/lib/supabase/types"

type JoinedRecord = {
  topic_id: string
  created_at: string
  topics: Pick<Topic, "id" | "slug" | "title" | "category"> | null
}

export const metadata = {
  title: "Saved Topics - Curio",
}

export default async function SavedTopicsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the user's saved topics, joined with the topics table
  const { data: savedRecords } = await supabase
    .from("user_topics")
    .select(`
      topic_id,
      created_at,
      topics (
        id,
        slug,
        title,
        category
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "saved")
    .order("created_at", { ascending: false })

  const records = (savedRecords as unknown as JoinedRecord[]) || []
  const savedTopics = records.flatMap((record) =>
    record.topics ? [record.topics] : []
  )

  return (
    <div style={{ minHeight: "100svh", background: "var(--background)", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 32px" }}>
        
        <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: "48px" }}>
          
          <header style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "32px" }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "40px", fontWeight: 400, color: "var(--foreground)", margin: 0 }}>
              Saved Topics
            </h1>
            <p style={{ fontSize: "16px", color: "var(--foreground-secondary)", margin: 0 }}>
              Your personal library of ideas to explore.
            </p>
          </header>

          {savedTopics.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px", paddingTop: "16px" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "var(--foreground)", margin: 0 }}>
                No saved topics yet.
              </p>
              <p style={{ fontSize: "16px", color: "var(--foreground-secondary)", margin: 0 }}>
                Save interesting topics as you discover them.
              </p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "10px 24px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--foreground)",
                  color: "var(--background)",
                  fontSize: "15px",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "opacity var(--duration-fast)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Discover Topics
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {savedTopics.map((topic) => {
                // Determine if topic is single object or array (Supabase might return single object for to-one relationships)
                const t = Array.isArray(topic) ? topic[0] : topic
                if (!t) return null

                return (
                  <article key={t.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--foreground-secondary)" }}>
                        {t.category}
                      </span>
                      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: 400, color: "var(--foreground)", margin: 0 }}>
                        {t.title}
                      </h2>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "4px" }}>
                      <Link
                        href={`/?topic=${encodeURIComponent(t.title)}&mode=research`}
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          textDecoration: "none",
                          padding: "6px 16px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-full)",
                          transition: "border-color var(--duration-fast)",
                        }}
                        className="saved-action-btn"
                        aria-label={`Research ${t.title}`}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        Research
                      </Link>
                      
                      <Link
                        href={`/?topic=${encodeURIComponent(t.title)}&mode=off_the_cuff`}
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          textDecoration: "none",
                          padding: "6px 16px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-full)",
                          transition: "border-color var(--duration-fast)",
                        }}
                        className="saved-action-btn"
                        aria-label={`Rawdog ${t.title}`}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        Rawdog
                      </Link>

                      <div style={{ flex: 1 }} />

                      <form action={unsaveTopicAction.bind(null, t.id)}>
                        <button
                          type="submit"
                          style={{
                            background: "none",
                            border: "none",
                            padding: "6px 8px",
                            fontSize: "14px",
                            color: "var(--muted-foreground)",
                            cursor: "pointer",
                            transition: "color var(--duration-fast)",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "var(--destructive)")}
                          onMouseOut={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                          aria-label={`Remove ${t.title} from saved`}
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
