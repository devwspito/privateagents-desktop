/**
 * Centralized token management — single source of truth.
 *
 * Refreshes directly against the backend /auth/refresh endpoint.
 * No NextAuth dependency.
 */

import { API_BASE } from "./api-config"

let cachedToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

/** Decode JWT payload without crypto — just reads the exp claim. */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    // Expire 30s early to avoid edge-case race with backend
    return payload.exp * 1000 < Date.now() + 30_000
  } catch {
    return true
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null
  if (!cachedToken) {
    cachedToken = localStorage.getItem("access_token")
  }
  // Auto-invalidate expired tokens
  if (cachedToken && isTokenExpired(cachedToken)) {
    cachedToken = null
    return null
  }
  return cachedToken
}

function writeToken(token: string): void {
  cachedToken = token
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token)
  }
}

function clearToken(): void {
  cachedToken = null
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_user")
  }
}

/** Clear in-memory cache only — forces re-read from localStorage on next getToken(). */
function clearCachedToken(): void {
  cachedToken = null
}

/**
 * Refresh the access token directly via the backend.
 * Deduplicates concurrent calls.
 */
function refreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (refreshPromise) return refreshPromise

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function doRefresh(): Promise<string | null> {
  const rt = localStorage.getItem("refresh_token")
  if (!rt) return null

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    })

    if (!res.ok) {
      // Refresh token is dead — clear everything
      clearToken()
      return null
    }

    const data = await res.json()
    writeToken(data.access_token)
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token)
    }
    return data.access_token
  } catch {
    return null
  }
}

export const tokenManager = {
  getToken: readToken,
  setToken: writeToken,
  clearToken,
  clearCachedToken,
  refreshToken,
} as const
