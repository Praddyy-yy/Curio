/**
 * Supabase database types for Curio.
 *
 * Generated manually from the schema defined in:
 *   supabase/migrations/20260801000000_create_enums_and_topics.sql
 *   supabase/migrations/20260801000001_create_user_topics.sql
 *   supabase/migrations/20260802000002_create_journey_tables.sql
 *
 * When the schema changes, update this file to match.
 * Future: replace with `supabase gen types typescript --linked > lib/supabase/types.ts`
 * once the Supabase CLI is available in the environment.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status for a curated topic.
 * Follows ADR-006: Status-Driven Processing Pipeline.
 */
export type TopicStatus =
  | "draft"
  | "pending"
  | "processing"
  | "enriched"
  | "failed"
  | "archived"

/** A user's learning progress for a given topic. */
export type UserTopicStatus = "saved" | "learning" | "completed"

// ─── Table Row Types ──────────────────────────────────────────────────────────

/** A row in the `topics` table. Platform-curated. Admin-managed. */
export interface Topic {
  id: string
  slug: string
  title: string
  category: string
  description: string
  summary: string | null
  key_concepts: string[] | null
  status: TopicStatus
  created_at: string
  updated_at: string
}

/** A row in the `user_topics` table. User's relationship to a topic. */
export interface UserTopic {
  id: string
  user_id: string
  topic_id: string
  status: UserTopicStatus
  created_at: string
  updated_at: string
}

// ─── Supabase Json type ───────────────────────────────────────────────────────
// Supabase represents jsonb columns as this recursive type in the typed client.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * A row in the `speaking_sessions` table.
 * Lightweight session record — no transcript, no audio, no raw AI response.
 */
export interface SpeakingSession {
  id: string
  user_id: string
  topic: string
  mode: "off_the_cuff" | "research"
  duration_seconds: number
  summary: string
  strengths: string[]          // jsonb; cast to string[] after fetching
  improvements: string[]       // jsonb; cast to string[] after fetching
  clarity_feedback: string
  vocabulary_feedback: string
  structure_feedback: string
  filler_feedback: string
  created_at: string
}

/** Shape used for insert — jsonb fields typed as Json[] for the Supabase client. */
export interface InsertSpeakingSessionDB {
  user_id: string
  topic: string
  mode: "off_the_cuff" | "research"
  duration_seconds: number
  summary: string
  strengths: Json
  improvements: Json
  clarity_feedback: string
  vocabulary_feedback: string
  structure_feedback: string
  filler_feedback: string
}

/**
 * A row in the `communication_profiles` table.
 * One per user. Evolves via AI synthesis over sessions.
 */
export interface CommunicationProfile {
  user_id: string
  profile_summary: string
  current_focus: string
  total_sessions: number
  updated_at: string
}

/**
 * A row in the `journey_letters` table.
 * Generated at milestones: session 25, 50, 100, 150, …
 */
export interface JourneyLetter {
  id: string
  user_id: string
  milestone_session: number
  content: string
  created_at: string
}

// ─── Insert / Upsert Types ────────────────────────────────────────────────────

export type InsertTopic = Pick<Topic, "slug" | "title" | "category" | "description"> & {
  summary?: string | null
  key_concepts?: string[] | null
  status?: TopicStatus
}

export type InsertUserTopic = Pick<UserTopic, "user_id" | "topic_id"> & {
  status?: UserTopicStatus
}

export type InsertSpeakingSession = Omit<SpeakingSession, "id" | "created_at">

export type UpsertCommunicationProfile = Omit<CommunicationProfile, "updated_at">

// ─── Update Types ─────────────────────────────────────────────────────────────

export type UpdateTopic = Partial<Omit<Topic, "id" | "created_at" | "updated_at">>
export type UpdateUserTopic = { status: UserTopicStatus }

// ─── Database type (Supabase JS client compatibility) ─────────────────────────

export interface Database {
  public: {
    Tables: {
      topics: {
        Row: Topic
        Insert: InsertTopic
        Update: UpdateTopic
        Relationships: []
      }
      user_topics: {
        Row: UserTopic
        Insert: InsertUserTopic
        Update: UpdateUserTopic
        Relationships: [
          {
            foreignKeyName: "user_topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_sessions: {
        Row: SpeakingSession
        Insert: InsertSpeakingSessionDB
        Update: Partial<InsertSpeakingSessionDB>
        Relationships: [
          {
            foreignKeyName: "speaking_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_profiles: {
        Row: CommunicationProfile
        Insert: UpsertCommunicationProfile
        Update: Partial<Omit<CommunicationProfile, "user_id" | "updated_at">>
        Relationships: [
          {
            foreignKeyName: "communication_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_letters: {
        Row: JourneyLetter
        Insert: Omit<JourneyLetter, "id" | "created_at">
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: "journey_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      topic_status: TopicStatus
      user_topic_status: UserTopicStatus
    }
    CompositeTypes: Record<string, never>
  }
}
