"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Wrench, XCircle } from "lucide-react"

import type { ToolCallEvent } from "../_hooks/use-chat-stream"

import { cn } from "@/lib/utils"

import { Progress } from "@/components/ui/progress"

// Human-readable labels for common tool actions
const A2A_TOOL_NAMES = new Set(["sessions_spawn", "message"])

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  sessions_spawn: { label: "Delegating to agent", icon: "users" },
  message: { label: "Communicating with agent", icon: "message" },
  googledrive_find_file: { label: "Searching Google Drive", icon: "search" },
  googledrive_download_file: { label: "Downloading file", icon: "download" },
  googledrive_create_file_from_text: {
    label: "Creating document",
    icon: "file",
  },
  googledrive_upload_file: { label: "Uploading to Drive", icon: "upload" },
  googledrive_add_file_sharing: { label: "Sharing file", icon: "share" },
  gmail_send_email: { label: "Sending email", icon: "mail" },
  gmail_reply_to_thread: { label: "Replying to email", icon: "reply" },
  gmail_fetch_emails: { label: "Fetching emails", icon: "inbox" },
  slack_send_message: { label: "Sending Slack message", icon: "message" },
  whatsapp_send: { label: "Sending WhatsApp message", icon: "message" },
}

function getToolLabel(toolName: string): string {
  const key = toolName.toLowerCase()
  return TOOL_LABELS[key]?.label || `Running ${toolName}`
}

function ToolCallItem({ toolCall }: { toolCall: ToolCallEvent }) {
  const [elapsed, setElapsed] = useState(0)
  const isA2A = A2A_TOOL_NAMES.has(toolCall.tool_name)

  useEffect(() => {
    if (toolCall.status !== "running") return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - toolCall.startedAt) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [toolCall.status, toolCall.startedAt])

  const isRunning = toolCall.status === "running"
  const isCompleted = toolCall.status === "completed"
  const isFailed = toolCall.status === "failed"

  // Extract target agent name from sessions_spawn/message args
  const targetAgent = isA2A
    ? (toolCall.tool_args?.agentId as string) ||
      (toolCall.tool_args?.agent_id as string) ||
      ""
    : ""
  // Show just the readable part (e.g. "it-analyst" from "enterprise-id-it-analyst")
  const agentDisplayName = targetAgent.includes("-")
    ? targetAgent.split("-").slice(-2).join(" ").replace(/^\w/, (c) => c.toUpperCase())
    : targetAgent

  if (isA2A) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
          isRunning && "border-purple-500/30 bg-purple-500/5",
          isCompleted && "border-green-500/30 bg-green-500/5",
          isFailed && "border-red-500/30 bg-red-500/5"
        )}
      >
        <div className="mt-0.5">
          {isRunning && (
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          )}
          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {isFailed && <XCircle className="h-4 w-4 text-red-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">
              {isRunning
                ? `@${agentDisplayName} working...`
                : isCompleted
                  ? `@${agentDisplayName} finished`
                  : `@${agentDisplayName} failed`}
            </span>
            {isRunning && (
              <span className="text-xs text-muted-foreground shrink-0">
                {elapsed}s
              </span>
            )}
          </div>

          {isRunning && <Progress className="mt-1.5 h-1" value={undefined} />}

          {/* Show the message sent to the sub-agent */}
          {toolCall.tool_args?.message && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {String(toolCall.tool_args.message).slice(0, 150)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        isRunning && "border-blue-500/30 bg-blue-500/5",
        isCompleted && "border-green-500/30 bg-green-500/5",
        isFailed && "border-red-500/30 bg-red-500/5"
      )}
    >
      <div className="mt-0.5">
        {isRunning && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
        {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {isFailed && <XCircle className="h-4 w-4 text-red-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">
            {getToolLabel(toolCall.tool_name)}
          </span>
          {isRunning && (
            <span className="text-xs text-muted-foreground shrink-0">
              {elapsed}s
            </span>
          )}
        </div>

        {isRunning && <Progress className="mt-1.5 h-1" value={undefined} />}

        {/* Show brief tool args summary for context */}
        {toolCall.tool_args && Object.keys(toolCall.tool_args).length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {formatToolArgs(toolCall.tool_args)}
          </p>
        )}
      </div>
    </div>
  )
}

function formatToolArgs(args: Record<string, unknown>): string {
  const parts: string[] = []

  // Show the most relevant arg values
  for (const [_key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.length > 0) {
      const truncated = value.length > 60 ? value.slice(0, 60) + "..." : value
      parts.push(truncated)
      if (parts.length >= 2) break
    }
  }

  return parts.join(" | ") || ""
}

export function ToolCallProgress({
  toolCalls,
}: {
  toolCalls: ToolCallEvent[]
}) {
  if (toolCalls.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wrench className="h-3 w-3" />
        <span>Agent actions</span>
      </div>
      {toolCalls.map((tc, idx) => (
        <ToolCallItem key={`${tc.tool_name}-${idx}`} toolCall={tc} />
      ))}
    </div>
  )
}
