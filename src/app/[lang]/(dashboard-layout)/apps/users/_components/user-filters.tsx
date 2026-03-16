"use client"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface UserFiltersValue {
  search: string
  department: string
  role: string
  status: string
}

interface UserFiltersProps {
  value: UserFiltersValue
  onChange: (value: UserFiltersValue) => void
  departments?: { id: string; name: string; display_name?: string }[]
  roles?: string[]
  statuses?: string[]
  className?: string
}

const defaultRoles = ["admin", "manager", "user", "viewer"]

const defaultStatuses = ["active", "inactive", "pending"]

export function UserFilters({
  value,
  onChange,
  departments = [],
  roles = defaultRoles,
  statuses = defaultStatuses,
  className,
}: UserFiltersProps) {
  const handleChange = (key: keyof UserFiltersValue, newValue: string) => {
    onChange({ ...value, [key]: newValue })
  }

  const handleClear = () => {
    onChange({
      search: "",
      department: "all",
      role: "all",
      status: "all",
    })
  }

  const hasFilters =
    value.search ||
    (value.department && value.department !== "all") ||
    (value.role && value.role !== "all") ||
    (value.status && value.status !== "all")

  return (
    <div className={className} data-slot="user-filters">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={value.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={value.department || "all"}
          onValueChange={(v) => handleChange("department", v)}
        >
          <SelectTrigger className="w-[180px]">
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
          value={value.role || "all"}
          onValueChange={(v) => handleChange("role", v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                <span className="capitalize">{role}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status || "all"}
          onValueChange={(v) => handleChange("status", v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                <span className="capitalize">{status}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
