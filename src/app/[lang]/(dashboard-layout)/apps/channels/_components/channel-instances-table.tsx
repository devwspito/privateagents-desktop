"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
} from "lucide-react"
import { FaApple, FaMicrosoft } from "react-icons/fa"
import {
  SiDiscord,
  SiGooglechat,
  SiMatrix,
  SiSignal,
  SiSlack,
  SiTelegram,
  SiWhatsapp,
} from "react-icons/si"

import type { ChannelInstance } from "@/lib/api"

import {
  useChannelInstances,
  useDeleteChannelInstance,
  useReconnectChannelInstance,
  useUpdateChannelInstance,
} from "@/lib/api"
import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const SiMicrosoftteams = FaMicrosoft

const PLATFORM_CONFIG: Record<
  string,
  { name: string; icon: React.ElementType; color: string }
> = {
  whatsapp: { name: "WhatsApp", icon: SiWhatsapp, color: "#25D366" },
  telegram: { name: "Telegram", icon: SiTelegram, color: "#0088cc" },
  slack: { name: "Slack", icon: SiSlack, color: "#4A154B" },
  discord: { name: "Discord", icon: SiDiscord, color: "#5865F2" },
  google_chat: { name: "Google Chat", icon: SiGooglechat, color: "#00AC47" },
  signal: { name: "Signal", icon: SiSignal, color: "#3A76F0" },
  imessage: { name: "iMessage", icon: FaApple, color: "#007AFF" },
  teams: { name: "Microsoft Teams", icon: SiMicrosoftteams, color: "#6264A7" },
  matrix: { name: "Matrix", icon: SiMatrix, color: "#000000" },
  webchat: { name: "WebChat", icon: Zap, color: "#6366F1" },
}

