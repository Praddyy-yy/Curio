import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in — Curio",
  description: "Sign in to your Curio account.",
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

/**
 * /login — public route.
 *
 * Authenticated users are redirected to / by middleware before this renders.
 * Reads error/message from URL search params (set by server actions or OAuth callback).
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const error = params.error
  const message = params.message

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span
              className="text-foreground"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                fontWeight: 400,
                lineHeight: "110%",
                letterSpacing: "-0.01em",
              }}
            >
              Curio
            </span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to continue learning
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-none">

          {/* Heading */}
          <h1
            className="mb-6 text-foreground"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: "115%",
            }}
          >
            Welcome back
          </h1>

          {/* Message banner (e.g. "Check your email") */}
          {message && (
            <div
              role="status"
              className="mb-4 rounded-sm bg-success/10 px-4 py-3 text-sm text-success"
            >
              {message}
            </div>
          )}

          <LoginForm initialError={error} />
        </div>

      </div>
    </div>
  )
}
