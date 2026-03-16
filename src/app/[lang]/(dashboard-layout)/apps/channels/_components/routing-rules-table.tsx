"use client"

import { useCallback, useMemo, useState } from "react"
import {
  AlertCircle,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Trash2,
} from "lucide-react"

import type { RoutingRule } from "@/lib/api"

import { useAgents, useRoutingRules, useUpdateRoutingRules } from "@/lib/api"
import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const channelColors: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800",
  telegram: "bg-blue-100 text-blue-800",
  slack: "bg-purple-100 text-purple-800",
  discord: "bg-indigo-100 text-indigo-800",
  webchat: "bg-cyan-100 text-cyan-800",
  signal: "bg-sky-100 text-sky-800",
  matrix: "bg-gray-100 text-gray-800",
  email: "bg-amber-100 text-amber-800",
}

interface RoutingRulesTableProps {
  className?: string
}

export function RoutingRulesTable({ className }: RoutingRulesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingRule, setDeletingRule] = useState<RoutingRule | null>(null)

  const {
    data: rulesData,
    isLoading: isLoadingRules,
    refetch,
  } = useRoutingRules()

  const { data: agentsData } = useAgents()

  const updateMutation = useUpdateRoutingRules()

  const rules = useMemo<RoutingRule[]>(
    () => (rulesData && "rules" in rulesData ? rulesData.rules : []),
    [rulesData]
  )

  const agentMap = useMemo(() => {
    const map = new Map<string, string>()
    agentsData?.items?.forEach((agent: { id: string; name?: string }) => {
      map.set(agent.id, agent.name || agent.id)
    })
    return map
  }, [agentsData])

  const filteredRules = useMemo(() => {
    if (!searchTerm.trim()) return rules

    const searchLower = searchTerm.toLowerCase()
    return rules.filter((rule: RoutingRule) => {
      const channelMatch = rule.channel.toLowerCase().includes(searchLower)
      const patternMatch = rule.pattern?.toLowerCase().includes(searchLower)
      const keywordsMatch = rule.keywords?.some((k: string) =>
        k.toLowerCase().includes(searchLower)
      )
      const agentName = agentMap.get(rule.agent_id) || ""
      const agentMatch = agentName.toLowerCase().includes(searchLower)

      return channelMatch || patternMatch || keywordsMatch || agentMatch
    })
  }, [rules, searchTerm, agentMap])

  const handleSaveRule = useCallback(
    async (rule: Partial<RoutingRule>) => {
      let updatedRules: RoutingRule[]

      if (editingRule) {
        updatedRules = rules.map((r: RoutingRule) =>
          r.id === editingRule.id ? { ...r, ...rule } : r
        )
      } else {
        const newRule: RoutingRule = {
          id: `rule_${Date.now()}`,
          channel: rule.channel || "webchat",
          pattern: rule.pattern || null,
          keywords: rule.keywords || null,
          agent_id: rule.agent_id || "",
          department_id: rule.department_id || null,
          priority: rule.priority || 0,
        }
        updatedRules = [...rules, newRule]
      }

      try {
        await updateMutation.mutateAsync(updatedRules)
        toast({
          title: editingRule ? "Rule updated" : "Rule created",
          description: editingRule
            ? "Routing rule has been updated successfully."
            : "New routing rule has been created.",
        })
        setEditingRule(null)
        setIsCreating(false)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to save rule",
          description:
            error instanceof Error ? error.message : "An error occurred",
        })
      }
    },
    [rules, editingRule, updateMutation]
  )

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      const updatedRules = rules.filter((r: RoutingRule) => r.id !== ruleId)
      try {
        await updateMutation.mutateAsync(updatedRules)
        toast({
          title: "Rule deleted",
          description: "Routing rule has been removed successfully.",
        })
        setDeletingRule(null)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to delete rule",
          description:
            error instanceof Error ? error.message : "An error occurred",
        })
      }
    },
    [rules, updateMutation]
  )

  if (isLoadingRules) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Routing Rules</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="w-64"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Refresh"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-1 size-4" />
                Add Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="w-20">Priority</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Route className="mx-auto size-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No rules match your search"
                        : "No routing rules configured"}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setIsCreating(true)}
                      >
                        Create your first rule
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <RoutingRuleRow
                    key={rule.id}
                    rule={rule}
                    agentName={agentMap.get(rule.agent_id)}
                    onEdit={() => setEditingRule(rule)}
                    onDelete={() => setDeletingRule(rule)}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {filteredRules.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Showing {filteredRules.length} rule
                {filteredRules.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <RuleEditDialog
        rule={isCreating ? null : editingRule}
        open={isCreating || !!editingRule}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsCreating(false)
            setEditingRule(null)
          }
        }}
        onSave={handleSaveRule}
        isLoading={updateMutation.isPending}
        agents={agentsData?.items || []}
      />

      <DeleteConfirmDialog
        rule={deletingRule}
        open={!!deletingRule}
        onOpenChange={(open: boolean) => {
          if (!open) setDeletingRule(null)
        }}
        onConfirm={() => handleDeleteRule(deletingRule!.id)}
        isLoading={updateMutation.isPending}
      />
    </>
  )
}

