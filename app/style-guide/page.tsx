"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

/* ─── Section wrapper ─── */
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-6 border-b border-border pb-12">
      <h2
        className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/* ─── Token swatch ─── */
function Swatch({
  color,
  name,
  hex,
}: {
  color: string
  name: string
  hex: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 w-full rounded-md border border-border"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{hex}</p>
      </div>
    </div>
  )
}

/* ─── Type specimen ─── */
function TypeSpecimen({
  label,
  size,
  weight,
  lineHeight,
  letterSpacing,
  fontFamily,
  sample,
}: {
  label: string
  size: string
  weight: string
  lineHeight: string
  letterSpacing?: string
  fontFamily: string
  sample: string
}) {
  return (
    <div className="flex items-baseline gap-8 border-b border-border/50 py-4">
      <div className="w-32 shrink-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/60">
          {size} / {weight}
        </p>
      </div>
      <p
        style={{
          fontSize: size,
          fontWeight: weight,
          lineHeight,
          letterSpacing,
          fontFamily,
        }}
        className="text-foreground"
      >
        {sample}
      </p>
    </div>
  )
}

export default function StyleGuidePage() {
  const [progress] = React.useState(62)

  /* ─── Color tokens ─── */
  const primaryColors = [
    { name: "Background",       hex: "#F7F4ED", color: "#F7F4ED" },
    { name: "Surface",          hex: "#FBF9F4", color: "#FBF9F4" },
    { name: "Primary Text",     hex: "#1A1815", color: "#1A1815" },
    { name: "Secondary Text",   hex: "#6F685F", color: "#6F685F" },
    { name: "Muted Text",       hex: "#9A9388", color: "#9A9388" },
    { name: "Border",           hex: "#E7E0D5", color: "#E7E0D5" },
    { name: "Border Strong",    hex: "#CEC8BD", color: "#CEC8BD" },
  ]

  const brandColors = [
    { name: "Accent Gold",       hex: "#B88946", color: "#B88946" },
    { name: "Accent Gold Hover", hex: "#D09B52", color: "#D09B52" },
    { name: "Accent Gold Light", hex: "#E5C08A", color: "#E5C08A" },
  ]

  const semanticColors = [
    { name: "Success", hex: "#557A55", color: "#557A55" },
    { name: "Warning", hex: "#C78A3B", color: "#C78A3B" },
    { name: "Error",   hex: "#B94A48", color: "#B94A48" },
    { name: "Info",    hex: "#4A6FAF", color: "#4A6FAF" },
  ]

  const neutralScale = [
    { name: "50",  hex: "#FDFBF8", color: "#FDFBF8" },
    { name: "100", hex: "#F7F4ED", color: "#F7F4ED" },
    { name: "200", hex: "#EEE9E1", color: "#EEE9E1" },
    { name: "300", hex: "#E2DDD2", color: "#E2DDD2" },
    { name: "400", hex: "#CEC8BD", color: "#CEC8BD" },
    { name: "500", hex: "#B8B1A7", color: "#B8B1A7" },
    { name: "600", hex: "#9A9388", color: "#9A9388" },
    { name: "700", hex: "#7A7368", color: "#7A7368" },
    { name: "800", hex: "#5A534A", color: "#5A534A" },
    { name: "900", hex: "#393530", color: "#393530" },
    { name: "950", hex: "#1A1815", color: "#1A1815" },
  ]

  const darkThemeColors = [
    { name: "Background",     hex: "#151210", color: "#151210" },
    { name: "Surface",        hex: "#1D1916", color: "#1D1916" },
    { name: "Surface Elev.",  hex: "#26211D", color: "#26211D" },
    { name: "Primary Text",   hex: "#F4F0E8", color: "#F4F0E8" },
    { name: "Secondary Text", hex: "#B9B1A6", color: "#B9B1A6" },
    { name: "Muted Text",     hex: "#8E867D", color: "#8E867D" },
    { name: "Border",         hex: "#35302A", color: "#35302A" },
    { name: "Border Strong",  hex: "#47413A", color: "#47413A" },
    { name: "Accent Gold",    hex: "#C59A57", color: "#C59A57" },
    { name: "Accent Hover",   hex: "#D8AA63", color: "#D8AA63" },
  ]

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Development Only
        </p>
        <h1
          className="mt-1 text-foreground"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "36px",
            fontWeight: 500,
            lineHeight: "115%",
          }}
        >
          Curio Design System
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Internal style guide. Not a product page.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-8 py-12">

        {/* ── Colors ── */}
        <Section title="Color System — Primary">
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
            {primaryColors.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </Section>

        <Section title="Color System — Brand">
          <div className="grid grid-cols-3 gap-4">
            {brandColors.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </Section>

        <Section title="Color System — Semantic">
          <div className="grid grid-cols-4 gap-4">
            {semanticColors.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </Section>

        <Section title="Color System — Neutral Scale">
          <div className="grid grid-cols-6 gap-4 sm:grid-cols-11">
            {neutralScale.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </Section>

        <Section title="Color System — Dark Theme">
          <div className="rounded-lg bg-[#151210] p-6">
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5">
              {darkThemeColors.map((s) => (
                <div key={s.name} className="flex flex-col gap-2">
                  <div
                    className="h-10 w-full rounded-md border border-[#35302A]"
                    style={{ backgroundColor: s.color }}
                  />
                  <div>
                    <p className="text-xs font-medium text-[#F4F0E8]">
                      {s.name}
                    </p>
                    <p className="font-mono text-xs text-[#8E867D]">{s.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Gradient Palette">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div
                className="h-16 rounded-lg"
                style={{
                  background: "linear-gradient(to right, #3A1F28, #B88946)",
                }}
              />
              <p className="text-xs font-medium text-foreground">
                Editorial Gradient
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                #3A1F28 → #B88946
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="h-16 rounded-lg"
                style={{
                  background: "linear-gradient(to right, #223124, #557A55)",
                }}
              />
              <p className="text-xs font-medium text-foreground">
                Growth Gradient
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                #223124 → #557A55
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="h-16 rounded-lg"
                style={{
                  background: "linear-gradient(to right, #1A1815, #F7F4ED)",
                }}
              />
              <p className="text-xs font-medium text-foreground">
                Neutral Gradient
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                #1A1815 → #F7F4ED
              </p>
            </div>
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section title="Typography — Display Typeface (Instrument Serif)">
          <div style={{ fontFamily: "var(--font-serif)" }}>
            <TypeSpecimen
              label="Display XL"
              size="56px"
              weight="400"
              lineHeight="105%"
              letterSpacing="-0.02em"
              fontFamily="var(--font-serif)"
              sample="Learning changes everything"
            />
            <TypeSpecimen
              label="Display Large"
              size="48px"
              weight="400"
              lineHeight="110%"
              fontFamily="var(--font-serif)"
              sample="Concept titles live here"
            />
          </div>
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Usage rule:</strong>{" "}
              Instrument Serif is only for editorial moments — hero headings,
              concept titles, landing pages, editorial quotes, empty states.
              Never inside forms, buttons, navigation, or paragraphs.
            </p>
          </div>
        </Section>

        <Section title="Typography — UI Typeface (Geist)">
          <div style={{ fontFamily: "var(--font-sans)" }}>
            <TypeSpecimen
              label="Heading 1"
              size="36px"
              weight="500"
              lineHeight="115%"
              fontFamily="var(--font-sans)"
              sample="Section heading one"
            />
            <TypeSpecimen
              label="Heading 2"
              size="30px"
              weight="500"
              lineHeight="120%"
              fontFamily="var(--font-sans)"
              sample="Section heading two"
            />
            <TypeSpecimen
              label="Heading 3"
              size="24px"
              weight="500"
              lineHeight="125%"
              fontFamily="var(--font-sans)"
              sample="Section heading three"
            />
            <TypeSpecimen
              label="Body Large"
              size="18px"
              weight="400"
              lineHeight="170%"
              fontFamily="var(--font-sans)"
              sample="Large body text for introductory paragraphs and key descriptions."
            />
            <TypeSpecimen
              label="Body"
              size="16px"
              weight="400"
              lineHeight="165%"
              fontFamily="var(--font-sans)"
              sample="Regular body text used throughout the interface for content and descriptions."
            />
            <TypeSpecimen
              label="Small"
              size="14px"
              weight="400"
              lineHeight="160%"
              fontFamily="var(--font-sans)"
              sample="Small text for labels, captions, and secondary information."
            />
            <TypeSpecimen
              label="Caption"
              size="12px"
              weight="500"
              lineHeight="1"
              letterSpacing="0.08em"
              fontFamily="var(--font-sans)"
              sample="TODAY'S DISCOVERY · CATEGORY · FEATURED · READY"
            />
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Button — Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </Section>

        <Section title="Button — Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="xs">Extra Small</Button>
          </div>
        </Section>

        <Section title="Button — States">
          <div className="flex flex-wrap gap-3">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Outline Disabled
            </Button>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badge — Variants">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="text-[10px] tracking-[0.08em] uppercase">
              Today&apos;s Discovery
            </Badge>
            <Badge variant="outline" className="text-[10px] tracking-[0.08em] uppercase">
              Category
            </Badge>
            <Badge variant="success" className="text-[10px] tracking-[0.08em] uppercase">
              Ready
            </Badge>
            <Badge variant="secondary" className="text-[10px] tracking-[0.08em] uppercase">
              Featured
            </Badge>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Input">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Default
              </label>
              <Input placeholder="Enter something..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Disabled
              </label>
              <Input placeholder="Disabled input" disabled />
            </div>
          </div>
        </Section>

        <Section title="Textarea">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Default
              </label>
              <Textarea placeholder="Write something..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Disabled
              </label>
              <Textarea placeholder="Disabled textarea" disabled />
            </div>
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description text goes here.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Card content area. Hover to see border emphasis.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>With Footer</CardTitle>
                <CardDescription>Includes a footer section.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Card body content.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </CardFooter>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Small Card</CardTitle>
                <CardDescription>Reduced spacing.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Compact content.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ── Tabs ── */}
        <Section title="Tabs — Default Variant">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Overview tab content.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="concepts">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Concepts tab content.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Notes tab content.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Tabs — Line Variant (Gold Underline)">
          <Tabs defaultValue="today">
            <TabsList variant="line">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <p className="mt-4 text-sm text-muted-foreground">
                Today&apos;s content.
              </p>
            </TabsContent>
            <TabsContent value="week">
              <p className="mt-4 text-sm text-muted-foreground">
                Weekly content.
              </p>
            </TabsContent>
            <TabsContent value="all">
              <p className="mt-4 text-sm text-muted-foreground">
                All time content.
              </p>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── Form controls ── */}
        <Section title="Checkbox">
          <div className="flex flex-col gap-3">
            {[
              { id: "c1", label: "Unchecked" },
              { id: "c2", label: "Checked", defaultChecked: true },
              { id: "c3", label: "Disabled", disabled: true },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  defaultChecked={item.defaultChecked}
                  disabled={item.disabled}
                />
                <label
                  htmlFor={item.id}
                  className="text-sm text-foreground"
                >
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radio Group">
          <RadioGroup defaultValue="option-1">
            {[
              { id: "option-1", label: "First option" },
              { id: "option-2", label: "Second option" },
              { id: "option-3", label: "Third option" },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <RadioGroupItem id={item.id} value={item.id} />
                <label htmlFor={item.id} className="text-sm text-foreground">
                  {item.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        </Section>

        <Section title="Switch">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch id="sw-off" />
              <label htmlFor="sw-off" className="text-sm text-foreground">
                Off (default)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sw-on" defaultChecked />
              <label htmlFor="sw-on" className="text-sm text-foreground">
                On (Accent Gold)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sw-sm" size="sm" defaultChecked />
              <label htmlFor="sw-sm" className="text-sm text-foreground">
                Small size
              </label>
            </div>
          </div>
        </Section>

        {/* ── Progress ── */}
        <Section title="Progress">
          <div className="space-y-4">
            <Progress value={progress}>
            </Progress>
            <Progress value={25} />
            <Progress value={75} />
            <Progress value={100} />
          </div>
        </Section>

        {/* ── Skeleton ── */}
        <Section title="Skeleton">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Separator ── */}
        <Section title="Separator">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-foreground">Above separator</p>
              <Separator />
              <p className="text-sm text-muted-foreground">Below separator</p>
            </div>
            <div className="flex h-8 items-center gap-4">
              <span className="text-sm text-foreground">Left</span>
              <Separator orientation="vertical" />
              <span className="text-sm text-foreground">Middle</span>
              <Separator orientation="vertical" />
              <span className="text-sm text-foreground">Right</span>
            </div>
          </div>
        </Section>

        {/* ── Overlays ── */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Open Dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This dialog uses Extra Large radius (18px), Level 2 shadow,
                  and a fade + scale 0.98→1 animation.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Dialog body content goes here. The background uses the surface
                color (#FBF9F4) and the border uses the design system border
                token.
              </p>
              <DialogFooter showCloseButton>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="Sheet">
          <div className="flex gap-3">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>
                Open Right Sheet
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Title</SheetTitle>
                  <SheetDescription>
                    Fade in with subtle slide. Border-only elevation.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Sheet body content. No heavy shadow — border defines the
                    edge.
                  </p>
                </div>
                <SheetFooter>
                  <Button>Save</Button>
                  <Button variant="outline">Cancel</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Section title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Open Dropdown
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Overview</DropdownMenuItem>
              <DropdownMenuItem>Concepts</DropdownMenuItem>
              <DropdownMenuItem>Notes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Section title="Tooltip">
          <div className="flex gap-4">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                Hover me (top)
              </TooltipTrigger>
              <TooltipContent side="top">
                Fade only. No zoom, no slide.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                Hover me (bottom)
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Level 1 shadow. 120ms fast.
              </TooltipContent>
            </Tooltip>
          </div>
        </Section>

        {/* ── Reference ── */}
        <Section title="Border Radius Reference">
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
            {[
              { label: "Small", value: "6px", className: "rounded-sm" },
              { label: "Medium", value: "10px", className: "rounded-md" },
              { label: "Large", value: "14px", className: "rounded-lg" },
              { label: "Extra Large", value: "18px", className: "rounded-xl" },
              { label: "Full", value: "9999px", className: "rounded-full" },
            ].map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <div
                  className={`h-12 w-12 border border-border-strong bg-secondary ${r.className}`}
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    {r.label}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {r.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Usage:</strong> Badges/Chips → 6px · Buttons/Inputs/Dropdowns → 10px · Cards/Panels → 14px · Dialogs/Modals → 18px · Avatars/Pills → 9999px
            </p>
          </div>
        </Section>

        <Section title="Shadow Reference">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3 text-center">
              <div className="h-20 w-full rounded-lg border border-border bg-card" />
              <p className="text-xs font-medium text-foreground">Level 0</p>
              <p className="text-xs text-muted-foreground">No shadow. Most components.</p>
            </div>
            <div className="space-y-3 text-center">
              <div className="h-20 w-full rounded-lg bg-card shadow-sm" />
              <p className="text-xs font-medium text-foreground">Level 1</p>
              <p className="text-xs text-muted-foreground">
                Dropdowns, tooltips, popovers.
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                0 2px 10px rgba(26,24,21,0.06)
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="h-20 w-full rounded-lg bg-card shadow-md" />
              <p className="text-xs font-medium text-foreground">Level 2</p>
              <p className="text-xs text-muted-foreground">Dialogs, modals.</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                0 8px 30px rgba(26,24,21,0.08)
              </p>
            </div>
          </div>
        </Section>

        <Section title="Spacing Scale (4px base unit)">
          <div className="flex flex-wrap items-end gap-2">
            {[4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96].map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <div
                  className="bg-primary/30 border border-primary/50 rounded-sm"
                  style={{ width: `${Math.min(size, 64)}px`, height: `${Math.min(size, 64)}px` }}
                />
                <p className="font-mono text-[10px] text-muted-foreground">{size}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion Reference">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Fast</p>
                <p className="text-2xl font-medium text-foreground">120ms</p>
                <p className="text-xs text-muted-foreground">Tooltip, checkbox, interactive focus</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Default</p>
                <p className="text-2xl font-medium text-foreground">180ms</p>
                <p className="text-xs text-muted-foreground">Buttons, inputs, cards, dropdowns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Complex</p>
                <p className="text-2xl font-medium text-foreground">250ms</p>
                <p className="text-xs text-muted-foreground">Progress, page transitions, layouts</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Easing:</strong>{" "}
              <code className="font-mono text-[11px]">ease-out</code> or{" "}
              <code className="font-mono text-[11px]">cubic-bezier(0.22, 1, 0.36, 1)</code>.
              Never exceed 300ms. Respect{" "}
              <code className="font-mono text-[11px]">prefers-reduced-motion</code>.
            </p>
          </div>
        </Section>

      </div>
    </div>
  )
}
