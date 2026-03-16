"use client"

import { useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import { Loader2, Network as _Network } from "lucide-react"

import type { CommunicationsFilterState } from "../types"
import { DEFAULT_FILTERS } from "../types"

import {
  useAgents,
  useDepartments,
  useEnterpriseMessages,
} from "@/lib/api/hooks"

import { CommunicationsProvider } from "../_contexts/communications-context"
import { groupMessagesIntoThreads } from "../_utils/group-threads"

export function CommunicationsApiWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status: sessionStatus } = useSession()
  const enterpriseId = session?.user?.enterprise_id

  const [filters, setFiltersState] =
    useState<CommunicationsFilterState>(DEFAULT_FILTERS)

  const setFilters = (partial: Partial<CommunicationsFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }

  const { data: agentsData, isLoading: loadingAgents } = useAgents({
    enterprise_id: enterpriseId,
    enabled: !!enterpriseId && sessionStatus === "authenticated",
  })

  const { data: departmentsData, isLoading: loadingDepts } =
    useDepartments(enterpriseId)

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {}
    if (filters.messageType !== "all") p["message_type"] = filters.messageType
    if (filters.departmentId !== "all")
      p["department_id"] = filters.departmentId
    if (filters.agentId !== "all") p["agent_id"] = filters.agentId
    if (filters.priority !== "all") p["priority"] = filters.priority
    return Object.keys(p).length > 0 ? p : undefined
  }, [filters])

  const {
    data: messages,
    isLoading: loadingMessages,
    error,
  } = useEnterpriseMessages(enterpriseId || "", apiParams)

  const agents = useMemo(() => agentsData?.items || [], [agentsData])
  const departments = useMemo(
    () => departmentsData?.items || [],
    [departmentsData]
  )

  const isLoading =
    sessionStatus === "loading" ||
    loadingAgents ||
    loadingDepts ||
    loadingMessages

  const threads = useMemo(() => {
    if (!messages || messages.length === 0) return []
    let grouped = groupMessagesIntoThreads(messages)

    // Client-side search filter
    if (filters.search) {
      const q = filters.search.toLowerCase()
      grouped = grouped.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.participants.some((p) => p.agentName.toLowerCase().includes(q)) ||
          t.messages.some(
            (m) =>
              m.body?.toLowerCase().includes(q) ||
              m.subject?.toLowerCase().includes(q)
          )
      )
    }

    return grouped
  }, [messages, filters.search])

  if (isLoading) {
    return (
      <div className="container relative w-full flex items-center justify-center p-4 min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading communications...
          </p>
        </div>
      </div>
    )
  }

  if (!enterpriseId) {
    return (
      <div className="container relative w-full flex items-center justify-center p-4 min-h-[400px]">
        <p className="text-muted-foreground">
          Please sign in to access communications.
        </p>
      </div>
    )
  }

  return (
    <CommunicationsProvider
      threads={threads}
      isLoading={false}
      error={error ? String(error) : null}
      agents={agents}
      departments={departments}
      filters={filters}
      setFilters={setFilters}
    >
      {children}
    </CommunicationsProvider>
  )
}
