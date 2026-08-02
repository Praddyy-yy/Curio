import Link from "next/link"
import type { Topic } from "@/lib/supabase/types"
import { SaveButton } from "@/components/save-button"

interface TopicCardProps {
  topic: Topic
  isSaved: boolean
}

/**
 * TopicCard — displays a curated topic in the discovery grid.
 *
 * Server Component. SaveButton is the only interactive part (Client Component).
 * Hover state is handled via CSS class injected into globals.css.
 *
 * Displays: title, category, save button.
 * Does NOT display: summary, description, AI content, statistics.
 */
export function TopicCard({ topic, isSaved }: TopicCardProps) {
  return (
    <article className="topic-card">
      {/* Category */}
      <p className="topic-card__category">{topic.category}</p>

      {/* Title */}
      <Link href={`/topic/${topic.slug}`} className="topic-card__title-link">
        <h2 className="topic-card__title">{topic.title}</h2>
      </Link>

      {/* Footer: save button */}
      <div className="topic-card__footer">
        <SaveButton topicId={topic.id} isSaved={isSaved} />
      </div>
    </article>
  )
}
