/**
 * Private Agents API Client - Base
 *
 * Core functionality for API communication with JWT authentication.
 * Uses shared tokenManager for coordinated refresh with SSE hooks.
 */

import type { ApiError } from "./types"
import { API_BASE as API_URL } from "@/lib/api-config"
import { tokenManager } from "@/lib/token-manager"

/** Combine multiple AbortSignals — aborts when ANY signal fires. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const s of signals) {
    if (s.aborted) { controller.abort(s.reason); return controller.signal }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true })
  }
  return controller.signal
}

export class BaseApiClient {
  protected baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    tokenManager.setToken(token)
  }

  clearToken() {
    tokenManager.clearToken()
  }

  getToken(): string | null {
    return tokenManager.getToken()
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 30000,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    const token = tokenManager.getToken()
    if (token) {
      ;(headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`
    }

    // Abort after timeout to prevent indefinite hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    const signal = options.signal
      ? anySignal([options.signal, controller.signal])
      : controller.signal

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error: ApiError = {
        detail: "An error occurred",
        status: response.status,
      }
      try {
        const data = await response.json()
        error.detail = data.detail || error.detail
      } catch {
        // Ignore JSON parse errors
      }

      if (response.status === 401) {
        const newToken = await tokenManager.refreshToken()
        if (newToken) {
          const retryHeaders: HeadersInit = {
            ...options.headers,
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          })
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return undefined as T
            return retryResponse.json()
          }
        }
      }

      throw error
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }
}
