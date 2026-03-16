"use client"

import { useEffect, useRef, useState } from "react"

import { isTauriEnv } from "@/lib/tauri"

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"

/**
 * Checks for app updates on startup (Tauri only).
 * Downloads and installs updates automatically, prompting the user to restart.
 */
export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle")
  const [version, setVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const checked = useRef(false)

  useEffect(() => {
    if (!isTauriEnv() || checked.current) return
    checked.current = true

    const checkForUpdates = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater")

        setStatus("checking")
        const update = await check()

        if (!update) {
          setStatus("idle")
          return
        }

        setStatus("available")
        setVersion(update.version)

        // Download and install
        setStatus("downloading")
        await update.downloadAndInstall()
        setStatus("ready")
      } catch (e) {
        console.warn("[AutoUpdate] Check failed:", e)
        setError(String(e))
        setStatus("error")
      }
    }

    // Delay check by 5 seconds to not block app startup
    const timer = setTimeout(checkForUpdates, 5000)
    return () => clearTimeout(timer)
  }, [])

  const restart = async () => {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    } catch {
      // Fallback: just reload the window
      window.location.reload()
    }
  }

  return { status, version, error, restart }
}
