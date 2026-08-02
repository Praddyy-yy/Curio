# Curio — Architecture

> Living document. Updated at the end of each phase.
> Last updated: 2026-08-01 (Phase 5 — Topic Discovery)

---

## Project Overview

**Curio** is an AI-powered learning companion that helps users capture, organize, and deepen their understanding of topics they encounter while browsing or reading.

Core capabilities (planned):
- Capture and curate topics of interest
- AI-enriched summaries and explanations via Groq
- Knowledge base backed by Supabase
- Clean, distraction-free reading and learning experience

---

## Tech Stack (Locked)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui |
| Database / Backend | Supabase |
| AI Inference | Groq |
| Package Manager | pnpm |
| Linter | ESLint |

> **These choices are locked.** See `docs/decisions.md` for the rationale behind each.

---

## Folder Structure

```
curio/
├── app/                        # Next.js App Router — pages and layouts
│   ├── layout.tsx              # Root layout (fonts, TooltipProvider)
│   ├── page.tsx                # Home page — topic discovery grid
│   ├── globals.css             # Global styles + Tailwind + design system tokens
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth + email confirmation code exchange
│   ├── login/
│   │   ├── page.tsx            # Login page (public)
│   │   ├── login-form.tsx      # Client component — email/password form + Google OAuth
│   │   └── actions.ts          # Server Action — signIn
│   ├── signup/
│   │   ├── page.tsx            # Signup page (public)
│   │   ├── signup-form.tsx     # Client component — email/password form
│   │   └── actions.ts          # Server Action — signUp
│   └── topic/
│       └── [slug]/
│           └── page.tsx        # Topic detail page
│
├── components/                 # Shared React components
│   ├── ui/                     # shadcn/ui generated components
│   ├── discovery/              # Discovery experience components
│   │   ├── discovery-app.tsx   # Orchestrator client component
│   │   ├── mode-selector.tsx   # Mode selector (Rawdog / Research)
│   │   ├── settings-dialog.tsx # Settings dialog for durations
│   │   └── action-button.tsx   # Timer and recording CTA button
│   ├── nav.tsx                 # Sticky navigation bar (Server Component)
│   ├── topic-card.tsx          # Topic card for discovery grid (Server Component) - Deprecated
│   └── save-button.tsx         # Save/unsave button (Client Component)
│
├── hooks/                      # Custom React hooks
│   ├── use-audio-recorder.ts   # Manages MediaRecorder and mic permissions
│   └── use-timer.ts            # Simple countdown timer hook
│
├── lib/                        # Shared utilities and clients
│   ├── auth/
│   │   └── actions.ts          # Shared server actions (signOut)
│   ├── topics/
│   │   └── actions.ts          # Server Actions: saveTopicAction, unsaveTopicAction
│   ├── supabase/
│   │   ├── client.ts           # Browser-side Supabase client (typed)
│   │   ├── server.ts           # Server-side Supabase client (typed)
│   │   └── types.ts            # TypeScript types for all database tables and enums
│   └── utils.ts                # shadcn/ui utility helpers (cn)
│
├── data/                       # Static / curated data
│   └── topics/
│       ├── index.ts            # Aggregated topic list
│       ├── ai.ts
│       ├── computer-science.ts
│       ├── economics.ts
│       ├── history.ts
│       ├── philosophy.ts
│       ├── psychology.ts
│       └── science.ts
│
├── docs/                       # Project documentation
│   ├── design-system.md        # Single source of truth for all visual decisions
│   ├── learn.md                # Learning notebook
│   ├── architecture.md         # This file
│   └── decisions.md            # Architectural Decision Records (ADRs)
│
├── supabase/                   # Supabase project configuration
│   ├── config.toml             # Supabase CLI configuration
│   └── migrations/             # SQL migration files (tracked in version control)
│       ├── 20260801000000_create_enums_and_topics.sql
│       └── 20260801000001_create_user_topics.sql
│
├── scripts/
│   ├── migrate.mjs             # Node.js migration runner (no CLI dependency)
│   └── seed.ts                 # Node.js native TypeScript seed script
│
├── public/                     # Static assets
│
├── proxy.ts                    # Next.js 16 proxy — session refresh + route protection
├── .env.example                # Environment variable template
├── .env.local                  # Local secrets (gitignored)
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
├── pnpm-lock.yaml              # Lockfile
└── package.json
```

---

## Data Flow (Planned)

```
User Input
    │
    ▼
Next.js App Router (Server Components)
    │
    ├──► Supabase (Postgres) — persistent storage
    │
    └──► Groq API — AI enrichment
              │
              ▼
         Streamed response back to client
```

---

## Key Architectural Principles

1. **Server-first rendering**: Prefer React Server Components for data fetching. Use Client Components only when interactivity is required.
2. **Auth in Phase 2**: Supabase Auth with email + Google OAuth. Session managed server-side via `@supabase/ssr`.
3. **Status-driven pipeline**: Topics move through defined states (e.g., `pending → processing → enriched`). No ad-hoc queries.
4. **Manual curation first**: Topic data is curated manually before any AI automation is layered on.

---

