"use server"

import { createClient } from "@/lib/supabase/server"
import type { InsertUserTopic } from "@/lib/supabase/types"
import { revalidatePath } from "next/cache"

/**
 * Save a topic for the current authenticated user.
 * Inserts a row into user_topics with status = 'saved'.
 * No-op if already saved (upsert with ignoreDuplicates).
 */
export async function saveTopicAction(topicId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const payload: InsertUserTopic = { user_id: user.id, topic_id: topicId, status: "saved" }

  await supabase
    .from("user_topics")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(payload as any, { onConflict: "user_id,topic_id", ignoreDuplicates: true })

  revalidatePath("/")
  revalidatePath(`/topic`, "layout")
  revalidatePath("/saved")
}

/**
 * Unsave (remove) a topic from the current authenticated user's saved list.
 * Deletes the user_topics row for this user + topic combination.
 */
export async function unsaveTopicAction(topicId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("user_topics")
    .delete()
    .eq("user_id", user.id)
    .eq("topic_id", topicId)

  revalidatePath("/")
  revalidatePath(`/topic`, "layout")
  revalidatePath("/saved")
}
