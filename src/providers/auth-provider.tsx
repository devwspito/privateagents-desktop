"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { tokenManager } from "@/lib/token-manager"
import { API_BASE } from "@/lib/api-config"
import { getQueryClient } from "./query-provider"

export interface AuthUser {
  id: string
  email: string | null
  name: string
  avatar: string | null
  role: string
  enterprise_id: string
  department_id?: string
  department_ids: string[]
  permissions: string[]
  visible_agent_ids: string[]
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  accessToken: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_USER_KEY = "auth_user"

function loadPersistedUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    // Set cookie for middleware route protection (no secrets, just role + permissions)
    document.cookie = `auth_session=${encodeURIComponent(
      JSON.stringify({ role: user.role, permissions: user.permissions })
    )}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
    document.cookie = "auth_session=; path=/; max-age=0"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(loadPersistedUser)
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (typeof window === "undefined") return "loading"
    return tokenManager.getToken() ? "authenticated" : "loading"
  })

  // On mount, validate token by fetching /auth/me
  useEffect(() => {
    const token = tokenManager.getToken()
    if (!token) {
      setStatus("unauthenticated")
      setUser(null)
      persistUser(null)
      return
    }

    // We have a token — validate it
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          const authUser: AuthUser = {
            id: data.id,
            email: data.email,
            name: data.name || data.email?.split("@")[0] || "User",
            avatar: data.avatar_url || null,
            role: data.role,
            enterprise_id: data.enterprise_id,
            department_id: data.department_id || undefined,
            department_ids: data.department_ids || [],
            permissions: data.permissions || [],
            visible_agent_ids: data.visible_agent_ids || [],
          }
          setUser(authUser)
          persistUser(authUser)
          setStatus("authenticated")
        } else {
          // Token invalid — try refresh
          const newToken = await tokenManager.refreshToken()
          if (newToken) {
            // Retry /me with new token
            const retryRes = await fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            })
            if (retryRes.ok) {
              const data = await retryRes.json()
              const authUser: AuthUser = {
                id: data.id,
                email: data.email,
                name: data.name || data.email?.split("@")[0] || "User",
                avatar: data.avatar_url || null,
                role: data.role,
                enterprise_id: data.enterprise_id,
                department_id: data.department_id || undefined,
                department_ids: data.department_ids || [],
                permissions: data.permissions || [],
                visible_agent_ids: data.visible_agent_ids || [],
              }
              setUser(authUser)
              persistUser(authUser)
              setStatus("authenticated")
              return
            }
          }
          // Both failed — clear everything
          tokenManager.clearToken()
          setUser(null)
          persistUser(null)
          setStatus("unauthenticated")
        }
      })
      .catch(() => {
        setStatus("unauthenticated")
        setUser(null)
        persistUser(null)
      })
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.detail ?? "Invalid credentials")
      }

      tokenManager.setToken(payload.access_token)
      if (payload.refresh_token) {
        localStorage.setItem("refresh_token", payload.refresh_token)
      }

      // Fetch user profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${payload.access_token}` },
      })

      if (!meRes.ok) {
        throw new Error("Failed to get user profile")
      }

      const data = await meRes.json()
      const authUser: AuthUser = {
        id: data.id,
        email: data.email,
        name: data.name || data.email?.split("@")[0] || "User",
        avatar: data.avatar_url || null,
        role: data.role,
        enterprise_id: data.enterprise_id,
        department_id: data.department_id || undefined,
        department_ids: data.department_ids || [],
        permissions: data.permissions || [],
        visible_agent_ids: data.visible_agent_ids || [],
      }

      setUser(authUser)
      persistUser(authUser)
      setStatus("authenticated")
    },
    []
  )

  const signOut = useCallback(async () => {
    try {
      const token = tokenManager.getToken()
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } finally {
      tokenManager.clearToken()
      // Clear all cached queries to prevent stale data on re-login
      getQueryClient()?.clear()
      setUser(null)
      persistUser(null)
      setStatus("unauthenticated")
      router.push("/sign-in")
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    const token = tokenManager.getToken()
    if (!token) return

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      const authUser: AuthUser = {
        id: data.id,
        email: data.email,
        name: data.name || data.email?.split("@")[0] || "User",
        avatar: data.avatar_url || null,
        role: data.role,
        enterprise_id: data.enterprise_id,
        department_id: data.department_id || undefined,
        department_ids: data.department_ids || [],
        permissions: data.permissions || [],
        visible_agent_ids: data.visible_agent_ids || [],
      }
      setUser(authUser)
      persistUser(authUser)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      accessToken: tokenManager.getToken(),
      signIn,
      signOut,
      refreshUser,
    }),
    [user, status, signIn, signOut, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/**
 * Drop-in replacement for useSession() from next-auth/react.
 * Returns { data: session, status } with the same shape.
 */
export function useSession() {
  const { user, status, accessToken } = useAuth()

  const data = useMemo(() => {
    if (!user) return null
    return {
      user,
      accessToken,
    }
  }, [user, accessToken])

  return { data, status }
}
