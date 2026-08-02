import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/types"

/**
 * Supabase auth proxy (Next.js 16+ convention, replaces middleware.ts).
 *
 * Responsibilities:
 * 1. Refresh the Supabase session on every request (required by @supabase/ssr)
 * 2. Enforce route protection:
 *    - Unauthenticated users → redirected to /login (protected routes only)
 *    - Authenticated users visiting /login or /signup → redirected to /
 *
 * IMPORTANT: Do not add code between createServerClient and auth.getUser().
 * The Supabase SSR client depends on this ordering to refresh tokens correctly.
 */

/** Routes that do not require authentication. */
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/auth/callback",
  "/style-guide",
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
}

/** Routes that redirect authenticated users away (e.g. back to app). */
const AUTH_ROUTES = ["/login", "/signup"]

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
}

export async function proxy(request: NextRequest) {
  // Build a mutable response. This is updated by Supabase when it sets cookies.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward cookie mutations onto both the request and response
          // so the session is available downstream in this request cycle.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // auth.getUser() validates and refreshes the session token.
  // Always use getUser() — getSession() does not refresh expired tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Authenticated user visiting /login or /signup → send to app root
  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Unauthenticated user visiting a protected route → send to /login
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // IMPORTANT: return supabaseResponse (not NextResponse.next()) so that
  // the refreshed session cookies are included in the response.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Files with extensions (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
}
