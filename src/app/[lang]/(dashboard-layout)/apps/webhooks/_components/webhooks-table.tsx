"use client"

import { useCallback, useMemo } from "react"
import {
  AlertCircle,
  CheckCircle,
  Edit2,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Zap,
  Clock as _Clock,
} from "lucide-react"

import type { WebhookRegistration } from "@/lib/api/client"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Webhook extends WebhookRegistration {
  departmentName?: string
}

const statusColors: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle className="size-3" />,
  inactive: <Pause className="size-3" />,
  error: <AlertCircle className="size-3" />,
}

interface WebhooksTableProps {
  webhooks: Webhook[]
  searchQuery?: string
  statusFilter?: string
  className?: string
  isLoading?: boolean
  onRefresh?: () => void
  onEdit?: (webhook: Webhook) => void
  onDelete?: (webhook: Webhook) => void
  onToggleStatus?: (webhook: Webhook) => void
  onTest?: (webhook: Webhook) => void
}

export function WebhooksTable({
  webhooks,
  searchQuery = "",
  statusFilter = "all",
  className,
  isLoading = false,
  onRefresh,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
}: WebhooksTableProps) {
  const filteredWebhooks = useMemo(() => {
    let result = webhooks

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      result = result.filter((webhook) => {
        const nameMatch = webhook.name.toLowerCase().includes(searchLower)
        const urlMatch = (webhook.target_url ?? "")
          .toLowerCase()
          .includes(searchLower)
        const eventsMatch = (webhook.trigger_events ?? []).some((event) =>
          event.toLowerCase().includes(searchLower)
        )
        return nameMatch || urlMatch || eventsMatch
      })
    }

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((webhook) => webhook.status === statusFilter)
    }

    return result
  }, [webhooks, searchQuery, statusFilter])

  const handleToggleStatus = useCallback(
    (webhook: Webhook) => {
      onToggleStatus?.(webhook)
    },
    [onToggleStatus]
  )

  const handleEdit = useCallback(
    (webhook: Webhook) => {
      onEdit?.(webhook)
    },
    [onEdit]
  )

  const handleDelete = useCallback(
    (webhook: Webhook) => {
      onDelete?.(webhook)
    },
    [onDelete]
  )

  const handleTest = useCallback(
    (webhook: Webhook) => {
      onTest?.(webhook)
    },
    [onTest]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Webhook Registrations</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Target URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Triggered</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWebhooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Zap className="mx-auto size-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "No webhooks match your filters"
                      : "No webhooks configured"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredWebhooks.map((webhook) => (
                <WebhookRow
                  key={webhook.id}
                  webhook={webhook}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTest={handleTest}
                />
              ))
            )}
          </TableBody>
        </Table>

        {filteredWebhooks.length > 0 && (
          <div className="flex items-center justify-between px-2 py-4 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {filteredWebhooks.length} webhook
              {filteredWebhooks.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface WebhookRowProps {
  webhook: Webhook
  onToggleStatus: (webhook: Webhook) => void
  onEdit: (webhook: Webhook) => void
  onDelete: (webhook: Webhook) => void
  onTest: (webhook: Webhook) => void
}

function WebhookRow({
  webhook,
  onToggleStatus,
  onEdit,
  onDelete,
  onTest,
}: WebhookRowProps) {
  const statusColor = statusColors[webhook.status ?? "inactive"] || statusColors["inactive"]
  const statusIcon = statusIcons[webhook.status ?? "inactive"] || statusIcons["inactive"]

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const successRate =
    (webhook.total_triggers ?? 0) > 0
      ? (
          ((webhook.success_count ?? 0) / (webhook.total_triggers ?? 1)) *
          100
        ).toFixed(1)
      : "0"

  const truncateUrl = (url: string, maxLength = 40): string => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{webhook.name}</span>
          {webhook.departmentName && (
            <span className="text-xs text-muted-foreground">
              {webhook.departmentName}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          {truncateUrl(webhook.target_url ?? "")}
        </code>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(webhook.trigger_events ?? []).slice(0, 3).map((event) => (
            <Badge key={event} variant="outline" className="text-xs">
              {event}
            </Badge>
          ))}
          {(webhook.trigger_events ?? []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(webhook.trigger_events ?? []).length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={cn(statusColor, "gap-1")}>
          {statusIcon}
          <span className="capitalize">{webhook.status}</span>
        </Badge>
        {!webhook.enabled && (
          <Badge variant="outline" className="ml-1 text-xs">
            Disabled
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(webhook.last_triggered_at)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-sm",
              parseFloat(successRate) >= 90
                ? "text-green-600"
                : parseFloat(successRate) >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
            )}
          >
            {successRate}%
          </span>
          <span className="text-xs text-muted-foreground">
            ({webhook.total_triggers} calls)
          </span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(webhook)}>
              <Edit2 className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTest(webhook)}>
              <Zap className="mr-2 size-4" />
              Test Webhook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(webhook)}>
              {webhook.enabled ? (
                <>
                  <Pause className="mr-2 size-4" />
                  Disable
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4" />
                  Enable
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(webhook)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
