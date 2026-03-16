"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Zap } from "lucide-react"

import type { Webhook } from "./webhooks-table"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface Department {
  id: string
  name: string
  display_name?: string
}

interface CreateWebhookDialogProps {
  webhook?: Webhook | null
  departments?: Department[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (webhook: Partial<Webhook>) => Promise<void>
  isLoading?: boolean
  trigger?: React.ReactNode
}

const WEBHOOK_EVENTS = [
  { value: "task.completed", label: "Task Completed" },
  { value: "task.failed", label: "Task Failed" },
  { value: "task.created", label: "Task Created" },
  { value: "approval.pending", label: "Approval Pending" },
  { value: "approval.approved", label: "Approval Approved" },
  { value: "approval.rejected", label: "Approval Rejected" },
  { value: "agent.message", label: "Agent Message" },
  { value: "agent.status_change", label: "Agent Status Change" },
  { value: "channel.message_received", label: "Channel Message Received" },
  { value: "knowledge.document_indexed", label: "Document Indexed" },
  { value: "clarification.pending", label: "Clarification Pending" },
  { value: "clarification.resolved", label: "Clarification Resolved" },
]

export function CreateWebhookDialog({
  webhook,
  departments = [],
  open: controlledOpen,
  onOpenChange,
  onSave,
  isLoading = false,
  trigger,
}: CreateWebhookDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department_id: "",
    target_url: "",
    secret_key: "",
    trigger_events: [] as string[],
    enabled: true,
  })

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const isEditing = !!webhook

  useEffect(() => {
    if (open) {
      if (webhook) {
        setFormData({
          name: webhook.name,
          description: webhook.description || "",
          department_id: webhook.department_id || "",
          target_url: webhook.target_url ?? "",
          secret_key: webhook.secret_key || "",
          trigger_events: webhook.trigger_events ?? [],
          enabled: webhook.enabled ?? true,
        })
      } else {
        setFormData({
          name: "",
          description: "",
          department_id: "",
          target_url: "",
          secret_key: "",
          trigger_events: [],
          enabled: true,
        })
      }
    }
  }, [open, webhook])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Webhook name is required",
      })
      return
    }

    if (!formData.target_url.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Target URL is required",
      })
      return
    }

    if (formData.trigger_events.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one trigger event is required",
      })
      return
    }

    try {
      await onSave({
        id: webhook?.id,
        name: formData.name,
        description: formData.description || undefined,
        department_id: formData.department_id || undefined,
        target_url: formData.target_url,
        secret_key: formData.secret_key || undefined,
        trigger_events: formData.trigger_events,
        enabled: formData.enabled,
      })

      toast({
        title: isEditing ? "Webhook updated" : "Webhook created",
        description: isEditing
          ? "The webhook has been updated successfully."
          : "The webhook has been created successfully.",
      })

      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing
          ? "Failed to update webhook"
          : "Failed to create webhook",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const handleEventToggle = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      trigger_events: prev.trigger_events.includes(event)
        ? prev.trigger_events.filter((e) => e !== event)
        : [...prev.trigger_events, event],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            {isEditing ? (
              <Zap className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Edit Webhook" : "New Webhook"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Webhook" : "Create Webhook"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the webhook configuration below."
              : "Configure a webhook to receive event notifications."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Slack Notifications"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this webhook..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select
              value={formData.department_id || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  department_id: value === "none" ? "" : value,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Enterprise-wide (no department)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Enterprise-wide</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.display_name || dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_url">Target URL *</Label>
            <Input
              id="target_url"
              type="url"
              placeholder="https://api.example.com/webhook"
              value={formData.target_url}
              onChange={(e) =>
                setFormData({ ...formData, target_url: e.target.value })
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              The endpoint that will receive webhook POST requests
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key</Label>
            <Input
              id="secret_key"
              type="password"
              placeholder="Optional secret for signature verification"
              value={formData.secret_key}
              onChange={(e) =>
                setFormData({ ...formData, secret_key: e.target.value })
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Used to sign webhook payloads for security verification
            </p>
          </div>

          <div className="space-y-2">
            <Label>Trigger Events *</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.trigger_events.includes(event.value)}
                    onChange={() => handleEventToggle(event.value)}
                    disabled={isLoading}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{event.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {formData.trigger_events.length} event(s)
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Webhook will receive events when enabled
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