## Phase History

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Project scaffold, tooling, documentation | ✅ Complete |
| Phase 1 | Design system tokens, component primitives, style guide | ✅ Complete |
| Phase 2 | Authentication (Email + Google OAuth), route protection | ✅ Complete |
| Phase 3 | Database schema (topics, user_topics), RLS, TypeScript types | ✅ Complete |
| Phase 4 | Topic seed data extraction, typed arrays, automated seed script | ✅ Complete |
| Phase 5 (Redesign) | Single-topic discovery, timers, mic prompt, mode selection | ✅ Complete |
| Phase 6A | Speech-to-text pipeline (Groq Whisper, /results page) | ✅ Complete |
| Phase 6B | AI feedback (analysis route, editorial results layout, Practice Again) | ✅ Complete |
| Phase 8 | Dark Theme (next-themes, design system tokens, Sun/Moon toggle) | ✅ Complete |
| Phase 9 | Saved Topics (user library, session initiation directly from list) | ✅ Complete |

---

## Future Architecture Notes

> Placeholder sections to be filled in as the project evolves.

### Authentication

Authentication uses **Supabase Auth** with two providers:
- **Email + Password** — Server Actions (`signInAction`, `signUpAction`, `signOutAction`)
- **Google OAuth** — Client-side `supabase.auth.signInWithOAuth()` → redirects to Google → returns to `/auth/callback`

**Session management** is handled via `@supabase/ssr`:
- `lib/supabase/server.ts` — server client using `next/headers` cookies (for Server Components, Server Actions, Route Handlers)
- `lib/supabase/client.ts` — browser client for Client Components
- `proxy.ts` — refreshes session tokens on every request; protects routes

**Route protection** (`proxy.ts`):
- Public routes: `/login`, `/signup`, `/auth/callback`, `/style-guide`
- All other routes are protected. Unauthenticated users are redirected to `/login`.
- Authenticated users visiting `/login` or `/signup` are redirected to `/`.

**Auth callback** (`/auth/callback/route.ts`):
- Exchanges the OAuth `code` for a session via `supabase.auth.exchangeCodeForSession()`
- Also handles email confirmation links


### Database Schema

**Two tables, two enums.** No additional tables exist.

#### Enum: `topic_status`
Values: `draft` | `pending` | `processing` | `enriched` | `failed` | `archived`

Tracks the AI enrichment lifecycle for a topic (ADR-006). A topic must reach `enriched` before it is visible to users.

#### Enum: `user_topic_status`
Values: `saved` | `learning` | `completed`

Tracks the user's learning progress for a saved topic.

---

#### Table: `topics`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `slug` | `text` UNIQUE NOT NULL | Kebab-case, URL-safe. Format enforced by CHECK constraint. |
| `title` | `text` NOT NULL | |
| `category` | `text` NOT NULL | Plain text; no FK. |
| `description` | `text` NOT NULL | Human-written blurb. |
| `summary` | `text` | AI-generated. NULL until `status = 'enriched'`. |
| `key_concepts` | `jsonb` | AI-generated string array. NULL until `status = 'enriched'`. |
| `status` | `topic_status` NOT NULL | DEFAULT `'draft'`. |
| `created_at` | `timestamptz` NOT NULL | DEFAULT `now()`. |
| `updated_at` | `timestamptz` NOT NULL | Auto-updated by trigger. |

**RLS:** `SELECT` for `authenticated` where `status = 'enriched'`. No user write policies (admin uses service-role key).

**Indexes:** `topics_slug_idx`, `topics_status_idx`, `topics_category_idx`

---

#### Table: `user_topics`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` NOT NULL FK | → `auth.users(id)` ON DELETE CASCADE |
| `topic_id` | `uuid` NOT NULL FK | → `topics(id)` ON DELETE CASCADE |
| `status` | `user_topic_status` NOT NULL | DEFAULT `'saved'`. |
| `created_at` | `timestamptz` NOT NULL | DEFAULT `now()`. |
| `updated_at` | `timestamptz` NOT NULL | Auto-updated by trigger. |

UNIQUE constraint on `(user_id, topic_id)` — one record per user–topic pair.

**RLS:** Full CRUD for authenticated users restricted to `user_id = auth.uid()`.

**Indexes:** `user_topics_user_id_idx`, `user_topics_topic_id_idx`, `user_topics_user_status_idx`

---

#### Shared Infrastructure
- `public.handle_updated_at()` — trigger function that sets `updated_at = now()` on every UPDATE. Shared by both tables.

#### Migration Approach
- SQL files committed in `supabase/migrations/` (timestamped filenames).
- Applied via `pnpm migrate` (runs `scripts/migrate.mjs`, which uses `postgres.js` to connect directly to the remote DB).
- Requires `SUPABASE_DB_URL` in `.env.local` (get from Supabase Dashboard → Settings → Database).

#### TypeScript Types
- Defined in `lib/supabase/types.ts` — manually written from the schema.
- Includes `Database` interface compatible with the typed Supabase JS client (`createBrowserClient<Database>`, `createServerClient<Database>`).


### API Routes / Edge Functions
_To be defined._

### AI Pipeline
_To be defined._

### Caching Strategy
_To be defined._
