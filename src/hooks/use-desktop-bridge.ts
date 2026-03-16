"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "@/providers/auth-provider"

import { getDesktopBridge } from "@/lib/desktop-bridge"
import { isTauriEnv } from "@/lib/tauri"
import { tokenManager } from "@/lib/token-manager"
import { useToast } from "@/hooks/use-toast"

type ConnectionState = "disconnected" | "connecting" | "connected"

import { API_BASE as API_URL } from "@/lib/api-config"

// Proactive refresh interval: 25 min (JWT expires at 30 min)
const TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000

/**
 * Manages the Desktop Bridge WebSocket connection.
 * Only activates when running inside a Tauri desktop environment.
 * Automatically connects when authenticated and disconnects on logout.
 * Also handles push notifications from the backend (approvals, workflows).
 */
export function useDesktopBridge() {
  const { data: session, status } = useSession()
  const [state, setState] = useState<ConnectionState>("disconnected")
  const { toast } = useToast()
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isTauri = typeof window !== "undefined" && isTauriEnv()

  // Refresh token and feed it to the bridge
  const doTokenRefresh = useCallback(async () => {
    try {
      console.log("[useDesktopBridge] Refreshing token...")
      const newToken = await tokenManager.refreshToken()
      if (newToken) {
        console.log("[useDesktopBridge] Token refreshed successfully")
        const bridge = getDesktopBridge()
        bridge.updateToken(newToken)
      } else {
        console.warn("[useDesktopBridge] Token refresh returned null")
      }
    } catch (e) {
      console.warn("[useDesktopBridge] Token refresh failed:", e)
    }
  }, [])

  useEffect(() => {
    if (!isTauri) return
    if (status !== "authenticated" || !session?.accessToken) return

    const bridge = getDesktopBridge()

    bridge.connect(API_URL, session.accessToken, setState)

    return () => {
      bridge.disconnect()
    }
  }, [isTauri, status, session?.accessToken])

  // Keep token in sync when it refreshes
  useEffect(() => {
    if (!isTauri || !session?.accessToken) return
    const bridge = getDesktopBridge()
    bridge.updateToken(session.accessToken)
  }, [isTauri, session?.accessToken])

  // Listen for auth failure from bridge → trigger token refresh
  useEffect(() => {
    if (!isTauri) return

    const handler = () => {
      console.log("[useDesktopBridge] Auth failed, refreshing token")
      doTokenRefresh()
    }
    window.addEventListener("desktop-bridge-auth-failed", handler)
    return () => window.removeEventListener("desktop-bridge-auth-failed", handler)
  }, [isTauri, doTokenRefresh])

  // Proactive token refresh every 25 min to prevent JWT expiry
  useEffect(() => {
    if (!isTauri || status !== "authenticated") return

    refreshTimerRef.current = setInterval(doTokenRefresh, TOKEN_REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [isTauri, status, doTokenRefresh])

  // Listen for desktop-notification custom events and show toasts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        title: string
        body: string
        action_url?: string
      }
      if (!document.hidden) {
        toast({
          title: detail.title,
          description: detail.body,
        })
      }
    }
    window.addEventListener("desktop-notification", handler)
    return () => window.removeEventListener("desktop-notification", handler)
  }, [toast])

  return {
    isConnected: state === "connected",
    state,
    isTauri,
  }
}
