"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { signInAction } from "./actions"
import type { SignInState } from "./actions"

const signInInitialState: SignInState = { error: null }

/* ─── Google G logo ─── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

interface LoginFormProps {
  /** Error from server-side redirect (e.g., OAuth failure). */
  initialError?: string
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    signInInitialState
  )

  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [googleError, setGoogleError] = React.useState<string | null>(null)

  const displayError = state.error ?? googleError ?? initialError ?? null

  async function handleGoogleSignIn() {
    setGoogleError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setGoogleError(error.message)
      setGoogleLoading(false)
    }
    // On success the browser redirects to Google — no need to reset loading
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Error banner */}
      {displayError && (
        <div
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {displayError}
        </div>
      )}

      {/* Email + password form */}
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isPending || googleLoading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <Input
            id="login-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isPending || googleLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || googleLoading}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleSignIn}
        disabled={isPending || googleLoading}
        type="button"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      {/* Sign-up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
