"use client"

import { useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Power,
  RefreshCw,
  Trash2,
  Workflow,
} from "lucide-react"

import type {
  Agent,
  CronJob,
  CronJobRun,
  Department,
  WorkflowRun,
  WorkflowTemplate,
} from "@/lib/api/client"

import {
  useAgents,
  useCronJobs,
  useCronJobRuns,
  useDeleteCronJob,
  useDeleteWorkflowTemplate,
  useDepartments,
  useResumeWorkflowRun,
  useRunCronJob,
  useStartWorkflowRun,
  useToggleCronJob,
  useUpdateCronJob,
  useUpdateWorkflowTemplate,
  useWorkflowCatalog,
  useWorkflowRuns,
  useWorkflowTemplates,
} from "@/lib/api/hooks"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { WorkflowCatalogTab } from "./_components/workflow-catalog-tab"
import { WorkflowRunDetailDialog } from "./_components/workflow-run-detail-dialog"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatusBadge = { variant: "default" | "secondary" | "destructive" | "outline"; label: string }

const RUN_STATUS_BADGE: Record<string, StatusBadge> = {
  pending: { variant: "outline", label: "Pending" },
  running: { variant: "default", label: "Running" },
  awaiting_approval: { variant: "secondary", label: "Awaiting Approval" },
  completed: { variant: "outline", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  ok: { variant: "outline", label: "OK" },
  error: { variant: "destructive", label: "Error" },
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString()
}

function formatRelative(iso: string | null | undefined) {
  if (!iso) return "-"
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Expandable Run History Row (OpenClaw native runs)
// ---------------------------------------------------------------------------

function CronJobRunsExpander({ jobId }: { jobId: string }) {
  const { data, isLoading } = useCronJobRuns(jobId)

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 py-3">
          <div className="flex items-center gap-2 pl-8 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading execution history...
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const runs = data?.items ?? []

  if (runs.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 py-3">
          <p className="pl-8 text-sm text-muted-foreground">No executions yet.</p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {runs.map((run: CronJobRun) => {
        const statusBadge = RUN_STATUS_BADGE[run.status] ?? RUN_STATUS_BADGE["pending"]
        return (
          <TableRow key={run.id} className="bg-muted/30">
            <TableCell className="pl-10 text-xs text-muted-foreground" colSpan={2}>
              {formatDate(run.started_at)}
            </TableCell>
            <TableCell colSpan={2}>
              <Badge variant={statusBadge!.variant} className="text-xs">
                {statusBadge!.label}
              </Badge>
            </TableCell>
            <TableCell colSpan={3} className="text-xs text-muted-foreground truncate max-w-xs">
              {run.finished_at ? `Finished: ${formatDate(run.finished_at)}` : "In progress..."}
              {run.error && ` — ${run.error}`}
            </TableCell>
            <TableCell />
          </TableRow>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowsPage() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id ?? ""

  // Data: cron jobs (OpenClaw native, enriched with DB metadata)
  const {
    data: cronData,
    isLoading: loadingCron,
    refetch: refetchCron,
    isRefetching,
  } = useCronJobs()
  const cronJobs = useMemo(
    () => cronData?.items ?? [],
    [cronData]
  )

  // Data: workflow templates + runs (DB)
  const { data: templates, isLoading: loadingTemplates } =
    useWorkflowTemplates({ enterprise_id: enterpriseId })
  const { data: runs, isLoading: loadingRuns } = useWorkflowRuns({
    enterprise_id: enterpriseId,
  })

  const { data: deptsData } = useDepartments(enterpriseId)
  const departmentsList = useMemo(
    () => (deptsData as { items?: Department[] })?.items ?? [],
    [deptsData]
  )
  const { data: catalogData } = useWorkflowCatalog()
  const catalogCount = Array.isArray(catalogData) ? catalogData.length : 0

  const { data: agentsData } = useAgents({ enterprise_id: enterpriseId })
  const agentMap = useMemo(() => {
    const items = Array.isArray(agentsData)
      ? agentsData
      : (agentsData as { items?: Agent[] })?.items ?? []
    const map = new Map<string, string>()
    items.forEach((a: Agent) => map.set(a.id, a.display_name || a.name))
    return map
  }, [agentsData])

  const templateList = useMemo(
    () => (Array.isArray(templates) ? templates : []) as WorkflowTemplate[],
    [templates]
  )
  const runList = useMemo(
    () => (Array.isArray(runs) ? runs : []) as WorkflowRun[],
    [runs]
  )
  const templateMap = useMemo(() => {
    const m = new Map<string, WorkflowTemplate>()
    templateList.forEach((t) => m.set(t.id, t))
    return m
  }, [templateList])

  // Mutations: cron jobs
  const deleteCron = useDeleteCronJob()
  const toggleCron = useToggleCronJob()
  const updateCron = useUpdateCronJob()
  const runNow = useRunCronJob()

  // Mutations: workflows
  const deleteTemplate = useDeleteWorkflowTemplate()
  const updateTemplate = useUpdateWorkflowTemplate()
  const startRun = useStartWorkflowRun()
  const resumeRun = useResumeWorkflowRun()

  // UI state
  const [deletingJob, setDeletingJob] = useState<CronJob | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<WorkflowTemplate | null>(null)
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Edit state: cron job
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)
  const [editJobSchedule, setEditJobSchedule] = useState("")
  const [editJobCommand, setEditJobCommand] = useState("")

  // Edit state: pipeline
  const [editingPipeline, setEditingPipeline] = useState<WorkflowTemplate | null>(null)
  const [editPipelineName, setEditPipelineName] = useState("")
  const [editPipelineDesc, setEditPipelineDesc] = useState("")

  // Handlers: cron jobs
  const handleToggleCron = async (job: CronJob) => {
    try {
      await toggleCron.mutateAsync(job.id)
      toast({ title: job.enabled ? "Job paused" : "Job resumed" })
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  }

  const handleRunNow = async (job: CronJob) => {
    try {
      await runNow.mutateAsync(job.id)
      toast({ title: "Job triggered" })
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  }

  const confirmDeleteCron = async () => {
    if (!deletingJob) return
    try {
      await deleteCron.mutateAsync(deletingJob.id)
      toast({ title: "Scheduled job deleted" })
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setDeletingJob(null)
    }
  }

  // Handlers: workflow templates
  const handleToggleTemplate = (t: WorkflowTemplate) => {
    updateTemplate.mutate({ templateId: t.id, data: { enabled: !t.enabled } })
  }

  const handleStartRun = (templateId: string) => {
    startRun.mutate(
      { template_id: templateId, enterprise_id: enterpriseId },
      {
        onSuccess: () => toast({ title: "Workflow run started" }),
        onError: (err) =>
          toast({ title: "Error", description: String(err), variant: "destructive" }),
      }
    )
  }

  const confirmDeleteTemplate = () => {
    if (!deletingTemplate) return
    deleteTemplate.mutate(deletingTemplate.id, {
      onSuccess: () => {
        toast({ title: "Template deleted" })
        setDeletingTemplate(null)
      },
    })
  }

  const handleResume = (approvalContext?: Record<string, unknown>) => {
    if (!selectedRun) return
    resumeRun.mutate(
      { runId: selectedRun.id, approvalContext },
      {
        onSuccess: () => {
          toast({ title: "Run resumed" })
          setSelectedRun(null)
        },
      }
    )
  }

  // Edit handlers
  const openEditJob = (job: CronJob) => {
    setEditingJob(job)
    setEditJobSchedule(job.schedule)
    setEditJobCommand(job.command)
  }

  const saveEditJob = async () => {
    if (!editingJob) return
    try {
      await updateCron.mutateAsync({
        jobId: editingJob.id,
        data: {
          schedule: editJobSchedule,
          command: editJobCommand,
        },
      })
      toast({ title: "Job updated" })
      setEditingJob(null)
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  }

  const openEditPipeline = (t: WorkflowTemplate) => {
    setEditingPipeline(t)
    setEditPipelineName(t.name)
    setEditPipelineDesc(t.description || "")
  }

  const saveEditPipeline = () => {
    if (!editingPipeline) return
    updateTemplate.mutate(
      {
        templateId: editingPipeline.id,
        data: { name: editPipelineName, description: editPipelineDesc },
      },
      {
        onSuccess: () => {
          toast({ title: "Pipeline updated" })
          setEditingPipeline(null)
        },
        onError: (err) =>
          toast({ title: "Error", description: String(err), variant: "destructive" }),
      }
    )
  }

  const selectedRunSteps = selectedRun
    ? (templateMap.get(selectedRun.template_id)?.steps ?? [])
    : []

  // Stats
  const scheduledActive = cronJobs.filter((j: CronJob) => j.enabled).length
  const pipelinesActive = templateList.filter((t) => t.enabled).length

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Workflow className="h-5 w-5" />
            Workflows
          </CardTitle>
          <CardDescription>
            Scheduled tasks and pipelines. Create them from chat using natural
            language.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchCron()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled Jobs</CardDescription>
            <CardTitle className="text-3xl">{cronJobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Schedules</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {scheduledActive}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline Templates</CardDescription>
            <CardTitle className="text-3xl">{templateList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Pipelines</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {pipelinesActive}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
        <MessageSquare className="h-4 w-4 shrink-0" />
        To create a workflow, describe it in chat. Your agent will set it up for
        you.
      </div>

      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Scheduled ({cronJobs.length})
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <Workflow className="h-3.5 w-3.5 mr-1" />
            Pipelines ({templateList.length})
          </TabsTrigger>
          <TabsTrigger value="runs">Runs ({runList.length})</TabsTrigger>
          <TabsTrigger value="catalog">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            Catálogo ({catalogCount})
          </TabsTrigger>
        </TabsList>

        {/* ---- Scheduled (OpenClaw Cron Jobs) ---- */}
        <TabsContent value="scheduled" className="space-y-4">
          {loadingCron ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cronJobs.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardDescription>
                  No scheduled jobs. Ask your agent to create one.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronJobs.map((job: CronJob) => {
                    const isExpanded = expandedJobId === job.id
                    const lastRunBadge = job.last_run_status
                      ? RUN_STATUS_BADGE[job.last_run_status] ??
                        RUN_STATUS_BADGE["pending"]
                      : null
                    return (
                      <>
                        <TableRow
                          key={job.id}
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedJobId(isExpanded ? null : job.id)
                          }
                        >
                          <TableCell className="w-8 px-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {job.title || job.name}
                              </p>
                              {job.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {job.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">
                                {job.schedule_human || job.schedule}
                              </p>
                              {job.schedule_human && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {job.schedule}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {job.agent_id
                              ? agentMap.get(job.agent_id) || job.agent_id
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={job.enabled ? "default" : "secondary"}
                            >
                              {job.enabled ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lastRunBadge && (
                                <Badge
                                  variant={lastRunBadge.variant}
                                  className="text-xs"
                                >
                                  {lastRunBadge.label}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatRelative(job.last_run)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {job.run_count ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Run now"
                                onClick={() => handleRunNow(job)}
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Edit"
                                onClick={() => openEditJob(job)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={job.enabled ? "Pause" : "Resume"}
                                onClick={() => handleToggleCron(job)}
                              >
                                {job.enabled ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title="Delete"
                                onClick={() => setDeletingJob(job)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <CronJobRunsExpander jobId={job.id} />
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ---- Pipelines (Workflow Templates) ---- */}
        <TabsContent value="pipelines" className="space-y-4">
          {loadingTemplates ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templateList.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardDescription>
                  No pipeline templates. Ask your agent to create one.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateList.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.steps.length}</TableCell>
                      <TableCell>
                        <Badge variant={t.enabled ? "default" : "secondary"}>
                          {t.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(t.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Run"
                            onClick={() => handleStartRun(t.id)}
                            disabled={!t.enabled}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => openEditPipeline(t)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t.enabled ? "Disable" : "Enable"}
                            onClick={() => handleToggleTemplate(t)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Delete"
                            onClick={() => setDeletingTemplate(t)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ---- Runs ---- */}
        <TabsContent value="runs" className="space-y-4">
          {loadingRuns ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : runList.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardDescription>No workflow runs yet.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runList.map((r) => {
                    const badge =
                      RUN_STATUS_BADGE[r.status] ?? RUN_STATUS_BADGE["pending"]
                    const tmpl = templateMap.get(r.template_id)
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedRun(r)}
                      >
                        <TableCell className="font-mono text-xs">
                          {r.id}
                        </TableCell>
                        <TableCell>{tmpl?.name ?? r.template_id}</TableCell>
                        <TableCell>
                          <Badge variant={badge!.variant}>{badge!.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {r.current_step + 1} / {tmpl?.steps.length ?? "?"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(r.completed_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        {/* ---- Catalog ---- */}
        <TabsContent value="catalog" className="space-y-4">
          <WorkflowCatalogTab departments={departmentsList} />
        </TabsContent>
      </Tabs>

      {/* Run detail dialog */}
      <WorkflowRunDetailDialog
        open={!!selectedRun}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null)
        }}
        run={selectedRun}
        steps={selectedRunSteps}
        onResume={handleResume}
        resuming={resumeRun.isPending}
      />

      {/* Delete cron job confirm */}
      <AlertDialog
        open={!!deletingJob}
        onOpenChange={() => setDeletingJob(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Job</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deletingJob?.title || deletingJob?.name}&quot;? This
              will remove it from OpenClaw{deletingJob?.recurring_task_id ? " and the database" : ""}.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCron}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete template confirm */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline Template</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deletingTemplate?.name}&quot; and all its runs? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit cron job dialog */}
      <Dialog
        open={!!editingJob}
        onOpenChange={(open) => {
          if (!open) setEditingJob(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Schedule (cron expression)</Label>
              <Input
                className="font-mono"
                value={editJobSchedule}
                onChange={(e) => setEditJobSchedule(e.target.value)}
                placeholder="0 9 * * *"
              />
              <p className="text-xs text-muted-foreground">
                minute hour day month weekday
              </p>
            </div>
            <div className="space-y-2">
              <Label>Command</Label>
              <Textarea
                value={editJobCommand}
                onChange={(e) => setEditJobCommand(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEditJob}
              disabled={updateCron.isPending}
            >
              {updateCron.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit pipeline dialog */}
      <Dialog
        open={!!editingPipeline}
        onOpenChange={(open) => {
          if (!open) setEditingPipeline(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editPipelineName}
                onChange={(e) => setEditPipelineName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editPipelineDesc}
                onChange={(e) => setEditPipelineDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPipeline(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEditPipeline}
              disabled={updateTemplate.isPending}
            >
              {updateTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
