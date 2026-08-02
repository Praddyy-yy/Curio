import { cn } from "@/lib/utils"

/**
 * Skeleton — design system spec:
 * - "Prefer skeleton loaders over spinners"
 * - Uses neutral-200 (muted) for the shimmer base
 * - animate-pulse is the loading pattern
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-sm bg-muted dark:bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
