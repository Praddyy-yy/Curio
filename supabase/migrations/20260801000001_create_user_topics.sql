-- =============================================================================
-- Migration: 20260801000001_create_user_topics.sql
-- Phase 3: Database Schema
-- =============================================================================

-- ─── Enum: user_topic_status ──────────────────────────────────────────────────
-- Represents where a user is in their learning journey for a given topic.
CREATE TYPE public.user_topic_status AS ENUM (
  'saved',      -- User bookmarked the topic; hasn't started yet
  'learning',   -- User is actively studying this topic
  'completed'   -- User marked the topic as done
);

-- ─── Table: user_topics ───────────────────────────────────────────────────────
-- Tracks each user's relationship to topics in the library.
-- This is the "capture" layer: users save topics they encounter and want to learn.
-- One row per (user, topic) pair — enforced by UNIQUE constraint.
CREATE TABLE public.user_topics (
  id          uuid                      NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid                      NOT NULL,
  topic_id    uuid                      NOT NULL,
  status      public.user_topic_status  NOT NULL DEFAULT 'saved',
  created_at  timestamptz               NOT NULL DEFAULT now(),
  updated_at  timestamptz               NOT NULL DEFAULT now(),

  CONSTRAINT user_topics_pkey            PRIMARY KEY (id),
  CONSTRAINT user_topics_user_topic_key  UNIQUE (user_id, topic_id),
  CONSTRAINT user_topics_user_id_fkey    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE,
  CONSTRAINT user_topics_topic_id_fkey   FOREIGN KEY (topic_id)
    REFERENCES public.topics (id)
    ON DELETE CASCADE
);

COMMENT ON TABLE  public.user_topics         IS 'User–topic relationships. One row per (user, topic) pair. Tracks learning progress.';
COMMENT ON COLUMN public.user_topics.user_id IS 'References auth.users. Cascades on delete: removing a user removes all their topic records.';
COMMENT ON COLUMN public.user_topics.status  IS 'Learning progress status: saved → learning → completed.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- user_id: used to fetch all topics for a given user (dashboard, "my topics")
CREATE INDEX user_topics_user_id_idx  ON public.user_topics (user_id);
-- topic_id: used to count or inspect who has saved a given topic (admin stats)
CREATE INDEX user_topics_topic_id_idx ON public.user_topics (topic_id);
-- (user_id, status): used for filtered views ("my learning topics", "completed")
CREATE INDEX user_topics_user_status_idx ON public.user_topics (user_id, status);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
-- Reuses the handle_updated_at() function created in migration 000000.
CREATE TRIGGER user_topics_updated_at
  BEFORE UPDATE ON public.user_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read only their own rows.
CREATE POLICY "user_topics_select_own"
  ON public.user_topics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: users can only create rows for themselves.
CREATE POLICY "user_topics_insert_own"
  ON public.user_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: users can only update their own rows (e.g. changing status).
CREATE POLICY "user_topics_update_own"
  ON public.user_topics
  FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: users can only remove their own rows (unsaving a topic).
CREATE POLICY "user_topics_delete_own"
  ON public.user_topics
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
