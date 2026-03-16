"use client"

import { useCallback, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "@/providers/auth-provider"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Building2,
  Check,
  Eye,
  Mail,
  MessageSquare,
  Pencil,
  Shield,
  Trash2,
  X,
} from "lucide-react"

import type { Agent, Department, User } from "@/lib/api"
import type { ProfileId } from "@/lib/permissions"

import {
  useAgents,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserPermissions,
} from "@/lib/api"
import {
  ALL_PERMISSION_IDS,
  detectProfile,
  PERMISSION_LABELS,
  PERMISSION_PROFILES,
} from "@/lib/permissions"
import { cn, getInitials } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, ButtonLoading } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DelegationSection } from "./delegation-section"
import { NotificationPrefs } from "./notification-prefs"

const UserEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
})

type UserEditFormType = z.infer<typeof UserEditSchema>

const roleColors: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  viewer: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

interface UserDetailSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  departments?: Department[]
  onUpdate?: (user: User) => void
  onDelete?: () => void
}

/**
 * Dialog wrapper — always mounted so Radix can animate open/close.
 * The heavy hooks (useForm, mutations) live in UserDetailContent,
 * which only mounts when a user is provided.
 */
export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  departments = [],
  onUpdate,
  onDelete,
}: UserDetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        {user ? (
          <UserDetailContent
            user={user}
            onOpenChange={onOpenChange}
            departments={departments}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function UserDetailContent({
  user,
  onOpenChange,
  departments = [],
  onUpdate,
  onDelete,
}: {
  user: User
  onOpenChange: (open: boolean) => void
  departments?: Department[]
  onUpdate?: (user: User) => void
  onDelete?: () => void
}) {
  const { data: session } = useSession()
  const currentUserRole = session?.user?.role
  const isCurrentUserAdmin =
    currentUserRole === "admin" || currentUserRole === "super_admin"

  const [isEditing, setIsEditing] = useState(false)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ProfileId | "custom">(
    "custom"
  )
  const [editVisibleAgentIds, setEditVisibleAgentIds] = useState<string[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    user.department_ids ?? (user.department_id ? [user.department_id] : [])
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: agentsData } = useAgents({ enterprise_id: user.enterprise_id })
  const allAgents: Agent[] = (agentsData?.items || []).filter((a: Agent) => a.enabled)

  const agentsByDept = useMemo(() => {
    const map = new Map<string, { name: string; agents: Agent[] }>()
    for (const agent of allAgents) {
      const deptId = agent.department_id || "__none__"
      if (!map.has(deptId)) {
        const dept = departments.find((d: Department) => d.id === deptId)
        map.set(deptId, {
          name: dept ? (dept.display_name || dept.name) : "General",
          agents: [],
        })
      }
      map.get(deptId)!.agents.push(agent)
    }
    return map
  }, [allAgents, departments])

  const updateUser = useUpdateUser()
  const updatePermissions = useUpdateUserPermissions()
  const deleteUser = useDeleteUser()

  const form = useForm<UserEditFormType>({
    resolver: zodResolver(UserEditSchema),
    values: {
      name: user.name || "",
      email: user.email,
      role: user.role || "user",
    },
  })

  const { isSubmitting, isDirty } = form.formState
  const originalDeptIds = useMemo(
    () => user.department_ids ?? (user.department_id ? [user.department_id] : []),
    [user.department_ids, user.department_id]
  )
  const deptsDirty = useMemo(() => {
    if (selectedDepartmentIds.length !== originalDeptIds.length) return true
    const sorted1 = [...selectedDepartmentIds].sort()
    const sorted2 = [...originalDeptIds].sort()
    return sorted1.some((id, i) => id !== sorted2[i])
  }, [selectedDepartmentIds, originalDeptIds])
  const hasChanges = isDirty || deptsDirty

  const initials = getInitials(user.name || user.email || "U")
  const roleColor =
    roleColors[user.role?.toLowerCase()] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  // All users are admin — permissions are granular via page access
  const isAdminUser = true
  const isSelf = session?.user?.id === user.id

  async function onSubmit(data: UserEditFormType) {
    try {
      const result = await updateUser.mutateAsync({
        id: user.id,
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          department_ids: selectedDepartmentIds,
        },
      })
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      })
      setIsEditing(false)
      onUpdate?.(result)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  function startEditing() {
    setEditPermissions(user.permissions ?? [])
    setSelectedProfile(detectProfile(user.permissions ?? []))
    setEditVisibleAgentIds(user.visible_agent_ids ?? [])
    setSelectedDepartmentIds(
      user.department_ids ?? (user.department_id ? [user.department_id] : [])
    )
    setIsEditing(true)
  }

  function handleCancelEdit() {
    form.reset()
    setSelectedDepartmentIds(
      user.department_ids ?? (user.department_id ? [user.department_id] : [])
    )
    setIsEditing(false)
  }

  const handleDepartmentToggle = useCallback(
    (deptId: string, checked: boolean) => {
      setSelectedDepartmentIds((prev) =>
        checked ? [...prev, deptId] : prev.filter((id) => id !== deptId)
      )
    },
    []
  )

  const handleProfileChange = useCallback((profileId: string) => {
    if (profileId === "custom") {
      setSelectedProfile("custom")
      return
    }
    const profile =
      PERMISSION_PROFILES[profileId as keyof typeof PERMISSION_PROFILES]
    if (profile) {
      setSelectedProfile(profileId as ProfileId)
      setEditPermissions([...profile.permissions])
    }
  }, [])

  const handlePermissionToggle = useCallback(
    (permId: string, checked: boolean) => {
      const next = checked
        ? [...editPermissions, permId]
        : editPermissions.filter((p) => p !== permId)
      setEditPermissions(next)
      setSelectedProfile(detectProfile(next))
    },
    [editPermissions]
  )

  const handleAgentToggle = useCallback(
    (agentId: string, checked: boolean) => {
      setEditVisibleAgentIds((prev) =>
        checked ? [...prev, agentId] : prev.filter((id) => id !== agentId)
      )
    },
    []
  )

  async function handleSaveVisibleAgents() {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { visible_agent_ids: editVisibleAgentIds },
      })
      toast({
        title: "Chat visibility updated",
        description: "Agent chat visibility has been updated successfully.",
      })
      onUpdate?.({ ...user, visible_agent_ids: editVisibleAgentIds })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update chat visibility",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  async function handleSavePermissions() {
    try {
      await updatePermissions.mutateAsync({
        id: user.id,
        permissions: editPermissions,
      })
      toast({
        title: "Permissions updated",
        description: "Page access has been updated successfully.",
      })
      onUpdate?.({ ...user, permissions: editPermissions })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update permissions",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  async function handleDeleteUser() {
    try {
      await deleteUser.mutateAsync(user.id)
      toast({
        title: "User deleted",
        description: `${user.name || user.email} has been removed.`,
      })
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onDelete?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edit user information"
                : "View user information and account details"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={startEditing}>
                <Pencil className="size-4" />
              </Button>
            )}
            {isCurrentUserAdmin && !isSelf && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="space-y-6 pt-2">
          {/* User avatar + name */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={undefined} alt={user.name || user.email} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {user.name || "Unknown User"}
              </h3>
              <Badge
                variant="secondary"
                className={cn(roleColor, "capitalize mt-1")}
              >
                {user.role || "user"}
              </Badge>
            </div>
          </div>

          <Separator />

          {isEditing ? (
            <>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="size-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {departments.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="size-4" />
                        Departments
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map((dept) => (
                          <label
                            key={dept.id}
                            className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedDepartmentIds.includes(dept.id)}
                              onCheckedChange={(checked) =>
                                handleDepartmentToggle(dept.id, !!checked)
                              }
                            />
                            <span>{dept.display_name || dept.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <ButtonLoading
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={!hasChanges}
                      icon={Check}
                    >
                      Save Changes
                    </ButtonLoading>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="size-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Page Access — edit mode */}
              <Separator />
              <div className="space-y-4">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="size-4" />
                  Page Access
                </label>

                <Select
                  value={selectedProfile}
                  onValueChange={handleProfileChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_PROFILES).map(
                      ([id, profile]) => (
                        <SelectItem key={id} value={id}>
                          {profile.name}
                        </SelectItem>
                      )
                    )}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSION_IDS.map((permId) => (
                    <label
                      key={permId}
                      className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={
                          editPermissions.includes("*") ||
                          editPermissions.includes(permId)
                        }
                        onCheckedChange={(checked) =>
                          handlePermissionToggle(permId, !!checked)
                        }
                        disabled={editPermissions.includes("*")}
                      />
                      <span>
                        {PERMISSION_LABELS[permId] ??
                          permId.replace(/-/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>

                <ButtonLoading
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={updatePermissions.isPending}
                  onClick={handleSavePermissions}
                  icon={Check}
                >
                  Save Permissions
                </ButtonLoading>
              </div>

              {/* Chat Visibility — edit mode */}
              <Separator />
              <div className="space-y-4">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  Chat Visibility
                </label>
                <p className="text-xs text-muted-foreground">
                  Select which agents this user can chat with. Leave empty for
                  all agents. Only affects Chat — Office always shows assigned
                  departments.
                </p>

                {agentsByDept.size === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No agents available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Array.from(agentsByDept.entries()).map(
                      ([deptId, { name, agents }]) => (
                        <div key={deptId} className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {name}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {agents.map((agent) => (
                              <label
                                key={agent.id}
                                className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={editVisibleAgentIds.includes(
                                    agent.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleAgentToggle(agent.id, !!checked)
                                  }
                                />
                                <span className="truncate">
                                  {agent.display_name || agent.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <ButtonLoading
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={updateUser.isPending}
                  onClick={handleSaveVisibleAgents}
                  icon={Check}
                >
                  Save Chat Visibility
                </ButtonLoading>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="size-4" />
                    Email
                  </label>
                  <p className="text-sm">{user.email}</p>
                </div>

                {((user.department_ids && user.department_ids.length > 0) || user.department_id) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building2 className="size-4" />
                      Departments
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {(user.department_ids && user.department_ids.length > 0
                        ? user.department_ids
                        : user.department_id
                          ? [user.department_id]
                          : []
                      ).map((deptId) => {
                        const dept = departments.find((d: Department) => d.id === deptId)
                        return (
                          <Badge key={deptId} variant="outline" className="text-xs">
                            {dept ? (dept.display_name || dept.name) : deptId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Page Access — view mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="size-4" />
                    Page Access
                  </label>
                  {user.permissions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.includes("*") ? (
                        <Badge variant="secondary">Full Access</Badge>
                      ) : (
                        user.permissions.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {p.replace(/-/g, " ")}
                          </Badge>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No pages assigned
                    </p>
                  )}
                </div>

                {/* Chat Visibility — view mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    Chat Visibility
                  </label>
                  {user.visible_agent_ids?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {user.visible_agent_ids.map((agentId) => {
                        const agent = allAgents.find((a) => a.id === agentId)
                        return (
                          <Badge
                            key={agentId}
                            variant="outline"
                            className="text-xs"
                          >
                            {agent
                              ? agent.display_name || agent.name
                              : agentId}
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      All agents visible
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <DelegationSection user={user} />

              <Separator />

              <NotificationPrefs user={user} disabled={true} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{user.name || user.email}</strong>? This action cannot be
              undone. All their data, delegations, and assignments will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
