import { Nav } from "@/components/nav"

export default function SavedLoading() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav />
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "24px",
            color: "var(--muted-foreground)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          Loading Library...
        </p>
      </main>
    </div>
  )
}
