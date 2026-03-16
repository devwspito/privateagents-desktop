"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bot,
  Building2,
  Database,
  FolderTree,
  Loader2,
  Plus,
} from "lucide-react"

import type {
  Agent,
  CollectionCreateRequest,
  Department,
  IntegrationScope,
} from "@/lib/api"

import { api } from "@/lib/api"

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
import { Textarea } from "@/components/ui/textarea"

const SCOPE_CONFIG: Record<
  IntegrationScope,
  { icon: React.ReactNode; color: string; label: string; description: string }
> = {
  enterprise: {
    icon: <Building2 className="size-4" />,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    label: "Enterprise",
    description: "Shared across all departments and agents",
  },
  department: {
    icon: <FolderTree className="size-4" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Department",
    description: "Shared within a department",
  },
  agent: {
    icon: <Bot className="size-4" />,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Agent",
    description: "Specific to one agent",
  },
}

interface CreateCollectionDialogProps {
  enterpriseId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  departments?: { items: Department[] }
  agents?: { items: Agent[] }
}

export function CreateCollectionDialog({
  enterpriseId,
  open: controlledOpen,
  onOpenChange,
  trigger,
  departments: propDepartments,
  agents: propAgents,
}: CreateCollectionDialogProps) {
  const queryClient = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "enterprise" as IntegrationScope,
    department_id: "",
    agent_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: fetchedDepartments } = useQuery({
    queryKey: ["departments", enterpriseId],
    queryFn: () => api.getDepartments(enterpriseId),
    enabled: !!enterpriseId && !propDepartments,
  })

  const { data: fetchedAgents } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId && !propAgents,
  })

  const departments = propDepartments || fetchedDepartments
  const agents = propAgents || fetchedAgents

  const createMutation = useMutation({
    mutationFn: (data: CollectionCreateRequest) =>
      api.createCollection(enterpriseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "collections"] })
      toast({
        title: "Collection created",
        description: `Collection "${formData.name}" has been created successfully.`,
      })
      resetForm()
      setOpen(false)
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create collection",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      scope: "enterprise",
      department_id: "",
      agent_id: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Collection name is required" })
      return
    }

    if (formData.scope === "department" && !formData.department_id) {
      toast({ variant: "destructive", title: "Please select a department" })
      return
    }

    if (formData.scope === "agent" && !formData.agent_id) {
      toast({ variant: "destructive", title: "Please select an agent" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CollectionCreateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        scope: formData.scope,
      }

      if (formData.scope === "department") {
        payload.department_id = formData.department_id
      }

      if (formData.scope === "agent") {
        payload.agent_id = formData.agent_id
      }

      await createMutation.mutateAsync(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const handleScopeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      scope: value as IntegrationScope,
      department_id: "",
      agent_id: "",
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 size-4" />
            Create Collection
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Create Collection
          </DialogTitle>
          <DialogDescription>
            Create a new knowledge collection. Collections store documents for
            RAG-powered agents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Product Documentation"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this collection contains..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Integration Scope</Label>
            <Select
              value={formData.scope}
              onValueChange={handleScopeChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCOPE_CONFIG).map(([scope, config]) => (
                  <SelectItem key={scope} value={scope}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SCOPE_CONFIG[formData.scope].description}
            </p>
          </div>

          {formData.scope === "department" && (
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, department_id: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.items?.map((dept: Department) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.display_name || dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.scope === "agent" && (
            <div className="space-y-2">
              <Label>Agent *</Label>
              <Select
                value={formData.agent_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, agent_id: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.items?.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
