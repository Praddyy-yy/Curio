"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type SignInState = {
  error: string | null
}

const initialState: SignInState = { error: null }
export { initialState as signInInitialState }

/**
 * Email + password sign-in.
 * Called via useActionState — returns error state or calls redirect() on success.
 */
export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = (formData.get("email") as string | null)?.trim() ?? ""
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Normalize Supabase error messages to something user-friendly
    const message =
      error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message
    return { error: message }
  }

  // redirect() throws internally — Next.js catches it and navigates the user
  redirect("/")
}
