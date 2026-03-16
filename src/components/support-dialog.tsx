"use client"

import { useEffect, useState } from "react"
import { Bug, ChevronDown, Loader2, Send } from "lucide-react"

import api from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errorData?: {
    message?: string
    stack?: string
    component?: string
    url?: string
    timestamp?: string
  }
}

export function SupportDialog({
  open,
  onOpenChange,
  errorData,
}: SupportDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Sync title from errorData when dialog opens
  useEffect(() => {
    if (open && errorData?.message) {
      setTitle(errorData.message)
    }
  }, [open, errorData?.message])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setIsPending(true)
    try {
      const ticket = await api.createSupportTicket({
        title: title.trim(),
        description: description.trim() || undefined,
        error_data: errorData || undefined,
        priority,
      })
      // Use alert-style notification since toast may not be available outside QueryProvider
      console.info(`[Support] Ticket ${ticket.id} created`)
      onOpenChange(false)
      setTitle("")
      setDescription("")
      setPriority("medium")
    } catch (err) {
      console.error("[Support] Failed to create ticket:", err)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="size-5" />
            Report Issue
          </DialogTitle>
          <DialogDescription>
            Send this to the Support Team for investigation and resolution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What were you doing when this happened? Any additional context..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="low">Low - Cosmetic issue</option>
              <option value="medium">Medium - Feature degraded</option>
              <option value="high">High - Feature broken</option>
              <option value="critical">Critical - System down</option>
            </select>
          </div>

          {errorData && (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
              >
                <ChevronDown
                  className={`size-3 transition-transform ${showErrorDetails ? "rotate-180" : ""}`}
                />
                Error details
              </Button>
              {showErrorDetails && (
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 mt-2">
                  {JSON.stringify(errorData, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Send className="size-4 mr-1" />
              )}
              Send to Support
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
