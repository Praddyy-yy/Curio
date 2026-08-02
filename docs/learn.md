# Curio — Learning Notebook

> A running log of concepts, patterns, and technical insights discovered during development.
> Updated continuously as new things are learned or existing understanding deepens.

---

## How to Use This Notebook

- Add a new entry whenever you encounter a concept worth remembering.
- Keep entries concise: explain what it is, why it matters, and any gotchas.
- Link to relevant files or external references where helpful.
- Date every entry.

---

## Entries

### 2026-08-01 — Next.js 15 App Router

**What**: Next.js 15 uses the App Router by default. Pages are defined via `app/` directory with `page.tsx` files. Layouts, error boundaries, and loading states are co-located.

**Why it matters**: App Router enables React Server Components (RSC), which allow server-side data fetching without client-side hydration. This is the foundation for Supabase server-side queries in future phases.

**Gotchas**:
- Files named `page.tsx` are public routes; other files in `app/` are not.
- `layout.tsx` wraps all child routes at its level.
- Client Components must include `"use client"` directive at the top.

---

### 2026-08-01 — Supabase SSR Package

**What**: `@supabase/ssr` is the recommended way to use Supabase in Next.js App Router. It provides `createBrowserClient` (for Client Components) and `createServerClient` (for Server Components / Route Handlers).

**Why it matters**: The legacy `@supabase/auth-helpers-nextjs` is deprecated. `@supabase/ssr` is the current standard for cookie-based session management.

**Gotchas**:
- `createServerClient` requires cookie helpers — even if auth is not used, the helpers must be wired up.
- Server Components cannot set cookies directly; cookie writes from Server Components are silently ignored (middleware handles session refresh).

---

### 2026-08-01 — pnpm Virtual Store

**What**: pnpm uses a content-addressable store and symlinks packages into a virtual store (`node_modules/.pnpm`). Moving a project folder breaks the symlinks because the virtual store path is absolute.

**Why it matters**: If you bootstrap in a subdirectory and move files up, you must run `pnpm install --config.confirmModulesPurge=false` to recreate the virtual store at the correct root path.

**Gotchas**:
- `pnpm install` in non-TTY environments (like CI or terminal sandboxes) aborts the purge by default. Pass `--config.confirmModulesPurge=false` to bypass.

---

### 2026-08-01 — shadcn/ui with Tailwind v4

**What**: shadcn/ui v2+ auto-detects Tailwind v4 and skips the legacy `tailwind.config.js` setup. CSS variables are injected directly into `globals.css` using Tailwind's `@layer` and `--color-*` custom properties.

**Why it matters**: Tailwind v4 moves configuration from JavaScript to CSS, so there is no `tailwind.config.ts` to manually edit. Theme tokens are set via CSS custom properties.

**Gotchas**:
- Do not add a `tailwind.config.ts` manually — shadcn/ui handles this automatically with Tailwind v4.
- The `components.json` file governs shadcn component paths and style settings.

---

## Open Questions

> Questions discovered during development that don't yet have answers. Move to an entry above once resolved.

- [ ] How will Groq streaming responses be handled in the App Router? (Server Actions vs. Route Handlers)
- [ ] Will Supabase Realtime be needed for the recording pipeline status updates?

