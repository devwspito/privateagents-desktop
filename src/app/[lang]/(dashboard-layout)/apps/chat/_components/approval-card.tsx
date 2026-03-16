"use client"

import { AlertTriangle, Check, X } from "lucide-react"

import type { ApprovalEvent } from "../_hooks/use-chat-stream"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Human-readable labels for approval actions
const ACTION_LABELS: Record<string, { label: string; verb: string }> = {
  gmail_send_email: { label: "Send Email", verb: "Send" },
  gmail_reply_to_thread: { label: "Reply to Email", verb: "Reply" },
  googledrive_delete_file: { label: "Delete File", verb: "Delete" },
  googledrive_add_file_sharing: { label: "Share File", verb: "Share" },
  slack_send_message: { label: "Send Slack Message", verb: "Send" },
  whatsapp_send: { label: "Send WhatsApp Message", verb: "Send" },
}

function getActionLabel(action: string): { label: string; verb: string } {
  const key = action.toLowerCase()
  return ACTION_LABELS[key] || { label: action, verb: "Execute" }
}

function ApprovalPreview({
  params,
  preview,
}: {
  params: Record<string, unknown>
  preview: string
}) {
  // If there's a structured preview string, show it
  if (preview) {
    return (
      <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
        {preview}
      </div>
    )
  }

  // Otherwise, show key params
  const entries = Object.entries(params).filter(
    ([, v]) => typeof v === "string" && (v as string).length > 0
  )

  if (entries.length === 0) return null

  return (
    <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
      {entries.slice(0, 5).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="text-muted-foreground font-medium min-w-[80px]">
            {key}:
          </span>
          <span className="truncate">{String(value).slice(0, 200)}</span>
        </div>
      ))}
    </div>
  )
}

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: ApprovalEvent
  onApprove: () => void
  onReject: () => void
}) {
  const { label, verb: _verb } = getActionLabel(approval.action)

  return (
    <Card className="w-full max-w-sm border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Acci&oacute;n ejecutada</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {label} &mdash; &iquest;Aprobar o revertir?
        </p>
      </CardHeader>

      <CardContent className="pb-3">
        <ApprovalPreview params={approval.params} preview={approval.preview} />
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button size="sm" onClick={onApprove} className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Revertir
        </Button>
      </CardFooter>
    </Card>
  )
}
