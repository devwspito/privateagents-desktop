"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Crown,
  Info,
  Pencil,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react"

import type { Department, DepartmentMember } from "@/lib/api"

import { api } from "@/lib/api"
import { cn, getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentAutonomyConfig } from "./department-autonomy-config"
import { DepartmentToolsTab } from "./department-tools-tab"

const roleColors: Record<string, string> = {
  management:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  sales: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  support: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  operations:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  finance:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  hr: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  legal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  it: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
}

interface DepartmentDetailSheetProps {
  department: Department | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (department: Department) => void
}

export function DepartmentDetailSheet({
  department,
  open,
  onOpenChange,
  onEdit,
}: DepartmentDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("details")

  const { data: members } = useQuery({
    queryKey: ["departments", department?.id, "members"],
    queryFn: () => api.getDepartmentMembers(department!.id),
    enabled: !!department?.id && open,
  })

  if (!department) return null

  const roleColor =
    roleColors[department.role?.toLowerCase() ?? ""] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"

  const initials = getInitials(
    department.display_name || department.name || "D"
  )

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setActiveTab("details")
    }
    onOpenChange(newOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="size-5" />
              </div>
              <div>
                <SheetTitle>
                  {department.display_name || department.name}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {department.id}
                </SheetDescription>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(department)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col mt-4 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
              <Info className="mr-2 size-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="autonomy">
              <ShieldCheck className="mr-2 size-4" />
              Autonomy
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Wrench className="mr-2 size-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-lg bg-muted text-xl font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {department.display_name || department.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {department.role && (
                        <Badge
                          variant="secondary"
                          className={cn(roleColor, "capitalize")}
                        >
                          {department.role}
                        </Badge>
                      )}
                      <Badge
                        variant={department.enabled ? "default" : "secondary"}
                      >
                        {department.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {department.can_approve && (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-600"
                        >
                          <ShieldCheck className="mr-1 size-3" />
                          Approver
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Name (slug)
                    </label>
                    <p className="text-sm font-mono">{department.name}</p>
                  </div>

                  {department.display_name && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Display Name
                      </label>
                      <p className="text-sm">{department.display_name}</p>
                    </div>
                  )}

                  {department.role && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Role
                      </label>
                      <p className="text-sm capitalize">{department.role}</p>
                    </div>
                  )}

                  {department.description && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-sm">{department.description}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <p className="text-sm">
                      {department.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Approval Authority
                    </label>
                    <p className="text-sm">
                      {department.can_approve
                        ? "Can approve agent requests"
                        : "Cannot approve agent requests"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="size-4" />
                      Members ({members?.length || 0})
                    </label>
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(department)}
                      >
                        <Pencil className="mr-2 size-3" />
                        Manage
                      </Button>
                    )}
                  </div>

                  {!members || members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No members assigned.{" "}
                      {onEdit && (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => onEdit(department)}
                        >
                          Add members
                        </button>
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member: DepartmentMember) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-md border px-3 py-2"
                        >
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name || member.email || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.name || member.email}
                            </p>
                            {member.name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {member.is_head && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300"
                              >
                                <Crown className="mr-1 size-3" />
                                Head
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="autonomy" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full pr-4">
              <DepartmentAutonomyConfig department={department} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full pr-4">
              <DepartmentToolsTab department={department} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
