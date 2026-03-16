"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Power,
  PowerOff,
  Trash2,
  User,
  Wrench,
} from "lucide-react"

import type { CustomTool } from "@/lib/api"

import {
  useCustomTools,
  useUpdateCustomTool,
  useDeleteCustomTool,
  useDepartments,
  useAgents,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface UserToolsSectionProps {
  enterpriseId: string
}

function ScopeBadge({ tool, departments, agents }: {
  tool: CustomTool
  departments?: Array<{ id: string; name: string; display_name?: string | null }>
  agents?: Array<{ id: string; name: string; display_name?: string | null }>
}) {
  if (tool.scope_type === "department" && tool.department_id) {
    const dept = departments?.find((d) => d.id === tool.department_id)
    return (
      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
        <Building2 className="size-3 mr-1" />
        {dept?.display_name || dept?.name || "Dept"}
      </Badge>
    )
  }
  if (tool.scope_type === "agent" && tool.agent_id) {
    const agent = agents?.find((a) => a.id === tool.agent_id)
    return (
      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
        <User className="size-3 mr-1" />
        {agent?.display_name || agent?.name || "Agent"}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
      <Globe className="size-3 mr-1" />
      Enterprise
    </Badge>
  )
}

export function UserToolsSection({ enterpriseId }: UserToolsSectionProps) {
  const { data: tools, isLoading } = useCustomTools({
    enterprise_id: enterpriseId,
  })
  const { data: departmentsData } = useDepartments(enterpriseId)
  const { data: agentsData } = useAgents({ enterprise_id: enterpriseId })
  const departments = departmentsData?.items
  const agents = agentsData?.items
  const updateTool = useUpdateCustomTool()
  const deleteTool = useDeleteCustomTool()

  const [selectedTool, setSelectedTool] = useState<CustomTool | null>(null)
  const [toolToDelete, setToolToDelete] = useState<CustomTool | null>(null)

  const handleToggleEnabled = (tool: CustomTool) => {
    updateTool.mutate(
      { toolId: tool.id, data: { enabled: !tool.enabled } },
      {
        onSuccess: () => {
          toast({
            title: tool.enabled ? "Tool disabled" : "Tool enabled",
            description: `${tool.display_name} has been ${tool.enabled ? "disabled" : "enabled"}`,
          })
        },
      }
    )
  }

  const handleScopeChange = (
    tool: CustomTool,
    scopeType: CustomTool["scope_type"],
    scopeId?: string | null
  ) => {
    const scopeData = {
      scope_type: scopeType,
      department_id: scopeType === "department" ? (scopeId || null) : null,
      agent_id: scopeType === "agent" ? (scopeId || null) : null,
    }

    updateTool.mutate(
      { toolId: tool.id, data: scopeData },
      {
        onSuccess: () => {
          toast({ title: "Scope updated", description: `${tool.display_name} scope changed to ${scopeType}` })
          setSelectedTool({
            ...tool,
            scope_type: scopeType,
            department_id: scopeData.department_id,
            agent_id: scopeData.agent_id,
          })
        },
      }
    )
  }

  const handleDelete = () => {
    if (!toolToDelete) return
    deleteTool.mutate(toolToDelete.id, {
      onSuccess: () => {
        toast({ title: "Tool deleted", description: `${toolToDelete.display_name} removed` })
        setToolToDelete(null)
      },
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="size-5" />
            User Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="size-5" />
            User Tools
            {tools && tools.length > 0 && (
              <Badge variant="secondary">{tools.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Custom tools built by the Tools Factory. Assign scope to control which agents can use them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tools || tools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="size-8 mx-auto mb-2 opacity-50" />
              <p>No custom tools yet</p>
              <p className="text-sm mt-1">
                Agents can request new tools by calling @team-builder
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Card
                  key={tool.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTool(tool)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Wrench className="size-4 text-emerald-500" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{tool.display_name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">{tool.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {tool.tested && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="size-3 mr-1" />
                            Tested
                          </Badge>
                        )}
                        {tool.enabled ? (
                          <Badge variant="outline" className="text-xs">v{tool.version}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Disabled</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <ScopeBadge tool={tool} departments={departments} agents={agents} />
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tool.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Detail Dialog */}
      {selectedTool && (
        <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="size-5" />
                {selectedTool.display_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="text-sm font-mono">{selectedTool.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{selectedTool.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <p className="text-sm">{selectedTool.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Path</p>
                  <p className="text-sm font-mono text-xs truncate">{selectedTool.tool_path}</p>
                </div>
              </div>

              {/* Scope selector */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Scope</p>
                <div className="flex gap-2">
                  <Select
                    value={selectedTool.scope_type}
                    onValueChange={(value) => {
                      if (value === "enterprise") {
                        handleScopeChange(selectedTool, "enterprise")
                      } else {
                        // Just update the scope type, user picks the target next
                        setSelectedTool({ ...selectedTool, scope_type: value as CustomTool["scope_type"] })
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedTool.scope_type === "department" && departments && (
                    <Select
                      value={selectedTool.department_id || ""}
                      onValueChange={(value) => handleScopeChange(selectedTool, "department", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.display_name || dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedTool.scope_type === "agent" && agents && (
                    <Select
                      value={selectedTool.agent_id || ""}
                      onValueChange={(value) => handleScopeChange(selectedTool, "agent", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.display_name || agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Parameters</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTool.examples && selectedTool.examples.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Examples</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedTool.examples, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {selectedTool.enabled ? (
                    <Power className="size-4 text-green-500" />
                  ) : (
                    <PowerOff className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {selectedTool.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={selectedTool.enabled}
                    onCheckedChange={() => {
                      handleToggleEnabled(selectedTool)
                      setSelectedTool({ ...selectedTool, enabled: !selectedTool.enabled })
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setToolToDelete(selectedTool)
                    setSelectedTool(null)
                  }}
                >
                  <Trash2 className="size-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom tool?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {toolToDelete?.display_name}. Agents will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
