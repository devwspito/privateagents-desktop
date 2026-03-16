"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/providers/auth-provider"
import {
  Bot,
  Building,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"

import type { Agent } from "@/lib/api"

import { api } from "@/lib/api"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AgentDialog, SoulEditorDialog } from "./_components"

const roleColors: Record<string, string> = {
  generalist: "bg-blue-100 text-blue-800",
  specialist: "bg-purple-100 text-purple-800",
  coordinator: "bg-green-100 text-green-800",
  assistant: "bg-yellow-100 text-yellow-800",
}

export default function AgentsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editingSoulAgent, setEditingSoulAgent] = useState<Agent | null>(null)

  const enterpriseId = session?.user?.enterprise_id

  const {
    data: agentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  const { data: departmentsData } = useQuery({
    queryKey: ["departments", enterpriseId],
    queryFn: () => api.getDepartments(enterpriseId),
    enabled: !!enterpriseId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
      toast({ title: "Agent deleted" })
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete agent" })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.updateAgent(id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["agents", enterpriseId] })
      const previous = queryClient.getQueryData<{ items?: Agent[] }>(["agents", enterpriseId])
      if (previous?.items) {
        queryClient.setQueryData(["agents", enterpriseId], {
          ...previous,
          items: previous.items.map((a) => a.id === id ? { ...a, enabled } : a),
        })
      }
      return { previous }
    },
    onSuccess: (_: unknown, variables: { id: string; enabled: boolean }) => {
      toast({
        title: variables.enabled ? "Agent enabled" : "Agent disabled",
      })
    },
    onError: (_, __, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["agents", enterpriseId], ctx.previous)
      toast({ variant: "destructive", title: "Failed to update agent status" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })

  const agents: Agent[] = agentsData?.items || []
  const departments = departmentsData?.items || []

  const filteredAgents = useMemo(
    () =>
      agents.filter(
        (agent: Agent) =>
          agent.name.toLowerCase().includes(search.toLowerCase()) ||
          agent.role?.toLowerCase().includes(search.toLowerCase())
      ),
    [agents, search]
  )

  const stats = useMemo(
    () => ({
      active: agents.filter((a) => a.enabled).length,
      specialists: agents.filter((a) => a.role === "specialist").length,
    }),
    [agents]
  )

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="size-6" />
            Agents
          </h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Agent
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Agents</CardDescription>
            <CardTitle className="text-3xl">{agents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Specialists</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {stats.specialists}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Departments</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Bot className="mx-auto size-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No agents found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                          <Bot className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {agent.display_name || agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {agent.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="size-4 text-muted-foreground" />
                        {agent.department_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={roleColors[agent.role] || ""}
                      >
                        {agent.role}
                      </Badge>
                      {agent.specialization && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {agent.specialization}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agent.enabled ? "default" : "secondary"}
                        className={
                          agent.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {agent.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {agent.model_id}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingAgent(agent)}
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingSoulAgent(agent)}
                          >
                            <Sparkles className="mr-2 size-4" />
                            Edit Soul
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: agent.id,
                                enabled: !agent.enabled,
                              })
                            }
                          >
                            {agent.enabled ? (
                              <>
                                <PowerOff className="mr-2 size-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 size-4" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(agent.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AgentDialog
        open={isCreateOpen || !!editingAgent}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingAgent(null)
          }
        }}
        agent={editingAgent}
        departments={departments}
        enterpriseId={enterpriseId || ""}
      />

      {editingSoulAgent && (
        <SoulEditorDialog
          open={!!editingSoulAgent}
          onOpenChange={(open: boolean) => {
            if (!open) setEditingSoulAgent(null)
          }}
          agent={editingSoulAgent}
        />
      )}
    </div>
  )
}
