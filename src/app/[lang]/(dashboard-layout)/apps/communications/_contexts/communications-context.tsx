"use client"

import { createContext, useState } from "react"

import type { Agent, Department } from "@/lib/api/client"
import type { ReactNode } from "react"
import type {
  CommunicationsContextType,
  CommunicationsFilterState,
  MonitoringThread,
} from "../types"

const CommunicationsContext = createContext<
  CommunicationsContextType | undefined
>(undefined)

export { CommunicationsContext }

export function CommunicationsProvider({
  threads,
  isLoading,
  error,
  agents,
  departments,
  filters,
  setFilters,
  children,
}: {
  threads: MonitoringThread[]
  isLoading: boolean
  error: string | null
  agents: Agent[]
  departments: Department[]
  filters: CommunicationsFilterState
  setFilters: (filters: Partial<CommunicationsFilterState>) => void
  children: ReactNode
}) {
  const [selectedThread, setSelectedThread] = useState<MonitoringThread | null>(
    null
  )

  return (
    <CommunicationsContext.Provider
      value={{
        threads,
        selectedThread,
        isLoading,
        error,
        filters,
        setFilters,
        selectThread: setSelectedThread,
        agents,
        departments,
      }}
    >
      {children}
    </CommunicationsContext.Provider>
  )
}
