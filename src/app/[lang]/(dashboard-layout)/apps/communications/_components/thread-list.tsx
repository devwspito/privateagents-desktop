"use client"

import { formatDistanceToNow } from "date-fns"
import { ArrowRight, ExternalLink, MessageSquare, Network } from "lucide-react"

import type { A2AMessageType, A2APriority, MonitoringThread } from "../types"

import { cn } from "@/lib/utils"

import { useCommunicationsContext } from "../_hooks/use-communications-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const typeColors: Record<A2AMessageType, string> = {
  request: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  response: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  notification:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  handoff:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  escalation: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const priorityIndicator: Record<A2APriority, string | null> = {
  low: null,
  normal: null,
  high: "bg-orange-500",
  urgent: "bg-red-500 animate-pulse",
}

function ThreadItem({
  thread,
  isSelected,
  onSelect,
}: {
  thread: MonitoringThread
  isSelected: boolean
  onSelect: (thread: MonitoringThread) => void
}) {
  const latestType = thread.latestMessage.message_type
  const priorityDot = priorityIndicator[thread.highestPriority]

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50",
        isSelected && "border-primary bg-muted/50"
      )}
      onClick={() => onSelect(thread)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Row 1: Type badge + Subject + Time */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 text-[10px] px-1.5 py-0",
                typeColors[latestType]
              )}
            >
              {latestType}
            </Badge>
            {priorityDot && (
              <span
                className={cn("size-2 rounded-full shrink-0", priorityDot)}
              />
            )}
            <span className="font-medium text-sm truncate flex-1">
              {thread.subject}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(thread.lastActivity), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Row 2: Agent A [Dept] → Agent B [Dept] */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">
              {thread.participants[0]?.agentName || "Unknown"}
              {thread.departmentPair.from && (
                <span className="text-muted-foreground/60">
                  {" "}
                  [{thread.departmentPair.from.name}]
                </span>
              )}
            </span>
            {thread.participants.length > 1 && (
              <>
                <ArrowRight className="size-3 shrink-0" />
                <span className="truncate">
                  {thread.participants[1]?.agentName || "Unknown"}
                  {thread.departmentPair.to && (
                    <span className="text-muted-foreground/60">
                      {" "}
                      [{thread.departmentPair.to.name}]
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Preview + meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate flex-1">
              {thread.latestMessage.body?.slice(0, 100) || "No content"}
            </span>
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] px-1.5 py-0 h-4"
            >
              {thread.messageCount} msg{thread.messageCount !== 1 && "s"}
            </Badge>
            {thread.taskId && (
              <ExternalLink className="size-3 shrink-0 text-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ThreadList() {
  const { threads, selectedThread, selectThread } = useCommunicationsContext()

  if (threads.length === 0) {
    return (
      <Card className="w-full lg:w-[380px] shrink-0">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <Network className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No communication threads found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full lg:w-[380px] shrink-0 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="size-4" />
          Discussion Threads
          <Badge variant="secondary" className="ml-auto">
            {threads.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2 p-3">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThread?.id === thread.id}
                onSelect={selectThread}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
