// Migration script: apply 20260809000003_add_session_id_and_transcript
// Run from project root: node scripts/apply-migration.cjs
// Requires: pnpm add --save-dev pg
/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg')
const path = require('path')
const fs = require('fs')


// Read .env.local manually to get the raw DB URL (handles passwords with special chars)
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbUrlMatch = envContent.match(/SUPABASE_DB_URL=(.+)/m)
if (!dbUrlMatch) { console.error('SUPABASE_DB_URL not found in .env.local'); process.exit(1) }

// Parse the DB URL: postgresql://user:password@host:port/database
// The password may contain special chars like [ ] — extract it with regex
const rawUrl = dbUrlMatch[1].trim().replace(/\r$/, '')
const urlMatch = rawUrl.match(/^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/)
if (!urlMatch) { console.error('Could not parse SUPABASE_DB_URL:', rawUrl); process.exit(1) }
const [, user, password, host, port, database] = urlMatch
console.log(`Connecting: ${user}@${host}:${port}/${database} (password length: ${password.length})`)

async function main() {
  const client = new Client({
    host,
    port: parseInt(port, 10),
    database,
    user,
    password,        // passed as plain string — no URL encoding issues
    ssl: { rejectUnauthorized: false },
  })


  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected.')

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260809000003_add_session_id_and_transcript.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('Applying migration...')
    await client.query(sql)
    console.log('Migration applied successfully.')

    // Verify
    const res = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'speaking_sessions'
        AND column_name IN ('session_id', 'transcript')
      ORDER BY column_name
    `)
    console.log('Verified columns:', res.rows.map(r => r.column_name).join(', '))

    // Check constraint
    const constraintRes = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'speaking_sessions'
        AND constraint_name = 'speaking_sessions_user_session_id_key'
    `)
    console.log('UNIQUE constraint:', constraintRes.rows.length > 0 ? 'present ✓' : 'MISSING!')

  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
