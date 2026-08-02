"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Sign the current user out and redirect to /login.
 *
 * Usage (in any Server Component or Client Component via form):
 * ```tsx
 * import { signOutAction } from "@/lib/auth/actions"
 *
 * <form action={signOutAction}>
 *   <button type="submit">Sign out</button>
 * </form>
 * ```
 */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
