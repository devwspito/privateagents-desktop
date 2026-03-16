"use client"

import { format } from "date-fns"
import {
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Hash,
  Loader2,
  Network,
  Users,
  X,
  XCircle,
} from "lucide-react"

import type {
  A2AEnterpriseMessage,
  A2AMessageType,
  A2APriority,
} from "../types"

import { useOrchestrations } from "@/lib/api/hooks"
import { cn } from "@/lib/utils"

import { useCommunicationsContext } from "../_hooks/use-communications-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const typeColors: Record<A2AMessageType, string> = {
  request: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  response: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  notification:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  handoff:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  escalation: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const typeDotColors: Record<A2AMessageType, string> = {
  request: "bg-blue-500",
  response: "bg-green-500",
  notification: "bg-yellow-500",
  handoff: "bg-purple-500",
  escalation: "bg-red-500",
}

const priorityBadge: Record<A2APriority, { show: boolean; class: string }> = {
  low: { show: false, class: "" },
  normal: { show: false, class: "" },
  high: {
    show: true,
    class: "border-orange-500 text-orange-500",
  },
  urgent: {
    show: true,
    class: "border-red-500 text-red-500 font-bold",
  },
}

function MessageTimelineItem({
  message,
  isLast,
}: {
  message: A2AEnterpriseMessage
  isLast: boolean
}) {
  const pBadge = priorityBadge[message.priority]

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-3 rounded-full shrink-0 mt-1.5",
            typeDotColors[message.message_type]
          )}
        />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        {/* Header: time + agent + dept */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs text-muted-foreground font-mono">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          <span className="text-sm font-medium">
            {message.from_agent_name || message.from_agent_id}
          </span>
          {message.from_department_name && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {message.from_department_name}
            </Badge>
          )}
          {message.to_agent_name && (
            <>
              <ArrowRight className="size-3 text-muted-foreground" />
              <span className="text-sm">{message.to_agent_name}</span>
              {message.to_department_name &&
                message.to_department_name !== message.from_department_name && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {message.to_department_name}
                  </Badge>
                )}
            </>
          )}
        </div>

        {/* Type badge + priority */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0",
              typeColors[message.message_type]
            )}
          >
            {message.message_type}
          </Badge>
          {pBadge.show && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", pBadge.class)}
            >
              {message.priority.toUpperCase()}
            </Badge>
          )}
          {message.subject && (
            <span className="text-xs text-muted-foreground italic truncate">
              {message.subject}
            </span>
          )}
        </div>

        {/* Body */}
        {message.body && (
          <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
            {message.body}
          </div>
        )}
      </div>
    </div>
  )
}

const STEP_STATUS_ICONS: Record<string, typeof Circle> = {
  pending: Circle,
  executing: Loader2,
  waiting_response: Loader2,
  waiting_human: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

const STEP_STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  executing: "text-blue-500 animate-spin",
  waiting_response: "text-yellow-500 animate-spin",
  waiting_human: "text-orange-500 animate-spin",
  completed: "text-green-500",
  failed: "text-red-500",
}

