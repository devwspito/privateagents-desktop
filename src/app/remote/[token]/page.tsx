"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, MonitorSmartphone, WifiOff } from "lucide-react"

import { RemoteChat } from "./_components/remote-chat"

import { API_BASE } from "@/lib/api-config"

interface TunnelSession {
  accessToken: string
  userName: string
  agentId: string | null
  agentName: string | null
  desktopConnected: boolean
}

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; session: TunnelSession }

export default function RemoteTunnelPage() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const [pageState, setPageState] = useState<PageState>({ status: "loading" })
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const authenticate = useCallback(
    async (tunnelToken: string): Promise<TunnelSession | null> => {
      try {
        const res = await fetch(`${API_BASE}/desktop/remote-tunnel/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tunnelToken }),
        })

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ detail: "Unknown error" }))
          setPageState({
            status: "error",
            message: err.detail || `HTTP ${res.status}`,
          })
          return null
        }

        const data = await res.json()
        const session: TunnelSession = {
          accessToken: data.access_token,
          userName: data.user_name,
          agentId: data.agent_id,
          agentName: data.agent_name,
          desktopConnected: data.desktop_connected,
        }

        // Store token so useChatStream picks it up
        localStorage.setItem("access_token", session.accessToken)

        return session
      } catch {
        setPageState({
          status: "error",
          message: "No se pudo conectar con el servidor",
        })
        return null
      }
    },
    []
  )

  // Initial auth
  useEffect(() => {
    if (!token) return

    authenticate(token).then((session) => {
      if (session) {
        setPageState({ status: "ready", session })
      }
    })

    // Cleanup
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [token, authenticate])

  // Auto-refresh JWT every 12 minutes (token lasts 15 min)
  useEffect(() => {
    if (!token || pageState.status !== "ready") return

    refreshTimerRef.current = setInterval(
      async () => {
        const session = await authenticate(token)
        if (session) {
          setPageState({ status: "ready", session })
        }
      },
      12 * 60 * 1000
    )

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [token, pageState.status, authenticate])

  if (pageState.status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pageState.status === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Link invalido o expirado</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          {pageState.message}
        </p>
      </div>
    )
  }

  const { session } = pageState

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <MonitorSmartphone className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            {session.agentName || "Agent"}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {session.userName}
          </p>
        </div>
        <DesktopBadge
          connected={session.desktopConnected}
          token={token}
          accessToken={session.accessToken}
          onStatusChange={(connected) =>
            setPageState((prev) =>
              prev.status === "ready"
                ? {
                    ...prev,
                    session: { ...prev.session, desktopConnected: connected },
                  }
                : prev
            )
          }
        />
      </header>

      {/* Chat */}
      <RemoteChat
        agentId={session.agentId}
        desktopConnected={session.desktopConnected}
      />
    </div>
  )
}

/** Desktop status badge with polling */
function DesktopBadge({
  connected,
  token,
  accessToken,
  onStatusChange,
}: {
  connected: boolean
  token: string
  accessToken: string
  onStatusChange: (connected: boolean) => void
}) {
  const [isConnected, setIsConnected] = useState(connected)

  useEffect(() => {
    setIsConnected(connected)
  }, [connected])

  // Poll desktop status every 30s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/desktop/remote-tunnel/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setIsConnected(data.desktop_connected)
          onStatusChange(data.desktop_connected)
        }
      } catch {
        // Ignore polling errors
      }
    }

    const interval = setInterval(poll, 30_000)
    return () => clearInterval(interval)
  }, [accessToken, token, onStatusChange])

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2 w-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {isConnected ? "Desktop" : "Offline"}
      </span>
    </div>
  )
}
