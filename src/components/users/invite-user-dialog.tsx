"use client"

import { useCallback, useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import { Check, Copy, Eye, Link, Loader2, MessageSquare, UserPlus } from "lucide-react"

import type { Agent, Department } from "@/lib/api"
import type { ProfileId } from "@/lib/permissions"

import { useAgents, useCreateInvitation, useDepartments } from "@/lib/api/hooks"
import {
  ALL_PERMISSION_IDS,
  PERMISSION_LABELS,
  PERMISSION_PROFILES,
  detectProfile,
} from "@/lib/permissions"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

/** Default permissions for new users. */
const DEFAULT_PERMISSIONS = [
  ...PERMISSION_PROFILES.default.permissions,
]

export function InviteUserDialog() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id || ""
  const [open, setOpen] = useState(false)

  // Form state
  const [email, setEmail] = useState("")
  const [role] = useState("admin")
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    []
  )
  const [selectedProfile, setSelectedProfile] = useState<ProfileId | "custom">(
    "default"
  )
  const [permissions, setPermissions] = useState<string[]>([
    ...DEFAULT_PERMISSIONS,
  ])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Success state (shows link after creation)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: departmentsData } = useDepartments(enterpriseId)
  const departments = departmentsData?.items || []

  const { data: agentsData } = useAgents({ enterprise_id: enterpriseId })
  const allAgents: Agent[] = agentsData?.items || []

  const createInvitation = useCreateInvitation()

  const resetForm = useCallback(() => {
    setEmail("")
    setSelectedDepartmentIds([])
    setSelectedAgentIds([])
    setSelectedProfile("default")
    setPermissions([...DEFAULT_PERMISSIONS])
    setGeneratedLink(null)
    setCopied(false)
  }, [])

  const handleProfileChange = useCallback((profileId: string) => {
    if (profileId === "custom") {
      setSelectedProfile("custom")
      return
    }
    const profile =
      PERMISSION_PROFILES[profileId as keyof typeof PERMISSION_PROFILES]
    if (profile) {
      setSelectedProfile(profileId as ProfileId)
      setPermissions([...profile.permissions])
    }
  }, [])

  const handlePermissionToggle = useCallback(
    (permId: string, checked: boolean) => {
      const next = checked
        ? [...permissions, permId]
        : permissions.filter((p) => p !== permId)
      setPermissions(next)
      setSelectedProfile(detectProfile(next))
    },
    [permissions]
  )

  const handleDepartmentToggle = useCallback(
    (deptId: string, checked: boolean) => {
      setSelectedDepartmentIds((prev) =>
        checked ? [...prev, deptId] : prev.filter((id) => id !== deptId)
      )
    },
    []
  )

  const handleAgentToggle = useCallback(
    (agentId: string, checked: boolean) => {
      setSelectedAgentIds((prev) =>
        checked ? [...prev, agentId] : prev.filter((id) => id !== agentId)
      )
    },
    []
  )

  // Group agents by department for display
  const agentsByDept = useMemo(() => {
    const map = new Map<string, { name: string; agents: Agent[] }>()
    for (const agent of allAgents) {
      if (!agent.enabled) continue
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

  const handleSubmit = async () => {
    if (!email.trim()) return
    setIsSaving(true)

    try {
      const result = (await createInvitation.mutateAsync({
        email: email.trim().toLowerCase(),
        enterprise_id: enterpriseId,
        role,
        department_ids: selectedDepartmentIds.length
          ? selectedDepartmentIds
          : undefined,
        permissions,
        visible_agent_ids: selectedAgentIds.length
          ? selectedAgentIds
          : undefined,
      })) as { invite_url: string }

      setGeneratedLink(result.invite_url)
      toast({
        title: "Invitation created",
        description: `Invitation link generated for ${email}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create invitation",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast({ title: "Link copied to clipboard" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the link manually.",
      })
    }
  }

  const handleSendAnother = () => {
    resetForm()
  }

  const selectedDeptNames = departments
    .filter((d: Department) => selectedDepartmentIds.includes(d.id))
    .map((d: Department) => d.display_name || d.name)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        setOpen(v)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        {generatedLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation Link Ready</DialogTitle>
              <DialogDescription>
                Share this link with {email} so they can join your organization.
                The link expires in 7 days and can only be used once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Invitation Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedLink}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Email:</strong> {email}
                </p>
                <p>
                  <strong>Role:</strong> {role}
                </p>
                {selectedDeptNames.length > 0 && (
                  <p>
                    <strong>Departments:</strong> {selectedDeptNames.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={handleSendAnother}>
                <UserPlus className="mr-2 size-4" />
                Send Another
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Generate an invitation link for a new employee. They will set
                their own name and password when they open the link.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="juan@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Departments — multi-select via checkboxes */}
                <div className="space-y-2">
                  <Label>Departments</Label>
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No departments available
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {departments.map((dept: Department) => (
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
                  )}
                </div>

                <Separator />

                {/* Page Access */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Page Access
                  </Label>

                  {/* Profile preset */}
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
                            {profile.name} — {profile.description}
                          </SelectItem>
                        )
                      )}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Granular checkboxes */}
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSION_IDS.map((permId) => (
                      <label
                        key={permId}
                        className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={
                            permissions.includes("*") ||
                            permissions.includes(permId)
                          }
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(permId, !!checked)
                          }
                          disabled={permissions.includes("*")}
                        />
                        <span>
                          {PERMISSION_LABELS[permId] ??
                            permId.replace(/-/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Chat Visibility — optional agent filter */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    Chat Visibility
                  </Label>
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
                                    checked={selectedAgentIds.includes(
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
                </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!email.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Link className="mr-2 size-4" />
                )}
                Generate Link
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
