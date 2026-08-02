"use client"

import { useTransition } from "react"
import { saveTopicAction, unsaveTopicAction } from "@/lib/topics/actions"

interface SaveButtonProps {
  topicId: string
  isSaved: boolean
}

/**
 * Save / Unsave button for a topic.
 *
 * Client Component — manages optimistic pending state via useTransition.
 * Actual state comes from the server (prop drilling from Server Component parent).
 */
export function SaveButton({ topicId, isSaved }: SaveButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (isSaved) {
        await unsaveTopicAction(topicId)
      } else {
        await saveTopicAction(topicId)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isSaved ? "Remove from saved" : "Save topic"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        lineHeight: 1,
        padding: "7px 14px",
        borderRadius: "var(--radius-md)",
        border: isSaved
          ? "1px solid var(--accent-gold)"
          : "1px solid var(--border)",
        background: isSaved ? "var(--accent-gold)" : "transparent",
        color: isSaved ? "var(--primary-foreground)" : "var(--foreground-secondary)",
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "all var(--duration-default) var(--ease-out)",
        whiteSpace: "nowrap",
      }}
    >
      {isSaved ? (
        <>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5Z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          Save
        </>
      )}
    </button>
  )
}
