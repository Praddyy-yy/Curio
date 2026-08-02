import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * OAuth / magic-link callback handler.
 *
 * After the provider (Google) redirects the user back to this app, Supabase
 * appends a one-time `code` to the URL. This route exchanges that code for a
 * session and then redirects the user to the application.
 *
 * Google OAuth flow:
 *   1. User clicks "Continue with Google"
 *   2. supabase.auth.signInWithOAuth() redirects to Google
 *   3. Google authenticates → redirects to Supabase
 *   4. Supabase redirects here with ?code=...
 *   5. We exchange the code for a session → redirect to /
 *
 * Email confirmation flow:
 *   1. User signs up
 *   2. Supabase sends confirmation email with link to this route
 *   3. We exchange the code → redirect to /
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful auth: redirect to the app (or ?next= param)
      const redirectUrl = new URL(next, origin)
      return NextResponse.redirect(redirectUrl)
    }

    // Exchange failed: redirect to login with error
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set(
      "error",
      "Authentication failed. Please try again."
    )
    return NextResponse.redirect(loginUrl)
  }

  // No code in the URL: malformed callback
  const loginUrl = new URL("/login", origin)
  loginUrl.searchParams.set("error", "Missing authentication code.")
  return NextResponse.redirect(loginUrl)
}
