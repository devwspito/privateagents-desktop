"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useSession } from "@/providers/auth-provider"
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  Bot,
  Brain,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react"

import type { Task } from "@/lib/api"

import { api } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const roleColors: Record<string, string> = {
  generalist: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  specialist:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  coordinator:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  assistant:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  idle: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  busy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function safeFormatDate(
  dateStr: string | undefined | null,
  fmt: string
): string {
  if (!dateStr) return "—"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "—"
    return format(date, fmt)
  } catch {
    return "—"
  }
}

export default function MyAgentPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const {
    data: agents,
    isLoading: loadingAgents,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ["my-agent", userId],
    queryFn: () => api.getAgentsByUser(userId!),
    enabled: !!userId,
  })

  const agent = agents?.[0]
  const agentId = agent?.id

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", agentId, "recent"],
    queryFn: () => api.getTasks({ agent_id: agentId }),
    enabled: !!agentId,
  })

  const { data: soulData } = useQuery({
    queryKey: ["agents", agentId, "soul"],
    queryFn: () => api.getAgentSoul(agentId!),
    enabled: !!agentId,
  })

  const tasks = tasksData?.items || []
  const recentTasks = tasks.slice(0, 5)
  const isLoading = loadingAgents || loadingTasks

  const completedTasks = tasks.filter(
    (t: Task) => t.status === "completed"
  ).length
  const pendingTasks = tasks.filter((t: Task) => t.status === "pending").length
  const failedTasks = tasks.filter((t: Task) => t.status === "failed").length
  const totalTasks = tasks.length
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="size-6" />
              My Agent
            </h1>
            <p className="text-muted-foreground">View your assigned AI agent</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetchAgents()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Agent Assigned</h3>
            <p className="text-muted-foreground text-sm">
              You haven&apos;t been assigned an AI agent yet. Contact your
              administrator to get an agent assigned to you.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="size-6" />
            My Agent
          </h1>
          <p className="text-muted-foreground">
            View and interact with your assigned AI agent
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetchAgents()}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="size-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {agent.display_name || agent.name || "Unnamed Agent"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs">{agent.id}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    agent.enabled
                      ? statusColors["active"]
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {agent.enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.description && (
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <Badge
                      variant="secondary"
                      className={roleColors[agent.role || ""] || ""}
                    >
                      {agent.role || "—"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium truncate max-w-[120px]">
                      {agent.department_id || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="text-sm font-medium">
                      {agent.model_id || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Approval</p>
                    <Badge
                      variant={
                        agent.requires_human_approval ? "secondary" : "default"
                      }
                    >
                      {agent.requires_human_approval ? "Required" : "Auto"}
                    </Badge>
                  </div>
                </div>
              </div>

              {agent.specialization && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Specialization:
                  </span>
                  <span className="text-sm font-medium">
                    {agent.specialization}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="size-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Total Tasks</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600">
                    {completedTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-600">
                    {failedTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {completionRate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="size-5" />
                Recent Tasks
              </CardTitle>
              <CardDescription>
                Latest tasks handled by your agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto size-12 mb-2 opacity-50" />
                  <p>No recent tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="size-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-medium capitalize">
                  {agent.model_provider || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Temperature
                </span>
                <span className="text-sm font-medium">
                  {agent.temperature?.toString() ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Max Tokens
                </span>
                <span className="text-sm font-medium">
                  {agent.max_tokens?.toLocaleString() ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Max Concurrent Tasks
                </span>
                <span className="text-sm font-medium">
                  {(agent as typeof agent & { max_concurrent_tasks?: number }).max_concurrent_tasks?.toString() ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Current Tasks
                </span>
                <Badge variant="secondary">{(agent as typeof agent & { current_tasks?: number }).current_tasks ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {soulData?.cached_content && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="size-5" />
                  Agent Soul
                </CardTitle>
                <CardDescription>
                  Personality and behavior guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                  {soulData.cached_content.slice(0, 500)}
                  {soulData.cached_content.length > 500 && "..."}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="size-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {safeFormatDate(agent.created_at, "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="text-sm">
                  {safeFormatDate(agent.updated_at, "MMM dd, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {agent.can_use_tools && agent.can_use_tools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="size-5" />
                  Available Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.can_use_tools?.map((tool: string) => (
                    <Badge key={tool} variant="outline">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: Task }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    failed: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    running: {
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
  }

  const config =
    statusConfig[task.status as keyof typeof statusConfig] ||
    statusConfig.pending
  const StatusIcon = config.icon

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-full ${config.bg}`}
        >
          <StatusIcon className={`size-5 ${config.color}`} />
        </div>
        <div>
          <p className="font-medium truncate max-w-md">
            {task.title || task.input_text?.slice(0, 50) || "Untitled task"}
          </p>
          <p className="text-sm text-muted-foreground">
            {safeFormatDate(task.created_at, "p")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {task.requires_approval && (
          <Badge
            variant="outline"
            className={
              task.approval_status === "approved"
                ? "border-green-200 text-green-700"
                : task.approval_status === "rejected"
                  ? "border-red-200 text-red-700"
                  : "border-yellow-200 text-yellow-700"
            }
          >
            {task.approval_status === "auto_approved"
              ? "Auto"
              : task.approval_status || "Pending"}
          </Badge>
        )}
        <Badge
          className={
            task.status === "completed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : task.status === "failed"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }
        >
          {task.status}
        </Badge>
      </div>
    </div>
  )
}
