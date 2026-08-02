"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Sun / Moon theme toggle for the navigation bar.
 *
 * - Sun icon  → currently in Light mode
 * - Moon icon → currently in Dark mode
 * - Resolves "system" to the matching icon via resolvedTheme
 * - 180ms fade + 15° rotation between states (design system motion spec)
 * - Gold hover, matching nav button aesthetics
 * - Mounted guard prevents SSR mismatch
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid SSR/hydration mismatch — render nothing until client has the theme.
  // This is the canonical next-themes mount guard; the setState is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Reserve the same space as the button to avoid layout shift
    return <span style={{ display: "inline-block", width: "32px", height: "32px" }} />
  }

  const isDark = resolvedTheme === "dark"

  function toggle() {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        padding: 0,
        background: "none",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        color: "var(--foreground-secondary)",
        transition: `color var(--duration-default) var(--ease-out)`,
        flexShrink: 0,
      }}
      className="theme-toggle"
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: `transform var(--duration-default) var(--ease-out), opacity var(--duration-default) var(--ease-out)`,
      }}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: `transform var(--duration-default) var(--ease-out), opacity var(--duration-default) var(--ease-out)`,
      }}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
