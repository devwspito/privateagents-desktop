"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "@/providers/auth-provider"
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Cloud,
  Code2,
  CreditCard,
  ExternalLink,
  Info,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react"

import type { ValidationError } from "@/components/ui/gateway-config-editor"
import type {
  Agent,
  ApiKeyScope,
  Department,
  SubscriptionGateway,
} from "@/lib/api/client"

import api, {
  SUBSCRIPTION_PROVIDERS as _SUBSCRIPTION_PROVIDERS,
} from "@/lib/api/client"
import {
  useAgents,
  useApplyGatewayConfigPreset,
  useDepartments,
  useGatewayConfig,
  useGatewayConfigPresets,
  useGatewayConfigSchema,
  usePatchGatewayConfig,
  useSubscriptionGateways,
} from "@/lib/api/hooks"

import { toast } from "@/hooks/use-toast"
import {
  Alert,
  AlertDescription,
  AlertTitle as _AlertTitle,
} from "@/components/ui/alert"
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
import { GatewayConfigEditor } from "@/components/ui/gateway-config-editor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// =============================================================================
// Provider Catalog — Cloud LLM providers for OpenClaw
// =============================================================================

interface ProviderModel {
  id: string
  name: string
  contextWindow: number
  maxTokens: number
  reasoning?: boolean
}

interface GatewayConfigPreset {
  id: string
  name: string
  config: Record<string, unknown>
}

interface ProviderDefinition {
  id: string
  name: string
  description: string
  api: string
  baseUrl: string
  keyUrl: string
  keyPlaceholder: string
  models: ProviderModel[]
}

