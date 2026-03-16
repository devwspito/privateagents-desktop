"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { useSession } from "@/providers/auth-provider"
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  FileCode,
  Loader2,
  MessageSquare,
  Play,
  Search,
  Send,
  TestTube,
  RefreshCw,
  Trash2,
  Wrench,
  X,
  XCircle,
} from "lucide-react"

import {
  useCustomToolRequests,
  useCustomToolRequest,
  useUpdateCustomToolRequest,
  useApproveCustomToolRequest,
  useRejectCustomToolRequest,
  useRetryCustomToolRequest,
  useTestCustomToolRequest,
  useDeleteCustomToolRequest,
  useToolInfo,
  useRequestDepartmentAgents,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  researching: {
    label: "Researching",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Search className="size-3" />,
  },
  proposed: {
    label: "Proposed",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: <Eye className="size-3" />,
  },
  building: {
    label: "Building",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Code2 className="size-3" />,
  },
  review: {
    label: "Ready for Review",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: <TestTube className="size-3" />,
  },
  available: {
    label: "Available",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: <CheckCircle2 className="size-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: <XCircle className="size-3" />,
  },
}

export default function ToolRequestsPage() {
  const session = useSession()
  const enterpriseId =
    (session.data?.user as Record<string, string> | undefined)?.["enterprise_id"] || ""

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; title: string } | null>(null)
  const deleteRequest = useDeleteCustomToolRequest()

  const { data: requests, isLoading } = useCustomToolRequests({
    enterprise_id: enterpriseId,
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const statusCounts = useMemo(() => {
    if (!requests) return {}
    const counts: Record<string, number> = {}
    for (const r of requests) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return counts
  }, [requests])

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  // Detail view
  if (selectedRequestId) {
    return (
      <div className="container p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRequestId(null)}
          className="mb-4"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to requests
        </Button>
        <ToolRequestDetail
          requestId={selectedRequestId}
          enterpriseId={enterpriseId}
        />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="size-6" />
            Tool Requests
          </h1>
          <p className="text-muted-foreground">
            Review, test, and approve custom tools built by @team-builder
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter("all")}
        >
          All ({requests?.length || 0})
        </Badge>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Badge
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            className={`cursor-pointer gap-1 ${statusFilter !== status ? config.color : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {config.icon}
            {config.label} ({statusCounts[status] || 0})
          </Badge>
        ))}
      </div>

      {/* Requests list */}
      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No tool requests</p>
            <p className="text-sm mt-1">
              When agents need new tools, requests will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => {
            const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG["researching"]
            return (
              <Card
                key={request.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedRequestId(request.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{request.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {request.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`gap-1 ${statusConf!.color}`}>
                        {statusConf!.icon}
                        {statusConf!.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRequestToDelete({ id: request.id, title: request.title })
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Bot className="size-3" />
                      {request.requested_by_agent_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </span>
                    {request.estimated_delivery && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        ETA: {request.estimated_delivery}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tool request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{requestToDelete?.title}&quot; and its associated tool (if any).
              All related files and configurations will be cleaned up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!requestToDelete) return
                deleteRequest.mutate(requestToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Request deleted", description: `${requestToDelete.title} removed` })
                    setRequestToDelete(null)
                  },
                  onError: (err) => {
                    toast({ variant: "destructive", title: "Error", description: err.message })
                  },
                })
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =============================================================================
// Detail view with testing panel
// =============================================================================
/** Generate a sample payload from tool_meta parameters schema. */
function generateSamplePayload(toolMeta: Record<string, unknown> | null): Record<string, unknown> {
  if (!toolMeta) return {}
  // tool_meta may have { parameters: { ... } } or { properties: { ... } } (JSON Schema)
  const params = (toolMeta.parameters ?? toolMeta) as Record<string, unknown>
  const props = (params.properties ?? params) as Record<string, unknown>
  if (!props || typeof props !== "object") return {}

  const sample: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(props)) {
    if (!schema || typeof schema !== "object") continue
    const s = schema as Record<string, unknown>
    // Use example/default if available, otherwise generate from type
    if (s.example !== undefined) { sample[key] = s.example; continue }
    if (s.default !== undefined) { sample[key] = s.default; continue }
    switch (s.type) {
      case "string": sample[key] = s.enum ? (s.enum as unknown[])[0] : `example_${key}`; break
      case "number": case "integer": sample[key] = 1; break
      case "boolean": sample[key] = true; break
      case "array": sample[key] = []; break
      case "object": sample[key] = {}; break
      default: sample[key] = `example_${key}`
    }
  }
  return sample
}

function ToolRequestDetail({
  requestId,
  enterpriseId: _enterpriseId,
}: {
  requestId: string
  enterpriseId: string
}) {
  const { data: request, isLoading } = useCustomToolRequest(requestId)
  const updateRequest = useUpdateCustomToolRequest()
  const approveRequest = useApproveCustomToolRequest()
  const rejectRequest = useRejectCustomToolRequest()
  const retryRequest = useRetryCustomToolRequest()
  const testRequest = useTestCustomToolRequest()
  const deleteReq = useDeleteCustomToolRequest()
  const { data: toolInfo, isLoading: toolInfoLoading } = useToolInfo(requestId)
  const { data: deptAgents } = useRequestDepartmentAgents(requestId)

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Test panel state — auto-generate payload from tool_meta
  const [testInput, setTestInput] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean; exit_code: number; stdout: string; stderr: string; duration_ms: number
  } | null>(null)

  // Feedback state
  const [feedbackTarget, setFeedbackTarget] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Approve form state
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [approveData, setApproveData] = useState({
    tool_name: "",
    display_name: "",
    description: "",
    tool_path: "",
  })

  if (isLoading || !request) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  // Initialize test input from tool_meta on first render
  const effectiveTestInput = testInput ?? JSON.stringify(
    generateSamplePayload(request.tool_meta),
    null, 2
  )

  const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG["researching"]
  const isReview = request.status === "review"
  const canApprove = isReview
  const canFeedback = ["review", "building"].includes(request.status)
  const canRetry = ["researching", "proposed", "building"].includes(request.status)
  const canReject = !["available", "rejected"].includes(request.status)
  const canTest = !!request.tool_path

  const handleRunTest = (mode: "manual" | "predefined" = "manual") => {
    setTestResult(null)
    let params: Record<string, unknown> = {}
    if (mode === "manual") {
      try {
        params = JSON.parse(effectiveTestInput)
      } catch {
        setTestResult({
          success: false, exit_code: -1,
          stdout: "", stderr: "Invalid JSON in test parameters",
          duration_ms: 0,
        })
        return
      }
    }
    testRequest.mutate(
      { requestId: request.id, params, mode },
      {
        onSuccess: (result) => setTestResult(result as { success: boolean; exit_code: number; stdout: string; stderr: string; duration_ms: number }),
        onError: (err) => setTestResult({
          success: false, exit_code: -1,
          stdout: "", stderr: err.message,
          duration_ms: 0,
        }),
      }
    )
  }

  const handleApprove = () => {
    approveRequest.mutate(
      {
        requestId: request.id,
        data: {
          tool_name: approveData.tool_name || request.tool_name || "",
          display_name: approveData.display_name || request.title,
          description: approveData.description || request.description,
          tool_path: approveData.tool_path || request.tool_path || "",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Tool approved", description: "The tool is now available to all agents" })
          setShowApproveForm(false)
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message })
        },
      }
    )
  }

  const handleReject = () => {
    rejectRequest.mutate(
      { requestId: request.id, feedback: feedbackText },
      {
        onSuccess: () => {
          toast({ title: "Request rejected", description: "Feedback sent to team-builder" })
          setShowRejectDialog(false)
          setFeedbackText("")
        },
      }
    )
  }

  const handleSendFeedback = () => {
    if (!feedbackText.trim() || !feedbackTarget) return
    updateRequest.mutate(
      {
        requestId: request.id,
        data: {
          status_message: feedbackText,
          status: "building",
          feedback_target_agent_id: feedbackTarget,
        },
      },
      {
        onSuccess: () => {
          const agentName = deptAgents?.find((a) => a.id === feedbackTarget)?.display_name || "agent"
          toast({ title: "Feedback sent", description: `Feedback sent to ${agentName}. Request returned to building.` })
          setFeedbackText("")
          setFeedbackTarget("")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{request.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline" className={`gap-1 ${statusConf!.color}`}>
              {statusConf!.icon}
              {statusConf!.label}
            </Badge>
            <span className="flex items-center gap-1">
              <Bot className="size-3" />
              Requested by: {request.requested_by_agent_id}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                retryRequest.mutate(request.id, {
                  onSuccess: () => {
                    toast({
                      title: "Retry sent",
                      description: "A reminder has been sent to the planner agent",
                    })
                  },
                  onError: (err) => {
                    toast({ variant: "destructive", title: "Error", description: err.message })
                  },
                })
              }
              disabled={retryRequest.isPending}
            >
              {retryRequest.isPending ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="size-4 mr-1" />
              )}
              Retry
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setApproveData({
                  tool_name: request.tool_name || "",
                  display_name: request.title,
                  description: request.description,
                  tool_path: request.tool_path || "",
                })
                setShowApproveForm(true)
              }}
            >
              <Check className="size-4 mr-1" />
              Approve Tool
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="size-4 mr-1" />
              Reject
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="test" disabled={!canTest}>
            <TestTube className="size-3 mr-1" />
            Test Tool
          </TabsTrigger>
          {canFeedback && (
            <TabsTrigger value="feedback">
              <MessageSquare className="size-3 mr-1" />
              Request Changes
            </TabsTrigger>
          )}
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{request.description}</p>
            </CardContent>
          </Card>

          {request.use_case && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Use Case</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{request.use_case}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tool Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tool Name</span>
                  <span className="font-mono">{request.tool_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tool Path</span>
                  <span className="font-mono text-xs">{request.tool_path || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Builder Agent</span>
                  <span>{request.builder_agent_id || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewer</span>
                  <span>{request.reviewer_user_id || "Unassigned"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(request.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(request.updated_at).toLocaleString()}</span>
                </div>
                {request.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{new Date(request.approved_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETA</span>
                  <span>{request.estimated_delivery || "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {request.tool_meta && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tool Metadata (_meta.json)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                  {JSON.stringify(request.tool_meta, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {request.status_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Latest Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.status_message}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4 mt-4">
          {/* Tool Info Header */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="size-4" />
                Tool Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              {toolInfoLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Detecting tool info...
                </div>
              ) : toolInfo?.tool_dir ? (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Runtime</span>
                    <Badge variant="outline">{toolInfo.runtime || "unknown"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Point</span>
                    <span className="font-mono text-xs">{toolInfo.entry || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Test File</span>
                    <span className="font-mono text-xs">
                      {toolInfo.test_file ? (
                        <Badge variant="secondary" className="text-xs">{toolInfo.test_file}</Badge>
                      ) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved Path</span>
                    <span className="font-mono text-xs truncate max-w-[300px]" title={toolInfo.tool_dir}>
                      {toolInfo.tool_dir}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {toolInfo.files.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs font-mono">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tool directory not found. The tool may not have been built yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Predefined Tests */}
          {toolInfo?.test_file && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Predefined Tests
                </CardTitle>
                <CardDescription>
                  Run the tests generated by the developer agent ({toolInfo.test_file}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleRunTest("predefined")}
                  disabled={testRequest.isPending}
                  variant="secondary"
                >
                  {testRequest.isPending ? (
                    <Loader2 className="size-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="size-4 mr-1" />
                  )}
                  Run Predefined Tests
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Manual Test */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TestTube className="size-4" />
                Manual Test
              </CardTitle>
              <CardDescription>
                Run the tool with custom parameters.
                {toolInfo?.tool_json ? " Payload auto-generated from tool.json schema." : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action selector if tool.json has actions enum */}
              {(() => {
                const toolJson = toolInfo?.tool_json as Record<string, unknown> | null
                const params = (toolJson?.["parameters"] ?? toolJson) as Record<string, unknown> | null
                const props = (params?.["properties"] ?? params) as Record<string, unknown> | null
                const actionProp = props?.["action"] as Record<string, unknown> | null
                const actions = actionProp?.["enum"] as string[] | null
                if (!actions?.length) return null
                return (
                  <div>
                    <Label>Action</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onChange={(e) => {
                        const action = e.target.value
                        const base = generateSamplePayload(toolJson)
                        setTestInput(JSON.stringify({ ...base, action }, null, 2))
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select an action...</option>
                      {actions.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                )
              })()}

              <div>
                <Label>Input Parameters (JSON)</Label>
                <Textarea
                  value={effectiveTestInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder='{"action": "list_areas"}'
                  className="font-mono text-sm min-h-[120px]"
                />
              </div>

              <Button
                onClick={() => handleRunTest("manual")}
                disabled={testRequest.isPending || !request.tool_path}
              >
                {testRequest.isPending ? (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                ) : (
                  <Play className="size-4 mr-1" />
                )}
                Run Manual Test
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  Test Result
                  <Badge variant={testResult.success ? "default" : "destructive"} className="ml-auto">
                    {testResult.success ? "PASS" : `Exit ${testResult.exit_code}`}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-normal">
                    {testResult.duration_ms}ms
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {testResult.stdout && (
                  <div>
                    <Label className="text-xs text-muted-foreground">stdout</Label>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-80 whitespace-pre-wrap">
                      {testResult.stdout}
                    </pre>
                  </div>
                )}
                {testResult.stderr && (
                  <div>
                    <Label className="text-xs text-muted-foreground">stderr</Label>
                    <pre className="text-xs bg-red-500/10 text-red-600 p-3 rounded-md overflow-auto max-h-40 whitespace-pre-wrap">
                      {testResult.stderr}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feedback Tab — only visible at review/building */}
        {canFeedback && (
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  Request Changes
                </CardTitle>
                <CardDescription>
                  Send feedback to a department agent. The request returns to building phase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Send to</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={feedbackTarget}
                    onChange={(e) => setFeedbackTarget(e.target.value)}
                  >
                    <option value="" disabled>Select agent...</option>
                    {deptAgents?.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.display_name} ({agent.name})
                      </option>
                    ))}
                  </select>
                </div>

                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe the changes needed..."
                  className="min-h-[120px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendFeedback}
                    disabled={!feedbackText.trim() || !feedbackTarget || updateRequest.isPending}
                  >
                    {updateRequest.isPending ? (
                      <Loader2 className="size-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="size-4 mr-1" />
                    )}
                    Send & Return to Building
                  </Button>
                </div>

                {request.status_message && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground">Previous feedback</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{request.status_message}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Approve Dialog */}
      {showApproveForm && (
        <Dialog open={showApproveForm} onOpenChange={setShowApproveForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Approve Tool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tool Name (slug)</Label>
                <Input
                  value={approveData.tool_name}
                  onChange={(e) =>
                    setApproveData({ ...approveData, tool_name: e.target.value })
                  }
                  placeholder="airtable_list_records"
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={approveData.display_name}
                  onChange={(e) =>
                    setApproveData({ ...approveData, display_name: e.target.value })
                  }
                  placeholder="List Airtable Records"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={approveData.description}
                  onChange={(e) =>
                    setApproveData({ ...approveData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Tool Path</Label>
                <Input
                  value={approveData.tool_path}
                  onChange={(e) =>
                    setApproveData({ ...approveData, tool_path: e.target.value })
                  }
                  placeholder="/workspace/tools/custom/airtable_list/"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowApproveForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={!approveData.tool_name || !approveData.tool_path || approveRequest.isPending}
                >
                  {approveRequest.isPending ? (
                    <Loader2 className="size-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="size-4 mr-1" />
                  )}
                  Approve & Publish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject tool request?</AlertDialogTitle>
            <AlertDialogDescription>
              Provide feedback for the team-builder agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Reason for rejection..."
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground"
              disabled={!feedbackText.trim()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tool request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{request.title}&quot; and its associated tool (if any).
              All related files and configurations will be cleaned up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteReq.mutate(request.id, {
                  onSuccess: () => {
                    toast({ title: "Request deleted", description: `${request.title} removed` })
                    setShowDeleteDialog(false)
                  },
                  onError: (err) => {
                    toast({ variant: "destructive", title: "Error", description: err.message })
                  },
                })
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

