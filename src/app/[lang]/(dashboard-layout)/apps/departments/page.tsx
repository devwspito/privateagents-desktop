"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/providers/auth-provider"
import {
  ArrowLeft,
  Bot,
  Building,
  Check,
  Crown,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X as _X,
} from "lucide-react"

import type {
  Agent,
  Department,
  DepartmentMember,
  SectorInfo,
  TemplateDetail,
  TemplateListItem,
  User,
  TemplateAgentPreview as _TemplateAgentPreview,
} from "@/lib/api"

import {
  api,
  useApplyTemplate,
  useEnterprise,
  useTemplateSectors,
  useTemplates,
} from "@/lib/api"

import { QuickChatDialog } from "../office/_components/quick-chat-dialog"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DepartmentDetailSheet } from "@/components/departments"

const roleColors: Record<string, string> = {
  management: "bg-purple-100 text-purple-800",
  sales: "bg-green-100 text-green-800",
  support: "bg-blue-100 text-blue-800",
  operations: "bg-orange-100 text-orange-800",
  finance: "bg-yellow-100 text-yellow-800",
  hr: "bg-pink-100 text-pink-800",
  legal: "bg-red-100 text-red-800",
  it: "bg-cyan-100 text-cyan-800",
}

const roles = [
  { value: "management", label: "Management" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "legal", label: "Legal" },
  { value: "it", label: "IT / Technology" },
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
]

export default function DepartmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = ((params as Record<string, string>)?.["lang"]) || "es"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  )
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const enterpriseId = session?.user?.enterprise_id

  // Fetch departments
  const {
    data: departmentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["departments", enterpriseId],
    queryFn: () => api.getDepartments(enterpriseId),
    enabled: !!enterpriseId,
  })

  // Fetch agents to count per department
  const { data: agentsData } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast({ title: "Department deleted" })
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete department" })
    },
  })

  const departments: Department[] = departmentsData?.items ?? []
  const agents: Agent[] = agentsData?.items ?? []

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      dept.role?.toLowerCase().includes(search.toLowerCase())
  )

  const getAgentCount = (deptId: string) =>
    agents.filter((a) => a.department_id === deptId).length

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="size-6" />
            Departments
          </h1>
          <p className="text-muted-foreground">
            Manage departments and their agent assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Department
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Departments</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {departments.filter((d) => d.enabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Agents</CardDescription>
            <CardTitle className="text-3xl">{agents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Can Approve</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {departments.filter((d) => d.can_approve).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No departments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDepartments.map((dept) => (
            <Card
              key={dept.id}
              className="relative cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/${lang}/apps/departments/${dept.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Building className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {dept.display_name || dept.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {dept.id}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingDepartment(dept)
                        }}
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMutation.mutate(dept.id)
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {dept.role && (
                    <Badge
                      variant="secondary"
                      className={roleColors[dept.role] || ""}
                    >
                      {dept.role}
                    </Badge>
                  )}
                  <Badge variant={dept.enabled ? "default" : "secondary"}>
                    {dept.enabled ? "Active" : "Disabled"}
                  </Badge>
                  {dept.can_approve && (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600"
                    >
                      <ShieldCheck className="mr-1 size-3" />
                      Approver
                    </Badge>
                  )}
                </div>

                {dept.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dept.description}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Bot className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getAgentCount(dept.id)}
                    </span>
                    <span className="text-muted-foreground">agents</span>
                  </div>
                  {dept.manager_user_id && (
                    <div className="flex items-center gap-1 text-sm">
                      <Crown className="size-3 text-amber-500" />
                      <span className="text-muted-foreground">Head</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <DepartmentDialog
        key={editingDepartment?.id ?? "create"}
        open={isCreateOpen || !!editingDepartment}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingDepartment(null)
          }
        }}
        department={editingDepartment}
        enterpriseId={enterpriseId || ""}
      />

      {/* Department Detail Sheet */}
      <DepartmentDetailSheet
        department={selectedDepartment}
        open={!!selectedDepartment}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDepartment(null)
          }
        }}
        onEdit={(dept) => {
          setSelectedDepartment(null)
          setEditingDepartment(dept)
        }}
      />
    </div>
  )
}

