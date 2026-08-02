import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

import { allTopics } from "../data/topics/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(join(ROOT, ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local might not exist in CI
  }
}

loadEnv();

const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error(`
❌  SUPABASE_DB_URL is not set.

Add it to your .env.local:
  SUPABASE_DB_URL=postgresql://postgres:[DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
`);
  process.exit(1);
}

// ─── Parse DB URL ─────────────────────────────────────────────────────────────
function parseDbUrl(raw: string) {
  try {
    const u = new URL(raw);
    const password = decodeURIComponent(u.password).replace(/^\[|\]$/g, "").trim();
    return {
      host: u.hostname,
      port: parseInt(u.port, 10) || 5432,
      database: u.pathname.slice(1),
      username: u.username,
      password,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 20,
    };
  } catch {
    return raw;
  }
}

// ─── Run Seed ─────────────────────────────────────────────────────────────────
async function runSeed() {
  console.log(`▶  Seeding ${allTopics.length} topics...`);

  // Basic validation
  const slugs = new Set<string>();
  for (const topic of allTopics) {
    if (!topic.title || !topic.slug || !topic.category || !topic.status) {
      console.error(`❌  Validation failed: Topic is missing required fields: ${JSON.stringify(topic)}`);
      process.exit(1);
    }
    if (slugs.has(topic.slug)) {
      console.error(`❌  Validation failed: Duplicate slug detected: "${topic.slug}"`);
      process.exit(1);
    }
    slugs.add(topic.slug);
  }

  // @ts-expect-error Typescript struggles with union types passed to overloaded functions
  const sql = postgres(parseDbUrl(DB_URL as string));

  try {
    // Insert all topics. On conflict of slug, DO UPDATE the status if it is currently 'draft'.
    // This allows the starter topics to be moved to 'enriched' without overwriting other fields.
    const result = await sql`
      INSERT INTO public.topics ${sql(allTopics, "slug", "title", "category", "description", "status")}
      ON CONFLICT (slug) 
      DO UPDATE SET status = EXCLUDED.status 
      WHERE topics.status = 'draft'
      RETURNING id, slug
    `;

    console.log(`✓  Inserted ${result.length} new topics (skipped ${allTopics.length - result.length} existing duplicates).`);
    console.log("\n✅  Seeding complete.\n");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("\n❌  Seed failed:\n", message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runSeed();
