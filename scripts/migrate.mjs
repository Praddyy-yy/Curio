#!/usr/bin/env node
/**
 * Curio — Migration Runner
 *
 * Applies SQL migration files from supabase/migrations/ in filename order.
 * Tracks applied migrations in a _migrations table to prevent double-runs.
 *
 * Usage:
 *   node scripts/migrate.mjs
 *
 * Prerequisites:
 *   Add SUPABASE_DB_URL to your .env.local:
 *     SUPABASE_DB_URL=postgresql://postgres:[DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
 *
 *   Find your DB password in:
 *     Supabase Dashboard → Settings → Database → Connection string (URI format)
 */

import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// ─── Load .env.local ─────────────────────────────────────────────────────────
// parse-dotenv is not available as a dep; do a minimal parse
function loadEnv() {
  try {
    const content = readFileSync(join(ROOT, ".env.local"), "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // .env.local might not exist in CI
  }
}

loadEnv()

const DB_URL = process.env.SUPABASE_DB_URL

if (!DB_URL) {
  console.error(`
❌  SUPABASE_DB_URL is not set.

Add it to your .env.local:
  SUPABASE_DB_URL=postgresql://postgres:[DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

Find your DB password in:
  Supabase Dashboard → Settings → Database → Connection string (URI)
`)
  process.exit(1)
}

// ─── Run migrations ───────────────────────────────────────────────────────────
// ─── Parse DB URL ─────────────────────────────────────────────────────────────
// The Supabase dashboard sometimes displays the connection string with
// the password wrapped in brackets, e.g. postgresql://postgres:[pass]@...
// Brackets are NOT part of the URL spec for the password component —
// strip them before connecting.
function parseDbUrl(raw) {
  try {
    const u = new URL(raw)
    const password = decodeURIComponent(u.password).replace(/^\[|\]$/g, "").trim()
    return {
      host:     u.hostname,
      port:     parseInt(u.port, 10) || 5432,
      database: u.pathname.slice(1),
      username: u.username,
      password,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 20,
    }
  } catch {
    // If URL parsing fails, pass the raw string and let postgres.js handle it
    return { connection: raw, ssl: { rejectUnauthorized: false }, max: 1, idle_timeout: 20 }
  }
}

const { default: postgres } = await import("postgres")
const sql = postgres(parseDbUrl(DB_URL))

try {
  // Create migrations tracking table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id          serial      PRIMARY KEY,
      name        text        NOT NULL UNIQUE,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `

  // Read all migration files in order
  const migrationsDir = join(ROOT, "supabase", "migrations")
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort() // lexicographic = timestamp order

  if (files.length === 0) {
    console.log("✓ No migration files found.")
    process.exit(0)
  }

  for (const file of files) {
    // Check if already applied
    const [existing] = await sql`
      SELECT id FROM public._migrations WHERE name = ${file}
    `

    if (existing) {
      console.log(`  ↩  ${file} (already applied, skipping)`)
      continue
    }

    console.log(`  ▶  Applying ${file} ...`)
    const sqlContent = readFileSync(join(migrationsDir, file), "utf-8")

    // Execute the entire migration file in a single unsafe() call.
    // postgres.js supports multi-statement SQL via unsafe() and returns
    // the result of the last statement. This avoids splitting logic that
    // breaks dollar-quoted strings ($$...$$) in trigger function bodies.
    await sql.begin(async (tx) => {
      await tx.unsafe(sqlContent)
      await tx`
        INSERT INTO public._migrations (name) VALUES (${file})
      `
    })

    console.log(`  ✓  ${file}`)
  }

  console.log("\n✅  All migrations applied successfully.\n")
} catch (err) {
  console.error("\n❌  Migration failed:\n", err.message)
  process.exit(1)
} finally {
  await sql.end()
}