const statusColors: Record<string, string> = {
  connected:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  disconnected: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

interface ChannelInstancesTableProps {
  className?: string
  onAddChannel?: () => void
  onConfigureInstance?: (instance: ChannelInstance) => void
}

export function ChannelInstancesTable({
  className,
  onAddChannel,
  onConfigureInstance,
}: ChannelInstancesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [configuringInstance, setConfiguringInstance] =
    useState<ChannelInstance | null>(null)
  const [deletingInstance, setDeletingInstance] =
    useState<ChannelInstance | null>(null)
  const [reconnectingInstance, setReconnectingInstance] =
    useState<ChannelInstance | null>(null)

  const { data: instancesData, isLoading, refetch } = useChannelInstances()

  const updateMutation = useUpdateChannelInstance()
  const deleteMutation = useDeleteChannelInstance()
  const reconnectMutation = useReconnectChannelInstance()

  const instances = useMemo<ChannelInstance[]>(
    () => instancesData?.instances || [],
    [instancesData]
  )

  const filteredInstances = useMemo(() => {
    if (!searchTerm.trim()) return instances

    const searchLower = searchTerm.toLowerCase()
    return instances.filter((instance) => {
      const platformConfig = instance.platform
        ? PLATFORM_CONFIG[instance.platform]
        : undefined
      const platformName = platformConfig?.name || instance.platform || ""
      const nameMatch = instance.name?.toLowerCase().includes(searchLower)
      const platformMatch = platformName.toLowerCase().includes(searchLower)
      const account = instance.account
      const accountMatch =
        typeof account === "string"
          ? account.toLowerCase().includes(searchLower)
          : false

      return nameMatch || platformMatch || accountMatch
    })
  }, [instances, searchTerm])

  const handleToggleEnabled = useCallback(
    async (instance: ChannelInstance) => {
      try {
        await updateMutation.mutateAsync({
          instanceId: instance.id,
          data: { enabled: !instance.enabled },
        })
        toast({
          title: instance.enabled ? "Channel disabled" : "Channel enabled",
          description: `${instance.name || instance.platform} has been ${instance.enabled ? "disabled" : "enabled"}.`,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to update channel",
          description:
            error instanceof Error ? error.message : "An error occurred",
        })
      }
    },
    [updateMutation]
  )

  const handleSaveConfig = useCallback(
    async (data: { name: string; enabled: boolean }) => {
      if (!configuringInstance) return

      try {
        await updateMutation.mutateAsync({
          instanceId: configuringInstance.id,
          data,
        })
        toast({
          title: "Channel updated",
          description: "Channel settings have been saved successfully.",
        })
        setConfiguringInstance(null)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to update channel",
          description:
            error instanceof Error ? error.message : "An error occurred",
        })
      }
    },
    [configuringInstance, updateMutation]
  )

  const handleDelete = useCallback(async () => {
    if (!deletingInstance) return

    try {
      await deleteMutation.mutateAsync(deletingInstance.id)
      toast({
        title: "Channel deleted",
        description: `${deletingInstance.name || deletingInstance.platform} has been removed.`,
      })
      setDeletingInstance(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete channel",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }, [deletingInstance, deleteMutation])

  const handleReconnect = useCallback(async () => {
    if (!reconnectingInstance) return

    try {
      await reconnectMutation.mutateAsync(reconnectingInstance.id)
      toast({
        title: "Reconnecting",
        description: `Attempting to reconnect ${reconnectingInstance.name || reconnectingInstance.platform}...`,
      })
      setReconnectingInstance(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to reconnect",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }, [reconnectingInstance, reconnectMutation])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="max-w-sm"
            />
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Refresh"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button size="sm" onClick={onAddChannel}>
                <Plus className="mr-1 size-4" />
                Add Channel
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Zap className="mx-auto size-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No channels match your search"
                        : "No channel instances connected"}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={onAddChannel}
                      >
                        Connect your first channel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstances.map((instance) => (
                  <ChannelInstanceRow
                    key={instance.id}
                    instance={instance}
                    onConfigure={() => {
                      if (onConfigureInstance) {
                        onConfigureInstance(instance)
                      } else {
                        setConfiguringInstance(instance)
                      }
                    }}
                    onToggleEnabled={() => handleToggleEnabled(instance)}
                    onReconnect={() => setReconnectingInstance(instance)}
                    onDelete={() => setDeletingInstance(instance)}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {filteredInstances.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Showing {filteredInstances.length} channel
                {filteredInstances.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfigureInstanceDialog
        instance={configuringInstance}
        open={!!configuringInstance}
        onOpenChange={(open: boolean) => !open && setConfiguringInstance(null)}
        onSave={handleSaveConfig}
        isLoading={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        instance={deletingInstance}
        open={!!deletingInstance}
        onOpenChange={(open: boolean) => !open && setDeletingInstance(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      <ReconnectConfirmDialog
        instance={reconnectingInstance}
        open={!!reconnectingInstance}
        onOpenChange={(open: boolean) => !open && setReconnectingInstance(null)}
        onConfirm={handleReconnect}
        isLoading={reconnectMutation.isPending}
      />
    </>
  )
}

interface ChannelInstanceRowProps {
  instance: ChannelInstance
  onConfigure: () => void
  onToggleEnabled: () => void
  onReconnect: () => void
  onDelete: () => void
}

function ChannelInstanceRow({
  instance,
  onConfigure,
  onToggleEnabled,
  onReconnect,
  onDelete,
}: ChannelInstanceRowProps) {
  const platformConfig = (instance.platform
    ? PLATFORM_CONFIG[instance.platform]
    : undefined) || {
    name: instance.platform || "Unknown",
    icon: Zap,
    color: "#6366F1",
  }

  const Icon = platformConfig.icon
  const statusColor =
    statusColors[instance.status] || "bg-gray-100 text-gray-800"

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return "Never"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${platformConfig.color}15` }}
          >
            <Icon className="size-5" style={{ color: platformConfig.color }} />
          </div>
          <span className="font-medium">{platformConfig.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {instance.name ? (
          <span className="text-sm">{instance.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {instance.account ? (
          <span className="text-sm">
            {typeof instance.account === "string"
              ? instance.account
              : JSON.stringify(instance.account)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn(statusColor, "capitalize")}>
            {instance.status}
          </Badge>
          {instance.status === "error" && instance.error_message && (
            <span
              className="text-xs text-destructive"
              title={instance.error_message}
            >
              <AlertCircle className="size-4" />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono">{instance.message_count}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatLastActivity(instance.last_activity ?? null)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onConfigure}
            title="Configure"
          >
            <Settings className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onToggleEnabled}
            title={instance.enabled ? "Disable" : "Enable"}
          >
            {instance.enabled ? (
              <PowerOff className="size-4" />
            ) : (
              <Power className="size-4" />
            )}
          </Button>
          {instance.status !== "connected" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onReconnect}
              title="Reconnect"
            >
              <RefreshCw className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface ConfigureInstanceDialogProps {
  instance: ChannelInstance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; enabled: boolean }) => Promise<void>
  isLoading: boolean
}

function ConfigureInstanceDialog({
  instance,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: ConfigureInstanceDialogProps) {
  const [name, setName] = useState("")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (instance) {
      setName(instance.name || "")
      setEnabled(instance.enabled)
    }
  }, [instance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ name, enabled })
  }

  if (!instance) return null

  const platformConfig = (instance.platform
    ? PLATFORM_CONFIG[instance.platform]
    : undefined) || {
    name: instance.platform || "Unknown",
    icon: Zap,
    color: "#6366F1",
  }

  const Icon = platformConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${platformConfig.color}15` }}
            >
              <Icon
                className="size-5"
                style={{ color: platformConfig.color }}
              />
            </div>
            <div>
              <DialogTitle>Configure Channel</DialogTitle>
              <DialogDescription>{platformConfig.name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              placeholder="e.g., Sales WhatsApp"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this channel instance
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable message processing
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {instance.error_message && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-muted-foreground">
                {instance.error_message}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  instance: ChannelInstance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

function DeleteConfirmDialog({
  instance,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  if (!instance) return null

  const platformConfig = (instance.platform
    ? PLATFORM_CONFIG[instance.platform]
    : undefined) || {
    name: instance.platform || "Unknown",
    icon: Zap,
    color: "#6366F1",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Delete Channel
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this channel instance? All
            configuration will be lost.
          </p>
          <div className="mt-3 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{platformConfig.name}</Badge>
              <span className="text-muted-foreground">
                {instance.name ||
                  (typeof instance.account === "string"
                    ? instance.account
                    : instance.id.slice(0, 8))}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ReconnectConfirmDialogProps {
  instance: ChannelInstance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

function ReconnectConfirmDialog({
  instance,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: ReconnectConfirmDialogProps) {
  if (!instance) return null

  const platformConfig = (instance.platform
    ? PLATFORM_CONFIG[instance.platform]
    : undefined) || {
    name: instance.platform || "Unknown",
    icon: Zap,
    color: "#6366F1",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5" />
            Reconnect Channel
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Attempt to reconnect {platformConfig.name}? This may take a few
            moments.
          </p>
          {instance.error_message && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Last error:</span>{" "}
                {instance.error_message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Reconnect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
