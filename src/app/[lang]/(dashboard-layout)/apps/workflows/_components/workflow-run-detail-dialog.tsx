"use client"

import { useState } from "react"
import {
  CheckCircle,
  Circle,
  Clock,
  Loader2,
  Play,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import type { WorkflowRun, WorkflowStepDef } from "@/lib/api/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; label: string; color: string }
> = {
  pending: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  running: { icon: Loader2, label: "Running", color: "text-blue-500" },
  awaiting_approval: {
    icon: ShieldAlert,
    label: "Awaiting Approval",
    color: "text-orange-500",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    color: "text-green-500",
  },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500" },
}

interface WorkflowRunDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  run: WorkflowRun | null
  steps: WorkflowStepDef[]
  onResume: (approvalContext?: Record<string, unknown>) => void
  resuming?: boolean
}

export function WorkflowRunDetailDialog({
  open,
  onOpenChange,
  run,
  steps,
  onResume,
  resuming,
}: WorkflowRunDetailDialogProps) {
  const [approvalNotes, setApprovalNotes] = useState("")

  if (!run) return null

  const config = STATUS_CONFIG[run.status] ?? STATUS_CONFIG["pending"]!
  const StatusIcon = config!.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon
              className={`h-4 w-4 ${config!.color} ${run.status === "running" ? "animate-spin" : ""}`}
            />
            Run {run.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Status: <Badge variant="outline">{config!.label}</Badge>
          </p>
          {run.error && (
            <p className="text-red-500">Error: {run.error}</p>
          )}
        </div>

        {/* Step timeline */}
        <div className="space-y-0 mt-4">
          {steps.map((step, index) => {
            const isPast = index < run.current_step
            const isCurrent = index === run.current_step
            let stepStatus: "done" | "active" | "waiting" | "future"
            if (run.status === "completed") {
              stepStatus = "done"
            } else if (run.status === "failed" && isCurrent) {
              stepStatus = "active"
            } else if (isPast) {
              stepStatus = "done"
            } else if (isCurrent) {
              stepStatus =
                run.status === "awaiting_approval" ? "waiting" : "active"
            } else {
              stepStatus = "future"
            }

            const outputKey = step.output_key ?? `step_${index}`
            const output = run.context[outputKey] as string | Record<string, unknown> | undefined

            return (
              <div key={index} className="flex gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      stepStatus === "done"
                        ? "border-green-500 bg-green-500"
                        : stepStatus === "active"
                          ? "border-blue-500 bg-blue-500"
                          : stepStatus === "waiting"
                            ? "border-orange-500 bg-orange-500"
                            : "border-muted-foreground/30 bg-background"
                    }`}
                  >
                    {stepStatus === "done" && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                    {stepStatus === "active" && (
                      <Play className="h-2.5 w-2.5 text-white" />
                    )}
                    {stepStatus === "waiting" && (
                      <Clock className="h-2.5 w-2.5 text-white" />
                    )}
                    {stepStatus === "future" && (
                      <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[24px] ${
                        isPast ? "bg-green-500" : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Step {index + 1}:{" "}
                    {step.type === "agent_task"
                      ? `Agent ${step.agent_id ?? "?"}`
                      : step.title ?? "Approval Required"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.type === "agent_task"
                      ? step.prompt?.substring(0, 120) ?? ""
                      : "Human approval gate"}
                    {step.type === "agent_task" &&
                      (step.prompt?.length ?? 0) > 120 &&
                      "..."}
                  </p>

                  {/* Show output for completed steps */}
                  {stepStatus === "done" && output && (
                    <pre className="mt-1 text-xs bg-muted p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                      {typeof output === "string"
                        ? output
                        : JSON.stringify(output, null, 2)}
                    </pre>
                  )}

                  {/* Approval form for waiting step */}
                  {stepStatus === "waiting" &&
                    step.type === "require_approval" && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Approval notes (optional)"
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            onResume(
                              approvalNotes.trim()
                                ? { approval_notes: approvalNotes.trim() }
                                : undefined
                            )
                            setApprovalNotes("")
                          }}
                          disabled={resuming}
                        >
                          {resuming ? "Approving..." : "Approve & Continue"}
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
