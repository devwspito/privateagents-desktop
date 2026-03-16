/**
 * Hook that connects to the unified SSE endpoint and feeds events into
 * the Zustand event store. Mounted once at the dashboard layout level.
 *
 * Auto-reconnects on failure with exponential backoff.
 * After MAX_RETRIES consecutive failures, sets sseError in the store
 * so the UI can show a non-blocking error banner.
 */
"use client"

import { useEffect, useRef } from "react"
import { useEventStore } from "@/lib/stores/event-store"
import type { UnifiedSSEEvent } from "@/lib/stores/event-store"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { tokenManager } from "@/lib/token-manager"
import { API_BASE } from "@/lib/api-config"
import { readSSEStream } from "@/lib/sse-reader"

const MAX_RETRIES = 5

export function useUnifiedEvents() {
  const processEvent = useEventStore((s) => s.processEvent)
  const setSseError = useEventStore((s) => s.setSseError)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let mounted = true
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let consecutiveFailures = 0

    async function connect() {
      if (!mounted) return

      // Force re-read from localStorage (another request may have refreshed the token)
      tokenManager.clearCachedToken()

      if (!tokenManager.getToken()) {
        // No valid token — try refresh before giving up
        const refreshed = await tokenManager.refreshToken()
        if (!refreshed) {
          retryTimeout = setTimeout(connect, 3000)
          return
        }
      }

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetchWithAuth(`${API_BASE}/events/stream`, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          // If 401, try refreshing token for next attempt
          if (response.status === 401) {
            await tokenManager.refreshToken()
          }
          throw new Error(`SSE failed: ${response.status}`)
        }

        // Connected successfully — clear error and reset counter
        consecutiveFailures = 0
        setSseError(null)

        await readSSEStream(response, (data) => {
          const event = data as UnifiedSSEEvent
          if (event.type !== "ping" && event.type !== "connected") {
            processEvent(event)
          }
        })

        // Stream ended normally — reconnect
        if (mounted) {
          retryTimeout = setTimeout(connect, 3000)
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        consecutiveFailures++
        console.warn(`[sse] error (attempt ${consecutiveFailures}/${MAX_RETRIES}):`, (err as Error).message)

        if (consecutiveFailures >= MAX_RETRIES) {
          setSseError(
            `Real-time connection failed after ${MAX_RETRIES} attempts. ` +
            `Some features may not update automatically.`
          )
          // Keep trying in the background with longer intervals
          if (mounted) {
            retryTimeout = setTimeout(connect, 15000)
          }
        } else {
          const delay = Math.min(3000 * Math.pow(2, consecutiveFailures - 1), 30000)
          if (mounted) {
            retryTimeout = setTimeout(connect, delay)
          }
        }
      }
    }

    connect()

    return () => {
      mounted = false
      abortRef.current?.abort()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [processEvent, setSseError])
}
