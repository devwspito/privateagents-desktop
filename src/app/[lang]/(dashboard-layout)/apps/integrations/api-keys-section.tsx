"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bot,
  Building2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderTree,
  Key,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"

import type {
  ApiKeyResponse,
  ApiKeyScope,
  ApiKeyService,
  CreateApiKeyRequest,
} from "@/lib/api"

import { api } from "@/lib/api"

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

// Scope configuration
const scopeConfig: Record<
  ApiKeyScope,
  { icon: React.ReactNode; color: string; label: string }
> = {
  enterprise: {
    icon: <Building2 className="size-4" />,
    color: "bg-purple-500/10 text-purple-500",
    label: "Enterprise",
  },
  department: {
    icon: <FolderTree className="size-4" />,
    color: "bg-blue-500/10 text-blue-500",
    label: "Department",
  },
  agent: {
    icon: <Bot className="size-4" />,
    color: "bg-green-500/10 text-green-500",
    label: "Agent",
  },
}

// ---------------------------------------------------------------------------
// Service icon component — inline SVGs, always renders correctly
// ---------------------------------------------------------------------------
function ServiceIcon({
  service,
  className = "size-6",
}: {
  service: string
  className?: string
}) {
  switch (service) {
    case "gemini":
    case "veo":
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none">
          <path
            d="M14 28C14 21.37 8.63 16 2 16V12C8.63 12 14 6.63 14 0C14 6.63 19.37 12 26 12V16C19.37 16 14 21.37 14 28Z"
            fill="#4285F4"
          />
        </svg>
      )
    case "openai":
    case "openai-codex":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.704.413a6.12 6.12 0 00-5.834 4.234 5.985 5.985 0 00-3.997 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.517 4.911 6.046 6.046 0 006.51 2.9A6.065 6.065 0 0013.29 23.6a6.12 6.12 0 005.834-4.234 5.985 5.985 0 003.997-2.9 6.046 6.046 0 00-.743-7.097zM13.29 21.95a4.514 4.514 0 01-2.898-1.05l.144-.083 4.812-2.78a.782.782 0 00.393-.678v-6.788l2.033 1.174a.072.072 0 01.039.056v5.615a4.534 4.534 0 01-4.523 4.534zm-9.725-4.16a4.513 4.513 0 01-.54-3.045l.144.087 4.812 2.779a.782.782 0 00.786 0l5.87-3.39v2.348a.072.072 0 01-.029.062l-4.862 2.806a4.534 4.534 0 01-6.181-1.647zM2.21 7.87a4.514 4.514 0 012.358-1.993V11.5a.782.782 0 00.393.677l5.87 3.39-2.034 1.173a.072.072 0 01-.068.006l-4.862-2.806A4.534 4.534 0 012.21 7.87zm16.699 3.882l-5.87-3.39 2.034-1.173a.072.072 0 01.068-.006l4.862 2.806a4.53 4.53 0 01-.7 8.172v-5.622a.782.782 0 00-.394-.677zm2.024-3.068l-.145-.087-4.811-2.779a.782.782 0 00-.786 0l-5.87 3.39V6.86a.072.072 0 01.028-.062l4.863-2.806a4.534 4.534 0 016.721 4.692zm-12.72 4.182l-2.034-1.174a.072.072 0 01-.039-.056V6.02a4.534 4.534 0 017.421-3.483l-.144.083-4.812 2.78a.782.782 0 00-.393.677l-.001 6.789zm1.104-2.384l2.614-1.51 2.614 1.51v3.019l-2.614 1.509-2.614-1.51z" />
        </svg>
      )
    case "anthropic":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.503-4.076H5.248L3.718 20.48H0L6.569 3.52zm1.04 3.878L5.37 13.593h4.478L7.609 7.398z" />
        </svg>
      )
    case "stability":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 8.5a1 1 0 012 0v5a1 1 0 01-2 0v-5zm4 0a1 1 0 012 0v7a1 1 0 01-2 0v-7z"
            fill="currentColor"
          />
        </svg>
      )
    case "elevenlabs":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <rect x="8" y="3" width="2.5" height="18" rx="1.25" />
          <rect x="13.5" y="3" width="2.5" height="18" rx="1.25" />
        </svg>
      )
    case "replicate":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
        </svg>
      )
    case "mistral":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="5" height="5" fill="#F7D046" />
          <rect x="17" y="2" width="5" height="5" fill="#F7D046" />
          <rect x="2" y="9.5" width="5" height="5" fill="#F2A73B" />
          <rect x="9.5" y="9.5" width="5" height="5" fill="#F2A73B" />
          <rect x="17" y="9.5" width="5" height="5" fill="#F2A73B" />
          <rect x="2" y="17" width="5" height="5" fill="#EE792F" />
          <rect x="9.5" y="17" width="5" height="5" fill="currentColor" />
          <rect x="17" y="17" width="5" height="5" fill="#EE792F" />
        </svg>
      )
    case "openrouter":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    case "venice":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 016.32 12.906l-3.814-6.608a.6.6 0 00-1.039 0L12 13.09l-1.467-2.792a.6.6 0 00-1.04 0L5.68 16.906A8 8 0 0112 4z" />
        </svg>
      )
    case "amazon-bedrock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z"
            stroke="#FF9900"
            strokeWidth="1.5"
          />
          <path
            d="M12 2v20M3 6.5l9 4.5 9-4.5"
            stroke="#FF9900"
            strokeWidth="1.5"
          />
        </svg>
      )
    case "zai":
    case "zai-coding":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#6C5CE7" />
          <path
            d="M7 8h10M7 8l10 8M7 16h10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    default:
      return <Key className={className + " text-muted-foreground"} />
  }
}

