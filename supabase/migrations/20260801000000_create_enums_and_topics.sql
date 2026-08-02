-- =============================================================================
-- Migration: 20260801000000_create_enums_and_topics.sql
-- Phase 3: Database Schema
-- =============================================================================

-- ─── Enum: topic_status ───────────────────────────────────────────────────────
-- Represents a topic's position in the admin/AI lifecycle.
-- Follows ADR-006: Status-Driven Processing Pipeline.
CREATE TYPE public.topic_status AS ENUM (
  'draft',       -- Admin is preparing content; not yet queued for AI
  'pending',     -- Queued for AI enrichment; awaiting processing
  'processing',  -- AI pipeline is actively running
  'enriched',    -- AI enrichment complete; topic is ready to publish
  'failed',      -- AI pipeline encountered an error; needs admin review
  'archived'     -- Removed from the active library; hidden from users
);

-- ─── Table: topics ────────────────────────────────────────────────────────────
-- Platform-curated topic library. Written only by admins via the service-role
-- key or future admin tooling — never by end users directly.
CREATE TABLE public.topics (
  id            uuid                NOT NULL DEFAULT gen_random_uuid(),
  slug          text                NOT NULL,
  title         text                NOT NULL,
  category      text                NOT NULL,
  description   text                NOT NULL,
  -- AI-generated fields (NULL until status = 'enriched')
  summary       text,
  key_concepts  jsonb,
  status        public.topic_status NOT NULL DEFAULT 'draft',
  created_at    timestamptz         NOT NULL DEFAULT now(),
  updated_at    timestamptz         NOT NULL DEFAULT now(),

  CONSTRAINT topics_pkey           PRIMARY KEY (id),
  CONSTRAINT topics_slug_key       UNIQUE (slug),
  CONSTRAINT topics_slug_format    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE  public.topics               IS 'Platform-curated topic library. Admin-managed. Not user-created.';
COMMENT ON COLUMN public.topics.slug          IS 'URL-safe identifier, e.g. "quantum-entanglement". Kebab-case, lowercase only.';
COMMENT ON COLUMN public.topics.summary       IS 'AI-generated summary. Populated when status transitions to enriched.';
COMMENT ON COLUMN public.topics.key_concepts  IS 'AI-generated array of key concept strings. JSON array, e.g. ["concept one", "concept two"].';
COMMENT ON COLUMN public.topics.status        IS 'Lifecycle status. See topic_status enum for valid values.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- slug: used for URL lookups (/topics/quantum-entanglement)
CREATE INDEX topics_slug_idx     ON public.topics (slug);
-- status: used by the AI pipeline to query by processing state
CREATE INDEX topics_status_idx   ON public.topics (status);
-- category: used for filtering/grouping topic library
CREATE INDEX topics_category_idx ON public.topics (category);

-- ─── updated_at trigger function ──────────────────────────────────────────────
-- Shared across tables. Only created once.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at IS 'Automatically sets updated_at = now() on every UPDATE. Shared by all tables.';

CREATE TRIGGER topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read topics that have completed AI enrichment.
-- Draft, pending, processing, failed, and archived topics are hidden.
CREATE POLICY "topics_select_enriched"
  ON public.topics
  FOR SELECT
  TO authenticated
  USING (status = 'enriched');

-- No INSERT / UPDATE / DELETE policies for regular users.
-- Writes are performed via the service-role key which bypasses RLS.
-- This is intentional: topics are platform content, not user-generated.
