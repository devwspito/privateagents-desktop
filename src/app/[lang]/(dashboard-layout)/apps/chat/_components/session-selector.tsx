"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, Clock, MessageSquare, Users } from "lucide-react"

import { useAgentSessions } from "@/lib/api/hooks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SessionSelectorProps {
  agentId: string
  currentSessionKey: string
  onSelectSession: (sessionKey: string) => void
}

function formatSessionDate(dateStr: string | null): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return format(d, "HH:mm")
    return format(d, "d MMM, HH:mm", { locale: es })
  } catch {
    return ""
  }
}

export function SessionSelector({
  agentId,
  currentSessionKey,
  onSelectSession,
}: SessionSelectorProps) {
  const { data: sessions } = useAgentSessions(agentId, currentSessionKey)

  const sortedSessions = useMemo(() => {
    if (!sessions) return []
    return [...sessions].sort(
      (a, b) =>
        new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime()
    )
  }, [sessions])

  // Don't show selector if there's only one or no sessions
  if (!sortedSessions || sortedSessions.length <= 1) return null

  const privateSessions = sortedSessions.filter((s) => s.channel !== "a2a")
  const a2aSessions = sortedSessions.filter((s) => s.channel === "a2a")

  const currentSession = sortedSessions.find(
    (s) => s.session_key === currentSessionKey
  )
  const currentLabel = currentSession?.label || "Sesión actual"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Clock className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{currentLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] max-h-[400px] overflow-y-auto">
        {privateSessions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs">
              Conversaciones
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {privateSessions.map((session) => (
              <SessionItem
                key={session.session_key}
                session={session}
                isActive={session.session_key === currentSessionKey}
                onSelect={onSelectSession}
              />
            ))}
          </>
        )}
        {a2aSessions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              Delegaciones (A2A)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {a2aSessions.map((session) => (
              <SessionItem
                key={session.session_key}
                session={session}
                isActive={session.session_key === currentSessionKey}
                onSelect={onSelectSession}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SessionItem({
  session,
  isActive,
  onSelect,
}: {
  session: { session_key: string; label: string | null; last_activity: string | null; last_message: string | null; channel?: string }
  isActive: boolean
  onSelect: (sk: string) => void
}) {
  const dateStr = formatSessionDate(session.last_activity)
  const label = session.label || dateStr || "Sin título"
  const isA2A = session.channel === "a2a"

  return (
    <DropdownMenuItem
      className={cn(
        "flex flex-col items-start gap-0.5 py-2",
        isActive && "bg-accent"
      )}
      onClick={() => {
        if (!isActive) onSelect(session.session_key)
      }}
    >
      <div className="flex w-full items-center gap-2">
        {isA2A ? (
          <Users className="h-3 w-3 shrink-0 text-blue-400" />
        ) : (
          <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-sm font-medium">
          {label}
        </span>
        {dateStr && label !== dateStr && (
          <span className="text-[10px] text-muted-foreground">
            {dateStr}
          </span>
        )}
      </div>
      {session.last_message && (
        <span className="ml-5 truncate text-xs text-muted-foreground max-w-full">
          {session.last_message}
        </span>
      )}
    </DropdownMenuItem>
  )
}
