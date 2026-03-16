"use client"

import { useState } from "react"
import { Building2, Check, ChevronsUpDown, Crown, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  display_name: string | null
  department_id: string | null
  enabled: boolean
}

interface Department {
  id: string
  name: string
  display_name: string | null
  orchestrator_enabled?: boolean
  orchestrator_agent_id?: string | null
}

interface OfficeToolbarProps {
  agents: Agent[]
  departments: Department[]
  selectedDepartments: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  directorAgentId?: string | null
  onNewTask?: () => void
}

export function OfficeToolbar({
  agents,
  departments,
  selectedDepartments,
  onSelectionChange,
  searchQuery,
  onSearchChange,
  directorAgentId,
  onNewTask,
}: OfficeToolbarProps) {
  const [open, setOpen] = useState(false)
  const enabledAgents = agents.filter((a) => a.enabled)

  // Count agents per department
  const countByDept = new Map<string, number>()
  for (const a of enabledAgents) {
    if (a.department_id) {
      countByDept.set(
        a.department_id,
        (countByDept.get(a.department_id) || 0) + 1
      )
    }
  }

  // Trigger label
  const triggerLabel = (() => {
    if (selectedDepartments.size === 0) {
      return `Todos (${enabledAgents.length})`
    }
    if (selectedDepartments.size === 1) {
      const deptId = [...selectedDepartments][0]
      const dept = departments.find((d) => d.id === deptId)
      const name = dept?.display_name || dept?.name || deptId
      const count = countByDept.get(deptId) || 0
      return `${name} (${count})`
    }
    return `${selectedDepartments.size} departamentos`
  })()

  function handleSelect(deptId: string | null) {
    if (deptId === null) {
      // "Todos"
      onSelectionChange(new Set())
      setOpen(false)
      return
    }

    // Single select — toggle or switch
    if (selectedDepartments.size === 1 && selectedDepartments.has(deptId)) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set([deptId]))
    }
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 bg-background">
      <div className="flex items-center gap-2 shrink-0">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Office</span>
      </div>

      {/* Department selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs font-normal"
          >
            {triggerLabel}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar departamento..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>No encontrado</CommandEmpty>
              <CommandGroup>
                {/* "Todos" option */}
                <CommandItem
                  onSelect={() => handleSelect(null)}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      selectedDepartments.size === 0 ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Todos
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {enabledAgents.length}
                  </span>
                </CommandItem>

                {/* Department items */}
                {departments.map((dept) => {
                  const count = countByDept.get(dept.id) || 0
                  const isSelected = selectedDepartments.has(dept.id)
                  const hasOrchestrator = dept.orchestrator_enabled && dept.orchestrator_agent_id
                  return (
                    <CommandItem
                      key={dept.id}
                      value={dept.display_name || dept.name}
                      onSelect={() => handleSelect(dept.id)}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {hasOrchestrator && (
                        <Crown className="h-3 w-3 mr-1 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{dept.display_name || dept.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* New Task — opens QuickChatDialog with Director General */}
      {directorAgentId && onNewTask && (
        <Button
          variant="default"
          size="sm"
          className="h-7 gap-1 text-xs bg-amber-600 hover:bg-amber-700"
          onClick={onNewTask}
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Tarea
        </Button>
      )}

      {/* Search */}
      <div className="relative shrink-0 ml-auto">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar agente..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 w-40 pl-7 text-xs"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
          Online
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Busy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
          Off
        </span>
      </div>
    </div>
  )
}