function DepartmentDialog({
  open,
  onOpenChange,
  department,
  enterpriseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  enterpriseId: string
}) {
  const queryClient = useQueryClient()
  const params = useParams()
  const lang = ((params as Record<string, string>)?.["lang"]) || "es"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scratchChatOpen, setScratchChatOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: department?.name || "",
    display_name: department?.display_name || "",
    role: department?.role || "",
    description: department?.description || "",
    can_approve: department?.can_approve || false,
    tools_autonomous: department?.tools_autonomous || false,
    orchestrator_enabled: department?.orchestrator_enabled || false,
    orchestrator_agent_id: department?.orchestrator_agent_id || "",
  })

  // Members state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [headUserId, setHeadUserId] = useState<string>("")

  const isEditing = !!department

  // Fetch agents for orchestrator selector
  const { data: allAgentsData } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })
  const departmentAgents: Agent[] = (allAgentsData?.items ?? []).filter(
    (a: Agent) => a.department_id === department?.id
  )

  // Fetch available users for member selection
  const { data: usersData } = useQuery({
    queryKey: ["users", { enterprise_id: enterpriseId }],
    queryFn: () => api.getUsers({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })
  const availableUsers: User[] = usersData?.items ?? []

  // Fetch existing members when editing
  const { data: existingMembers } = useQuery({
    queryKey: ["departments", department?.id, "members"],
    queryFn: () => api.getDepartmentMembers(department!.id),
    enabled: !!department?.id,
  })

  // Sync existing members into state when loaded
  const [membersSynced, setMembersSynced] = useState(false)
  if (isEditing && existingMembers && !membersSynced) {
    setSelectedMemberIds(existingMembers.map((m: DepartmentMember) => m.id))
    const head = existingMembers.find((m: DepartmentMember) => m.is_head)
    if (head) setHeadUserId(head.id)
    setMembersSynced(true)
  }

  // Template state (only for create mode)
  const [step, setStep] = useState<"choose" | "template" | "manual">(
    isEditing ? "manual" : "choose"
  )
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItem | null>(null)
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({})

  // Template data
  // Get enterprise name to auto-fill company_name variable
  const { data: enterprise } = useEnterprise(enterpriseId)

  const { data: templatesData, isLoading: templatesLoading } = useTemplates(
    sectorFilter ? { sector: sectorFilter } : undefined
  )
  const templates: TemplateListItem[] | undefined = templatesData?.templates
  const { data: sectorsData } = useTemplateSectors()
  const sectors: SectorInfo[] | undefined = sectorsData?.sectors
  const applyTemplateMutation = useApplyTemplate()

  // Fetch full template detail when selected (for variables)
  const { data: templateDetail } = useQuery<TemplateDetail>({
    queryKey: ["templates", selectedTemplate?.id],
    queryFn: () => api.getTemplate(selectedTemplate!.id),
    enabled: !!selectedTemplate,
  })

  // Reset state when dialog opens/closes or department changes
  const resetDialog = () => {
    setStep(isEditing ? "manual" : "choose")
    setSelectedTemplate(null)
    setTemplateVars({})
    setSectorFilter(null)
    setSelectedMemberIds([])
    setHeadUserId("")
    setMembersSynced(false)
  }

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.createDepartment({
        ...data,
        enterprise_id: enterpriseId,
      }) as Promise<Department>,
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.updateDepartment(department!.id, data) as Promise<Department>,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let deptId: string
      if (isEditing) {
        await updateMutation.mutateAsync(formData)
        deptId = department!.id
      } else {
        const created = await createMutation.mutateAsync(formData)
        deptId = created.id
      }

      // Sync members: add new ones, remove deselected ones
      if (isEditing && existingMembers) {
        const existingIds = existingMembers.map((m: DepartmentMember) => m.id)
        const toAdd = selectedMemberIds.filter(
          (id) => !existingIds.includes(id)
        )
        const toRemove = existingIds.filter(
          (id: string) => !selectedMemberIds.includes(id)
        )

        if (toAdd.length > 0) {
          await api.addDepartmentMembers(deptId, toAdd)
        }
        for (const userId of toRemove) {
          await api.removeDepartmentMember(deptId, userId)
        }
      } else if (selectedMemberIds.length > 0) {
        await api.addDepartmentMembers(deptId, selectedMemberIds)
      }

      // Set department head
      if (headUserId) {
        await api.setDepartmentHead(deptId, headUserId)
      }

      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({ title: isEditing ? "Department updated" : "Department created" })
      onOpenChange(false)
    } catch {
      toast({
        variant: "destructive",
        title: isEditing
          ? "Failed to update department"
          : "Failed to create department",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    setIsSubmitting(true)
    try {
      const result = await applyTemplateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        data: {
          enterprise_id: enterpriseId,
          variables: {
            company_name: enterprise?.name || "",
            ...templateVars,
          },
        },
      })
      toast({
        title: "Department created from template",
        description: `${result.department_name} with ${result.agents_created} agents`,
      })
      onOpenChange(false)
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to apply template",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogWidth =
    step === "choose" || step === "template" ? "max-w-2xl" : "max-w-md"

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetDialog()
        onOpenChange(o)
      }}
    >
      <DialogContent className={dialogWidth}>
        {/* ============= STEP: CHOOSE MODE ============= */}
        {step === "choose" && !isEditing && (
          <>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Start from a pre-built template or create from scratch
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setStep("template")}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Sparkles className="size-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">From Template</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pre-configured department with agents
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const directorId = enterprise?.director_agent_id
                  if (directorId) {
                    onOpenChange(false)
                    setScratchChatOpen(true)
                  } else {
                    setStep("manual")
                  }
                }}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <MessageSquare className="size-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">From Scratch</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe your team in chat and AI builds it
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ============= STEP: TEMPLATE PICKER ============= */}
        {step === "template" && !selectedTemplate && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setStep("choose")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <DialogTitle>Choose a Template</DialogTitle>
                  <DialogDescription>
                    Select a pre-built department configuration
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Sector filter */}
            {sectors && sectors.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={sectorFilter === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSectorFilter(null)}
                >
                  All
                </Badge>
                {sectors.map((s) => (
                  <Badge
                    key={s.id}
                    variant={sectorFilter === s.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSectorFilter(s.id)}
                  >
                    {s.display_name} ({s.template_count})
                  </Badge>
                ))}
              </div>
            )}

            {/* Template grid */}
            <ScrollArea className="max-h-[50vh]">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : !templates || templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates available
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pr-3">
                  {templates.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-xl">{t.icon}</span>
                        <span className="font-medium text-sm truncate">
                          {t.display_name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t w-full">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {t.agent_count} agents
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {t.sector}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {/* ============= STEP: TEMPLATE DETAIL ============= */}
        {step === "template" && selectedTemplate && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setTemplateVars({})
                  }}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-xl">{selectedTemplate.icon}</span>
                    {selectedTemplate.display_name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTemplate.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Agents preview */}
              {templateDetail?.agents && templateDetail.agents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Agents that will be created:
                  </Label>
                  <div className="space-y-2">
                    {templateDetail.agents.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Bot className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {a.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {a.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-auto shrink-0 text-xs"
                        >
                          {a.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables */}
              {templateDetail?.variables &&
                templateDetail.variables.filter((v) => v !== "company_name")
                  .length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">
                      Customize your department:
                    </Label>
                    {templateDetail.variables
                      .filter((v) => v !== "company_name")
                      .map((v) => (
                        <div key={v} className="space-y-1">
                          <Label className="text-xs capitalize">
                            {v.replace(/_/g, " ")}
                          </Label>
                          <Input
                            placeholder={`Enter ${v.replace(/_/g, " ")}`}
                            value={templateVars[v] || ""}
                            onChange={(e) =>
                              setTemplateVars({
                                ...templateVars,
                                [v]: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                  </div>
                )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null)
                  setTemplateVars({})
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleApplyTemplate}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Create from Template
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ============= STEP: MANUAL FORM ============= */}
        {step === "manual" && (
          <>
            <DialogHeader>
              {!isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 absolute left-4 top-4"
                  onClick={() => setStep("choose")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <DialogTitle>
                {isEditing ? "Edit Department" : "Create New Department"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the department configuration"
                  : "Add a new department to your enterprise"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (slug)</Label>
                <Input
                  id="name"
                  placeholder="sales"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Sales Department"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this department do?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="can_approve">Can Approve</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can approve agent requests
                  </p>
                </div>
                <Switch
                  id="can_approve"
                  checked={formData.can_approve}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, can_approve: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="tools_autonomous">Tools Autonomous</Label>
                  <p className="text-sm text-muted-foreground">
                    Las solicitudes de tools se construyen y aprueban sin intervención humana
                  </p>
                </div>
                <Switch
                  id="tools_autonomous"
                  checked={formData.tools_autonomous}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, tools_autonomous: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="orchestrator">Activar Orquestador</Label>
                  <p className="text-sm text-muted-foreground">
                    Un agente coordinador recibe y descompone tareas para asignarlas a los agentes del departamento
                  </p>
                </div>
                <Switch
                  id="orchestrator"
                  checked={formData.orchestrator_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      orchestrator_enabled: checked,
                      orchestrator_agent_id: checked ? formData.orchestrator_agent_id : "",
                    })
                  }
                />
              </div>

              {formData.orchestrator_enabled && (
                <div className="space-y-2 ml-4">
                  <Label>Agente Orquestador</Label>
                  <Select
                    value={formData.orchestrator_agent_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, orchestrator_agent_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar agente orquestador" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.display_name || agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Este agente recibirá las tareas del departamento y las delegará
                  </p>
                </div>
              )}

              {/* Members Section */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="size-4" />
                    Members
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedMemberIds.length} selected
                  </span>
                </div>

                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No users available. Create users first.
                  </p>
                ) : (
                  <ScrollArea className="max-h-40">
                    <div className="space-y-1">
                      {availableUsers.map((user) => {
                        const isSelected = selectedMemberIds.includes(user.id)
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMemberIds(
                                  selectedMemberIds.filter(
                                    (id) => id !== user.id
                                  )
                                )
                                if (headUserId === user.id) setHeadUserId("")
                              } else {
                                setSelectedMemberIds([
                                  ...selectedMemberIds,
                                  user.id,
                                ])
                              }
                            }}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div
                              className={`flex size-5 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && <Check className="size-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block">
                                {user.name || user.email}
                              </span>
                              {user.name && (
                                <span className="text-xs text-muted-foreground truncate block">
                                  {user.email}
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                            >
                              {user.role}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Department Head */}
              {selectedMemberIds.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Crown className="size-4 text-amber-500" />
                    Department Head
                  </Label>
                  <Select value={headUserId} onValueChange={setHeadUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department head" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMemberIds.map((uid) => {
                        const user = availableUsers.find((u) => u.id === uid)
                        if (!user) return null
                        return (
                          <SelectItem key={uid} value={uid}>
                            {user.name || user.email}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The head can see escalated approvals from all agents in this
                    department
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {isEditing ? "Save Changes" : "Create Department"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* QuickChatDialog for "From Scratch" — opens Director General chat */}
    {enterprise?.director_agent_id && (
      <QuickChatDialog
        open={scratchChatOpen}
        onOpenChange={setScratchChatOpen}
        agentId={enterprise.director_agent_id}
        agentName="Director General"
        lang={lang}
      />
    )}
    </>
  )
}
