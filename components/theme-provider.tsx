"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Thin client wrapper around next-themes ThemeProvider.
 *
 * Placed here (not in layout.tsx) so the root layout stays a Server Component.
 *
 * Configuration:
 *   attribute="class"    — next-themes adds/removes the `.dark` class on <html>
 *   defaultTheme="system" — respects OS preference on first visit
 *   enableSystem          — allows the "system" option to function
 *   disableTransitionOnChange — suppresses cross-theme transition flash on hydration
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
