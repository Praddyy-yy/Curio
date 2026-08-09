// Apply the migration using @supabase/supabase-js with service role key
// The anon key won't have DDL access; we need the service role key.
// Since we only have the anon key, we'll use the DB URL directly.

import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Password has special chars: [Supabase100]
const client = new Client({
  host: 'db.sqcnggtdolotdrrojoul.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '[Supabase100]',
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected!');
  
  const sql = readFileSync('supabase/migrations/20260809000003_add_session_id_and_transcript.sql', 'utf-8');
  await client.query(sql);
  console.log('Migration applied successfully!');
  
  // Verify
  const result = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name IN ($2, $3)', ['speaking_sessions', 'session_id', 'transcript']);
  console.log('Columns found:', result.rows.map(r => r.column_name));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await client.end();
}
