-- =============================================================================
-- Migration: 20260809000003_add_session_id_and_transcript.sql
-- Adds session_id (idempotency key) and transcript to speaking_sessions.
-- Adds UPDATE RLS policy required for communication_profiles side-effects.
-- =============================================================================

-- ─── Add session_id column ────────────────────────────────────────────────────
ALTER TABLE public.speaking_sessions
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- Back-fill existing rows so the NOT NULL constraint can be applied.
UPDATE public.speaking_sessions
  SET session_id = gen_random_uuid()
  WHERE session_id IS NULL;

ALTER TABLE public.speaking_sessions
  ALTER COLUMN session_id SET NOT NULL;

-- Unique constraint: one row per (user, session_id).
-- Duplicate inserts for the same sessionId are rejected with error 23505,
-- which the save-session route handles by returning success silently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'speaking_sessions_user_session_id_key'
      AND table_name = 'speaking_sessions'
  ) THEN
    ALTER TABLE public.speaking_sessions
      ADD CONSTRAINT speaking_sessions_user_session_id_key
      UNIQUE (user_id, session_id);
  END IF;
END $$;

COMMENT ON COLUMN public.speaking_sessions.session_id IS
  'Client-generated UUID assigned before recording begins. '
  'Idempotency key: UNIQUE(user_id, session_id) ensures one row per session.';

-- ─── Add transcript column ────────────────────────────────────────────────────
ALTER TABLE public.speaking_sessions
  ADD COLUMN IF NOT EXISTS transcript text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.speaking_sessions.transcript IS
  'Full spoken transcript returned by Whisper. Stored per-user under RLS.';

-- ─── UPDATE RLS policy for speaking_sessions ──────────────────────────────────
-- Required: the save-session route currently does a single INSERT that includes
-- all new columns. No UPDATE policy is strictly needed for saving sessions.
-- However, adding it future-proofs the table for profile/analytics updates.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'speaking_sessions'
      AND policyname = 'speaking_sessions_update_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "speaking_sessions_update_own"
        ON public.speaking_sessions FOR UPDATE
        TO authenticated
        USING  (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- Update table comment
COMMENT ON TABLE public.speaking_sessions IS
  'Session record including structured AI feedback, full transcript, and idempotency key.';
