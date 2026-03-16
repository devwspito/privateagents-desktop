"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Bot,
  Brain,
  Cpu,
  Database,
  Loader2,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react"

import type { Agent, User } from "@/lib/api"

import {
  api,
  useAgentMemoryConfig,
  useAvailableModels,
} from "@/lib/api"
import { SUBSCRIPTION_PROVIDERS } from "@/lib/api/client"
import { useSubscriptionGateways } from "@/lib/api/hooks"
import { MemoryEntriesViewer } from "./MemoryEntriesViewer"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
// AgentAutonomyOverride reserved for future use

interface ProviderModel {
  id: string
  name: string
  context_window: number
}

interface Provider {
  id: string
  name: string
  models: ProviderModel[]
  requires_key?: boolean
  has_key?: boolean
}

interface SubscriptionGatewayItem {
  id: string
  scope: "enterprise" | "department" | "agent"
  label?: string
  instance_name: string
  masked_key: string
}

export function AgentDialog({
  open,
  onOpenChange,
  agent,
  departments,
  enterpriseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: Agent | null
  departments: { id: string; name: string }[]
  enterpriseId: string
}) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const { data: usersData } = useQuery({
    queryKey: ["users", enterpriseId],
    queryFn: () => api.getUsers({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })
  const users = usersData?.items || []

  const { data: modelsData } = useAvailableModels()
  const providers: Provider[] = (modelsData?.providers as Provider[]) || []

  const [formData, setFormData] = useState({
    id: agent?.id || "",
    name: agent?.name || "",
    display_name: agent?.display_name ?? "",
    description: agent?.description || "",
    department_id: agent?.department_id || "",
    user_id: agent?.user_id || "",
    role: agent?.role || "generalist",
    specialization: agent?.specialization || "",
    model_provider: agent?.model_provider || "local",
    model_id: agent?.model_id || "qwen3:32b",
    temperature: agent?.temperature ?? 0.3,
    gateway_key_id: agent?.gateway_key_id || (null as string | null),
    requires_human_approval: agent?.requires_human_approval ?? true,
    approval_threshold: agent?.approval_threshold,
    // OpenClaw runtime config
    thinking_level: agent?.thinking_level || (null as string | null),
    subagent_max_depth: agent?.subagent_max_depth ?? (null as number | null),
    subagent_max_children: agent?.subagent_max_children ?? (null as number | null),
    subagent_max_concurrent: agent?.subagent_max_concurrent ?? (null as number | null),
    subagent_timeout_seconds: agent?.subagent_timeout_seconds ?? (null as number | null),
    // Heartbeat config
    heartbeat_enabled: agent?.heartbeat_enabled ?? false,
    heartbeat_interval_minutes: agent?.heartbeat_interval_minutes ?? (null as number | null),
    heartbeat_active_hours: agent?.heartbeat_active_hours ?? (null as string | null),
    heartbeat_instructions: agent?.heartbeat_instructions ?? (null as string | null),
    // Exec security + browser
    exec_security: agent?.exec_security ?? ("full" as "full" | "allowlist" | "deny"),
    exec_allowlist: agent?.exec_allowlist ?? (null as string[] | null),
    exec_denylist: agent?.exec_denylist ?? (null as string[] | null),
    browser_enabled: agent?.browser_enabled ?? false,
    a2a_supervision_mode: "supervised" as string,
    primary_supervisor_id: "" as string,
  })

  useEffect(() => {
    if (agent) {
      setFormData({
        id: agent.id,
        name: agent.name,
        display_name: agent.display_name || "",
        description: agent.description || "",
        department_id: agent.department_id || "",
        user_id: agent.user_id || "",
        role: agent.role,
        specialization: agent.specialization || "",
        model_provider: agent.model_provider || "local",
        model_id: agent.model_id || "qwen3:32b",
        temperature: agent.temperature ?? 0.3,
        gateway_key_id: agent.gateway_key_id || null,
        requires_human_approval: agent.requires_human_approval ?? true,
        approval_threshold: agent.approval_threshold,
        thinking_level: agent.thinking_level || null,
        subagent_max_depth: agent.subagent_max_depth ?? null,
        subagent_max_children: agent.subagent_max_children ?? null,
        subagent_max_concurrent: agent.subagent_max_concurrent ?? null,
        subagent_timeout_seconds: agent.subagent_timeout_seconds ?? null,
        heartbeat_enabled: agent.heartbeat_enabled ?? false,
        heartbeat_interval_minutes: agent.heartbeat_interval_minutes ?? null,
        heartbeat_active_hours: agent.heartbeat_active_hours ?? null,
        heartbeat_instructions: agent.heartbeat_instructions ?? null,
        exec_security: agent.exec_security ?? "full",
        exec_allowlist: agent.exec_allowlist ?? null,
        exec_denylist: agent.exec_denylist ?? null,
        browser_enabled: agent.browser_enabled ?? false,
        a2a_supervision_mode: "supervised",
        primary_supervisor_id: "",
      })
      // Load HLC config (A2A supervision + supervisor)
      api.getAgentHumanLoopConfig(agent.id).then((hlc) => {
        if (hlc) {
          setFormData((prev) => ({
            ...prev,
            a2a_supervision_mode: hlc.a2a_supervision_mode || prev.a2a_supervision_mode,
            primary_supervisor_id: hlc.primary_supervisor_id || "",
          }))
        }
      }).catch(() => {})
    } else {
      setFormData({
        id: "",
        name: "",
        display_name: "",
        description: "",
        department_id: "",
        user_id: "",
        role: "generalist",
        specialization: "",
        model_provider: "local",
        model_id: "qwen3:32b",
        temperature: 0.3,
        gateway_key_id: null,
        requires_human_approval: true,
        approval_threshold: undefined,
        thinking_level: null,
        subagent_max_depth: null,
        subagent_max_children: null,
        subagent_max_concurrent: null,
        subagent_timeout_seconds: null,
        heartbeat_enabled: false,
        heartbeat_interval_minutes: null,
        heartbeat_active_hours: null,
        heartbeat_instructions: null,
        exec_security: "full",
        exec_allowlist: null,
        exec_denylist: null,
        browser_enabled: false,
        a2a_supervision_mode: "supervised",
        primary_supervisor_id: "",
      })
    }
    setActiveTab("basic")
  }, [agent])

  const isEditing = !!agent

  const selectedProvider = useMemo(
    () => providers.find((p: Provider) => p.id === formData.model_provider),
    [providers, formData.model_provider]
  )

  const { data: gatewaysData } = useSubscriptionGateways({
    enterprise_id: enterpriseId,
    department_id: formData.department_id,
    ...(agent?.id ? { agent_id: agent.id } : {}),
    ...(SUBSCRIPTION_PROVIDERS.has(formData.model_provider)
      ? { service: formData.model_provider }
      : {}),
  })
  const subscriptionGateways: SubscriptionGatewayItem[] =
    (gatewaysData?.gateways as unknown as SubscriptionGatewayItem[]) || []

  const gatewaysByScope = useMemo(() => {
    const grouped = { enterprise: [] as SubscriptionGatewayItem[], department: [] as SubscriptionGatewayItem[], agent: [] as SubscriptionGatewayItem[] }
    for (const g of subscriptionGateways) {
      if (g.scope in grouped) grouped[g.scope as keyof typeof grouped].push(g)
    }
    return grouped
  }, [subscriptionGateways])

  const { data: memoryData } = useAgentMemoryConfig(agent?.id || "")
  const [memoryForm, setMemoryForm] = useState({
    enabled: false,
    mode: "preset" as "preset" | "custom",
    strategy: "balanced" as string,
    include_sender_history: true,
    include_similar_tasks: true,
    include_kb_context: true,
    max_context_pct: 0.2,
    min_relevance_score: 0.55,
    conversation_lookback_days: 30,
    task_lookback_days: 90,
    max_memories: 10,
  })
  const [memoryDirty, setMemoryDirty] = useState(false)

  useEffect(() => {
    if (memoryData) {
      const isCustom =
        !memoryData.include_sender_history ||
        !memoryData.include_similar_tasks ||
        !memoryData.include_kb_context
      setMemoryForm({
        enabled: memoryData.enabled,
        mode: isCustom ? "custom" : "preset",
        strategy: memoryData.strategy || "balanced",
        include_sender_history: memoryData.include_sender_history ?? true,
        include_similar_tasks: memoryData.include_similar_tasks ?? true,
        include_kb_context: memoryData.include_kb_context ?? true,
        max_context_pct: memoryData.max_context_pct ?? 0.2,
        min_relevance_score: memoryData.min_relevance_score ?? 0.55,
        conversation_lookback_days: memoryData.conversation_lookback_days ?? 30,
        task_lookback_days: memoryData.task_lookback_days ?? 90,
        max_memories: memoryData.max_memories ?? 10,
      })
      setMemoryDirty(false)
    }
  }, [memoryData])

  const updateMemory = (updates: Partial<typeof memoryForm>) => {
    setMemoryForm((prev) => ({ ...prev, ...updates }))
    setMemoryDirty(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { a2a_supervision_mode, primary_supervisor_id, user_id, ...agentData } = formData
      let agentId: string
      if (isEditing) {
        agentId = agent!.id
        await api.updateAgent(agentId, agentData)
      } else {
        const created = await api.createAgent({ ...agentData, enterprise_id: enterpriseId })
        agentId = (created as Agent).id
      }

      // Close dialog immediately — secondary calls run in background
      toast({ title: isEditing ? "Agent updated" : "Agent created" })
      onOpenChange(false)

      // Optimistically update list cache so UI reflects changes instantly
      if (isEditing) {
        queryClient.setQueriesData<{ items?: Agent[] }>(
          { queryKey: ["agents"] },
          (old) => {
            if (!old?.items) return old
            return { ...old, items: old.items.map((a) => a.id === agentId ? { ...a, ...agentData } as Agent : a) }
          }
        )
      }

      // Fire secondary API calls in parallel (non-blocking)
      const secondaryCalls: Promise<unknown>[] = []
      if (a2a_supervision_mode || primary_supervisor_id) {
        secondaryCalls.push(
          api.updateAgentHumanLoopConfig(agentId, {
            ...(a2a_supervision_mode ? { a2a_supervision_mode: a2a_supervision_mode as "supervised" | "autonomous" } : {}),
            ...(primary_supervisor_id ? { primary_supervisor_id } : { primary_supervisor_id: null }),
          }).catch(() => {})
        )
      }
      if (user_id) {
        secondaryCalls.push(api.linkAgentToUser(agentId, user_id).catch(() => {}))
      } else if (agent?.user_id) {
        secondaryCalls.push(api.unlinkAgentFromUser(agentId).catch(() => {}))
      }
      if (isEditing && memoryDirty) {
        const { mode, ...memoryPayload } = memoryForm
        secondaryCalls.push(
          api.updateAgentMemoryConfig(agentId, memoryPayload).catch(() => {})
        )
      }
      await Promise.all(secondaryCalls)

      // Background refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    } catch {
      toast({ variant: "destructive", title: isEditing ? "Failed to update agent" : "Failed to create agent" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Agent" : "Create New Agent"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the agent configuration"
              : "Add a new AI agent to your enterprise"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                <Bot className="mr-1 size-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="model">
                <Brain className="mr-1 size-4" />
                Model
              </TabsTrigger>
              <TabsTrigger value="runtime">
                <Cpu className="mr-1 size-4" />
                Runtime
              </TabsTrigger>
              <TabsTrigger value="autonomy">
                <Shield className="mr-1 size-4" />
                Autonomy
              </TabsTrigger>
              <TabsTrigger value="memory">
                <Database className="mr-1 size-4" />
                Memory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Agent ID</Label>
                  <Input
                    id="id"
                    placeholder="sales-agent-1"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    disabled={isEditing}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Sales Agent"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="Alex Sales"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linked_user">Linked User</Label>
                  <Select
                    value={formData.user_id || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        user_id: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-4" />
                            {user.name || user.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this agent to a human user for personalized behavior
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generalist">Generalist</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Enterprise Sales"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent does..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="model" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_provider">Provider</Label>
                  <select
                    value={formData.model_provider}
                    onChange={(e) => {
                      const value = e.target.value
                      const prov = providers.find(
                        (p: Provider) => p.id === value
                      )
                      const firstModel = prov?.models[0]?.id || ""
                      setFormData((prev) => ({
                        ...prev,
                        model_provider: value,
                        model_id: firstModel,
                      }))
                    }}
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {providers.map((p: Provider) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.requires_key ? (p.has_key ? " ✓" : " ✗ No Key") : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_id">Model</Label>
                  <select
                    value={formData.model_id}
                    onChange={(e) =>
                      setFormData({ ...formData, model_id: e.target.value })
                    }
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {(selectedProvider?.models || []).map(
                      (m: ProviderModel) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({Math.round(m.context_window / 1000)}k ctx)
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {selectedProvider?.requires_key && !selectedProvider?.has_key && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    No API key configured for {selectedProvider.name}. Go to{" "}
                    <strong>Integrations &gt; API Keys</strong> to add one.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature: {formData.temperature}</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.temperature < 0.3
                      ? "Precise"
                      : formData.temperature > 0.7
                        ? "Creative"
                        : "Balanced"}
                  </span>
                </div>
                <Slider
                  value={[formData.temperature]}
                  onValueChange={([value]: number[] | undefined[]) =>
                    setFormData({ ...formData, temperature: value ?? 0 })
                  }
                  max={1}
                  min={0}
                  step={0.1}
                />
              </div>

              {SUBSCRIPTION_PROVIDERS.has(formData.model_provider) && (
                <div className="space-y-2">
                  <Label>Gateway Instance</Label>
                  <select
                    value={formData.gateway_key_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gateway_key_id: e.target.value || null,
                      })
                    }
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Auto (hierarchy resolution)</option>
                    {gatewaysByScope.enterprise.length > 0 && (
                      <optgroup label="Enterprise">
                        {gatewaysByScope.enterprise.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label || g.instance_name} — {g.masked_key}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {gatewaysByScope.department.length > 0 && (
                      <optgroup label="Department">
                        {gatewaysByScope.department.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label || g.instance_name} — {g.masked_key}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {gatewaysByScope.agent.length > 0 && (
                      <optgroup label="Agent-specific">
                        {gatewaysByScope.agent.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label || g.instance_name} — {g.masked_key}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select &quot;Auto&quot; to use the closest scope gateway, or
                    choose a specific subscription.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="runtime" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="size-4" />
                    Thinking Level
                  </CardTitle>
                  <CardDescription>
                    Controls reasoning depth. Higher levels use more tokens but produce better results.
                    Leave empty to use the enterprise default.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.thinking_level || "inherit"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        thinking_level: value === "inherit" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Inherit from enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit (enterprise default)</SelectItem>
                      <SelectItem value="off">Off — No reasoning</SelectItem>
                      <SelectItem value="minimal">Minimal — Fast, simple tasks</SelectItem>
                      <SelectItem value="low">Low — Routine operations</SelectItem>
                      <SelectItem value="medium">Medium — Balanced (recommended)</SelectItem>
                      <SelectItem value="high">High — Complex analysis</SelectItem>
                      <SelectItem value="xhigh">Extra High — Deep research</SelectItem>
                      <SelectItem value="adaptive">Adaptive — Auto-adjust per message</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="size-4" />
                    Sub-agent Limits
                  </CardTitle>
                  <CardDescription>
                    Control how this agent spawns sub-agents for A2A collaboration.
                    Empty values inherit enterprise defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subagent_max_depth">Max Spawn Depth</Label>
                      <Input
                        id="subagent_max_depth"
                        type="number"
                        min={0}
                        max={5}
                        placeholder="2"
                        value={formData.subagent_max_depth ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subagent_max_depth: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        How deep sub-agents can nest (0-5)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subagent_max_children">Max Children</Label>
                      <Input
                        id="subagent_max_children"
                        type="number"
                        min={1}
                        max={20}
                        placeholder="5"
                        value={formData.subagent_max_children ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subagent_max_children: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max sub-agents per parent (1-20)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subagent_max_concurrent">Max Concurrent</Label>
                      <Input
                        id="subagent_max_concurrent"
                        type="number"
                        min={1}
                        max={50}
                        placeholder="8"
                        value={formData.subagent_max_concurrent ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subagent_max_concurrent: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max running sub-agents at once (1-50)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subagent_timeout_seconds">Timeout (seconds)</Label>
                      <Input
                        id="subagent_timeout_seconds"
                        type="number"
                        min={30}
                        max={3600}
                        placeholder="900"
                        value={formData.subagent_timeout_seconds ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subagent_timeout_seconds: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Sub-agent execution timeout (30-3600s)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    Heartbeat
                  </CardTitle>
                  <CardDescription>
                    Periodic proactive checks. When enabled, the agent wakes up at regular intervals
                    to perform monitoring tasks (emails, SLAs, pending items).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="heartbeat_enabled">Enable Heartbeat</Label>
                    <Switch
                      id="heartbeat_enabled"
                      checked={formData.heartbeat_enabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, heartbeat_enabled: checked })
                      }
                    />
                  </div>
                  {formData.heartbeat_enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="heartbeat_interval">Interval (minutes)</Label>
                          <Input
                            id="heartbeat_interval"
                            type="number"
                            min={5}
                            max={1440}
                            placeholder="30"
                            value={formData.heartbeat_interval_minutes ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                heartbeat_interval_minutes: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            How often to check (default: 30 min)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartbeat_hours">Active Hours</Label>
                          <Input
                            id="heartbeat_hours"
                            type="text"
                            placeholder="09:00-18:00"
                            value={formData.heartbeat_active_hours ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                heartbeat_active_hours: e.target.value || null,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Only run during these hours (empty = 24/7)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="heartbeat_instructions">Heartbeat Instructions</Label>
                        <Textarea
                          id="heartbeat_instructions"
                          placeholder={"Check for new unread emails and summarize them.\nReview pending tasks and alert if any are overdue.\nVerify that all integrations are responding."}
                          rows={5}
                          value={formData.heartbeat_instructions ?? ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              heartbeat_instructions: e.target.value || null,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          What should the agent check on each heartbeat? One task per line.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="size-4" />
                    Exec Security
                  </CardTitle>
                  <CardDescription>
                    Controls what shell commands this agent can execute. In multi-tenant environments,
                    restrict agents to only the commands they need.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exec_security">Security Level</Label>
                    <Select
                      value={formData.exec_security}
                      onValueChange={(value: "full" | "allowlist" | "deny") =>
                        setFormData({ ...formData, exec_security: value })
                      }
                    >
                      <SelectTrigger id="exec_security">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Access</SelectItem>
                        <SelectItem value="allowlist">Allowlist Only</SelectItem>
                        <SelectItem value="deny">Deny All</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Full = no restrictions. Allowlist = only matching patterns. Deny = no exec at all.
                    </p>
                  </div>
                  {formData.exec_security === "allowlist" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="exec_allowlist">Allowed Patterns</Label>
                        <Textarea
                          id="exec_allowlist"
                          placeholder={"git *\nnpm run *\ncurl *"}
                          rows={3}
                          value={(formData.exec_allowlist ?? []).join("\n")}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              exec_allowlist: e.target.value
                                ? e.target.value.split("\n").filter(Boolean)
                                : null,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          One pattern per line. Glob patterns supported.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exec_denylist">Denied Patterns</Label>
                        <Textarea
                          id="exec_denylist"
                          placeholder={"rm -rf *\nsudo *\nchmod *"}
                          rows={3}
                          value={(formData.exec_denylist ?? []).join("\n")}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              exec_denylist: e.target.value
                                ? e.target.value.split("\n").filter(Boolean)
                                : null,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Commands matching these patterns are always blocked, even if they match the allowlist.
                        </p>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <Label htmlFor="browser_enabled">Browser Automation</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable headless Chrome for web scraping and interaction.
                      </p>
                    </div>
                    <Switch
                      id="browser_enabled"
                      checked={formData.browser_enabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, browser_enabled: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Runtime Summary</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={formData.thinking_level ? "default" : "secondary"}>
                    {formData.thinking_level
                      ? `Thinking: ${formData.thinking_level}`
                      : "Thinking: inherited"}
                  </Badge>
                  {(formData.subagent_max_depth !== null ||
                    formData.subagent_max_children !== null ||
                    formData.subagent_max_concurrent !== null) && (
                    <Badge variant="outline">
                      Sub-agents:{" "}
                      {[
                        formData.subagent_max_depth !== null &&
                          `depth=${formData.subagent_max_depth}`,
                        formData.subagent_max_children !== null &&
                          `children=${formData.subagent_max_children}`,
                        formData.subagent_max_concurrent !== null &&
                          `concurrent=${formData.subagent_max_concurrent}`,
                      ]
                        .filter(Boolean)
                        .join(", ") || "inherited"}
                    </Badge>
                  )}
                  {formData.subagent_timeout_seconds !== null && (
                    <Badge variant="outline">
                      Timeout: {formData.subagent_timeout_seconds}s
                    </Badge>
                  )}
                  <Badge variant={formData.heartbeat_enabled ? "default" : "secondary"}>
                    {formData.heartbeat_enabled
                      ? `Heartbeat: ${formData.heartbeat_interval_minutes ?? 30}min`
                      : "Heartbeat: off"}
                  </Badge>
                  <Badge variant={formData.exec_security === "full" ? "secondary" : formData.exec_security === "deny" ? "destructive" : "default"}>
                    Exec: {formData.exec_security}
                  </Badge>
                  {formData.browser_enabled && (
                    <Badge variant="default">Browser</Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="autonomy" className="space-y-4 mt-4">
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="size-4" />
                        Human-in-the-Loop
                      </CardTitle>
                      <CardDescription>
                        Configure when this agent requires human approval
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Human Approval</Label>
                          <p className="text-xs text-muted-foreground">
                            All actions require approval before execution
                          </p>
                        </div>
                        <Switch
                          checked={formData.requires_human_approval}
                          onCheckedChange={(checked: boolean) =>
                            setFormData({
                              ...formData,
                              requires_human_approval: checked,
                            })
                          }
                        />
                      </div>
                      {!formData.requires_human_approval && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label htmlFor="approval_threshold">
                            Auto-approve up to (amount)
                          </Label>
                          <Input
                            id="approval_threshold"
                            type="number"
                            placeholder="e.g., 1000"
                            value={formData.approval_threshold || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                approval_threshold: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Actions involving amounts above this threshold will
                            require approval
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="font-medium mb-2">Autonomy Level Summary</h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          formData.requires_human_approval
                            ? "secondary"
                            : "default"
                        }
                      >
                        {formData.requires_human_approval
                          ? "MANUAL"
                          : formData.approval_threshold
                            ? "SUPERVISED"
                            : "FULL"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formData.requires_human_approval
                          ? "100% supervised - all actions require approval"
                          : formData.approval_threshold
                            ? `Auto-approve actions up to ${formData.approval_threshold}`
                            : "Full autonomy - no approvals required"}
                      </span>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="size-4" />
                        A2A Supervision
                      </CardTitle>
                      <CardDescription>
                        Controls whether agent-to-agent responses require human review
                        before being shared with the requesting agent.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={formData.a2a_supervision_mode || "supervised"}
                        onValueChange={(value: "supervised" | "autonomous") =>
                          setFormData({ ...formData, a2a_supervision_mode: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supervised">
                            Supervisado — humano aprueba respuestas A2A
                          </SelectItem>
                          <SelectItem value="autonomous">
                            Autónomo — respuestas A2A directas sin revisión
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="size-4" />
                        Supervisor Principal
                      </CardTitle>
                      <CardDescription>
                        Usuario humano responsable de supervisar y aprobar las acciones de este agente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={formData.primary_supervisor_id || "__none__"}
                        onValueChange={(value: string) =>
                          setFormData({ ...formData, primary_supervisor_id: value === "__none__" ? "" : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin supervisor asignado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin supervisor</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </>
            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-4">
              {!isEditing ? (
                <div className="rounded-lg border bg-muted/50 p-6 text-center">
                  <Database className="mx-auto size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Save the agent first to configure memory settings.
                  </p>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Memory Settings
                      </CardTitle>
                      <CardDescription>
                        Inject relevant historical context (conversations,
                        tasks, KB) before each agent session
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Memory</Label>
                          <p className="text-xs text-muted-foreground">
                            Agent recalls past context automatically
                          </p>
                        </div>
                        <Switch
                          checked={memoryForm.enabled}
                          onCheckedChange={(checked: boolean) =>
                            updateMemory({ enabled: checked })
                          }
                        />
                      </div>

                      {memoryForm.enabled && (
                        <>
                          <div className="border-t pt-4 space-y-4">
                            <div className="space-y-2">
                              <Label>Configuration Mode</Label>
                              <Select
                                value={memoryForm.mode}
                                onValueChange={(value: "preset" | "custom") => {
                                  if (value === "preset") {
                                    updateMemory({
                                      mode: "preset",
                                      include_sender_history: true,
                                      include_similar_tasks: true,
                                      include_kb_context: true,
                                    })
                                  } else {
                                    updateMemory({ mode: "custom" })
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="preset">
                                    Preset Strategy
                                  </SelectItem>
                                  <SelectItem value="custom">
                                    Custom Configuration
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {memoryForm.mode === "preset" && (
                              <div className="space-y-2">
                                <Label>Strategy</Label>
                                <Select
                                  value={memoryForm.strategy}
                                  onValueChange={(value: string) =>
                                    updateMemory({ strategy: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="balanced">
                                      Balanced — 40% conversations, 30% tasks,
                                      30% KB
                                    </SelectItem>
                                    <SelectItem value="conversations">
                                      Conversations First — 60% conversations,
                                      20/20
                                    </SelectItem>
                                    <SelectItem value="tasks">
                                      Tasks First — 60% tasks, 20/20
                                    </SelectItem>
                                    <SelectItem value="knowledge">
                                      Knowledge First — 60% KB, 20/20
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  All three memory lanes are active. The
                                  strategy controls how the context budget is
                                  distributed.
                                </p>
                              </div>
                            )}

                            {memoryForm.mode === "custom" && (
                              <div className="space-y-3">
                                <div className="rounded-lg border p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm font-medium">
                                        Conversation History
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        Past messages with the same user
                                      </p>
                                    </div>
                                    <Switch
                                      checked={
                                        memoryForm.include_sender_history
                                      }
                                      onCheckedChange={(checked: boolean) =>
                                        updateMemory({
                                          include_sender_history: checked,
                                        })
                                      }
                                    />
                                  </div>
                                  {memoryForm.include_sender_history && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <Label className="text-xs whitespace-nowrap">
                                        Lookback
                                      </Label>
                                      <Input
                                        type="number"
                                        className="h-7 w-20 text-xs"
                                        value={
                                          memoryForm.conversation_lookback_days
                                        }
                                        onChange={(e) =>
                                          updateMemory({
                                            conversation_lookback_days:
                                              parseInt(e.target.value) || 30,
                                          })
                                        }
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        days
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-lg border p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm font-medium">
                                        Similar Tasks
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        Completed tasks matching the current
                                        query
                                      </p>
                                    </div>
                                    <Switch
                                      checked={memoryForm.include_similar_tasks}
                                      onCheckedChange={(checked: boolean) =>
                                        updateMemory({
                                          include_similar_tasks: checked,
                                        })
                                      }
                                    />
                                  </div>
                                  {memoryForm.include_similar_tasks && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <Label className="text-xs whitespace-nowrap">
                                        Lookback
                                      </Label>
                                      <Input
                                        type="number"
                                        className="h-7 w-20 text-xs"
                                        value={memoryForm.task_lookback_days}
                                        onChange={(e) =>
                                          updateMemory({
                                            task_lookback_days:
                                              parseInt(e.target.value) || 90,
                                          })
                                        }
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        days
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-lg border p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label className="text-sm font-medium">
                                        Knowledge Base
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        Semantic search on KB documents
                                      </p>
                                    </div>
                                    <Switch
                                      checked={memoryForm.include_kb_context}
                                      onCheckedChange={(checked: boolean) =>
                                        updateMemory({
                                          include_kb_context: checked,
                                        })
                                      }
                                    />
                                  </div>
                                  {memoryForm.include_kb_context && (
                                    <div className="flex flex-col gap-1 pt-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">
                                          Min relevance score
                                        </Label>
                                        <span className="text-xs text-muted-foreground">
                                          {memoryForm.min_relevance_score.toFixed(
                                            2
                                          )}
                                        </span>
                                      </div>
                                      <Slider
                                        min={0.1}
                                        max={0.95}
                                        step={0.05}
                                        value={[memoryForm.min_relevance_score]}
                                        onValueChange={([v]:
                                          | number[]
                                          | undefined[]) =>
                                          updateMemory({
                                            min_relevance_score: v ?? 0.55,
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="border-t pt-4 space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">
                                    Context Budget
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(
                                      memoryForm.max_context_pct * 100
                                    )}
                                    % of context window
                                  </span>
                                </div>
                                <Slider
                                  min={0.05}
                                  max={0.5}
                                  step={0.05}
                                  value={[memoryForm.max_context_pct]}
                                  onValueChange={([v]:
                                    | number[]
                                    | undefined[]) =>
                                    updateMemory({ max_context_pct: v ?? 0.2 })
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm whitespace-nowrap">
                                  Max memories
                                </Label>
                                <Input
                                  type="number"
                                  className="h-8 w-20"
                                  min={1}
                                  max={50}
                                  value={memoryForm.max_memories}
                                  onChange={(e) =>
                                    updateMemory({
                                      max_memories: Math.max(
                                        1,
                                        Math.min(
                                          50,
                                          parseInt(e.target.value) || 10
                                        )
                                      ),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="font-medium mb-2">Memory Summary</h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={memoryForm.enabled ? "default" : "secondary"}
                      >
                        {memoryForm.enabled
                          ? memoryForm.mode === "preset"
                            ? memoryForm.strategy.toUpperCase()
                            : "CUSTOM"
                          : "DISABLED"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {!memoryForm.enabled
                          ? "Memory is disabled — agent starts fresh each session"
                          : memoryForm.mode === "preset"
                            ? `Using ${memoryForm.strategy} strategy across all lanes`
                            : `${
                                [
                                  memoryForm.include_sender_history &&
                                    "conversations",
                                  memoryForm.include_similar_tasks && "tasks",
                                  memoryForm.include_kb_context && "KB",
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "no lanes"
                              } active`}
                      </span>
                    </div>
                  </div>

                  {/* OpenClaw Native Memory Viewer */}
                  <MemoryEntriesViewer agentId={agent!.id} />
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