function OrchestrationPanel({
  orchestration,
}: {
  orchestration: {
    id: string
    status: string
    current_step: number
    total_steps: number
    original_message: string
    summary: string | null
    steps?: {
      id: string
      step_number: number
      action: string
      description: string | null
      target_agent_name?: string | null
      status: string
      response_received: string | null
      error: string | null
    }[]
  }
}) {
  const statusLabel =
    orchestration.status === "completed"
      ? "Completed"
      : orchestration.status === "failed"
        ? "Failed"
        : orchestration.status === "cancelled"
          ? "Cancelled"
          : `Step ${orchestration.current_step}/${orchestration.total_steps}`

  return (
    <div className="border rounded-lg bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-primary" />
          <span className="text-sm font-semibold">Orchestration</span>
          <Badge
            variant={
              orchestration.status === "completed"
                ? "default"
                : orchestration.status === "failed"
                  ? "destructive"
                  : "secondary"
            }
            className="text-[10px]"
          >
            {statusLabel}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {orchestration.id.slice(0, 8)}
        </span>
      </div>

      {orchestration.summary && (
        <p className="text-sm text-muted-foreground">{orchestration.summary}</p>
      )}

      {orchestration.steps && orchestration.steps.length > 0 && (
        <div className="space-y-2">
          {orchestration.steps.map((step) => {
            const Icon = STEP_STATUS_ICONS[step.status] || Circle
            const iconColor =
              STEP_STATUS_COLORS[step.status] || "text-muted-foreground"

            return (
              <div key={step.id} className="flex items-start gap-2">
                <Icon className={cn("size-4 mt-0.5 shrink-0", iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Step {step.step_number}:
                    </span>
                    <span className="text-sm truncate">
                      {step.description || step.action}
                    </span>
                    {step.target_agent_name && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                      >
                        {step.target_agent_name}
                      </Badge>
                    )}
                  </div>
                  {step.response_received && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {step.response_received}
                    </p>
                  )}
                  {step.error && (
                    <p className="text-xs text-red-500 mt-1">{step.error}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ThreadDetail() {
  const { selectedThread, selectThread } = useCommunicationsContext()

  // Fetch orchestration if thread has a conversationId
  const { data: orchData } = useOrchestrations(
    selectedThread?.conversationId
      ? { conversation_id: selectedThread.conversationId, limit: 1 }
      : undefined
  )
  const orchestration = orchData?.orchestrations?.[0] || null

  if (!selectedThread) {
    return (
      <Card className="flex-1 hidden lg:flex items-center justify-center">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <Network className="size-16 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">Select a Discussion Thread</h3>
            <p className="text-muted-foreground text-sm">
              Choose a thread from the list to view the agent conversation
              timeline
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const thread = selectedThread
  const firstMsg = thread.messages[0]!
  const sortedMessages = [...thread.messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-lg truncate">{thread.subject}</CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            {/* Department pair */}
            {thread.departmentPair.from && (
              <span className="flex items-center gap-1">
                <Building className="size-3" />
                {thread.departmentPair.from.name}
              </span>
            )}
            {thread.departmentPair.from && thread.departmentPair.to && (
              <ArrowRight className="size-3" />
            )}
            {thread.departmentPair.to && (
              <span className="flex items-center gap-1">
                <Building className="size-3" />
                {thread.departmentPair.to.name}
              </span>
            )}
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {thread.participants.length} participants
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1">
              <Hash className="size-3" />
              {thread.messageCount} messages
            </span>
            {thread.taskId && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="flex items-center gap-1 text-primary">
                  <ExternalLink className="size-3" />
                  Task: {thread.taskId.slice(0, 8)}
                </span>
              </>
            )}
          </CardDescription>

          {/* Priority + type badges */}
          <div className="flex items-center gap-2 pt-1">
            {thread.highestPriority !== "low" &&
              thread.highestPriority !== "normal" && (
                <Badge
                  variant="outline"
                  className={cn(
                    priorityBadge[thread.highestPriority].class,
                    "text-xs"
                  )}
                >
                  {thread.highestPriority.toUpperCase()}
                </Badge>
              )}
            {thread.messageTypes.map((type: A2AMessageType) => (
              <Badge
                key={type}
                variant="secondary"
                className={cn("text-[10px]", typeColors[type])}
              >
                {type}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Calendar className="size-3" />
              Started {format(new Date(firstMsg.created_at), "MMM d, HH:mm")}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => selectThread(null)}>
          <X className="size-4" />
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Orchestration panel (if linked) */}
            {orchestration && (
              <div className="mb-4">
                <OrchestrationPanel orchestration={orchestration as unknown as Parameters<typeof OrchestrationPanel>[0]["orchestration"]} />
              </div>
            )}

            {sortedMessages.map((msg: A2AEnterpriseMessage, i: number) => (
              <MessageTimelineItem
                key={msg.id}
                message={msg}
                isLast={i === sortedMessages.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
