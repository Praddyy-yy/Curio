"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export type SignUpState = {
  error: string | null
  /** True when sign-up succeeded and confirmation email was sent. */
  success: boolean
}



/**
 * Email + password sign-up.
 * Called via useActionState — returns state (success or error).
 *
 * On success: returns { success: true } so the form can show a confirmation
 * message ("Check your email") without redirecting.
 *
 * On error: returns { error: message }.
 *
 * The email confirmation link points to /auth/callback which exchanges the
 * code for a session and redirects to /.
 */
export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = (formData.get("email") as string | null)?.trim() ?? ""
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !password) {
    return { error: "Email and password are required.", success: false }
  }

  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      success: false,
    }
  }

  // Derive the origin for the confirmation email redirect
  const headersList = await headers()
  const origin =
    headersList.get("origin") ??
    headersList.get("x-forwarded-host") ??
    "http://localhost:3000"

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message, success: false }
  }

  return { error: null, success: true }
}
