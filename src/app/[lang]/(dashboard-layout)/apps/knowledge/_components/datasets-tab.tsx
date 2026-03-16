"use client"

import { useCallback, useRef, useState } from "react"
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Database,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Server,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
  Wrench,
  XCircle,
  Link2,
} from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  useDataLabProjects,
  useDataLabDeployments,
  useCreateDataLabProject,
  useDeleteDataLabProject,
  useBuildMCPServer,
  useDeployMCPServer,
  useStopMCPServer,
  useBuildDataset,
  useDataLabEntries,
  useDataLabStats,
  useReviewDataLabEntry,
  useDeleteDataLabEntry,
  useUploadFileToProject,
  useCollections,
} from "@/lib/api/react-hooks"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  building: "bg-yellow-500/10 text-yellow-600",
  ready: "bg-blue-500/10 text-blue-600",
  deployed: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  running: "bg-green-500/10 text-green-600",
  stopped: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/10 text-yellow-600",
}

function qualityColor(score: number | null) {
  if (score === null) return "text-muted-foreground"
  if (score >= 0.8) return "text-green-600"
  if (score >= 0.6) return "text-yellow-600"
  return "text-red-500"
}

// ============================================================================
// Datasets Tab (Projects list)
// ============================================================================

export function DatasetsTab({ enterpriseId }: { enterpriseId: string }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { data: projects, isLoading: loadingProjects } = useDataLabProjects(enterpriseId)
  const { data: collections } = useCollections(enterpriseId)

  const createProject = useCreateDataLabProject()
  const deleteProject = useDeleteDataLabProject()
  const buildMCP = useBuildMCPServer()
  const deployMCP = useDeployMCPServer()
  const buildDataset = useBuildDataset()

  if (selectedProjectId) {
    return (
      <ProjectDetailView
        enterpriseId={enterpriseId}
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    )
  }

  const handleCreateProject = async (data: {
    name: string
    description: string
    projectType: string
    sourceCollectionIds: string[]
  }) => {
    try {
      await createProject.mutateAsync({
        enterpriseId,
        data: {
          name: data.name,
          description: data.description,
          project_type: data.projectType,
          source_collection_ids: data.sourceCollectionIds,
          mcp_config:
            data.projectType !== "dataset"
              ? {
                  server_name: data.name.toLowerCase().replace(/\s+/g, "-"),
                  tools: [
                    { name: "search_knowledge", description: "Search enterprise knowledge", enabled: true },
                    { name: "get_document", description: "Get full document content", enabled: true },
                    { name: "list_documents", description: "List available documents", enabled: true },
                  ],
                }
              : undefined,
          dataset_config:
            data.projectType !== "mcp_server"
              ? { format: "jsonl", pair_generation: "qa", max_pairs: 5, quality_threshold: 0.5 }
              : undefined,
        },
      })
      setShowCreateDialog(false)
      toast({ title: "Project created" })
    } catch {
      toast({ title: "Error creating project", variant: "destructive" })
    }
  }

  const handleBuildAndDeploy = async (projectId: string) => {
    try {
      const deployment = await buildMCP.mutateAsync({ enterpriseId, projectId })
      toast({ title: "MCP server generated" })
      await deployMCP.mutateAsync({ enterpriseId, deploymentId: deployment.id })
      toast({ title: "MCP server deployed" })
    } catch {
      toast({ title: "Error building MCP server", variant: "destructive" })
    }
  }

  const handleBuildDataset = async (projectId: string) => {
    try {
      const result = await buildDataset.mutateAsync({ enterpriseId, projectId }) as { entries_created: number; entries_skipped: number }
      toast({
        title: "Dataset built",
        description: `${result.entries_created} entries created, ${result.entries_skipped} skipped`,
      })
    } catch {
      toast({ title: "Error building dataset", variant: "destructive" })
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject.mutateAsync({ enterpriseId, projectId })
      toast({ title: "Project deleted" })
    } catch {
      toast({ title: "Error deleting project", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {loadingProjects ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !projects?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No dataset projects yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex gap-1">
                    <Badge className={STATUS_COLORS[project.status] || ""}>{project.status}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {project.project_type === "both" ? "MCP + Dataset" : project.project_type === "dataset" ? "Dataset" : "MCP Server"}
                    </Badge>
                  </div>
                </div>
                {project.description && <CardDescription>{project.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    {project.source_collection_ids?.length || 0} collections
                  </span>
                  {project.total_entries > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {project.total_entries} entries
                    </span>
                  )}
                  {project.quality_score !== null && (
                    <span className={`flex items-center gap-1 ${qualityColor(project.quality_score)}`}>
                      <BarChart3 className="h-4 w-4" />
                      {(project.quality_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {project.last_built_at && (
                  <div className="text-xs text-muted-foreground">
                    Last built: {new Date(project.last_built_at).toLocaleString()}
                  </div>
                )}
                {project.build_error && <p className="text-xs text-red-500">{project.build_error}</p>}
                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {(project.project_type === "dataset" || project.project_type === "both") && (
                    <Button size="sm" variant="outline" onClick={() => handleBuildDataset(project.id)} disabled={buildDataset.isPending}>
                      {buildDataset.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1" />}
                      Build Dataset
                    </Button>
                  )}
                  {(project.project_type === "mcp_server" || project.project_type === "both") && (
                    <Button size="sm" onClick={() => handleBuildAndDeploy(project.id)} disabled={buildMCP.isPending || deployMCP.isPending}>
                      {buildMCP.isPending || deployMCP.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : project.status === "deployed" ? (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      {project.status === "deployed" ? "Rebuild" : "Build MCP"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateProject}
        collections={collections || []}
        isPending={createProject.isPending}
      />
    </div>
  )
}

// ============================================================================
// MCP Servers Tab (Deployments list)
// ============================================================================

export function MCPServersTab({ enterpriseId }: { enterpriseId: string }) {
  const { data: deployments, isLoading } = useDataLabDeployments(enterpriseId)
  const deployMCP = useDeployMCPServer()
  const stopMCP = useStopMCPServer()

  const handleStopServer = async (deploymentId: string) => {
    try {
      await stopMCP.mutateAsync({ enterpriseId, deploymentId })
      toast({ title: "MCP server stopped" })
    } catch {
      toast({ title: "Error stopping server", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!deployments?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Server className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No MCP servers deployed yet. Build one from a dataset project.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {deployments.map((dep) => (
        <Card key={dep.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dep.server_name}</span>
                  <Badge variant="outline">v{dep.server_version}</Badge>
                  <Badge className={STATUS_COLORS[dep.status] || ""}>{dep.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    {Object.values(dep.tools_manifest || {}).flat().length} tools
                    {dep.bound_agent_ids?.length ? (
                      <>
                        {" "}&middot; <Link2 className="h-3 w-3 inline" /> {dep.bound_agent_ids.length} agents
                      </>
                    ) : null}
                    {dep.total_queries > 0 && <> &middot; {dep.total_queries} queries</>}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {dep.status === "running" ? (
                <Button size="sm" variant="outline" onClick={() => handleStopServer(dep.id)} disabled={stopMCP.isPending}>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              ) : dep.status === "pending" || dep.status === "stopped" ? (
                <Button
                  size="sm"
                  onClick={() => deployMCP.mutateAsync({ enterpriseId, deploymentId: dep.id })}
                  disabled={deployMCP.isPending}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Deploy
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Project Detail View (entries, stats, review)
// ============================================================================

function ProjectDetailView({
  enterpriseId,
  projectId,
  onBack,
}: {
  enterpriseId: string
  projectId: string
  onBack: () => void
}) {
  const [entriesPage, setEntriesPage] = useState(0)
  const [filterReviewed, setFilterReviewed] = useState<string>("all")
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pageSize = 20

  const uploadFile = useUploadFileToProject()
  const { data: stats } = useDataLabStats(enterpriseId, projectId)
  const { data: entriesData, isLoading: loadingEntries } = useDataLabEntries(
    enterpriseId,
    projectId,
    {
      offset: entriesPage * pageSize,
      limit: pageSize,
      ...(filterReviewed === "reviewed"
        ? { reviewed: true }
        : filterReviewed === "unreviewed"
          ? { reviewed: false }
          : filterReviewed === "approved"
            ? { approved: true }
            : filterReviewed === "rejected"
              ? { approved: false, reviewed: true }
              : {}),
    }
  )

  const reviewEntry = useReviewDataLabEntry()
  const deleteEntry = useDeleteDataLabEntry()
  const buildDataset = useBuildDataset()

  const handleReview = async (entryId: string, approved: boolean) => {
    try {
      await reviewEntry.mutateAsync({ enterpriseId, entryId, projectId, data: { approved } })
    } catch {
      toast({ title: "Error reviewing entry", variant: "destructive" })
    }
  }

  const handleDelete = async (entryId: string) => {
    try {
      await deleteEntry.mutateAsync({ enterpriseId, entryId, projectId })
    } catch {
      toast({ title: "Error deleting entry", variant: "destructive" })
    }
  }

  const handleExport = () => {
    const url = `/api/enterprises/${enterpriseId}/datalab/projects/${projectId}/export?format=jsonl&min_quality=0.5&only_approved=false`
    window.open(url, "_blank")
  }

  const handleBuild = async () => {
    try {
      const result = await buildDataset.mutateAsync({ enterpriseId, projectId }) as { entries_created: number; entries_skipped: number }
      toast({
        title: "Dataset built",
        description: `${result.entries_created} entries created, ${result.entries_skipped} skipped`,
      })
    } catch {
      toast({ title: "Error building dataset", variant: "destructive" })
    }
  }

  const ACCEPTED_EXTENSIONS = ".pdf,.docx,.xlsx,.csv,.txt,.md"

  const handleUploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true)
      let successCount = 0
      for (const file of Array.from(files)) {
        try {
          await uploadFile.mutateAsync({ enterpriseId, projectId, file, title: file.name })
          successCount++
        } catch {
          toast({ title: `Error uploading ${file.name}`, variant: "destructive" })
        }
      }
      setUploading(false)
      if (successCount > 0) {
        toast({
          title: `${successCount} file${successCount > 1 ? "s" : ""} uploaded`,
          description: "You can now build the dataset to generate QA pairs.",
        })
      }
    },
    [enterpriseId, projectId, uploadFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) handleUploadFiles(e.dataTransfer.files)
    },
    [handleUploadFiles]
  )

  interface DataLabEntry {
    id: string
    entry_type: string
    input_text: string
    output_text: string
    quality_score: number | null
    quality_flags?: Record<string, boolean>
    human_reviewed: boolean
    human_approved: boolean
    token_count?: number
  }
  const entries: DataLabEntry[] = (entriesData as { items?: DataLabEntry[] })?.items || []
  const totalEntries = (entriesData as { total?: number })?.total || 0
  const totalPages = Math.ceil(totalEntries / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Dataset Entries</h2>
          <p className="text-muted-foreground text-sm">Review and curate QA pairs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBuild} disabled={buildDataset.isPending}>
            {buildDataset.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1" />}
            Build Dataset
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export JSONL
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-4 pb-3"><div className="text-2xl font-bold">{stats.total_entries}</div><div className="text-xs text-muted-foreground">Total Entries</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3"><div className="text-2xl font-bold text-green-600">{stats.approved}</div><div className="text-xs text-muted-foreground">Approved</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3"><div className="text-2xl font-bold text-red-500">{stats.rejected}</div><div className="text-xs text-muted-foreground">Rejected</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3"><div className="text-2xl font-bold text-yellow-600">{stats.pending_review}</div><div className="text-xs text-muted-foreground">Pending Review</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3"><div className={`text-2xl font-bold ${qualityColor(stats.avg_quality)}`}>{stats.avg_quality !== null ? `${(stats.avg_quality * 100).toFixed(0)}%` : "—"}</div><div className="text-xs text-muted-foreground">Avg Quality</div></CardContent></Card>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS} className="hidden"
          onChange={(e) => { if (e.target.files?.length) { handleUploadFiles(e.target.files); e.target.value = "" } }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, CSV, TXT, MD</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterReviewed} onValueChange={setFilterReviewed}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            <SelectItem value="unreviewed">Pending review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="reviewed">All reviewed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{totalEntries} entries</span>
      </div>

      {/* Entries List */}
      {loadingEntries ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !entries.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No entries yet. Build a dataset to generate QA pairs.</p>
            <Button onClick={handleBuild} disabled={buildDataset.isPending}>
              {buildDataset.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-2" />}
              Build Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{entry.entry_type.toUpperCase()}</Badge>
                    {entry.quality_score !== null && (
                      <span className={`text-xs font-medium ${qualityColor(entry.quality_score)}`}>
                        Quality: {(entry.quality_score * 100).toFixed(0)}%
                      </span>
                    )}
                    {entry.human_reviewed && (
                      <Badge className={entry.human_approved ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                        {entry.human_approved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {entry.human_approved ? "Approved" : "Rejected"}
                      </Badge>
                    )}
                    {entry.quality_flags &&
                      Object.entries(entry.quality_flags).map(([key, val]) =>
                        key === "hallucination_risk" && val === true ? (
                          <Badge key={key} variant="outline" className="text-xs text-orange-600 border-orange-300">Hallucination risk</Badge>
                        ) : key === "low_info" && val === true ? (
                          <Badge key={key} variant="outline" className="text-xs text-yellow-600 border-yellow-300">Low info</Badge>
                        ) : null
                      )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleReview(entry.id, true)} disabled={reviewEntry.isPending} title="Approve"><ThumbsUp className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReview(entry.id, false)} disabled={reviewEntry.isPending} title="Reject"><ThumbsDown className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(entry.id)} disabled={deleteEntry.isPending} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Question</span>
                  <p className="text-sm bg-muted/50 rounded p-3">{entry.input_text}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Answer</span>
                  <p className="text-sm bg-muted/30 rounded p-3">{entry.output_text}</p>
                </div>
                {entry.token_count && <div className="text-xs text-muted-foreground">{entry.token_count} tokens</div>}
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setEntriesPage((p) => Math.max(0, p - 1))} disabled={entriesPage === 0}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {entriesPage + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setEntriesPage((p) => Math.min(totalPages - 1, p + 1))} disabled={entriesPage >= totalPages - 1}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Create Project Dialog
// ============================================================================

function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
  collections,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; projectType: string; sourceCollectionIds: string[] }) => void
  collections: Array<{ id: string; collection_id?: string; name: string; document_count: number }>
  isPending: boolean
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [projectType, setProjectType] = useState("both")
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim(), projectType, sourceCollectionIds: selectedCollections })
    setName("")
    setDescription("")
    setProjectType("both")
    setSelectedCollections([])
  }

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Dataset Project</DialogTitle>
          <DialogDescription>Create a project to curate datasets and/or generate MCP servers from your knowledge base.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Company Knowledge" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will this project produce?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Project Type</Label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Dataset + MCP Server</SelectItem>
                <SelectItem value="dataset">Dataset Only</SelectItem>
                <SelectItem value="mcp_server">MCP Server Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Source Collections</Label>
            <p className="text-xs text-muted-foreground">Select which collections will feed this project</p>
            {!collections.length ? (
              <p className="text-sm text-muted-foreground py-2">No collections found. Upload documents first.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collections.map((col) => {
                  const colId = col.collection_id || col.id
                  return (
                    <label key={colId} className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" checked={selectedCollections.includes(colId)} onChange={() => toggleCollection(colId)} className="rounded" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{col.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{col.document_count} docs</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