interface RoutingRuleRowProps {
  rule: RoutingRule
  agentName?: string
  onEdit: () => void
  onDelete: () => void
}

function RoutingRuleRow({
  rule,
  agentName,
  onEdit,
  onDelete,
}: RoutingRuleRowProps) {
  const channelColor =
    channelColors[rule.channel.toLowerCase()] || "bg-gray-100 text-gray-800"

  return (
    <TableRow className="group">
      <TableCell>
        <Badge variant="secondary" className={cn(channelColor, "capitalize")}>
          {rule.channel}
        </Badge>
      </TableCell>
      <TableCell>
        {rule.pattern ? (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {rule.pattern}
          </code>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {rule.keywords && rule.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {rule.keywords.slice(0, 3).map((keyword: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {rule.keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{rule.keywords.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {agentName ? (
          <span className="text-sm">{agentName}</span>
        ) : (
          <span className="text-muted-foreground text-sm">
            {rule.agent_id.slice(0, 8)}...
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {rule.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEdit}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface RuleEditDialogProps {
  rule: RoutingRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (rule: Partial<RoutingRule>) => Promise<void>
  isLoading: boolean
  agents: Array<{ id: string; name?: string }>
}

function RuleEditDialog({
  rule,
  open,
  onOpenChange,
  onSave,
  isLoading,
  agents,
}: RuleEditDialogProps) {
  const [channel, setChannel] = useState(rule?.channel || "webchat")
  const [pattern, setPattern] = useState(rule?.pattern || "")
  const [keywords, setKeywords] = useState(rule?.keywords?.join(", ") || "")
  const [agentId, setAgentId] = useState(rule?.agent_id || "")
  const [priority, setPriority] = useState(rule?.priority?.toString() || "0")

  const isEditing = !!rule

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const keywordsArray = keywords
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean)

    await onSave({
      channel,
      pattern: pattern || null,
      keywords: keywordsArray.length > 0 ? keywordsArray : null,
      agent_id: agentId,
      priority: parseInt(priority, 10) || 0,
    })

    if (!isEditing) {
      setChannel("webchat")
      setPattern("")
      setKeywords("")
      setAgentId("")
      setPriority("0")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Routing Rule" : "Create Routing Rule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="webchat">WebChat</SelectItem>
                <SelectItem value="signal">Signal</SelectItem>
                <SelectItem value="matrix">Matrix</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pattern (regex)</Label>
            <Input
              placeholder="e.g., ^support.*"
              value={pattern}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPattern(e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional regex pattern to match message content
            </p>
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <Input
              placeholder="e.g., help, support, urgent"
              value={keywords}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setKeywords(e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords to match
            </p>
          </div>

          <div className="space-y-2">
            <Label>Route to Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: { id: string; name?: string }) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name || agent.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={priority}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPriority(e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Higher priority rules are evaluated first
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !agentId}>
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  rule: RoutingRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmDialog({
  rule,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Delete Rule
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this routing rule? This action
            cannot be undone.
          </p>
          {rule && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="capitalize">
                  {rule.channel}
                </Badge>
                <span className="text-muted-foreground">
                  Priority: {rule.priority}
                </span>
              </div>
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
