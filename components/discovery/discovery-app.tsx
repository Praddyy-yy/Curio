"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Topic } from "@/lib/supabase/types"
import { offTheCuffTopics } from "@/data/topics/off-the-cuff"
import { ModeSelector, type DiscoveryMode } from "./mode-selector"
import { SettingsDialog, type Settings, DEFAULT_SETTINGS } from "./settings-dialog"
import { ActionButton } from "./action-button"
import { useRollingSound } from "@/hooks/use-rolling-sound"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DiscoveryAppProps {
  topics: Pick<Topic, "id" | "slug" | "title" | "category">[]
  /** Topic title to pre-select (from Practice Again URL param). */
  initialTopic?: string
  /** Mode to pre-select (from Practice Again URL param). */
  initialMode?: string
}

export function DiscoveryApp({ topics, initialTopic, initialMode }: DiscoveryAppProps) {
  const [mode, setMode] = useState<DiscoveryMode>(
    initialMode === "research" ? "research" : "off_the_cuff"
  )
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [currentTopic, setCurrentTopic] = useState<Pick<Topic, "id" | "slug" | "title" | "category"> | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  // Tracks whether the initialTopic (if any) has been applied yet.
  // Gates the random roll so it doesn't overwrite the pre-selected topic.
  const [initialTopicApplied, setInitialTopicApplied] = useState(!initialTopic)
  const { playTick } = useRollingSound(settings.uiSounds)
  
  // Try to load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("curio_discovery_settings")
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse settings:", e)
      }
    }
  }, [])

  // Save settings to localStorage when they change
  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings)
    localStorage.setItem("curio_discovery_settings", JSON.stringify(newSettings))
  }

  // Derive active dataset based on mode
  const activeTopics = useMemo(() => {
    return mode === "off_the_cuff" ? (offTheCuffTopics as Pick<Topic, "id" | "slug" | "title" | "category">[]) : topics
  }, [mode, topics])

  // Derive available categories from active dataset
  const categories = useMemo(() => {
    const cats = new Set(activeTopics.map(t => t.category))
    return ["All Categories", ...Array.from(cats).sort()]
  }, [activeTopics])

  // Filter topics by category
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "All Categories") return activeTopics
    return activeTopics.filter(t => t.category === selectedCategory)
  }, [activeTopics, selectedCategory])

  // Automatically reset category if current selection doesn't exist in the new active dataset
  useEffect(() => {
    if (selectedCategory !== "All Categories") {
      const cats = new Set(activeTopics.map(t => t.category))
      if (!cats.has(selectedCategory)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCategory("All Categories")
      }
    }
  }, [activeTopics, selectedCategory])

  // Apply the Practice Again initial topic once activeTopics is ready.
  // Searches by title so it works across both Rawdog and Research datasets.
  useEffect(() => {
    if (initialTopicApplied || !initialTopic) return
    const found = activeTopics.find((t) => t.title === initialTopic)
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTopic(found)
      setInitialTopicApplied(true)
    }
  }, [activeTopics, initialTopic, initialTopicApplied])

  // Roll a random topic with animation
  const rollTopic = useCallback(async (animate = true) => {
    if (filteredTopics.length === 0 || isRolling) {
      if (filteredTopics.length === 0) setCurrentTopic(null)
      return
    }

    if (!animate) {
      const randomIndex = Math.floor(Math.random() * filteredTopics.length)
      setCurrentTopic(filteredTopics[randomIndex])
      return
    }

    setIsRolling(true)

    const finalTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)]

    if (settings.reduceMotion) {
      // Skip the long rolling animation completely for reduce motion
      setCurrentTopic(finalTopic)
      playTick(true)
      setIsRolling(false)
      return
    }

    // Calculate a 4-second strong deceleration curve
    const maxTime = 3800 // slightly under 4s so the final snap aligns with ~4s total
    const delays: number[] = []
    let currentDelay = 40 // very rapid initial changes
    let totalTime = 0
    
    while (totalTime < maxTime) {
      delays.push(currentDelay)
      totalTime += currentDelay
      currentDelay *= 1.12 // strong ease-out curve
    }

    for (let i = 0; i < delays.length; i++) {
      // Pick a random topic for the visual blur, ensuring it changes
      const randomIndex = Math.floor(Math.random() * filteredTopics.length)
      setCurrentTopic(filteredTopics[randomIndex])
      
      playTick(false) // Synchronized click on each transition
      
      await new Promise(resolve => setTimeout(resolve, delays[i]))
    }

    // Settles with the final selection
    setCurrentTopic(finalTopic)
    playTick(true) // Slightly stronger, more satisfying final click
    setIsRolling(false)
  }, [filteredTopics, isRolling, playTick, settings.reduceMotion])

  // Initial roll on mount or when category changes (no animation on mount/filter change).
  // Skipped until initialTopic has been applied (or there is no initialTopic) so the
  // Practice Again pre-selection isn't immediately overwritten by a random roll.
  useEffect(() => {
    if (!initialTopicApplied) return
    if (!isRolling) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      rollTopic(false)
    }
  }, [selectedCategory, rollTopic, isRolling, initialTopicApplied])

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100svh - 56px)", alignItems: "center", justifyContent: "center", padding: "32px", position: "relative" }}>
      
      {/* Settings — pinned top-right */}
      <div style={{ position: "absolute", top: "32px", right: "32px" }}>
        <SettingsDialog settings={settings} onSettingsChange={handleSettingsChange} />
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "48px", width: "100%", maxWidth: "600px", textAlign: "center" }}>

        {/* Top controls: Mode toggle → subtitle → category — all centered with 16px gaps */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <ModeSelector mode={mode} onModeChange={setMode} />

          {/* Category Selector */}
          <Select
            value={selectedCategory}
            onValueChange={(val) => val && setSelectedCategory(val)}
            disabled={isRolling}
          >
            <SelectTrigger
              style={{
                width: "auto",
                minWidth: "180px",
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--foreground-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderRadius: "var(--radius-full)",
                margin: "0 auto",
                display: "inline-flex",
              }}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Random Topic Display */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--foreground-secondary)", margin: 0 }}>
            READY
          </p>

          <div style={{ position: "relative", height: "clamp(160px, 25vh, 220px)", width: "100%", maxWidth: "800px", display: "flex", justifyContent: "center", alignItems: "center", perspective: "1000px" }}>
            <AnimatePresence mode="popLayout">
              {currentTopic ? (
                <motion.h1
                  key={currentTopic.id || currentTopic.title}
                  initial={{ y: "80%", opacity: 0, scale: 0.98, rotateX: -10 }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ y: "-80%", opacity: 0, scale: 0.98, rotateX: 10 }}
                  transition={{ 
                    type: "spring",
                    stiffness: isRolling ? 600 : 350,
                    damping: isRolling ? 50 : 25,
                    mass: 0.8
                  }}
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(40px, 6vw, 64px)",
                    fontWeight: 400,
                    color: "var(--foreground)",
                    margin: 0,
                    lineHeight: 1.1,
                    position: "absolute",
                    textAlign: "center",
                    width: "100%",
                    textWrap: "balance"
                  }}
                >
                  {currentTopic.title}
                </motion.h1>
              ) : (
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 400, color: "var(--muted)", margin: 0, position: "absolute" }}>
                  No topics
                </h1>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => rollTopic(true)}
            disabled={isRolling}
            aria-label="Roll another topic"
            style={{
              marginTop: "16px",
              background: "none",
              border: "none",
              color: isRolling ? "var(--muted-foreground)" : "var(--accent-gold)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isRolling ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color var(--duration-fast) var(--ease-out)",
              opacity: isRolling ? 0.5 : 1,
            }}
          >
            <motion.svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              animate={{ rotate: isRolling ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-8.27l-5.67-1.5" />
            </motion.svg>
            Roll
          </button>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: "32px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ActionButton
            mode={mode}
            researchDuration={settings.researchDuration}
            speakingDuration={settings.speakingDuration}
            currentTopicTitle={currentTopic?.title ?? null}
          />
        </div>

      </div>
    </div>
  )
}
