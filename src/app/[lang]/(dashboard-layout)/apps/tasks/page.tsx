"use client"

import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { useSession } from "@/providers/auth-provider"
import {
  AlertCircle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Filter,
  Link2,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react"
import { FaCalendarAlt } from "react-icons/fa"
import {
  SiAirtable,
  SiAsana,
  SiClickup,
  SiJira,
  SiLinear,
  SiNotion,
  SiTrello,
} from "react-icons/si"

import type {
  Agent,
  CreateTaskRequest,
  Task,
  TaskToolCall as _TaskToolCall,
} from "@/lib/api"

import { api } from "@/lib/api"
import { useAgents } from "@/lib/api/hooks"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ApprovalsTab } from "./_components/approvals-tab"

// Alias for Monday.com (icon was renamed in newer react-icons)
const SiMondaydotcom = FaCalendarAlt

// Task management connectors
const TASK_CONNECTORS = [
  {
    id: "jira",
    name: "Jira",
    icon: SiJira,
    color: "#0052CC",
    connected: false,
  },
  {
    id: "asana",
    name: "Asana",
    icon: SiAsana,
    color: "#F06A6A",
    connected: false,
  },
  {
    id: "trello",
    name: "Trello",
    icon: SiTrello,
    color: "#0079BF",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    icon: SiNotion,
    color: "#000000",
    connected: false,
  },
  {
    id: "clickup",
    name: "ClickUp",
    icon: SiClickup,
    color: "#7B68EE",
    connected: false,
  },
  {
    id: "linear",
    name: "Linear",
    icon: SiLinear,
    color: "#5E6AD2",
    connected: false,
  },
  {
    id: "monday",
    name: "Monday",
    icon: SiMondaydotcom,
    color: "#FF3D57",
    connected: false,
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: SiAirtable,
    color: "#18BFFF",
    connected: false,
  },
]

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="size-4" />,
  running: <Loader2 className="size-4 animate-spin" />,
  completed: <CheckCircle2 className="size-4" />,
  failed: <XCircle className="size-4" />,
  cancelled: <AlertCircle className="size-4" />,
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showConnectors, setShowConnectors] = useState(false)
  const [connectingSource, setConnectingSource] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const enterpriseId = session?.user?.enterprise_id

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tasks", enterpriseId, statusFilter],
    queryFn: () =>
      api.getTasks({
        enterprise_id: enterpriseId,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })

  const queryClient = useQueryClient()

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (taskId: string) => api.retryTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({
        title: "Task retried",
        description: "The task has been re-queued for execution.",
      })
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to retry task" })
    },
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["tasks", "stats", enterpriseId],
    queryFn: () => api.getTaskStats(enterpriseId),
    enabled: !!enterpriseId,
  })

  const tasks = tasksData?.items || []

  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (task: Task) =>
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.agent_id?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [tasks, search])

  // Pagination calculations
  const totalItems = filteredTasks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Agent",
      "Status",
      "Approval",
      "Created At",
      "Completed At",
    ]
    const rows = filteredTasks.map((task: Task) => [
      task.id,
      task.title || task.description?.slice(0, 50) || "Untitled",
      task.agent_id || "",
      task.status,
      task.human_action_type || "",
      task.created_at,
      task.completed_at || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) =>
        row
          .map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `tasks-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    toast({
      title: "Tasks exported",
      description: `${filteredTasks.length} tasks exported to CSV`,
    })
  }

  // Export to JSON
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredTasks, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `tasks-export-${format(new Date(), "yyyy-MM-dd")}.json`
    link.click()
    toast({
      title: "Tasks exported",
      description: `${filteredTasks.length} tasks exported to JSON`,
    })
  }

  // Connect to external task system
  const handleConnectSource = async (sourceId: string) => {
    setConnectingSource(sourceId)
    try {
      const result = await api.connectScopedApp({ enterprise_id: enterpriseId || "", app: sourceId, scope: "enterprise" })
      if (result.auth_url) {
        window.open(result.auth_url, "_blank", "width=600,height=700")
      }
      toast({ title: `Connecting to ${sourceId}...` })
    } catch {
      toast({ variant: "destructive", title: "Connection failed" })
    } finally {
      setConnectingSource(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="tasks" className="container p-6 h-full flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="tasks" className="flex items-center gap-1.5">
          <ListTodo className="size-4" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="approvals" className="flex items-center gap-1.5">
          <ShieldCheck className="size-4" />
          Approvals
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tasks" className="flex-1 min-h-0 overflow-auto mt-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListTodo className="size-6" />
              Task History
            </h1>
            <p className="text-muted-foreground">
              View and analyze all agent task executions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 size-4" />
              Create Task
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats?.completed || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {stats?.pending || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto-Approved</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {stats?.auto_approved || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approval Rate</CardDescription>
              <CardTitle className="text-3xl">
                {(stats as unknown as { approval_rate?: number })?.approval_rate
                  ? `${((stats as unknown as { approval_rate: number }).approval_rate * 100).toFixed(0)}%`
                  : "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Task Source Connectors */}
        {showConnectors && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="size-5" />
                Task Management Integrations
              </CardTitle>
              <CardDescription>
                Sync tasks with external project management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {TASK_CONNECTORS.map((connector) => {
                  const Icon = connector.icon
                  return (
                    <TooltipProvider key={connector.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card
                            className={`cursor-pointer hover:border-primary transition-colors ${
                              connector.connected
                                ? "border-green-500 bg-green-50/50"
                                : ""
                            }`}
                            onClick={() => handleConnectSource(connector.id)}
                          >
                            <CardContent className="p-4 flex items-center gap-3">
                              <div
                                className="size-10 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: `${connector.color}15`,
                                }}
                              >
                                <Icon
                                  className="size-5"
                                  style={{ color: connector.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {connector.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {connector.connected
                                    ? "Connected"
                                    : "Click to connect"}
                                </p>
                              </div>
                              {connectingSource === connector.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : connector.connected ? (
                                <CheckCircle2 className="size-4 text-green-600" />
                              ) : (
                                <ExternalLink className="size-4 text-muted-foreground" />
                              )}
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sync tasks with {connector.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConnectors(!showConnectors)}
                >
                  <Link2 className="mr-2 size-4" />
                  Connectors
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 size-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileSpreadsheet className="mr-2 size-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToJSON}>
                      <Download className="mr-2 size-4" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <Calendar className="mr-2 size-4" />
                      Schedule Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <ListTodo className="mx-auto size-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No tasks found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task: Task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTask(task)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium truncate max-w-xs">
                            {task.title ||
                              task.description?.slice(0, 50) ||
                              "Untitled"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {task.id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-muted-foreground" />
                          <span className="text-sm">
                            {task.agent_id || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusColors[task.status]} flex items-center gap-1 w-fit`}
                        >
                          {statusIcons[task.status]}
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.requires_human_action ? (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            <Clock className="mr-1 size-3" />
                            {task.human_action_type || "Pending"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(task.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedTask(task)
                                  }}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {(task.status === "failed" ||
                            task.status === "pending") && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={retryMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      retryMutation.mutate(task.id)
                                    }}
                                  >
                                    {retryMutation.isPending ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="size-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Retry task</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Showing {startIndex + 1}-{endIndex} of {totalItems} tasks
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Detail Dialog */}
        {selectedTask && (
          <TaskDetailDialog
            open={!!selectedTask}
            onOpenChange={(open) => !open && setSelectedTask(null)}
            task={selectedTask}
            onRetry={(taskId) => retryMutation.mutate(taskId)}
            isRetrying={retryMutation.isPending}
          />
        )}

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          enterpriseId={enterpriseId || ""}
        />
      </TabsContent>

      <TabsContent value="approvals" className="flex-1 min-h-0 overflow-hidden mt-0">
        <ApprovalsTab />
      </TabsContent>
    </Tabs>
  )
}

