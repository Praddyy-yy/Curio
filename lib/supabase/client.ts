import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Supabase browser client (typed).
 * Use in Client Components and browser-side code only.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
