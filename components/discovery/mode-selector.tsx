"use client"

export type DiscoveryMode = "off_the_cuff" | "research"

interface ModeSelectorProps {
  mode: DiscoveryMode
  onModeChange: (mode: DiscoveryMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-full)",
          padding: "4px",
        }}
      >
        <button
          onClick={() => onModeChange("off_the_cuff")}
          style={{
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: mode === "off_the_cuff" ? "var(--foreground)" : "transparent",
            color: mode === "off_the_cuff" ? "var(--background)" : "var(--foreground-secondary)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
        >
          Rawdog
        </button>
        <button
          onClick={() => onModeChange("research")}
          style={{
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: mode === "research" ? "var(--foreground)" : "transparent",
            color: mode === "research" ? "var(--background)" : "var(--foreground-secondary)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
        >
          Research
        </button>
      </div>
      <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: 0, textAlign: "center", height: "20px" }}>
        {mode === "off_the_cuff" ? "Speak raw." : "Take time to explore before speaking."}
      </p>
    </div>
  )
}
