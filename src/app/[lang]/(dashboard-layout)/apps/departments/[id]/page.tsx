"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "@/providers/auth-provider"
import {
  ArrowLeft,
  Bot,
  Check,
  ExternalLink,
  FolderGit2,
  GitBranch,
  FolderOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Plug,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"

import type { Agent, DepartmentProject, RecommendedIntegration, ResourceConfigItem } from "@/lib/api"
import { api, useDepartment, useAgents } from "@/lib/api"
import {
  useDepartmentProjects,
  useCreateDepartmentProject,
  useUpdateDepartmentProject,
  useDeleteDepartmentProject,
  useAssignProjectAgents,
  useProjectResourceConfig,
  useRecommendedIntegrations,
} from "@/lib/api/react-hooks/department-projects"
import { ResourceBrowserDialog } from "./_components/resource-browser"
import { AppLogo } from "@/components/app-logo"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DepartmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const deptId = params?.id as string
  const lang = ((params as Record<string, string>)?.["lang"]) || "es"

  const { data: department, isLoading: loadingDept } = useDepartment(deptId)
  const { data: agentsData, isLoading: loadingAgents } = useAgents({
    enterprise_id: session?.user?.enterprise_id,
    department_id: deptId,
  })
  const { data: projectsData, isLoading: loadingProjects } =
    useDepartmentProjects(deptId)

  const { data: integrationsData, isLoading: loadingIntegrations } =
    useRecommendedIntegrations(deptId)

  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DepartmentProject | null>(null)
  const [connectingApp, setConnectingApp] = useState<string | null>(null)

  const agents = agentsData?.items ?? []
  const projects = projectsData?.items ?? []
  const integrations = integrationsData?.integrations ?? []
  const oauthApps = integrations.filter((i) => i.requires_oauth)
  const apiKeyApps = integrations.filter((i) => !i.requires_oauth)

  if (loadingDept || loadingAgents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Department not found</p>
        <Button variant="outline" onClick={() => router.push(`/${lang}/apps/departments`)}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${lang}/apps/departments`)}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {department.display_name || department.name}
          </h1>
          {department.description && (
            <p className="text-muted-foreground mt-1">
              {department.description}
            </p>
          )}
        </div>
        <Badge variant="outline">{department.role}</Badge>
      </div>

      {/* Agents Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Agents</h2>
          <Badge variant="secondary">{agents.length}</Badge>
        </div>
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bot className="size-8 mb-2 opacity-50" />
              <p>No agents in this department</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>

      {/* Integrations Section */}
      {integrations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plug className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Integrations</h2>
            <Badge variant="secondary">
              {integrations.filter((i) => i.connected).length}/{integrations.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect these apps to enable department capabilities for all agents
          </p>

          {loadingIntegrations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* OAuth Apps */}
              {oauthApps.length > 0 && (
                <div>
                  {apiKeyApps.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      OAuth Connections
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {oauthApps.map((integration) => (
                      <IntegrationCard
                        key={integration.app_key}
                        integration={integration}
                        departmentId={deptId}
                        enterpriseId={session?.user?.enterprise_id}
                        lang={lang}
                        connecting={connectingApp === integration.app_key}
                        onConnect={() => {
                          router.push(`/${lang}/apps/integrations?app=${integration.app_key}&scope=department&dept=${deptId}`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* API Key Apps */}
              {apiKeyApps.length > 0 && (
                <div>
                  {oauthApps.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      API Key / Configuration
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {apiKeyApps.map((integration) => (
                      <IntegrationCard
                        key={integration.app_key}
                        integration={integration}
                        departmentId={deptId}
                        enterpriseId={session?.user?.enterprise_id}
                        lang={lang}
                        connecting={connectingApp === integration.app_key}
                        onConnect={async () => {
                          // For API key apps, redirect to integrations page
                          router.push(`/${lang}/apps/integrations`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Projects</h2>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <Button size="sm" onClick={() => { setEditingProject(null); setProjectDialogOpen(true) }}>
            <Plus className="mr-2 size-4" />
            New Project
          </Button>
        </div>
        {loadingProjects ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FolderGit2 className="size-8 mb-2 opacity-50" />
              <p>No projects yet</p>
              <p className="text-xs mt-1">
                Create a project to give agents context about where to work
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                agents={agents}
                onEdit={() => {
                  setEditingProject(project)
                  setProjectDialogOpen(true)
                }}
                deptId={deptId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        departmentId={deptId}
        agents={agents}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Card
// ─────────────────────────────────────────────────────────────────────────────
function AgentCard({ agent }: { agent: Agent }) {
  const initials = getInitials(agent.display_name || agent.name)
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {agent.display_name || agent.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {agent.specialization || agent.role}
          </p>
        </div>
        {agent.enabled ? (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Disabled
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  agents,
  onEdit,
  deptId,
}: {
  project: DepartmentProject
  agents: Agent[]
  onEdit: () => void
  deptId: string
}) {
  const deleteMut = useDeleteDepartmentProject(deptId)
  const assignedAgents = agents.filter((a) => project.agent_ids?.includes(a.id))

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  deleteMut.mutate(project.id, {
                    onSuccess: () =>
                      toast({ title: "Project deleted" }),
                  })
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Local Paths */}
        {project.local_paths?.length > 0 && (
          <div className="flex items-start gap-2">
            <FolderOpen className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              {project.local_paths.map((p, i) => (
                <div key={i} className="font-mono truncate">{p}</div>
              ))}
            </div>
          </div>
        )}

        {/* Repositories */}
        {project.repositories?.length > 0 && (
          <div className="flex items-start gap-2">
            <GitBranch className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              {project.repositories.map((r, i) => (
                <div key={i} className="truncate">
                  {r.url}
                  {r.branch && (
                    <span className="ml-1 text-primary/70">({r.branch})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Agents */}
        {assignedAgents.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1">
              {assignedAgents.map((a) => (
                <Badge key={a.id} variant="secondary" className="text-xs">
                  {a.display_name || a.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Config keys */}
        {Object.keys(project.config || {}).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(project.config).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-xs font-normal">
                {key}: {String(val)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Dialog (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
function ProjectDialog({
  open,
  onOpenChange,
  project,
  departmentId,
  agents,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: DepartmentProject | null
  departmentId: string
  agents: Agent[]
}) {
  const isEditing = !!project
  const createMut = useCreateDepartmentProject(departmentId)
  const updateMut = useUpdateDepartmentProject(departmentId)
  const assignMut = useAssignProjectAgents(departmentId)

  const { data: resourceConfig } = useProjectResourceConfig(departmentId)
  const [browsingResource, setBrowsingResource] = useState<ResourceConfigItem | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [localPaths, setLocalPaths] = useState<string[]>([])
  const [newPath, setNewPath] = useState("")
  const [repositories, setRepositories] = useState<
    { url: string; branch: string; provider: string }[]
  >([])
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [newRepoBranch, setNewRepoBranch] = useState("main")
  const [configEntries, setConfigEntries] = useState<
    { key: string; value: string }[]
  >([])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (project) {
        setName(project.name)
        setDescription(project.description || "")
        setLocalPaths(project.local_paths || [])
        setRepositories(
          (project.repositories || []).map((r) => ({
            url: r.url,
            branch: r.branch || "main",
            provider: r.provider || "",
          }))
        )
        setConfigEntries(
          Object.entries(project.config || {}).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        )
        setSelectedAgentIds(project.agent_ids || [])
      } else {
        setName("")
        setDescription("")
        setLocalPaths([])
        setRepositories([])
        setConfigEntries([])
        setSelectedAgentIds([])
      }
      setNewPath("")
      setNewRepoUrl("")
      setNewRepoBranch("main")
    }
    onOpenChange(isOpen)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    const config: Record<string, string> = {}
    for (const e of configEntries) {
      if (e.key.trim()) config[e.key.trim()] = e.value
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      local_paths: localPaths,
      repositories,
      config,
      agent_ids: selectedAgentIds,
    }

    try {
      if (isEditing && project) {
        await updateMut.mutateAsync({
          projectId: project.id,
          data: payload,
        })
        // Update agent assignments separately
        await assignMut.mutateAsync({
          projectId: project.id,
          agentIds: selectedAgentIds,
        })
        toast({ title: "Project updated" })
      } else {
        await createMut.mutateAsync(payload)
        toast({ title: "Project created" })
      }
      onOpenChange(false)
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save project",
        variant: "destructive",
      })
    }
  }

  const isSubmitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update project configuration and agent assignments"
              : "Create a project to give agents context about paths, repos, and tools"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Name & Description */}
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Epsum Design System"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this project is about..."
                  rows={2}
                />
              </div>
            </div>

            {/* Local Paths */}
            <div>
              <Label className="mb-2 block">Local Paths</Label>
              <div className="space-y-2">
                {localPaths.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted px-3 py-1.5 rounded truncate">
                      {p}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() =>
                        setLocalPaths(localPaths.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/path/to/project"
                    className="font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPath.trim()) {
                        setLocalPaths([...localPaths, newPath.trim()])
                        setNewPath("")
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newPath.trim()}
                    onClick={() => {
                      setLocalPaths([...localPaths, newPath.trim()])
                      setNewPath("")
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Repositories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Repositories</Label>
                <div className="flex gap-1">
                  {resourceConfig?.resources
                    ?.filter((r) => r.resource_type === "repositories")
                    .map((res) => (
                      <Button
                        key={res.app}
                        variant="outline"
                        size="sm"
                        disabled={!res.connected}
                        onClick={() => setBrowsingResource(res)}
                        className="text-xs h-7"
                      >
                        <Search className="mr-1 size-3" />
                        {res.label}
                      </Button>
                    ))}
                </div>
              </div>
              {resourceConfig?.resources?.some(
                (r) => r.resource_type === "repositories" && !r.connected
              ) && (
                <p className="text-xs text-muted-foreground mb-2">
                  Connect GitHub/GitLab in Integrations to browse repos
                </p>
              )}
              <div className="space-y-2">
                {repositories.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 text-sm bg-muted px-3 py-1.5 rounded truncate">
                      <span>{r.url}</span>
                      <span className="ml-2 text-muted-foreground">
                        ({r.branch})
                      </span>
                      {r.provider && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {r.provider}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() =>
                        setRepositories(
                          repositories.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newRepoUrl}
                    onChange={(e) => setNewRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="flex-1"
                  />
                  <Input
                    value={newRepoBranch}
                    onChange={(e) => setNewRepoBranch(e.target.value)}
                    placeholder="main"
                    className="w-24"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newRepoUrl.trim()}
                    onClick={() => {
                      setRepositories([
                        ...repositories,
                        {
                          url: newRepoUrl.trim(),
                          branch: newRepoBranch.trim() || "main",
                          provider: "",
                        },
                      ])
                      setNewRepoUrl("")
                      setNewRepoBranch("main")
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Config (key-value) */}
            <div>
              <Label className="mb-2 block">Config</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Extra context for agents (e.g. tech_stack, conventions)
              </p>
              <div className="space-y-2">
                {configEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={entry.key}
                      onChange={(e) => {
                        const updated = [...configEntries]
                        updated[i] = { ...entry, key: e.target.value }
                        setConfigEntries(updated)
                      }}
                      placeholder="Key"
                      className="w-36"
                    />
                    <Input
                      value={entry.value}
                      onChange={(e) => {
                        const updated = [...configEntries]
                        updated[i] = { ...entry, value: e.target.value }
                        setConfigEntries(updated)
                      }}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() =>
                        setConfigEntries(
                          configEntries.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfigEntries([...configEntries, { key: "", value: "" }])
                  }
                >
                  <Plus className="mr-2 size-4" />
                  Add entry
                </Button>
              </div>
            </div>

            {/* Agent Assignment */}
            <div>
              <Label className="mb-2 block">Assign Agents</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selected agents will receive project context in their prompts
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No agents in this department
                  </p>
                ) : (
                  agents.map((agent) => {
                    const isSelected = selectedAgentIds.includes(agent.id)
                    return (
                      <label
                        key={agent.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgentIds([
                                ...selectedAgentIds,
                                agent.id,
                              ])
                            } else {
                              setSelectedAgentIds(
                                selectedAgentIds.filter((id) => id !== agent.id)
                              )
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {agent.display_name || agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.specialization || agent.role}
                          </p>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Resource Browser Dialog */}
      {browsingResource && (
        <ResourceBrowserDialog
          open={!!browsingResource}
          onOpenChange={(isOpen) => {
            if (!isOpen) setBrowsingResource(null)
          }}
          app={browsingResource.app}
          resourceType={browsingResource.resource_type}
          label={browsingResource.label}
          departmentId={departmentId}
          onSelect={(items) => {
            const newRepos = items.map((item) => ({
              url: item.url || "",
              branch: String(item.metadata?.default_branch || "main"),
              provider: browsingResource.app,
            }))
            setRepositories((prev) => {
              // Avoid duplicates by URL
              const existingUrls = new Set(prev.map((r) => r.url))
              const unique = newRepos.filter((r) => !existingUrls.has(r.url))
              return [...prev, ...unique]
            })
            setBrowsingResource(null)
          }}
        />
      )}
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration Card
// ─────────────────────────────────────────────────────────────────────────────
function IntegrationCard({
  integration,
  departmentId,
  enterpriseId,
  lang,
  connecting,
  onConnect,
}: {
  integration: RecommendedIntegration
  departmentId: string
  enterpriseId?: string
  lang: string
  connecting: boolean
  onConnect: () => void
}) {
  return (
    <Card
      className={cn(
        "transition-colors",
        integration.connected
          ? "border-green-200 dark:border-green-800"
          : "hover:border-primary/30"
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <AppLogo
          appName={integration.app_name}
          appKey={integration.app_key}
          logoUrl={integration.logo_url}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{integration.app_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {integration.auth_type}
            </Badge>
            {integration.connection_scope && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                {integration.connection_scope}
              </Badge>
            )}
          </div>
        </div>
        {integration.connected ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs shrink-0">
            <Check className="mr-1 size-3" />
            Connected
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs h-7"
            disabled={connecting}
            onClick={onConnect}
          >
            {connecting ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Plug className="mr-1 size-3" />
            )}
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
