"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export interface Settings {
  researchDuration: number // seconds
  speakingDuration: number // seconds
  uiSounds: boolean
  reduceMotion: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  researchDuration: 7 * 60, // 7 minutes default
  speakingDuration: 1 * 60, // 1 minute default
  uiSounds: true,
  reduceMotion: false,
}

interface SettingsDialogProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  /** Authenticated user email, displayed read-only in the Account section. */
  userEmail?: string | null
}

export function SettingsDialog({ settings, onSettingsChange, userEmail }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  
  const handleUpdate = (updates: Partial<Settings>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            aria-label="Settings"
            style={{
              background: "none",
              border: "none",
              color: "var(--foreground-secondary)",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        }
      >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
      </DialogTrigger>
      
      <DialogContent style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "24px", gap: "24px", maxWidth: "400px" }}>
        <DialogHeader style={{ gap: "4px" }}>
          <DialogTitle style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400 }}>Settings</DialogTitle>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--foreground)", opacity: 0.8 }}>Timer lengths in whole minutes.</p>
        </DialogHeader>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Speaking Duration */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--foreground)", opacity: 0.9 }}>Speech</Label>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: 400, color: "var(--foreground)" }}>{settings.speakingDuration / 60} min</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[settings.speakingDuration / 60]}
              onValueChange={(val) => handleUpdate({ speakingDuration: (Array.isArray(val) ? val[0] : val as unknown as number) * 60 })}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--foreground)", opacity: 0.7, marginTop: "-4px" }}>
              <span>1 min</span>
              <span>10 min</span>
            </div>
          </div>

          {/* Research Duration */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--foreground)", opacity: 0.9 }}>Research</Label>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: 400, color: "var(--foreground)" }}>{settings.researchDuration / 60} min</span>
            </div>
            <Slider
              min={1}
              max={60}
              step={1}
              value={[settings.researchDuration / 60]}
              onValueChange={(val) => handleUpdate({ researchDuration: (Array.isArray(val) ? val[0] : val as unknown as number) * 60 })}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--foreground)", opacity: 0.7, marginTop: "-4px" }}>
              <span>1 min</span>
              <span>60 min</span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--foreground)", opacity: 0.7, marginTop: "-4px" }}>Research mode only</p>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Switch id="ui-sounds" checked={settings.uiSounds} onCheckedChange={(c) => handleUpdate({ uiSounds: !!c })} />
              <Label htmlFor="ui-sounds" style={{ fontSize: "15px", fontWeight: 500, color: "var(--foreground)", cursor: "pointer" }}>UI Sounds</Label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Switch id="reduce-motion" checked={settings.reduceMotion} onCheckedChange={(c) => handleUpdate({ reduceMotion: !!c })} />
              <Label htmlFor="reduce-motion" style={{ fontSize: "15px", fontWeight: 500, color: "var(--foreground)", cursor: "pointer" }}>Reduce Motion</Label>
            </div>
          </div>

          {/* Account */}
          {userEmail && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--foreground)", opacity: 0.5 }}>Account</p>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--foreground)", opacity: 0.7, wordBreak: "break-all" }}>{userEmail}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--foreground)", opacity: 0.7, textAlign: "center" }}>Changes are saved automatically.</p>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: "var(--accent-gold)",
                color: "var(--primary-foreground)",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                transition: "opacity var(--duration-fast)",
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