interface ApiKeysSectionProps {
  enterpriseId: string
  departments?: {
    items: Array<{ id: string; name: string; display_name?: string }>
  }
  agents?: { items: Array<{ id: string; name: string }> }
}

export function ApiKeysSection({
  enterpriseId,
  departments,
  agents,
}: ApiKeysSectionProps) {
  const queryClient = useQueryClient()
  const [addingService, setAddingService] = useState<ApiKeyService | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState<string | null>(null)

  // Form state
  const [apiKey, setApiKey] = useState("")
  const [scope, setScope] = useState<ApiKeyScope>("enterprise")
  const [departmentId, setDepartmentId] = useState("")
  const [agentId, setAgentId] = useState("")
  const [label, setLabel] = useState("")
  const [projectId, setProjectId] = useState("")

  // Fetch available services
  const { data: services }: { data: ApiKeyService[] | undefined } = useQuery({
    queryKey: ["api-key-services"],
    queryFn: () => api.getApiKeyServices(),
  })

  // Fetch configured API keys
  const { data: apiKeys, isLoading: _isLoading } = useQuery<{
    keys: ApiKeyResponse[]
  }>({
    queryKey: ["api-keys", enterpriseId],
    queryFn: () => api.getApiKeys({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyRequest) => api.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      toast({ title: "API Key saved successfully" })
      resetForm()
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save API Key",
        description: error.message,
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => api.deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      toast({ title: "API Key deleted" })
      setDeletingKey(null)
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete API Key" })
    },
  })

  const resetForm = () => {
    setAddingService(null)
    setApiKey("")
    setScope("enterprise")
    setDepartmentId("")
    setAgentId("")
    setLabel("")
    setProjectId("")
  }

  const handleSave = () => {
    if (!addingService || !apiKey.trim()) return

    const data: CreateApiKeyRequest = {
      service_id: addingService.service,
      service: addingService.service,
      api_key: apiKey.trim(),
      scope,
      scope_id: enterpriseId,
      enterprise_id: enterpriseId,
      label: label.trim() || undefined,
    }

    if (scope === "department" && departmentId) {
      data.department_id = departmentId
    }
    if (scope === "agent" && agentId) {
      data.agent_id = agentId
    }
    if (projectId.trim()) {
      data.metadata = { project_id: projectId.trim() }
    }

    createMutation.mutate(data)
  }

  // Group keys by service
  const keysByService =
    apiKeys?.keys.reduce(
      (acc: Record<string, ApiKeyResponse[]>, key) => {
        const serviceKey = key.service ?? ""
        if (!acc[serviceKey]) acc[serviceKey] = []
        acc[serviceKey].push(key)
        return acc
      },
      {} as Record<string, ApiKeyResponse[]>
    ) ?? {}

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Configure API keys for AI services (Gemini, Veo, OpenAI, etc.)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services?.map((service) => {
              const configuredKeys = keysByService[service.service] || []
              const hasKey = configuredKeys.length > 0

              return (
                <Card
                  key={service.service}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    hasKey
                      ? "border-primary/30 bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setAddingService(service)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        <ServiceIcon
                          service={service.service}
                          className="size-7"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {service.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {hasKey ? (
                      <div className="space-y-1">
                        {configuredKeys.slice(0, 2).map((key) => (
                          <div
                            key={key.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Badge
                              className={`${scopeConfig[key.scope].color} text-xs py-0`}
                            >
                              {scopeConfig[key.scope].label}
                            </Badge>
                            <span className="text-muted-foreground font-mono truncate">
                              {key.masked_key}
                            </span>
                          </div>
                        ))}
                        {configuredKeys.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{configuredKeys.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Plus className="size-3" />
                        Click to configure
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Configured keys list */}
          {apiKeys && apiKeys.keys.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">
                All Configured Keys ({apiKeys?.keys.length ?? 0})
              </h4>
              <div className="space-y-2">
                {apiKeys.keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-muted flex items-center justify-center">
                        <ServiceIcon service={key.service ?? ""} className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">
                            {key.service ?? "unknown"}
                          </span>
                          <Badge
                            className={`${scopeConfig[key.scope]?.color ?? ""} text-xs`}
                          >
                            {scopeConfig[key.scope]?.icon}
                            <span className="ml-1">
                              {scopeConfig[key.scope]?.label}
                            </span>
                          </Badge>
                          {key.label && (
                            <span className="text-xs text-muted-foreground">
                              ({key.label})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          {showKey === key.id ? key.masked_key : key.masked_key}
                          {key.department_id && departments?.items && (
                            <span>
                              |{" "}
                              {
                                departments.items.find(
                                  (d) => d.id === key.department_id
                                )?.display_name
                              }
                            </span>
                          )}
                          {key.agent_id && agents?.items && (
                            <span>
                              |{" "}
                              {
                                agents.items.find((a) => a.id === key.agent_id)
                                  ?.name
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          setShowKey(showKey === key.id ? null : key.id)
                        }
                      >
                        {showKey === key.id ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeletingKey(key.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit API Key Dialog */}
      {addingService && (
        <Dialog open={!!addingService} onOpenChange={() => resetForm()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ServiceIcon
                  service={addingService.service}
                  className="size-5"
                />
                Configure {addingService.name}
              </DialogTitle>
              <DialogDescription>{addingService.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* API Key */}
              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                {addingService.key_url && (
                  <a
                    href={addingService.key_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Get your API key <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {/* Project ID (for Veo/Vertex AI) */}
              {addingService.fields?.some((f) => f.name === "project_id") && (
                <div className="space-y-2">
                  <Label>Project ID</Label>
                  <Input
                    placeholder="Google Cloud Project ID"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </div>
              )}

              {/* Scope */}
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => setScope(v as ApiKeyScope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4" />
                        Enterprise (shared by all)
                      </div>
                    </SelectItem>
                    <SelectItem value="department">
                      <div className="flex items-center gap-2">
                        <FolderTree className="size-4" />
                        Department
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4" />
                        Agent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department selector */}
              {scope === "department" && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.items?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.display_name || dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Agent selector */}
              {scope === "agent" && (
                <div className="space-y-2">
                  <Label>Agent</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.items?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Label */}
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="e.g., Marketing Gemini"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  createMutation.isPending ||
                  !apiKey.trim() ||
                  (scope === "department" && !departmentId) ||
                  (scope === "agent" && !agentId)
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Key className="mr-2 size-4" />
                )}
                Save API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingKey}
        onOpenChange={() => setDeletingKey(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove access for all agents using this
              key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingKey && deleteMutation.mutate(deletingKey)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
