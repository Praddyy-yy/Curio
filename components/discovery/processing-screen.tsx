"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const MESSAGES = [
  "Processing your recording…",
  "Preparing transcript…",
  "Analyzing your explanation…",
  "Preparing your feedback…",
]

/**
 * A calm, minimal full-screen processing state shown while the audio
 * is being uploaded and transcribed. Cycles through reassuring messages.
 * Respects prefers-reduced-motion via CSS.
 */
export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)

  // Cycle through messages every 3s so the UI feels alive without fake progress
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
      }}
    >
      {/* Animated dots — pure CSS, reduced-motion handled in globals.css */}
      <div style={{ display: "flex", gap: "8px" }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--foreground)",
              opacity: 0.3,
              animation: `processingPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Message — cycles with a gentle fade */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 400,
            color: "var(--foreground)",
            margin: 0,
            textAlign: "center",
          }}
        >
          {MESSAGES[messageIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
