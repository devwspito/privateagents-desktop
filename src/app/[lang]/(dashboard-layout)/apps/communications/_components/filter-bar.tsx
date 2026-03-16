"use client"

import { Search, X } from "lucide-react"

import { DEFAULT_FILTERS } from "../types"

import { cn } from "@/lib/utils"

import { useCommunicationsContext } from "../_hooks/use-communications-context"
import { Badge as _Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MESSAGE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "request", label: "Request", color: "bg-blue-500" },
  { value: "response", label: "Response", color: "bg-green-500" },
  { value: "notification", label: "Notification", color: "bg-yellow-500" },
  { value: "handoff", label: "Handoff", color: "bg-purple-500" },
  { value: "escalation", label: "Escalation", color: "bg-red-500" },
]

const PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
]

export function FilterBar() {
  const { filters, setFilters, departments, agents } =
    useCommunicationsContext()

  const hasActiveFilters =
    filters.search !== "" ||
    filters.departmentId !== "all" ||
    filters.messageType !== "all" ||
    filters.agentId !== "all" ||
    filters.priority !== "all"

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search threads..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-9 h-9"
        />
      </div>

      <Select
        value={filters.departmentId}
        onValueChange={(v) => setFilters({ departmentId: v })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.display_name || dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.messageType}
        onValueChange={(v) =>
          setFilters({ messageType: v as typeof filters.messageType })
        }
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {MESSAGE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <span className="flex items-center gap-2">
                {type.color && (
                  <span className={cn("size-2 rounded-full", type.color)} />
                )}
                {type.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.agentId}
        onValueChange={(v) => setFilters({ agentId: v })}
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Agents</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.display_name || agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) =>
          setFilters({ priority: v as typeof filters.priority })
        }
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => setFilters(DEFAULT_FILTERS)}
        >
          <X className="mr-1 size-3" />
          Clear
        </Button>
      )}

    </div>
  )
}
