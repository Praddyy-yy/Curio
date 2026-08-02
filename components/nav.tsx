import Link from "next/link"
import { signOutAction } from "@/lib/auth/actions"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Global navigation bar.
 *
 * Server Component — no client interactivity except the sign-out form.
 * Three zones: logo (left), nav links (center), actions (right).
 */
export function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 32px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            fontFamily: "var(--font-serif)",
            fontSize: "22px",
            fontWeight: 400,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          Curio
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/saved"
            style={{
              textDecoration: "none",
              fontSize: "14px",
              color: "var(--foreground-secondary)",
              transition: "color var(--duration-fast)",
            }}
            className="nav-link"
          >
            Saved
          </Link>
          <Link
            href="/journey"
            style={{
              textDecoration: "none",
              fontSize: "14px",
              color: "var(--foreground-secondary)",
              transition: "color var(--duration-fast)",
            }}
            className="nav-link"
          >
            Journey
          </Link>
        </nav>

        {/* Right side: theme toggle + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <ThemeToggle />
          <form action={signOutAction}>
            <button type="submit" className="nav-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

