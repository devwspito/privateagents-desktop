"use client"

import { useCallback, useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import { Loader2, RefreshCw, Users } from "lucide-react"

import type { Department, User } from "@/lib/api"
import type { UserFiltersValue } from "./user-filters"

import { useDepartments, useUsers } from "@/lib/api"
import { cn, getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserDetailSheet } from "@/components/users/user-detail-sheet"
import { UserFilters } from "./user-filters"

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  user: "bg-gray-100 text-gray-800",
  viewer: "bg-slate-100 text-slate-800",
}

const defaultFilters: UserFiltersValue = {
  search: "",
  department: "all",
  role: "all",
  status: "all",
}

interface UsersTableProps {
  className?: string
}

export function UsersTable({ className }: UsersTableProps) {
  const { data: session } = useSession()
  const [filters, setFilters] = useState<UserFiltersValue>(defaultFilters)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const enterpriseId = session?.user?.enterprise_id

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch,
  } = useUsers({
    enterprise_id: enterpriseId,
  })

  const { data: departmentsData } = useDepartments(enterpriseId)

  const departments = useMemo(() => {
    return departmentsData?.items || []
  }, [departmentsData])

  const departmentMap = useMemo(() => {
    const items = departmentsData?.items || []
    const map = new Map<string, string>()
    items.forEach((dept: Department) => {
      map.set(dept.id, dept.display_name || dept.name)
    })
    return map
  }, [departmentsData])

  const filteredUsers = useMemo(() => {
    const items = usersData?.items || []

    return items.filter((user: User) => {
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      if (filters.department && filters.department !== "all") {
        const userDeptIds =
          user.department_ids && user.department_ids.length > 0
            ? user.department_ids
            : user.department_id
              ? [user.department_id]
              : []
        if (!userDeptIds.includes(filters.department)) return false
      }

      if (filters.role && filters.role !== "all") {
        if (user.role?.toLowerCase() !== filters.role.toLowerCase())
          return false
      }

      return true
    })
  }, [usersData, filters])

  const handleFiltersChange = useCallback((newFilters: UserFiltersValue) => {
    setFilters(newFilters)
  }, [])

  const handleUserUpdate = useCallback(
    (updatedUser: User) => {
      setSelectedUser(updatedUser)
      refetch()
    },
    [refetch]
  )

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <UserFilters
              value={filters}
              onChange={handleFiltersChange}
              departments={departments as Parameters<typeof UserFilters>[0]["departments"]}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="ml-auto"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Users className="mx-auto size-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: User) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    departmentMap={departmentMap}
                    onClick={() => {
                      setSelectedUser(user)
                      setDetailOpen(true)
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} user
                {filteredUsers.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailSheet
        user={selectedUser}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            // Clear user after close animation finishes
            setTimeout(() => setSelectedUser(null), 200)
          }
        }}
        departments={departments}
        onUpdate={handleUserUpdate}
        onDelete={() => {
          setDetailOpen(false)
          setSelectedUser(null)
          refetch()
        }}
      />
    </>
  )
}

interface UserRowProps {
  user: User
  departmentMap: Map<string, string>
  onClick?: () => void
}

function UserRow({ user, departmentMap, onClick }: UserRowProps) {
  const initials = getInitials(user.name || user.email || "U")
  const roleColor =
    roleColors[user.role?.toLowerCase()] || "bg-gray-100 text-gray-800"

  const deptIds =
    user.department_ids && user.department_ids.length > 0
      ? user.department_ids
      : user.department_id
        ? [user.department_id]
        : []

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={undefined} alt={user.name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name || "Unknown"}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        {deptIds.length > 0 ? (
          <span className="text-sm">
            {deptIds.map((id) => departmentMap.get(id) || id).join(", ")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={cn(roleColor, "capitalize")}>
          {user.role || "user"}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
