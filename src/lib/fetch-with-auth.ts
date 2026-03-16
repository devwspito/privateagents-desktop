/**
 * Authenticated fetch with automatic token refresh.
 *
 * Uses the shared tokenManager for coordinated refresh.
 */

import { tokenManager } from "./token-manager"

export async function fetchWithAuth(
  url: string,
  init?: RequestInit
): Promise<Response> {
  let token = tokenManager.getToken()
  if (!token) token = await tokenManager.refreshToken()

  const makeHeaders = (t: string | null): HeadersInit => ({
    ...init?.headers,
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  })

  const response = await fetch(url, {
    ...init,
    headers: makeHeaders(token),
  })

  if (response.status === 401) {
    const newToken = await tokenManager.refreshToken()
    if (newToken) {
      return fetch(url, {
        ...init,
        headers: makeHeaders(newToken),
      })
    }
  }

  return response
}
