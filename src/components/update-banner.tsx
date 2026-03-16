"use client"

import { useAutoUpdate } from "@/hooks/use-auto-update"

/**
 * Shows a banner when a new app version has been downloaded and is ready to install.
 * Only renders in Tauri desktop environment.
 */
export function UpdateBanner() {
  const { status, version, restart } = useAutoUpdate()

  if (status !== "ready") return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="text-sm">
        <span className="font-medium">v{version}</span> ready to install
      </div>
      <button
        onClick={restart}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Restart now
      </button>
    </div>
  )
}
