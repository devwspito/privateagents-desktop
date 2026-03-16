"use client"

import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { useState } from "react"

import { useEventStore } from "@/lib/stores/event-store"

export function SseErrorBanner({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false)
  const setSseError = useEventStore((s) => s.setSseError)

  if (dismissed) return null

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="flex-1 text-destructive">{message}</span>
      <button
        onClick={() => {
          setSseError(null)
          window.location.reload()
        }}
        className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-destructive/60 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
