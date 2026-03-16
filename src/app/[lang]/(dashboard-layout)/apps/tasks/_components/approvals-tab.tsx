"use client"

import { useCallback, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  Building,
  Calendar,
  Check,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react"

import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// ---------------------------------------------------------------------------
// Types (mirrored from approvals page)
// ---------------------------------------------------------------------------
type ApprovalType =
  | "payment"
  | "contract"
  | "hiring"
  | "action"
  | "communication"
  | "other"

type ApprovalPriority = "low" | "medium" | "high" | "urgent"

interface Approval {
  id: string
  enterprise_id: string
  requesting_agent_id: string
  task_id?: string
  type: ApprovalType
  category: string
  title: string
  description?: string
  amount?: number
  status: string
  priority: ApprovalPriority
  created_at: string
  due_at?: string
  resolved_at?: string
  resolved_by?: string
  agent_name?: string
  department_name?: string
  assigned_user_id?: string
  escalated?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const typeIcons: Record<ApprovalType, typeof DollarSign> = {
  payment: DollarSign,
  contract: FileText,
  hiring: Users,
  action: Zap,
  communication: MessageSquare,
  other: AlertCircle,
}

const priorityColors: Record<ApprovalPriority, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const statusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ApprovalsTab() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>("pending")
  const [scope, setScope] = useState<"mine" | "department" | "all">("mine")
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null
  )
  const [mode, setMode] = useState<"view" | "approve" | "reject" | "escalate">(
    "view"
  )
  const [comments, setComments] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [escalateReason, setEscalateReason] = useState("")

  // Fetch approvals
  const {
    data: approvalsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["approvals", filter, scope],
    queryFn: () =>
      api.getApprovals({
        status: filter === "all" ? undefined : filter,
      }),
    staleTime: 30000,
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["approval-stats"],
    queryFn: () => api.getApprovalStats(),
    staleTime: 30000,
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, c }: { id: string; c?: string }) =>
      api.approveApproval(id, c),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      queryClient.invalidateQueries({ queryKey: ["approval-stats"] })
      setSelectedApproval(null)
      setMode("view")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectApproval(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      queryClient.invalidateQueries({ queryKey: ["approval-stats"] })
      setSelectedApproval(null)
      setMode("view")
    },
  })

  const escalateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.escalateApproval(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      queryClient.invalidateQueries({ queryKey: ["approval-stats"] })
      setSelectedApproval(null)
      setMode("view")
    },
  })

  const isSubmitting =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    escalateMutation.isPending

  const handleApprove = useCallback(async () => {
    if (!selectedApproval) return
    try {
      await approveMutation.mutateAsync({
        id: selectedApproval.id,
        c: comments || undefined,
      })
      toast({
        title: "Approved",
        description: `"${selectedApproval.title}" approved.`,
      })
      setComments("")
    } catch {
      toast({ variant: "destructive", title: "Error approving" })
    }
  }, [approveMutation, selectedApproval, comments])

  const handleReject = useCallback(async () => {
    if (!selectedApproval || !rejectReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please provide a reason for rejection.",
      })
      return
    }
    try {
      await rejectMutation.mutateAsync({
        id: selectedApproval.id,
        reason: rejectReason,
      })
      toast({
        title: "Rejected",
        description: `"${selectedApproval.title}" rejected.`,
      })
      setRejectReason("")
    } catch {
      toast({ variant: "destructive", title: "Error rejecting" })
    }
  }, [rejectMutation, selectedApproval, rejectReason])

  const handleEscalate = useCallback(async () => {
    if (!selectedApproval) return
    try {
      await escalateMutation.mutateAsync({
        id: selectedApproval.id,
        reason: escalateReason || undefined,
      })
      toast({
        title: "Escalated",
        description: `"${selectedApproval.title}" escalated.`,
      })
      setEscalateReason("")
    } catch {
      toast({ variant: "destructive", title: "Error escalating" })
    }
  }, [escalateMutation, selectedApproval, escalateReason])

  const approvals: Approval[] = (approvalsData as unknown as Approval[]) || []
  const isPending = selectedApproval?.status === "pending"

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 shrink-0">
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
            <CardDescription>Approved Today</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats?.approved_today || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected Today</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats?.rejected_today || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.avg_response_minutes
                ? `${Math.round(stats.avg_response_minutes)}m`
                : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters + Scope */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(f)
              setSelectedApproval(null)
            }}
          >
            {f === "pending"
              ? "Pending"
              : f === "approved"
                ? "Approved"
                : f === "rejected"
                  ? "Rejected"
                  : "All"}
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["mine", "department", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                scope === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "mine" ? "Mine" : s === "department" ? "Dept" : "All"}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => refetch()}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* List + Detail */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Approvals list */}
        <Card className="w-full lg:w-[420px] shrink-0 flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : approvals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <ShieldCheck className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  No {filter === "all" ? "" : filter} approvals
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 p-3">
                  {approvals.map((approval) => {
                    const Icon = typeIcons[approval.type] || AlertCircle
                    const isSelected = selectedApproval?.id === approval.id

                    return (
                      <div
                        key={approval.id}
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50",
                          isSelected && "border-primary bg-muted/50"
                        )}
                        onClick={() => {
                          setSelectedApproval(approval)
                          setMode("view")
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              approval.priority === "urgent"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-muted"
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {approval.title}
                              </span>
                              {approval.escalated && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Escalated
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Bot className="size-3" />
                              <span className="truncate">
                                {approval.agent_name ||
                                  approval.requesting_agent_id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  statusColors[approval.status]
                                )}
                              >
                                {approval.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  priorityColors[approval.priority]
                                )}
                              >
                                {approval.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {formatDistanceToNow(
                                  new Date(approval.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Detail panel */}
        {selectedApproval ? (
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedApproval.title}
                  {selectedApproval.escalated && (
                    <Badge variant="destructive" className="text-xs">
                      Escalated
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedApproval.category}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedApproval(null)}
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    selectedApproval.status === "approved"
                      ? "default"
                      : selectedApproval.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {selectedApproval.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    selectedApproval.priority === "urgent" &&
                      "border-red-500 text-red-500",
                    selectedApproval.priority === "high" &&
                      "border-orange-500 text-orange-500"
                  )}
                >
                  {selectedApproval.priority}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Bot className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Agent:</span>
                  <span className="font-medium">
                    {selectedApproval.agent_name ||
                      selectedApproval.requesting_agent_id}
                  </span>
                </div>
                {selectedApproval.department_name && (
                  <div className="flex items-center gap-3">
                    <Building className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dept:</span>
                    <span className="font-medium">
                      {selectedApproval.department_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {format(new Date(selectedApproval.created_at), "PPp")}
                  </span>
                </div>
                {selectedApproval.due_at && (
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Due:</span>
                    <span className="font-medium">
                      {format(new Date(selectedApproval.due_at), "PPp")}
                    </span>
                  </div>
                )}
                {selectedApproval.amount != null && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium text-lg">
                      ${selectedApproval.amount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {selectedApproval.description && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                    {selectedApproval.description}
                  </div>
                </>
              )}

              {/* Approve/Reject/Escalate forms */}
              {mode === "approve" && isPending && (
                <div className="space-y-2 animate-in slide-in-from-bottom-4">
                  <Label>Comments (optional)</Label>
                  <Textarea
                    placeholder="Add comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
              {mode === "reject" && isPending && (
                <div className="space-y-2 animate-in slide-in-from-bottom-4">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    placeholder="Provide a reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              )}
              {mode === "escalate" && isPending && (
                <div className="space-y-2 animate-in slide-in-from-bottom-4">
                  <Label>Escalation Reason (optional)</Label>
                  <Textarea
                    placeholder="Why escalate?"
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                  />
                </div>
              )}
            </CardContent>

            {isPending && (
              <CardFooter className="flex gap-2 border-t pt-4">
                {mode === "view" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => setMode("approve")}
                    >
                      <Check className="mr-2 size-4" />
                      Approve
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => setMode("escalate")}
                    >
                      <ArrowUpRight className="mr-2 size-4" />
                      Escalate
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => setMode("reject")}
                    >
                      <X className="mr-2 size-4" />
                      Reject
                    </Button>
                  </>
                )}
                {mode === "approve" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setMode("view")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Confirm Approval
                    </Button>
                  </>
                )}
                {mode === "reject" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setMode("view")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Confirm Rejection
                    </Button>
                  </>
                )}
                {mode === "escalate" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setMode("view")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={handleEscalate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Confirm Escalation
                    </Button>
                  </>
                )}
              </CardFooter>
            )}
          </Card>
        ) : (
          <Card className="flex-1 hidden lg:flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <ShieldCheck className="size-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Select an Approval</h3>
                <p className="text-muted-foreground text-sm">
                  Choose an approval to view details and take action
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
