"use client"

import { useCallback, useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  Zap,
  Plus as _Plus,
} from "lucide-react"

import type { WebhookRegistration } from "@/lib/api/client"
import type { Webhook } from "./_components/webhooks-table"

import {
  useCreateWebhook,
  useDeleteWebhook,
  useDepartments,
  useTestWebhook,
  useUpdateWebhook,
  useWebhooks,
} from "@/lib/api/hooks"

import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge as _Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateWebhookDialog } from "./_components/create-webhook-dialog"
import { WebhooksTable } from "./_components/webhooks-table"

function mapApiWebhookToComponent(
  apiWebhook: WebhookRegistration,
  departments: { id: string; name: string; display_name?: string }[]
): Webhook {
  const dept = departments.find((d) => d.id === apiWebhook.department_id)

  return {
    ...apiWebhook,
    departmentName: dept
      ? dept.display_name || dept.name
      : apiWebhook.department_id || undefined,
  }
}

export default function WebhooksPage() {
  const { data: session } = useSession()
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deleteWebhook, setDeleteWebhook] = useState<Webhook | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<Webhook | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const enterpriseId = session?.user?.enterprise_id || ""

  const {
    data: webhooksData,
    isLoading,
    refetch,
    isRefetching,
  } = useWebhooks({
    enterprise_id: enterpriseId,
    limit: 100,
  })

  const { data: departmentsData } = useDepartments(enterpriseId)

  const createMutation = useCreateWebhook()
  const updateMutation = useUpdateWebhook()
  const deleteMutation = useDeleteWebhook()
  const testMutation = useTestWebhook()

  const departments = useMemo(() => {
    return departmentsData?.items || []
  }, [departmentsData])

  const webhooks = useMemo(() => {
    if (!webhooksData?.webhooks) return []
    return webhooksData.webhooks.map((w: WebhookRegistration) =>
      mapApiWebhookToComponent(w, departments as { id: string; name: string; display_name?: string }[])
    )
  }, [webhooksData, departments])

  const stats = useMemo(() => {
    const total = webhooks.length
    const active = webhooks.filter(
      (w: Webhook) => w.enabled && w.status === "active"
    ).length
    const disabled = webhooks.filter((w: Webhook) => !w.enabled).length
    const error = webhooks.filter((w: Webhook) => w.status === "error").length
    const totalTriggers = webhooks.reduce(
      (acc: number, w: Webhook) => acc + (w.total_triggers ?? 0),
      0
    )
    const totalSuccess = webhooks.reduce(
      (acc: number, w: Webhook) => acc + (w.success_count ?? 0),
      0
    )
    const avgSuccessRate =
      totalTriggers > 0
        ? ((totalSuccess / totalTriggers) * 100).toFixed(1)
        : "0"

    return { total, active, disabled, error, totalTriggers, avgSuccessRate }
  }, [webhooks])

  const handleRefresh = useCallback(async () => {
    await refetch()
    toast({
      title: "Refreshed",
      description: "Webhooks list has been refreshed.",
    })
  }, [refetch])

  const handleCreateWebhook = useCallback(
    async (webhookData: Partial<Webhook>) => {
      await createMutation.mutateAsync({
        enterpriseId,
        data: {
          name: webhookData.name || "",
          description: webhookData.description,
          department_id: webhookData.department_id,
          trigger_events: webhookData.trigger_events || [],
          target_url: webhookData.target_url || "",
          secret_key: webhookData.secret_key,
          enabled: webhookData.enabled ?? true,
        } as unknown as Parameters<typeof createMutation.mutateAsync>[0]["data"],
      })
    },
    [createMutation, enterpriseId]
  )

  const handleEdit = useCallback((webhook: Webhook) => {
    setEditingWebhook(webhook)
    setIsCreateDialogOpen(true)
  }, [])

  const handleSaveWebhook = useCallback(
    async (webhookData: Partial<Webhook>) => {
      if (editingWebhook) {
        await updateMutation.mutateAsync({
          webhookId: editingWebhook.id,
          enterpriseId,
          data: {
            name: webhookData.name,
            description: webhookData.description,
            department_id: webhookData.department_id,
            trigger_events: webhookData.trigger_events,
            target_url: webhookData.target_url,
            secret_key: webhookData.secret_key,
            enabled: webhookData.enabled,
          } as Parameters<typeof updateMutation.mutateAsync>[0]["data"],
        })
        setEditingWebhook(null)
      } else {
        await handleCreateWebhook(webhookData)
      }
    },
    [editingWebhook, updateMutation, enterpriseId, handleCreateWebhook]
  )

  const handleDelete = useCallback((webhook: Webhook) => {
    setDeleteWebhook(webhook)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteWebhook) return

    try {
      await deleteMutation.mutateAsync({
        webhookId: deleteWebhook.id,
        enterpriseId,
      })
      toast({
        title: "Webhook deleted",
        description: `"${deleteWebhook.name}" has been deleted.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete webhook",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDeleteWebhook(null)
    }
  }, [deleteWebhook, deleteMutation, enterpriseId])

  const handleToggleStatus = useCallback(
    async (webhook: Webhook) => {
      try {
        await updateMutation.mutateAsync({
          webhookId: webhook.id,
          enterpriseId,
          data: { enabled: !webhook.enabled } as Parameters<typeof updateMutation.mutateAsync>[0]["data"],
        })
        toast({
          title: webhook.enabled ? "Webhook Disabled" : "Webhook Enabled",
          description: `"${webhook.name}" has been ${webhook.enabled ? "disabled" : "enabled"}.`,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to toggle webhook",
          description: error instanceof Error ? error.message : undefined,
        })
      }
    },
    [updateMutation, enterpriseId]
  )

  const handleTest = useCallback(
    async (webhook: Webhook) => {
      setTestingWebhook(webhook)
      try {
        const result = (await testMutation.mutateAsync({
          webhookId: webhook.id,
          enterpriseId,
        })) as { success: boolean; status_code?: number; error?: string }
        if (result.success) {
          toast({
            title: "Test Successful",
            description: `Webhook returned status ${result.status_code}`,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Test Failed",
            description: result.error || "Unknown error",
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Test Failed",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setTestingWebhook(null)
      }
    },
    [testMutation, enterpriseId]
  )

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setEditingWebhook(null)
    }
  }, [])

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    testMutation.isPending

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="size-6" />
            Webhooks
          </h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <CreateWebhookDialog
            open={isCreateDialogOpen}
            onOpenChange={handleDialogOpenChange}
            webhook={editingWebhook}
            departments={departments as { id: string; name: string; display_name?: string }[]}
            onSave={handleSaveWebhook}
            isLoading={isMutating}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Webhooks</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="size-3" /> Active
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="size-3" /> With Errors
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats.error}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Success Rate</CardDescription>
            <CardTitle className="text-3xl">{stats.avgSuccessRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search webhooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <WebhooksTable
        webhooks={webhooks}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        isLoading={isLoading || isRefetching}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onTest={handleTest}
      />

      <AlertDialog
        open={!!deleteWebhook}
        onOpenChange={() => setDeleteWebhook(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteWebhook?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!testingWebhook}
        onOpenChange={() => setTestingWebhook(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Testing Webhook</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Sending test request to {testingWebhook?.name}...
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