const PROVIDER_CATALOG: ProviderDefinition[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus, Sonnet, Haiku",
    api: "anthropic-messages",
    baseUrl: "https://api.anthropic.com",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    models: [
      {
        id: "claude-opus-4-6",
        name: "Claude Opus 4.6",
        contextWindow: 200000,
        maxTokens: 8192,
      },
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
        maxTokens: 8192,
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
        maxTokens: 4096,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, o3, o4-mini",
    api: "openai-completions",
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    models: [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxTokens: 4096 },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        contextWindow: 128000,
        maxTokens: 4096,
      },
      { id: "o3", name: "o3", contextWindow: 200000, maxTokens: 8192 },
      {
        id: "o4-mini",
        name: "o4-mini",
        contextWindow: 200000,
        maxTokens: 8192,
      },
    ],
  },
  {
    id: "zai",
    name: "Z.AI (Open API)",
    description: "GLM-5, GLM-4.7 — open.bigmodel.cn",
    api: "openai-completions",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    keyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    keyPlaceholder: "...",
    models: [
      { id: "glm-5", name: "GLM-5", contextWindow: 200000, maxTokens: 128000 },
      {
        id: "glm-4.7",
        name: "GLM-4.7",
        contextWindow: 131072,
        maxTokens: 32768,
      },
      {
        id: "glm-4.6",
        name: "GLM-4.6",
        contextWindow: 131072,
        maxTokens: 32768,
      },
      {
        id: "glm-4.5-air",
        name: "GLM-4.5 Air",
        contextWindow: 131072,
        maxTokens: 32768,
      },
    ],
  },
  {
    id: "zai-coding",
    name: "Z.AI Coding",
    description: "GLM via api.z.ai — suscripción coding",
    api: "openai-completions",
    baseUrl: "https://api.z.ai/api/coding/paas/v4",
    keyUrl: "https://www.z.ai",
    keyPlaceholder: "...",
    models: [
      { id: "glm-5", name: "GLM-5", contextWindow: 200000, maxTokens: 128000 },
      {
        id: "glm-4.7",
        name: "GLM-4.7",
        contextWindow: 131072,
        maxTokens: 32768,
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Flash — 1M context",
    api: "google-generative-ai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza...",
    models: [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        contextWindow: 1000000,
        maxTokens: 8192,
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        contextWindow: 1000000,
        maxTokens: 8192,
      },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    description: "Mistral Large, Medium",
    api: "openai-completions",
    baseUrl: "https://api.mistral.ai/v1",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "...",
    models: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        contextWindow: 128000,
        maxTokens: 4096,
      },
      {
        id: "mistral-medium-latest",
        name: "Mistral Medium",
        contextWindow: 32000,
        maxTokens: 4096,
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Multi-provider access (Claude, GPT, Gemini, Llama)",
    api: "openai-completions",
    baseUrl: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-...",
    models: [
      {
        id: "anthropic/claude-sonnet-4-5",
        name: "Claude Sonnet 4.5",
        contextWindow: 200000,
        maxTokens: 8192,
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        contextWindow: 128000,
        maxTokens: 4096,
      },
      {
        id: "google/gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        contextWindow: 1000000,
        maxTokens: 8192,
      },
      {
        id: "meta-llama/llama-3.3-70b",
        name: "Llama 3.3 70B",
        contextWindow: 131072,
        maxTokens: 4096,
      },
    ],
  },
  {
    id: "venice",
    name: "Venice (Private)",
    description: "Private, uncensored inference",
    api: "openai-completions",
    baseUrl: "https://api.venice.ai/api/v1",
    keyUrl: "https://venice.ai/settings/api",
    keyPlaceholder: "...",
    models: [
      {
        id: "llama-3.3-70b",
        name: "Llama 3.3 70B",
        contextWindow: 131072,
        maxTokens: 4096,
      },
      {
        id: "deepseek-v3.2",
        name: "DeepSeek V3.2",
        contextWindow: 128000,
        maxTokens: 4096,
      },
      {
        id: "qwen3-235b-a22b-instruct-2507",
        name: "Qwen3 235B",
        contextWindow: 131072,
        maxTokens: 4096,
      },
    ],
  },
  {
    id: "openai-codex",
    name: "OpenAI Codex",
    description: "GPT-5.3 Codex, Codex Mini — ChatGPT Plus/Pro OAuth",
    api: "openai-responses",
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://chatgpt.com",
    keyPlaceholder: "",
    models: [
      {
        id: "gpt-5.3-codex",
        name: "GPT-5.3 Codex",
        contextWindow: 192000,
        maxTokens: 64000,
      },
      {
        id: "gpt-5.1-codex",
        name: "GPT-5.1 Codex",
        contextWindow: 192000,
        maxTokens: 64000,
      },
      {
        id: "codex-mini-latest",
        name: "Codex Mini",
        contextWindow: 192000,
        maxTokens: 64000,
      },
    ],
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    description: "AWS-managed Claude models",
    api: "bedrock-converse-stream",
    baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
    keyUrl: "https://console.aws.amazon.com/bedrock",
    keyPlaceholder: "AKIA...",
    models: [
      {
        id: "us.anthropic.claude-opus-4-6-v1:0",
        name: "Claude Opus 4.6",
        contextWindow: 200000,
        maxTokens: 8192,
      },
      {
        id: "us.anthropic.claude-sonnet-4-6-v1:0",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
        maxTokens: 8192,
      },
    ],
  },
]

// =============================================================================
// Sub-components
// =============================================================================

type ConfirmDialogType = "save" | "reset" | "preset" | null

function AccessDenied() {
  return (
    <div className="container p-6 flex flex-col items-center justify-center h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="size-8 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You need administrator privileges to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Contact your system administrator if you believe this is an error.
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="container p-6 flex justify-center items-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    </div>
  )
}

function ValidationPanel({
  errors,
  isValidating,
}: {
  errors: ValidationError[]
  isValidating: boolean
}) {
  const errorCount = errors.filter((e) => e.severity === "error").length
  const warningCount = errors.filter((e) => e.severity === "warning").length

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Validation</h3>
          {isValidating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : errorCount === 0 && warningCount === 0 ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-100 text-yellow-800"
                >
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isValidating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : errors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-10 text-green-500 mb-2" />
              <p className="font-medium">Configuration Valid</p>
              <p className="text-sm text-muted-foreground">
                No validation errors detected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div
                  key={`${error.path}-${index}`}
                  className={`p-3 rounded-lg border ${
                    error.severity === "error"
                      ? "bg-destructive/5 border-destructive/20"
                      : error.severity === "warning"
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {error.severity === "error" ? (
                      <XCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                    ) : error.severity === "warning" ? (
                      <AlertCircle className="size-4 text-yellow-600 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="size-4 text-blue-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          error.severity === "error"
                            ? "text-destructive"
                            : error.severity === "warning"
                              ? "text-yellow-700 dark:text-yellow-400"
                              : "text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {error.path}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// =============================================================================
// Provider Card
// =============================================================================

// Map provider catalog IDs to api_key service names
const PROVIDER_TO_SERVICE: Record<string, string> = {
  anthropic: "anthropic",
  openai: "openai",
  "openai-codex": "openai-codex",
  zai: "zai",
  "zai-coding": "zai-coding",
  gemini: "gemini",
  mistral: "mistral",
  openrouter: "openrouter",
  venice: "venice",
  "amazon-bedrock": "amazon-bedrock",
}

interface StoredKeyInfo {
  id: string
  masked_key: string
}

function ProviderCard({
  provider,
  storedKey,
  onSave,
  onRemove,
  isSaving,
}: {
  provider: ProviderDefinition
  storedKey: StoredKeyInfo | null
  onSave: (providerId: string, apiKey: string) => Promise<void>
  onRemove: (providerId: string, keyId: string) => Promise<void>
  isSaving: boolean
}) {
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const isConfigured = !!storedKey

  const handleSave = async () => {
    if (!apiKeyInput.trim()) return
    await onSave(provider.id, apiKeyInput.trim())
    setApiKeyInput("")
    setIsEditing(false)
  }

  const handleRemove = async () => {
    if (!storedKey) return
    await onRemove(provider.id, storedKey.id)
    setIsEditing(false)
    setApiKeyInput("")
  }

  return (
    <Card className={isConfigured ? "border-green-500/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{provider.name}</CardTitle>
            {isConfigured ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-green-500/50 text-green-600"
              >
                Configured
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-muted-foreground"
              >
                Not configured
              </Badge>
            )}
          </div>
          <a
            href={provider.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <CardDescription className="text-xs">
          {provider.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* API Key section */}
        {isConfigured && !isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5">
              <Key className="size-3 text-muted-foreground shrink-0" />
              <code className="text-xs font-mono flex-1 truncate">
                {storedKey.masked_key}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={isSaving}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder={provider.keyPlaceholder}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="h-8 text-xs font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
              disabled={!apiKeyInput.trim() || isSaving}
            >
              {isSaving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setIsEditing(false)
                  setApiKeyInput("")
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Models list */}
        <div className="flex flex-wrap gap-1">
          {provider.models.map((m) => (
            <Badge
              key={m.id}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {m.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// OpenAI Codex OAuth Card
// =============================================================================

function CodexProviderCard() {
  const provider = PROVIDER_CATALOG.find((p) => p.id === "openai-codex")!
  const [authState, setAuthState] = useState<
    "idle" | "loading" | "waiting" | "completed" | "error"
  >("idle")
  const [userCode, setUserCode] = useState("")
  const [verificationUrl, setVerificationUrl] = useState("")
  const [email, setEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Check if already connected on mount
  const { data: connStatus, refetch: refetchConn } = useQuery({
    queryKey: ["codex-connected"],
    queryFn: () => api.checkCodexConnected(),
    staleTime: 60_000,
  })

  const isConnected = connStatus?.connected === true

  useEffect(() => {
    if (connStatus?.connected && connStatus.email) {
      setEmail(connStatus.email)
      setAuthState("completed")
    }
  }, [connStatus])

  const handleLogin = async () => {
    try {
      setAuthState("loading")
      setErrorMsg("")
      const result = await api.initiateCodexAuth()
      setUserCode(result.user_code ?? "")
      setVerificationUrl(result.verification_url ?? "")
      setAuthState("waiting")

      // Open verification URL
      window.open(result.verification_url, "_blank")

      // Start polling
      const pollMs = (result.interval || 5) * 1000
      const maxMs = (result.expires_in ?? 600) * 1000
      const start = Date.now()

      const poll = async () => {
        if (Date.now() - start > maxMs) {
          setAuthState("error")
          setErrorMsg("Authentication timed out")
          return
        }
        try {
          const status = await api.checkCodexAuthStatus()
          if (status.status === "completed") {
            setAuthState("completed")
            setEmail(status.email || "")
            refetchConn()
            toast({ title: "OpenAI Codex connected" })
            return
          }
          if (status.status === "expired" || status.status === "error") {
            setAuthState("error")
            setErrorMsg(status.error || "Authentication failed")
            return
          }
        } catch {
          // Network error — keep polling
        }
        setTimeout(poll, pollMs)
      }
      setTimeout(poll, pollMs)
    } catch (e) {
      setAuthState("error")
      setErrorMsg(e instanceof Error ? e.message : "Failed to initiate auth")
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.revokeCodexAuth()
      setAuthState("idle")
      setEmail("")
      setUserCode("")
      refetchConn()
      toast({ title: "OpenAI Codex disconnected" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to disconnect",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Card
      className={
        isConnected || authState === "completed" ? "border-green-500/30" : ""
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{provider.name}</CardTitle>
            {isConnected || authState === "completed" ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-green-500/50 text-green-600"
              >
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-blue-500 border-blue-500/50"
              >
                OAuth
              </Badge>
            )}
          </div>
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <CardDescription className="text-xs">
          {provider.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Auth state */}
        {authState === "idle" && !isConnected && (
          <Button
            onClick={handleLogin}
            className="w-full h-8 text-xs"
            variant="outline"
          >
            <Key className="size-3 mr-2" />
            Sign in with ChatGPT
          </Button>
        )}

        {authState === "loading" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs text-muted-foreground">
              Initiating login...
            </span>
          </div>
        )}

        {authState === "waiting" && (
          <div className="space-y-2">
            <div className="bg-muted/50 rounded-md p-3 text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                Enter this code at OpenAI:
              </p>
              <code className="text-lg font-bold font-mono tracking-widest">
                {userCode}
              </code>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-3 animate-spin text-blue-500" />
              <span className="text-xs text-muted-foreground">
                Waiting for authorization...
              </span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.open(verificationUrl, "_blank")}
            >
              Open login page again
            </Button>
          </div>
        )}

        {(authState === "completed" || isConnected) && (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5">
              <CheckCircle2 className="size-3 text-green-500 shrink-0" />
              <span className="text-xs font-mono flex-1 truncate">
                {email || "ChatGPT account linked"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleDisconnect}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}

        {authState === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="size-3 shrink-0" />
              <span className="text-xs">
                {errorMsg || "Authentication failed"}
              </span>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-8 text-xs"
              variant="outline"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Models list */}
        <div className="flex flex-wrap gap-1">
          {provider.models.map((m) => (
            <Badge
              key={m.id}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {m.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Providers Panel
// =============================================================================

function ProvidersPanel({
  onRefetch,
}: {
  config?: Record<string, unknown>
  onRefetch: () => void
}) {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id || ""
  const [savingProvider, setSavingProvider] = useState<string | null>(null)

  // Fetch API keys from database (persisted, encrypted)
  const { data: keysData, refetch: refetchKeys } = useQuery({
    queryKey: ["api-keys", enterpriseId],
    queryFn: () => api.getApiKeys({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
    staleTime: 30_000,
  })

  // Build a map: service name → { id, masked_key }
  const storedKeysMap = useMemo(() => {
    const map: Record<string, StoredKeyInfo> = {}
    if (keysData?.keys) {
      for (const k of keysData.keys) {
        map[k.service!] = { id: k.id, masked_key: k.masked_key ?? "" }
      }
    }
    return map
  }, [keysData])

  const handleSaveProvider = async (providerId: string, apiKey: string) => {
    setSavingProvider(providerId)
    try {
      const catalogEntry = PROVIDER_CATALOG.find((p) => p.id === providerId)
      if (!catalogEntry) return

      const serviceName = PROVIDER_TO_SERVICE[providerId] || providerId

      // Save to database (encrypted) — backend auto-syncs to OpenClaw
      await api.createApiKey({
        service_id: serviceName,
        service: serviceName,
        api_key: apiKey,
        scope: "enterprise",
        scope_id: enterpriseId,
        enterprise_id: enterpriseId,
      })

      toast({ title: `${catalogEntry.name} configured successfully` })
      refetchKeys()
      onRefetch()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save provider",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setSavingProvider(null)
    }
  }

  const handleRemoveProvider = async (providerId: string, keyId: string) => {
    setSavingProvider(providerId)
    try {
      const catalogEntry = PROVIDER_CATALOG.find((p) => p.id === providerId)

      // Delete from database
      await api.deleteApiKey(keyId)

      toast({ title: `${catalogEntry?.name || providerId} removed` })
      refetchKeys()
      onRefetch()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to remove provider",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setSavingProvider(null)
    }
  }

  // Count configured providers
  const configuredCount = PROVIDER_CATALOG.filter(
    (p) => !!storedKeysMap[PROVIDER_TO_SERVICE[p.id] || p.id]
  ).length

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Cloud className="size-4" />
              Cloud Providers
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure API keys for cloud LLM providers. Models become
              available in agent configuration after setup.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {configuredCount}/{PROVIDER_CATALOG.length} active
          </Badge>
        </div>

        {/* Ollama notice */}
        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Local (Ollama) is always available and requires no API key.
            Configure cloud providers below for API-based models.
          </AlertDescription>
        </Alert>

        {/* Provider cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PROVIDER_CATALOG.map((provider) => {
            // OpenAI Codex uses OAuth, not API key
            if (provider.id === "openai-codex") {
              return <CodexProviderCard key={provider.id} />
            }

            const serviceName = PROVIDER_TO_SERVICE[provider.id] || provider.id
            return (
              <ProviderCard
                key={provider.id}
                provider={provider}
                storedKey={storedKeysMap[serviceName] || null}
                onSave={handleSaveProvider}
                onRemove={handleRemoveProvider}
                isSaving={savingProvider === provider.id}
              />
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

// =============================================================================
// Subscriptions Panel — Multi-instance subscription gateways
// =============================================================================

const SUBSCRIPTION_PROVIDER_INFO: Record<
  string,
  { name: string; description: string }
> = {
  "zai-coding": {
    name: "Z.AI Coding",
    description: "Z.AI coding subscription — GLM models via api.z.ai",
  },
  "openai-codex": {
    name: "OpenAI Codex",
    description: "OpenAI Codex cloud coding agent",
  },
}

function SubscriptionsPanel() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id || ""
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state for new subscription
  const [formService, setFormService] = useState<string>("zai-coding")
  const [formScope, setFormScope] = useState<ApiKeyScope>("enterprise")
  const [formDeptId, setFormDeptId] = useState("")
  const [formAgentId, setFormAgentId] = useState("")
  const [formLabel, setFormLabel] = useState("")
  const [formInstanceName, setFormInstanceName] = useState("")
  const [formApiKey, setFormApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { data: departmentsData } = useDepartments(enterpriseId)
  const { data: agentsData } = useAgents({ enterprise_id: enterpriseId })

  // Fetch all subscription gateways
  const { data: gatewaysData, refetch } = useSubscriptionGateways({
    enterprise_id: enterpriseId,
  })
  const gateways: SubscriptionGateway[] = (gatewaysData?.gateways as SubscriptionGateway[]) || []

  const enterpriseGateways = gateways.filter((g) => g.scope === "enterprise")
  const departmentGateways = gateways.filter((g) => g.scope === "department")
  const agentGateways = gateways.filter((g) => g.scope === "agent")

  const departments: Department[] = departmentsData?.items || []
  const agents: Agent[] = agentsData?.items || []

  const resetForm = () => {
    setFormService("zai-coding")
    setFormScope("enterprise")
    setFormDeptId("")
    setFormAgentId("")
    setFormLabel("")
    setFormInstanceName("")
    setFormApiKey("")
  }

  const handleCreate = async () => {
    if (!formApiKey || !formInstanceName) return
    setIsSaving(true)
    try {
      await api.createApiKey({
        service_id: formService,
        service: formService,
        api_key: formApiKey,
        scope: formScope,
        scope_id: enterpriseId,
        enterprise_id: enterpriseId,
        department_id: formScope === "department" ? formDeptId : undefined,
        agent_id: formScope === "agent" ? formAgentId : undefined,
        label: formLabel || undefined,
        instance_name: formInstanceName || undefined,
      })
      toast({ title: "Subscription gateway created" })
      setDialogOpen(false)
      resetForm()
      refetch()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to create subscription",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.deleteApiKey(id)
      toast({ title: "Subscription gateway removed" })
      refetch()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const renderGatewayCard = (gw: SubscriptionGateway) => {
    const info = gw.service ? SUBSCRIPTION_PROVIDER_INFO[gw.service] : undefined
    const scopeLabel =
      gw.scope === "enterprise"
        ? "Enterprise"
        : gw.scope === "department"
          ? `Dept: ${departments.find((d) => d.id === gw.department_id)?.name || gw.department_id}`
          : `Agent: ${agents.find((a) => a.id === gw.agent_id)?.name || gw.agent_id}`

    return (
      <Card key={gw.id} className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">
                {gw.label || gw.instance_name || info?.name}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {scopeLabel}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {info?.name} &middot; {gw.masked_key}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(gw.id)}
            disabled={deletingId === gw.id}
            className="text-destructive hover:text-destructive"
          >
            {deletingId === gw.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Subscription Gateways</h3>
            <p className="text-sm text-muted-foreground">
              Manage Z.AI Coding and OpenAI Codex subscriptions at enterprise,
              department, or agent level.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="size-4 mr-1.5" />
            Add Subscription
          </Button>
        </div>

        {gateways.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No subscription gateways configured yet.</p>
            <p className="text-xs mt-1">
              Add a Z.AI or Codex subscription to enable per-department or
              per-agent billing.
            </p>
          </div>
        )}

        {enterpriseGateways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Enterprise
              <Badge variant="secondary" className="text-xs ml-1">
                {enterpriseGateways.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {enterpriseGateways.map(renderGatewayCard)}
            </div>
          </div>
        )}

        {departmentGateways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Department
              <Badge variant="secondary" className="text-xs ml-1">
                {departmentGateways.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {departmentGateways.map(renderGatewayCard)}
            </div>
          </div>
        )}

        {agentGateways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Key className="size-3.5" /> Agent
              <Badge variant="secondary" className="text-xs ml-1">
                {agentGateways.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agentGateways.map(renderGatewayCard)}
            </div>
          </div>
        )}
      </div>

      {/* Create subscription dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscription Gateway</DialogTitle>
            <DialogDescription>
              Create a new subscription instance for Z.AI Coding or OpenAI
              Codex.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Select value={formService} onValueChange={setFormService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zai-coding">Z.AI Coding</SelectItem>
                  <SelectItem value="openai-codex">OpenAI Codex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Scope</Label>
              <Select
                value={formScope}
                onValueChange={(v) => setFormScope(v as ApiKeyScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">
                    Enterprise (shared)
                  </SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formScope === "department" && (
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select value={formDeptId} onValueChange={setFormDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formScope === "agent" && (
              <div className="grid gap-2">
                <Label>Agent</Label>
                <Select value={formAgentId} onValueChange={setFormAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.display_name || a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Instance Name</Label>
              <Input
                placeholder="e.g., marketing-sub, agent-carlos"
                value={formInstanceName}
                onChange={(e) => setFormInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this subscription instance (slug format).
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g., Marketing Team Subscription"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Enter API key"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !formApiKey || !formInstanceName}
            >
              {isSaving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function GatewayConfigPage() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const [activeTab, setActiveTab] = useState("providers")
  const [editorContent, setEditorContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  )
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [selectedPresetName, setSelectedPresetName] = useState<string>("")
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogType>(null)

  const { data: configData, isLoading, refetch } = useGatewayConfig()
  const { data: schemaData } = useGatewayConfigSchema()
  const { data: presetsData } = useGatewayConfigPresets()
  const presets: GatewayConfigPreset[] = presetsData?.presets || []
  const patchMutation = usePatchGatewayConfig()
  const presetMutation = useApplyGatewayConfigPreset()

  const hasChanges = editorContent !== originalContent && editorContent !== ""

  useEffect(() => {
    if (configData?.["config"]) {
      const configJson = JSON.stringify(configData["config"], null, 2)
      setEditorContent(configJson)
      setOriginalContent(configJson)
    }
  }, [configData])

  const handleValidate = useCallback(async () => {
    setIsValidating(true)
    try {
      JSON.parse(editorContent)
      setValidationErrors([])
    } catch (e) {
      setValidationErrors([
        {
          path: "JSON Parse",
          message: e instanceof Error ? e.message : "Invalid JSON format",
          severity: "error",
        },
      ])
    } finally {
      setIsValidating(false)
    }
  }, [editorContent])

  const handleEditorValidate = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors)
  }, [])

  const performSave = async () => {
    setIsSaving(true)
    try {
      const parsed = JSON.parse(editorContent)
      await patchMutation.mutateAsync(parsed)
      setOriginalContent(editorContent)
      toast({ title: "Configuration saved successfully" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save configuration",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
    setConfirmDialog(null)
  }

  const performReset = async () => {
    setIsResetting(true)
    try {
      setEditorContent(originalContent)
      setValidationErrors([])
      toast({ title: "Configuration reset to saved state" })
    } finally {
      setIsResetting(false)
    }
    setConfirmDialog(null)
  }

  const performApplyPreset = async () => {
    if (!selectedPreset) return
    try {
      await presetMutation.mutateAsync(selectedPreset)
      toast({ title: "Preset applied successfully" })
      setSelectedPreset("")
      setSelectedPresetName("")
      refetch()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to apply preset",
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
    setConfirmDialog(null)
  }

  const handleSaveClick = () => {
    if (validationErrors.some((e) => e.severity === "error")) {
      toast({
        variant: "destructive",
        title: "Cannot save",
        description: "Please fix validation errors before saving.",
      })
      return
    }
    setConfirmDialog("save")
  }

  const handleResetClick = () => {
    setConfirmDialog("reset")
  }

  const handleApplyPresetClick = () => {
    if (!selectedPreset) return
    const preset = presetsData?.presets?.find(
      (p: GatewayConfigPreset) => p.id === selectedPreset
    )
    setSelectedPresetName(preset?.name || selectedPreset)
    setConfirmDialog("preset")
  }

  if (status === "loading" || isLoading) {
    return <LoadingState />
  }

  if (!isAdmin) {
    return <AccessDenied />
  }

  return (
    <div className="container p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="size-6" />
            Gateway Config
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage OpenClaw gateway — providers, models, and advanced settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="size-3" />
            Admin Only
          </Badge>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger
              value="providers"
              className="flex items-center gap-1.5"
            >
              <Cloud className="size-3.5" />
              Providers
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="flex items-center gap-1.5"
            >
              <CreditCard className="size-3.5" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1.5">
              <Code2 className="size-3.5" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Advanced tab toolbar */}
          {activeTab === "advanced" && (
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Unsaved changes
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedPreset}
                  onValueChange={setSelectedPreset}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleApplyPresetClick}
                  disabled={!selectedPreset || presetMutation.isPending}
                >
                  {presetMutation.isPending && (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  )}
                  Apply
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleResetClick}
                disabled={!hasChanges || isResetting}
              >
                {isResetting ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="size-3 mr-1" />
                )}
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleValidate}
              >
                Validate
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleSaveClick}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <Save className="size-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Providers tab */}
        <TabsContent value="providers" className="flex-1 min-h-0 mt-0">
          <Card className="h-full overflow-hidden">
            <ProvidersPanel config={configData?.["config"] as Record<string, unknown> | undefined} onRefetch={refetch} />
          </Card>
        </TabsContent>

        {/* Subscriptions tab */}
        <TabsContent value="subscriptions" className="flex-1 min-h-0 mt-0">
          <Card className="h-full overflow-hidden">
            <SubscriptionsPanel />
          </Card>
        </TabsContent>

        {/* Advanced JSON tab */}
        <TabsContent value="advanced" className="flex-1 min-h-0 mt-0">
          <Card className="h-full overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={70} minSize={50}>
                <div className="h-full">
                  <GatewayConfigEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    onValidate={handleEditorValidate}
                    height="100%"
                    schema={schemaData?.["schema"] as Record<string, unknown> | undefined}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <ValidationPanel
                  errors={validationErrors}
                  isValidating={isValidating}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation dialogs */}
      <AlertDialog
        open={confirmDialog === "save"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Save className="size-5" />
              Save Configuration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save this configuration? This will update
              the gateway settings and may affect active sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">This action will:</p>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              <li>Update the gateway configuration</li>
              <li>Apply changes to all new sessions</li>
              <li>May require restart for some settings</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog === "reset"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5" />
              Reset Configuration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the editor to the last saved
              configuration? All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              This action cannot be undone. Your current edits will be
              discarded.
            </AlertDescription>
          </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Configuration"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog === "preset"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Apply Preset: {selectedPresetName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply this preset? This will replace the
              current configuration with the preset values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">This action will:</p>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              <li>Replace current configuration values</li>
              <li>Save the preset configuration immediately</li>
              <li>Affect all new sessions</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={presetMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performApplyPreset}
              disabled={presetMutation.isPending}
            >
              {presetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Preset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