---

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Groq API Docs](https://console.groq.com/docs)

---

### 2026-08-01 — Tailwind v4 `@theme inline` vs `@theme`

**What**: Tailwind v4 has two theme declaration modes:
- `@theme { }` — generates CSS custom properties **and** utility classes. Tokens are accessible via `var(--token)` in CSS.
- `@theme inline { }` — generates utility classes only. Token values are inlined directly; no CSS variables are emitted.

**Why it matters**: shadcn's base-nova style uses `@theme inline` to map shadcn variable names (like `--color-background: var(--background)`) to Tailwind utilities. The actual values live in `:root`. This means components can reference `bg-background` in Tailwind and `var(--background)` directly in CSS — but only if both layers are defined.

**Gotchas**:
- If a component uses `rounded-[min(var(--radius-md),10px)]` (an arbitrary value with a CSS var), the var must be defined in `:root` — `@theme inline` alone does not emit it.
- Shadow utility names (`shadow-sm`, `shadow-md`) can be overridden by setting the `--shadow-sm` and `--shadow-md` properties in `@theme inline`. This replaces Tailwind's default shadow values globally.

---

### 2026-08-01 — Base UI vs Radix UI in shadcn base-nova

**What**: The `base-nova` shadcn style uses **Base UI** (`@base-ui/react/*`) instead of Radix UI. Base UI is an alternative from the MUI team.

**Key API difference**: Base UI uses a `render` prop pattern instead of Radix's `asChild`:
```tsx
// Radix (asChild)
<DialogTrigger asChild><Button /></DialogTrigger>

// Base UI (render prop)
<DialogTrigger render={<Button />}>Label</DialogTrigger>
```

**Why it matters**: Any code written for Radix UI (most online shadcn examples) will need adaptation. The `asChild` prop does not exist on Base UI primitives and TypeScript will error.

**Gotchas**:
- Base UI state attributes use `data-checked`, `data-open`, `data-closed`, `data-active` — different from Radix's `aria-*` or `data-state` attributes.
- `data-open:animate-in` works because Base UI emits `data-open` on the element.

---

### 2026-08-01 — CSS Custom Property Scoping for Animation

**What**: The `tw-animate-css` animation library (used by shadcn) exposes CSS custom properties like `--tw-enter-scale` and `--tw-exit-scale` that control the scale factor for zoom animations.

**Why it matters**: The design system specifies dialog animations at scale 0.98→1 (not the default 0.95 from `zoom-in-95`). By targeting the dialog's `data-slot` attribute and overriding `--tw-enter-scale: 0.98`, we can correct the animation without modifying the component's class list.

```css
[data-slot="dialog-content"] {
  --tw-enter-scale: 0.98;
  --tw-exit-scale: 0.98;
}
```

**Gotchas**:
- This CSS rule must be in `globals.css` at global scope, not inside `@layer base` — otherwise it may be overridden by the animation library styles.

---

### 2026-08-01 � Supabase SSR Session Refresh Pattern

**What**: `@supabase/ssr` requires the session to be refreshed on every server request. This is done in the Next.js proxy (`proxy.ts`) by calling `supabase.auth.getUser()`.

**Why it matters**: Without session refresh in the proxy, expired tokens are not renewed and users get logged out unexpectedly. `getSession()` reads from storage but does NOT refresh tokens \u2014 always use `getUser()` instead.

**The cookie forwarding pattern**:
```ts
// setAll must mutate BOTH request and response cookies so the session
// is available downstream in the same request cycle.
cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
supabaseResponse = NextResponse.next({ request })
cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
```n
**Gotchas**:
- Must return `supabaseResponse` (not a new `NextResponse.next()`) from the proxy or session cookies are lost.
- No code should run between `createServerClient` and `supabase.auth.getUser()` in the proxy.

---

### 2026-08-01 � Next.js 16: middleware.ts \u2192 proxy.ts

**What**: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`. The exported function must also be renamed from `middleware` to `proxy` (or exported as default).

**Why it matters**: Both files cannot coexist. Having both causes a build error. The fix is to delete `middleware.ts` entirely and create `proxy.ts` with the export named `proxy`:
```ts
// proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```n
**Gotchas**:
- Even an empty `middleware.ts` will be detected by Next.js \u2014 the file must be physically deleted.
- The `config.matcher` export works the same way in `proxy.ts`.


---

### 2026-08-01 � Supabase migrations without the CLI (Windows AppLocker)

**What**: The Supabase CLI binary (installed via npm or globally) is blocked by Windows Defender Application Control (WDAC / AppLocker) on this machine. The policy blocks execution of arbitrary .exe files that weren't installed through approved channels.

**Solution**: A pure Node.js migration runner (`scripts/migrate.mjs`) using the `postgres` package connects directly to the remote Supabase database via a PostgreSQL connection URL. Migration files in `supabase/migrations/` are executed in filename order and tracked in a `_migrations` table to prevent double-runs.

**How to get the DB URL**: Supabase Dashboard \u2192 Settings \u2192 Database \u2192 Connection string (URI format).

**Gotchas**:
- The `postgres` package is pure JavaScript \u2014 no native compilation needed. Safe to use as a dev dependency.
- SQL migrations with multiple statements must be split on `;\n` (newline-terminated semicolons) since `postgres.js` sends one statement at a time.
- The `unsafe()` method is required for DDL statements (`CREATE TABLE`, `ALTER TABLE`, etc.) which return no rows.
- `ssl: { rejectUnauthorized: false }` is needed for Supabase's remote host.

---

### 2026-08-01 � PostgreSQL RLS: service-role key bypasses RLS by design

**What**: Supabase Row Level Security (RLS) is automatically bypassed when connecting with the **service-role key** (as opposed to the anon key). This is a Postgres feature (`SECURITY DEFINER` role).

**Why it matters**: Admin writes to the `topics` table are done via the service-role key in future tooling. No `INSERT`/`UPDATE`/`DELETE` policies are created for regular users � they simply can't write to `topics` at all. The absence of a policy is itself the security boundary.

**Pattern**:
- Tables with platform-controlled data: enable RLS + SELECT policy only. No write policies for users.\n- Tables with user-owned data (`user_topics`): enable RLS + full CRUD policies filtered by `auth.uid()`.

---

### 2026-08-01 � Native TypeScript Execution in Node.js

**What**: Node.js v22.6+ (and stabilized in v23/v24) supports executing TypeScript files natively via the `--experimental-strip-types` flag without needing external transpilers like `tsx`, `ts-node`, or `esbuild`.

**How to use**: `node --experimental-strip-types script.ts`

**Gotchas**:
- It only strips types (like SWC/esbuild does); it does not perform type checking. You still need `tsc --noEmit` for that.
- You must use explicit `.ts` extensions in local imports within the script (e.g., `import { data } from './data.ts';`) because Node's ES module resolution strictly requires extensions and does not resolve TS files automatically without them.
- If `type: "module"` is not in `package.json`, you'll see an ESM warning. This is benign but can be resolved by adding it to `package.json`.

---

### 2026-08-01 � Supabase TypeScript Database Generic: Missing Required Fields Cause 
ever\n\n**What**: When using createBrowserClient<Database> or createServerClient<Database> from @supabase/ssr, the Database generic type must match the exact shape that @supabase/supabase-js v2 expects internally. Missing keys cause the conditional type inference to collapse to 
ever for all query results.\n\n**Required shape** (all fields are mandatory):\n`	ypescript\ninterface Database {\n  public: {\n    Tables: {\n      [table]: {\n        Row: {...}\n        Insert: {...}\n        Update: {...}\n        Relationships: [...]  // ? required, even if empty\n      }\n    }\n    Views: {...}              // ? required\n    Functions: {...}          // ? required\n    Enums: {...}\n    CompositeTypes: {...}     // ? required\n  }\n}\n`\n\n**Symptom**: Property 'x' does not exist on type 'never' on all query result properties.\n\n**Fix**: Add the missing keys with Record<string, never> as the type for empty schemas, and [] for empty Relationships arrays.\n\n**Pragmatic fallback**: If fighting generics isn't worth it, cast query results: const data = result.data as Topic[] | null. This is acceptable and used in the codebase for server action upserts where Supabase's Insert generic resolves incorrectly due to the 
ever[] upsert payload type.
