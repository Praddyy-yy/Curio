"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signUpAction, signUpInitialState } from "./actions"

interface SignupFormProps {
  /** Error pre-populated from URL search param (rare for signup). */
  initialError?: string
}

export function SignupForm({ initialError }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    signUpInitialState
  )

  const displayError = state.error ?? initialError ?? null

  // After successful sign-up, show the confirmation message
  if (state.success) {
    return (
      <div className="flex flex-col gap-6">
        <div
          role="status"
          className="rounded-sm bg-success/10 px-4 py-4 text-sm text-success"
        >
          <p className="font-medium">Check your email</p>
          <p className="mt-1 text-success/80">
            We sent a confirmation link. Click it to activate your account.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    )
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

      {/* Signup form */}
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="signup-email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="signup-password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {/* Sign-in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
