"use client"

import { useState, useCallback } from "react"
import { useSession } from "@/providers/auth-provider"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useAgents, useDepartments, useEnterprise } from "@/lib/api/hooks"
import { OfficeCanvas } from "./_components/office-canvas"
import { OfficeToolbar } from "./_components/office-toolbar"
import { QuickChatDialog } from "./_components/quick-chat-dialog"

const LS_DEPTS_KEY = "office:selectedDepartments"

function loadPersistedDepts(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DEPTS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch { return new Set() }
}

export default function OfficePage() {
  const { data: session } = useSession()
  const params = useParams()
  const enterpriseId = session?.user?.enterprise_id
  const lang = ((params as Record<string, string>)?.["lang"]) || "es"
  const isAdmin = session?.user?.role === "admin"

  const { data: agentsData, isLoading: loadingAgents } = useAgents({
    enterprise_id: enterpriseId,
  })
  const { data: deptsData, isLoading: loadingDepts } =
    useDepartments(enterpriseId)
  const { data: enterpriseData } = useEnterprise(enterpriseId || "")

  const [selectedDepartments, setSelectedDepartmentsRaw] = useState<Set<string>>(
    loadPersistedDepts
  )
  const setSelectedDepartments = useCallback((deps: Set<string>) => {
    setSelectedDepartmentsRaw(deps)
    try {
      localStorage.setItem(LS_DEPTS_KEY, JSON.stringify([...deps]))
    } catch { /* SSR or quota */ }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")

  // QuickChatDialog state for "Nueva Tarea" (Director General)
  const [taskChatOpen, setTaskChatOpen] = useState(false)

  const allAgents = agentsData?.items || []
  const allDepartments = deptsData?.items || []

  // Filter by user's assigned departments
  // Admin with no department_ids = sees all; otherwise filter by assigned ids
  const userDeptIds = session?.user?.department_ids || []
  const seesAll = isAdmin && userDeptIds.length === 0
  const departments = seesAll
    ? allDepartments
    : allDepartments.filter((d) => userDeptIds.includes(d.id))
  const deptIdSet = new Set(departments.map((d) => d.id))
  const agents = seesAll
    ? allAgents
    : allAgents.filter((a) => !a.department_id || deptIdSet.has(a.department_id))

  const directorAgentId = enterpriseData?.director_agent_id
  const directorAgent = agents.find((a) => a.id === directorAgentId)
  const directorName = directorAgent?.display_name || directorAgent?.name || "Director General"

  const handleNewTask = useCallback(() => {
    if (directorAgentId) {
      setTaskChatOpen(true)
    }
  }, [directorAgentId])

  if (loadingAgents || loadingDepts) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading office...</p>
        </div>
      </div>
    )
  }

  const enabledAgents = agents.filter((a) => a.enabled)

  return (
    <div className="flex flex-col h-full">
      <OfficeToolbar
        agents={enabledAgents}
        departments={departments}
        selectedDepartments={selectedDepartments}
        onSelectionChange={setSelectedDepartments}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        directorAgentId={directorAgentId}
        onNewTask={handleNewTask}
      />
      <div className="flex-1 min-h-0">
        <OfficeCanvas
          agents={enabledAgents as Parameters<typeof OfficeCanvas>[0]["agents"]}
          departments={
            departments as Parameters<typeof OfficeCanvas>[0]["departments"]
          }
          isAdmin={isAdmin}
          lang={lang}
          selectedDepartments={selectedDepartments}
          searchQuery={searchQuery}
          directorAgentId={directorAgentId}
        />
      </div>

      {/* QuickChatDialog for "Nueva Tarea" — opens Director General chat */}
      {directorAgentId && (
        <QuickChatDialog
          open={taskChatOpen}
          onOpenChange={setTaskChatOpen}
          agentId={directorAgentId}
          agentName={directorName}
          lang={lang}
        />
      )}
    </div>
  )
}