function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onRetry,
  isRetrying,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onRetry: (taskId: string) => void
  isRetrying: boolean
}) {
  // Fetch tool calls when dialog opens
  const { data: toolCalls, isLoading: toolCallsLoading } = useQuery({
    queryKey: ["tasks", task.id, "tool-calls"],
    queryFn: () => api.getTaskToolCalls(task.id),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="size-5" />
            Task Details
          </DialogTitle>
          <DialogDescription>ID: {task.id}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="tools">
              Tools{" "}
              {toolCalls && toolCalls.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {toolCalls.length}
                </Badge>
              )}
            </TabsTrigger>
            {task.human_action_reason && (
              <TabsTrigger value="feedback">Human Action</TabsTrigger>
            )}
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[task.status]}>
                    {statusIcons[task.status]}
                    <span className="ml-1">{task.status}</span>
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <div className="flex items-center gap-2">
                    <Bot className="size-4" />
                    <span>{task.agent_id || "—"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{format(new Date(task.created_at), "PPpp")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p>
                    {task.completed_at
                      ? format(new Date(task.completed_at), "PPpp")
                      : "—"}
                  </p>
                </div>
                {task.requires_human_action && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Human Action
                    </p>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {task.human_action_type || "pending"}
                    </Badge>
                  </div>
                )}
                {task.duration_ms != null && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p>{(task.duration_ms / 1000).toFixed(1)}s</p>
                  </div>
                )}
                {task.conversation_id && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Session</p>
                    <Badge variant="outline" className="font-mono text-xs">
                      {task.conversation_id.slice(0, 12)}...
                    </Badge>
                  </div>
                )}
              </div>

              {task.error_message && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="font-medium text-red-800 mb-2">Error</h4>
                  <p className="text-sm text-red-700 font-mono">
                    {task.error_message}
                  </p>
                </div>
              )}

              {(task.status === "failed" || task.status === "pending") && (
                <Button
                  variant="outline"
                  onClick={() => onRetry(task.id)}
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Retry Task
                </Button>
              )}
            </TabsContent>

            <TabsContent value="input" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.title && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Title
                      </p>
                      <p className="font-medium">{task.title}</p>
                    </div>
                  )}
                  {task.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-sm">{task.description}</p>
                    </div>
                  )}
                  {!task.title && !task.description && (
                    <p className="text-sm text-muted-foreground">
                      No input provided
                    </p>
                  )}
                </CardContent>
              </Card>
              {task.input && Object.keys(task.input).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                      {JSON.stringify(task.input, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="output" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Output</CardTitle>
                </CardHeader>
                <CardContent>
                  {task.output && Object.keys(task.output).length > 0 ? (
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                      {JSON.stringify(task.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No output yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="mt-4 space-y-3">
              {toolCallsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : toolCalls && toolCalls.length > 0 ? (
                toolCalls.map(
                  (
                    tc: _TaskToolCall & {
                      tool_name?: string
                      sequence?: number
                      success?: boolean
                      tool_input?: Record<string, unknown>
                      tool_output?: Record<string, unknown>
                      error_message?: string
                    }
                  ) => (
                    <Card key={tc.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Wrench className="size-4" />
                            <span className="font-mono">{tc.tool_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              #{tc.sequence}
                            </Badge>
                          </CardTitle>
                          {tc.success === true && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle2 className="mr-1 size-3" />
                              OK
                            </Badge>
                          )}
                          {tc.success === false && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <XCircle className="mr-1 size-3" />
                              Error
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tc.tool_input && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Input
                            </p>
                            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-[150px]">
                              {JSON.stringify(tc.tool_input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {tc.tool_output && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Output
                            </p>
                            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                              {JSON.stringify(tc.tool_output, null, 2)}
                            </pre>
                          </div>
                        )}
                        {tc.error_message && (
                          <div className="rounded border border-red-200 bg-red-50 p-2">
                            <p className="text-xs text-red-700 font-mono">
                              {tc.error_message}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                )
              ) : (
                <div className="text-center py-8">
                  <Wrench className="mx-auto size-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No tool calls recorded
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tool calls will appear here after task execution
                  </p>
                </div>
              )}
            </TabsContent>

            {task.human_action_reason && (
              <TabsContent value="feedback" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Human Action Required
                    </CardTitle>
                    {task.human_action_type && (
                      <CardDescription>
                        Type: {task.human_action_type}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{task.human_action_reason}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function CreateTaskDialog({
  open,
  onOpenChange,
  enterpriseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enterpriseId: string
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [agentId, setAgentId] = useState("")
  const [priority, setPriority] = useState("normal")

  const { data: agentsData } = useAgents({
    enterprise_id: enterpriseId,
    enabled: !!enterpriseId && open,
  })

  const agents = agentsData?.items || []

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({
        title: "Task created",
        description: "The task has been created and assigned to the agent.",
      })
      resetForm()
      onOpenChange(false)
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create task" })
    },
  })

  const resetForm = useCallback(() => {
    setTitle("")
    setDescription("")
    setAgentId("")
    setPriority("normal")
  }, [])

  const handleSubmit = () => {
    if (!title.trim() || !agentId) return
    createMutation.mutate({
      enterprise_id: enterpriseId,
      agent_id: agentId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      input: { source_type: "manual" },
    })
  }

  const selectedAgent = agents.find((a: Agent) => a.id === agentId)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Create Manual Task
          </DialogTitle>
          <DialogDescription>
            Create a task and assign it to an agent for execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              placeholder="e.g. Analyze Q4 sales report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Provide additional context or instructions for the agent..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign Agent *</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: Agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <Bot className="size-4 text-muted-foreground" />
                      <span>{agent.display_name || agent.name}</span>
                      {agent.specialization && (
                        <span className="text-xs text-muted-foreground">
                          ({agent.specialization})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgent?.description && (
              <p className="text-xs text-muted-foreground">
                {selectedAgent.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !agentId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
