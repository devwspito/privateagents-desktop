"use client"

import { useEffect, useState } from "react"

/**
 * Detects whether the app is running inside a Tauri desktop container.
 * Returns `null` during SSR, `true` in Tauri, `false` in browser.
 */
export function useIsTauri() {
  const [isTauri, setIsTauri] = useState<boolean | null>(null)

  useEffect(() => {
    setIsTauri(
      typeof window !== "undefined" &&
        (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__)
    )
  }, [])

  return isTauri
}
