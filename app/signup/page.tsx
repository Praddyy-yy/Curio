import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Sign up — Curio",
  description: "Create your Curio account.",
}

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

/**
 * /signup — public route.
 *
 * Authenticated users are redirected to / by middleware before this renders.
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const error = params.error

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
            Start your learning journey
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
            Create an account
          </h1>

          <SignupForm initialError={error} />
        </div>

      </div>
    </div>
  )
}
