"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { useSession } from "@/providers/auth-provider"
import {
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FolderTree,
  Globe,
  Info,
  Key,
  Link2,
  Link2Off,
  Loader2,
  Plug,
  RefreshCw,
  Search,
  Shield,
  Unplug,
  Wrench,
  X,
  Zap,
  Plus as _Plus,
} from "lucide-react"

import type {
  AppAuthScheme,
  AuthSchemeField,
  ComposioApp,
  IntegrationScope,
  ScopedConnectRequest,
  ScopedConnection,
  AppAuthSchemaResponse as _AppAuthSchemaResponse,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription as _DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea as _ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AppLogo } from "@/components/app-logo"
import { ApiKeysSection } from "./api-keys-section"
import { UserToolsSection } from "./user-tools-section"

// Scope icons and colors
const scopeConfig: Record<
  IntegrationScope,
  { icon: React.ReactNode; color: string; label: string; description: string }
> = {
  enterprise: {
    icon: <Building2 className="size-4" />,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    label: "Enterprise",
    description: "Shared across all departments and agents",
  },
  department: {
    icon: <FolderTree className="size-4" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    label: "Department",
    description: "Shared within a department",
  },
  agent: {
    icon: <Bot className="size-4" />,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    label: "Agent",
    description: "Specific to one agent or user",
  },
}

// Auth mode display labels
const AUTH_MODE_LABELS: Record<string, string> = {
  OAUTH2: "OAuth 2.0",
  OAUTH1: "OAuth 1.0",
  API_KEY: "API Key",
  BEARER_TOKEN: "Bearer Token",
  BASIC: "Basic Auth",
  BASIC_WITH_JWT: "JWT Auth",
  GOOGLE_SERVICE_ACCOUNT: "Service Account",
  NO_AUTH: "No Auth",
}

// Auth scheme badge colors
const authSchemeConfig: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  oauth2: {
    color: "bg-blue-500/10 text-blue-500",
    icon: <Shield className="size-3" />,
  },
  oauth1: {
    color: "bg-blue-500/10 text-blue-500",
    icon: <Shield className="size-3" />,
  },
  api_key: {
    color: "bg-amber-500/10 text-amber-500",
    icon: <Key className="size-3" />,
  },
  basic: {
    color: "bg-muted text-muted-foreground",
    icon: <Key className="size-3" />,
  },
  bearer: {
    color: "bg-green-500/10 text-green-500",
    icon: <Shield className="size-3" />,
  },
  none: {
    color: "bg-emerald-500/10 text-emerald-500",
    icon: <Zap className="size-3" />,
  },
}

// Category metadata
// Map raw Composio categories → display groups.
// Categories not listed here show as-is with title case.
const CATEGORY_GROUP: Record<string, string> = {
  // Developer & DevOps
  "developer tools": "developer",
  "developer tools & devops": "developer",
  "server monitoring": "developer",
  "it operations": "developer",
  "model context protocol": "developer",
  // AI & ML
  "artificial intelligence": "ai",
  "ai agents": "ai",
  "ai chatbots": "ai",
  "ai models": "ai",
  "ai assistants": "ai",
  "ai content generation": "ai",
  "ai document extraction": "ai",
  "ai meeting assistants": "ai",
  "ai sales tools": "ai",
  "ai safety compliance detection": "ai",
  "ai web scraping": "ai",
  // CRM & Sales
  "crm": "crm",
  "sales & crm": "crm",
  "contact management": "crm",
  // Marketing
  "marketing automation": "marketing",
  "marketing": "marketing",
  "social media marketing": "marketing",
  "social media accounts": "marketing",
  "ads & conversion": "marketing",
  "email newsletters": "marketing",
  "drip emails": "marketing",
  // Communication
  "communication": "communication",
  "team chat": "communication",
  "team collaboration": "communication",
  "video conferencing": "communication",
  "phone & sms": "communication",
  "notifications": "communication",
  "webinars": "communication",
  // Project & Productivity
  "project management": "projects",
  "task management": "projects",
  "productivity": "projects",
  "productivity & project management": "projects",
  "product management": "projects",
  "time tracking software": "projects",
  "notes": "projects",
  // Documents & Storage
  "documents": "documents",
  "file management & storage": "documents",
  "signatures": "documents",
  "spreadsheets": "documents",
  "transcription": "documents",
  // Email
  "email": "email",
  "transactional email": "email",
  // Analytics & BI
  "analytics": "analytics",
  "business intelligence": "analytics",
  // eCommerce & Payments
  "ecommerce": "ecommerce",
  "e-commerce": "ecommerce",
  "payment processing": "ecommerce",
  // HR & Recruitment
  "human resources": "hr",
  "hr talent & recruitment": "hr",
  "education": "hr",
  "online courses": "hr",
  // Finance
  "accounting": "finance",
  "taxes": "finance",
  "proposal & invoice management": "finance",
  "fundraising": "finance",
  // Design & Media
  "images & design": "design",
  "video & audio": "design",
  "gaming": "design",
  // Forms & Surveys
  "forms & surveys": "forms",
  "reviews": "forms",
  // Customer Support
  "customer support": "support",
  // Security
  "security & identity tools": "security",
  "verifiable credentials": "security",
  // Scheduling
  "scheduling & booking": "scheduling",
  "event management": "scheduling",
  // Databases
  "databases": "databases",
  "internet of things": "databases",
  // Website & App
  "website builders": "websites",
  "app builder": "websites",
  "url shortener": "websites",
  "bookmark managers": "websites",
  // Other
  "news & lifestyle": "other",
  "fitness": "other",
  "tag1": "other",
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  developer: "Developer",
  ai: "AI & ML",
  crm: "CRM & Sales",
  marketing: "Marketing",
  communication: "Communication",
  projects: "Projects",
  documents: "Documents",
  email: "Email",
  analytics: "Analytics",
  ecommerce: "eCommerce",
  hr: "HR & Education",
  finance: "Finance",
  design: "Design & Media",
  forms: "Forms & Surveys",
  support: "Support",
  security: "Security",
  scheduling: "Scheduling",
  databases: "Databases",
  websites: "Websites",
  other: "Other",
}

function normalizeCategory(raw: string): string {
  return CATEGORY_GROUP[raw.toLowerCase()] || raw.toLowerCase()
}

// No mock data — tools_count and triggers_count come from the API (Composio meta)

// Integration Card Component
function IntegrationCard({
  app,
  isConnected,
  onClick,
}: {
  app: ComposioApp
  isConnected: boolean
  onClick: () => void
}) {
  return (
    <Card
      className={`group relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
        isConnected ? "border-primary/30 bg-primary/5" : ""
      }`}
      onClick={onClick}
    >
      {/* Connected indicator */}
      {isConnected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
            <Check className="size-3" />
            <span className="text-[10px] font-medium">Connected</span>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <AppLogo
            appName={app.name}
            appKey={app.key}
            logoUrl={app.logo_url}
            size="sm"
          />

          {/* Name and Key */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
              {app.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {app.key}
            </p>
          </div>

          {/* Chevron on hover */}
          <ChevronRight className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {app.description || `Connect ${app.name} to your agents`}
        </p>

        {/* Auth badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {app.auth_schemes && app.auth_schemes.length > 0 ? (
            app.auth_schemes.slice(0, 2).map((scheme) => {
              const schemeName = typeof scheme === "string" ? scheme : (scheme.scheme_name ?? scheme.scheme_type)
              const schemeKey = schemeName.toLowerCase().replace(/[^a-z0-9]/g, "_")
              const config =
                authSchemeConfig[schemeKey] ?? authSchemeConfig["api_key"]
              return (
                <Badge
                  key={schemeName}
                  variant="secondary"
                  className={`${config?.color ?? ""} text-xs font-medium gap-1 px-2 py-0.5`}
                >
                  {config?.icon}
                  {schemeName.toUpperCase().replace(/_/g, " ")}
                </Badge>
              )
            })
          ) : (
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-500 text-xs font-medium gap-1 px-2 py-0.5"
            >
              <Shield className="size-3" />
              OAUTH2
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex justify-between items-center">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(app.tools_count ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Wrench className="size-3.5" />
              <span>Tools</span>
            </div>
          )}
          {(app.triggers_count ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="size-3.5" />
              <span>Triggers</span>
            </div>
          )}
        </div>
        {isConnected && (
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <_Plus className="size-3" />
            New
          </span>
        )}
      </CardFooter>
    </Card>
  )
}

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [authView, setAuthView] = useState<"managed" | "custom">("managed")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedApp, setSelectedApp] = useState<ComposioApp | null>(null)
  const [connectScope, setConnectScope] =
    useState<IntegrationScope>("enterprise")
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [selectedAuthMode, setSelectedAuthMode] = useState<string>("")
  const [authFields, setAuthFields] = useState<Record<string, string>>({})
  const [deepLinkHandled, setDeepLinkHandled] = useState(false)

  const enterpriseId = session?.user?.enterprise_id || ""

  // Fetch departments for scope selection
  const { data: departments } = useQuery({
    queryKey: ["departments", enterpriseId],
    queryFn: () => api.getDepartments(enterpriseId),
    enabled: !!enterpriseId,
  })

  // Fetch agents for scope selection
  const { data: agents } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  // Fetch connected integrations (scoped)
  const {
    data: connections,
    isLoading: loadingConnections,
    refetch: refetchConnections,
  } = useQuery({
    queryKey: ["scoped-connections", enterpriseId],
    queryFn: () => api.getScopedConnections({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  // Fetch available Composio apps
  const { data: availableApps, isLoading: loadingApps } = useQuery({
    queryKey: ["composio-apps"],
    queryFn: () => api.getComposioApps(),
  })

  // Auto-open app modal from deep link (?app=canva&scope=department&dept=xxx)
  useEffect(() => {
    if (deepLinkHandled || !availableApps) return
    const appParam = searchParams.get("app")
    if (!appParam) return
    const match = availableApps.find(
      (a) => a.key.toLowerCase() === appParam.toLowerCase()
    )
    if (match) {
      setSelectedApp(match)
      const scope = searchParams.get("scope")
      if (scope === "department" || scope === "agent" || scope === "enterprise") {
        setConnectScope(scope)
      }
      const dept = searchParams.get("dept")
      if (dept) setSelectedDepartment(dept)
      setDeepLinkHandled(true)
    }
  }, [availableApps, searchParams, deepLinkHandled])

  // Fetch auth schema when an app is selected
  const { data: authSchema, isLoading: loadingAuthSchema } = useQuery({
    queryKey: ["app-auth-schema", selectedApp?.key],
    queryFn: () => api.getAppAuthSchema(selectedApp!.key),
    enabled: !!selectedApp,
  })

  // Fetch app details (tools/triggers list) when dialog opens
  const { data: appDetails, isLoading: loadingAppDetails } = useQuery({
    queryKey: ["app-details", selectedApp?.key],
    queryFn: () => api.getAppDetails(selectedApp!.key),
    enabled: !!selectedApp,
    staleTime: 5 * 60 * 1000,
  })

  // Track which detail section is expanded
  const [expandedSection, setExpandedSection] = useState<"tools" | "triggers" | null>(null)

  // Reset auth fields when selected app or schema changes
  useEffect(() => {
    setAuthFields({})
    if (!authSchema?.auth_schemes?.length) {
      setSelectedAuthMode("")
      return
    }
    // For apps without managed OAuth, prefer non-OAuth scheme (API_KEY, BEARER_TOKEN, etc.)
    if (authSchema.requires_custom_auth) {
      const nonOAuth = authSchema.auth_schemes.find(
        (s: AppAuthScheme) =>
          s.auth_mode && !s.auth_mode.toUpperCase().startsWith("OAUTH")
      )
      if (nonOAuth) {
        setSelectedAuthMode(nonOAuth.auth_mode || "")
        return
      }
    }
    setSelectedAuthMode(authSchema.auth_schemes[0]?.auth_mode || "")
  }, [authSchema])

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: (data: ScopedConnectRequest) => api.connectScopedApp(data),
    onSuccess: (data) => {
      const result = data as { auth_url: string; no_auth?: boolean }
      if (result.no_auth) {
        toast({ title: "App enabled — no authentication required" })
        setSelectedApp(null)
        refetchConnections()
        // Refresh Composio configs so agents pick up the new tool immediately
        if (enterpriseId) api.refreshComposioTools(enterpriseId).catch(() => {})
        return
      }
      if (result.auth_url) {
        window.open(result.auth_url, "_blank", "width=600,height=700")
      }
      toast({ title: "Redirecting to authorization..." })
      setSelectedApp(null)
      // Poll for OAuth completion: check every 3s for up to 2 minutes
      let attempts = 0
      const maxAttempts = 40
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const updated = await api.getScopedConnections({
            enterprise_id: enterpriseId,
            scope: connectScope,
          })
          const prevCount = connections?.length ?? 0
          if ((updated?.length ?? 0) > prevCount) {
            // New connection detected — refresh everything
            clearInterval(pollInterval)
            refetchConnections()
            if (enterpriseId) api.refreshComposioTools(enterpriseId).catch(() => {})
            toast({ title: "Integration connected successfully" })
          }
        } catch { /* ignore polling errors */ }
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          refetchConnections()
          if (enterpriseId) api.refreshComposioTools(enterpriseId).catch(() => {})
        }
      }, 3000)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to initiate connection",
        description: error.message,
      })
    },
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => api.disconnectScopedApp(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoped-connections"] })
      toast({ title: "Integration disconnected" })
      setDisconnectingId(null)
      // Refresh Composio configs so agents stop seeing the removed tool
      if (enterpriseId) api.refreshComposioTools(enterpriseId).catch(() => {})
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to disconnect" })
    },
  })

  // Get connected app keys and their connections
  const connectedApps = useMemo(() => {
    const map = new Map<string, ScopedConnection[]>()
    connections?.forEach((c: ScopedConnection) => {
      const key = (c.app || c.app_key).toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
    return map
  }, [connections])

  // Filter available apps
  const filteredApps = useMemo(() => {
    if (!availableApps) return []
    return availableApps.filter((app: ComposioApp) => {
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.key.toLowerCase().includes(search.toLowerCase()) ||
        app.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        activeCategory === "all" ||
        normalizeCategory(app.category || "other") === activeCategory
      const matchesView =
        authView === "managed" ? app.managed_auth === true : app.managed_auth !== true
      return matchesSearch && matchesCategory && matchesView
    })
  }, [availableApps, search, activeCategory, authView])

  // Get unique categories (grouped) - filtered by current auth view
  const categories = useMemo(() => {
    if (!availableApps) return ["all"]
    const viewApps = availableApps.filter((a: ComposioApp) =>
      authView === "managed" ? a.managed_auth === true : a.managed_auth !== true
    )
    const cats = new Set(
      viewApps.map((a: ComposioApp) =>
        normalizeCategory(a.category || "other")
      )
    )
    // Sort: known groups first (by CATEGORY_LABELS order), then unknown
    const knownOrder = Object.keys(CATEGORY_LABELS).filter((k) => k !== "all")
    const sorted = knownOrder.filter((k) => cats.has(k))
    const unknown = Array.from(cats).filter((c) => !knownOrder.includes(c))
    return ["all", ...sorted, ...unknown]
  }, [availableApps, authView])

  // Group connections by scope
  const connectionsByScope = useMemo(() => {
    const groups: Record<IntegrationScope, ScopedConnection[]> = {
      enterprise: [],
      department: [],
      agent: [],
    }
    connections?.forEach((c: ScopedConnection) => {
      groups[c.scope].push(c)
    })
    return groups
  }, [connections])

  // Get the currently active auth scheme based on selection
  const activeScheme: AppAuthScheme | null = useMemo(() => {
    if (!authSchema?.auth_schemes?.length) return null
    if (selectedAuthMode) {
      return (
        authSchema.auth_schemes.find(
          (s: AppAuthScheme) => s.auth_mode === selectedAuthMode
        ) || (authSchema.auth_schemes[0] as AppAuthScheme)
      )
    }
    return (authSchema.auth_schemes[0] as AppAuthScheme) ?? null
  }, [authSchema, selectedAuthMode])

  // Check if all required auth fields are filled
  const requiredAuthFieldsFilled = useMemo(() => {
    if (!activeScheme?.fields?.length) return true
    return activeScheme.fields
      .filter((f) => f.required)
      .every((f) => authFields[f.name]?.trim())
  }, [activeScheme, authFields])

  const handleConnect = () => {
    if (!selectedApp || !enterpriseId) return

    // Credential-type field names go to auth_config, the rest to connected_account_params
    const AUTH_CONFIG_KEYWORDS = [
      "client_id",
      "client_secret",
      "api_key",
      "auth_token",
      "access_token",
      "secret",
      "token",
      "password",
      "bearer",
    ]

    const authConfig: Record<string, string> = {}
    const connectedAccountParams: Record<string, string> = {}

    if (activeScheme?.fields) {
      for (const field of activeScheme.fields) {
        const value = authFields[field.name]
        if (!value) continue
        const isAuthField = AUTH_CONFIG_KEYWORDS.some((kw) =>
          field.name.toLowerCase().includes(kw)
        )
        if (isAuthField) {
          authConfig[field.name] = value
        } else {
          connectedAccountParams[field.name] = value
        }
      }
    }

    const data: ScopedConnectRequest = {
      app_key: selectedApp.key,
      app: selectedApp.key,
      scope: connectScope,
      scope_id: enterpriseId,
      enterprise_id: enterpriseId,
      redirect_uri: `${window.location.origin}/oauth/callback`,
    }

    if (connectScope === "department" && selectedDepartment) {
      data.department_id = selectedDepartment
    }
    if (connectScope === "agent" && selectedAgent) {
      data.agent_id = selectedAgent
    }

    // Include auth params if the user filled them
    if (activeScheme?.auth_mode) {
      data.auth_mode = activeScheme.auth_mode
    }
    if (Object.keys(authConfig).length > 0) {
      data.auth_config = authConfig
    }
    if (Object.keys(connectedAccountParams).length > 0) {
      data.connected_account_params = connectedAccountParams
    }

    connectMutation.mutate(data)
  }

  // Get connections for selected app
  const selectedAppConnections = useMemo(() => {
    if (!selectedApp) return []
    return connectedApps.get(selectedApp.key.toLowerCase()) || []
  }, [selectedApp, connectedApps])

  const isLoading = loadingConnections || loadingApps

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
            <Plug className="size-6" />
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect OAuth apps at enterprise, department, or agent level
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchConnections()}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Scope Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(scopeConfig).map(([scope, config]) => (
          <TooltipProvider key={scope}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`${config.color} gap-1.5 cursor-help`}
                >
                  {config.icon}
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Connected</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {connections?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Building2 className="size-3" /> Enterprise
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {connectionsByScope.enterprise.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FolderTree className="size-3" /> Department
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {connectionsByScope.department.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Bot className="size-3" /> Agent
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              {connectionsByScope.agent.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* API Keys Section - Multi-tenant, stored in DB */}
      <ApiKeysSection
        enterpriseId={enterpriseId}
        departments={departments as Parameters<typeof ApiKeysSection>[0]["departments"]}
        agents={agents as Parameters<typeof ApiKeysSection>[0]["agents"]}
      />

      {/* Custom Tools built by @team-builder */}
      <UserToolsSection enterpriseId={enterpriseId} />

      {/* Connected Integrations by Scope */}
      {connections && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="size-5" />
              Connected Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  All ({connections.length})
                </TabsTrigger>
                <TabsTrigger value="enterprise" className="gap-1">
                  <Building2 className="size-3" />
                  Enterprise ({connectionsByScope.enterprise.length})
                </TabsTrigger>
                <TabsTrigger value="department" className="gap-1">
                  <FolderTree className="size-3" />
                  Department ({connectionsByScope.department.length})
                </TabsTrigger>
                <TabsTrigger value="agent" className="gap-1">
                  <Bot className="size-3" />
                  Agent ({connectionsByScope.agent.length})
                </TabsTrigger>
              </TabsList>

              {["all", "enterprise", "department", "agent"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(tab === "all"
                      ? connections
                      : connectionsByScope[tab as IntegrationScope]
                    ).map(
                      (
                        conn: ScopedConnection & {
                          app_display_name?: string
                          department_id?: string
                          agent_id?: string
                          connected_at?: string
                        }
                      ) => (
                        <Card
                          key={conn.id}
                          className="border-primary/20 bg-primary/5"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AppLogo
                                  appName={conn.app_name || conn.app_key}
                                  appKey={conn.app_key}
                                  size="sm"
                                  className="size-8"
                                />
                                <CardTitle className="text-base">
                                  {conn.app_display_name}
                                </CardTitle>
                              </div>
                              <Badge className={scopeConfig[conn.scope].color}>
                                {scopeConfig[conn.scope].icon}
                                <span className="ml-1">
                                  {scopeConfig[conn.scope].label}
                                </span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {conn.department_id && (
                              <p className="flex items-center gap-1">
                                <FolderTree className="size-3" />
                                {departments?.items?.find(
                                  (d: {
                                    id: string
                                    display_name: string | null
                                    name: string
                                  }) => d.id === conn.department_id
                                )?.display_name || conn.department_id}
                              </p>
                            )}
                            {conn.agent_id && (
                              <p className="flex items-center gap-1">
                                <Bot className="size-3" />
                                {agents?.items?.find(
                                  (a: { id: string; name: string }) =>
                                    a.id === conn.agent_id
                                )?.name || conn.agent_id}
                              </p>
                            )}
                            {conn.connected_at && (
                              <p>
                                Connected{" "}
                                {formatDistanceToNow(
                                  new Date(conn.connected_at),
                                  { addSuffix: true }
                                )}
                              </p>
                            )}
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDisconnectingId(conn.id)}
                            >
                              <Unplug className="mr-2 size-4" />
                              Disconnect
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Available Apps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="size-5" />
                Available Integrations ({filteredApps.length})
              </CardTitle>
              <CardDescription>
                {authView === "managed"
                  ? "One-click connect — pre-configured OAuth by Composio"
                  : "Requires your own credentials (API keys, OAuth client ID/secret, etc.)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth view toggle + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={authView} onValueChange={(v) => { setAuthView(v as "managed" | "custom"); setActiveCategory("all") }}>
              <TabsList>
                <TabsTrigger value="managed" className="gap-1.5">
                  <Zap className="size-3.5" />
                  One-Click
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-1.5">
                  <Key className="size-3.5" />
                  Custom Credentials
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Apps grid - Clickable cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApps.map((app: ComposioApp) => {
              const isConnected = connectedApps.has(app.key.toLowerCase())
              return (
                <IntegrationCard
                  key={app.key}
                  app={app}
                  isConnected={isConnected}
                  onClick={() => setSelectedApp(app)}
                />
              )
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {search
                ? "No apps found matching your search"
                : authView === "managed"
                  ? "No one-click integrations in this category"
                  : "No custom credential integrations in this category"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Detail/Connect Dialog */}
      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={() => { setSelectedApp(null); setExpandedSection(null) }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader className="pb-2">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <AppLogo
                  appName={selectedApp.name}
                  appKey={selectedApp.key}
                  logoUrl={selectedApp.logo_url || selectedApp.logo}
                  size="lg"
                />

                <div className="flex-1">
                  <DialogTitle className="text-xl">
                    {selectedApp.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedApp.key}
                  </p>

                  {/* Auth badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedApp.auth_schemes &&
                    selectedApp.auth_schemes.length > 0 ? (
                      selectedApp.auth_schemes.map((scheme) => {
                        const schemeName = typeof scheme === "string" ? scheme : (scheme.scheme_name ?? scheme.scheme_type)
                        const schemeKey = schemeName
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_")
                        const config =
                          authSchemeConfig[schemeKey] ??
                          authSchemeConfig["api_key"]
                        return (
                          <Badge
                            key={schemeName}
                            variant="secondary"
                            className={`${config?.color ?? ""} text-xs font-medium gap-1`}
                          >
                            {config?.icon}
                            {schemeName.toUpperCase().replace(/_/g, " ")}
                          </Badge>
                        )
                      })
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 text-xs font-medium gap-1"
                      >
                        <Shield className="size-3" />
                        OAUTH2
                      </Badge>
                    )}
                    {selectedApp.category && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {CATEGORY_LABELS[normalizeCategory(selectedApp.category)] || selectedApp.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Separator />

            {/* Description and metrics */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedApp.description ||
                  `Connect ${selectedApp.name} to enable your agents to interact with this service.`}
              </p>

              {/* Tools & Triggers — expandable sections */}
              <div className="space-y-2">
                {/* Tools section */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => setExpandedSection(expandedSection === "tools" ? null : "tools")}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="size-4 text-blue-500" />
                    <span className="font-medium">Tools</span>
                    <span className="text-muted-foreground">
                      — Acciones que el agente puede ejecutar
                    </span>
                  </div>
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === "tools" ? "rotate-90" : ""}`} />
                </button>
                {expandedSection === "tools" && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {loadingAppDetails ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : appDetails?.tools && appDetails.tools.length > 0 ? (
                      <ul className="divide-y">
                        {appDetails.tools.map((tool) => (
                          <li key={tool.name} className="px-3 py-2">
                            <div className="text-sm font-medium">{tool.display_name}</div>
                            {tool.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {tool.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No hay tools disponibles
                      </p>
                    )}
                  </div>
                )}

                {/* Triggers section */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => setExpandedSection(expandedSection === "triggers" ? null : "triggers")}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="size-4 text-amber-500" />
                    <span className="font-medium">Triggers</span>
                    <span className="text-muted-foreground">
                      — Eventos que inician workflows automaticamente
                    </span>
                  </div>
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === "triggers" ? "rotate-90" : ""}`} />
                </button>
                {expandedSection === "triggers" && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {loadingAppDetails ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : appDetails?.triggers && appDetails.triggers.length > 0 ? (
                      <ul className="divide-y">
                        {appDetails.triggers.map((trigger) => (
                          <li key={trigger.name} className="px-3 py-2">
                            <div className="text-sm font-medium">{trigger.display_name}</div>
                            {trigger.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {trigger.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No hay triggers disponibles
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="flex items-start gap-2 rounded-lg border bg-blue-500/5 border-blue-500/20 p-3">
                <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">Tools</strong> son acciones que los agentes pueden ejecutar: enviar emails, crear tareas, buscar datos, etc.
                  </p>
                  <p>
                    <strong className="text-foreground">Triggers</strong> son eventos que activan workflows automaticamente: email recibido, tarea creada, etc.
                  </p>
                </div>
              </div>

              {/* Existing connections for this app */}
              {selectedAppConnections.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" />
                    Active Connections ({selectedAppConnections.length})
                  </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedAppConnections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-green-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${scopeConfig[conn.scope].color} text-xs`}
                          >
                            {scopeConfig[conn.scope].icon}
                            <span className="ml-1">
                              {scopeConfig[conn.scope].label}
                            </span>
                          </Badge>
                          {conn.department_id && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FolderTree className="size-3" />
                              {departments?.items?.find(
                                (d: {
                                  id: string
                                  display_name: string | null
                                  name: string
                                }) => d.id === conn.department_id
                              )?.display_name || conn.department_id}
                            </span>
                          )}
                          {conn.agent_id && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Bot className="size-3" />
                              {agents?.items?.find(
                                (a: { id: string; name: string }) =>
                                  a.id === conn.agent_id
                              )?.name || conn.agent_id}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDisconnectingId(conn.id)
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Connect at scope */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {selectedAppConnections.length > 0
                      ? "Add Another Connection"
                      : "New Connection"}
                  </Label>
                  {selectedAppConnections.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Each agent can have its own {selectedApp.name} account
                    </span>
                  )}
                </div>

                {/* Scope Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Integration Scope
                  </Label>
                  <Select
                    value={connectScope}
                    onValueChange={(v) =>
                      setConnectScope(v as IntegrationScope)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(scopeConfig).map(([scope, config]) => (
                        <SelectItem key={scope} value={scope}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span>{config.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              - {config.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Selection (for department scope) */}
                {connectScope === "department" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Department
                    </Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.items?.map(
                          (dept: {
                            id: string
                            display_name: string | null
                            name: string
                          }) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.display_name || dept.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Agent Selection (for agent scope) */}
                {connectScope === "agent" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Agent
                    </Label>
                    <Select
                      value={selectedAgent}
                      onValueChange={setSelectedAgent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents?.items?.map(
                          (agent: { id: string; name: string }) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Auth Configuration */}
                {loadingAuthSchema && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading auth configuration...
                  </div>
                )}

                {authSchema?.requires_custom_auth &&
                  activeScheme?.auth_mode?.toUpperCase().startsWith("OAUTH") && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <Shield className="size-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        Custom OAuth credentials required
                      </p>
                      <p className="text-muted-foreground">
                        {selectedApp?.name} does not have managed credentials from Composio.
                        You must provide your own <strong>Client ID</strong> and <strong>Client Secret</strong> from
                        the app&apos;s developer portal. Once provided, the OAuth flow will work normally.
                      </p>
                    </div>
                  </div>
                )}

                {authSchema && authSchema.auth_schemes.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Key className="size-4" />
                      Authentication
                    </Label>

                    {/* Auth Mode Selector (if multiple schemes) */}
                    {authSchema.auth_schemes.length > 1 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Auth Method
                        </Label>
                        <Select
                          value={selectedAuthMode}
                          onValueChange={(v) => {
                            setSelectedAuthMode(v)
                            setAuthFields({})
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {authSchema.auth_schemes
                              .filter(
                                (s: AppAuthScheme) =>
                                  s.auth_mode || s.scheme_name
                              )
                              .map((scheme: AppAuthScheme) => {
                                const schemeKey = (scheme.auth_mode ?? "")
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, "_")
                                const config =
                                  authSchemeConfig[schemeKey] ??
                                  authSchemeConfig["api_key"]
                                return (
                                  <SelectItem
                                    key={scheme.auth_mode || scheme.scheme_name || ""}
                                    value={
                                      scheme.auth_mode || scheme.scheme_name || ""
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      {config?.icon}
                                      <span>
                                        {AUTH_MODE_LABELS[
                                          (scheme.auth_mode ?? "").toUpperCase()
                                        ] ??
                                          (scheme.auth_mode ?? "")
                                            .toUpperCase()
                                            .replace(/_/g, " ")}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({scheme.fields?.length ?? 0} fields)
                                      </span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Dynamic Auth Fields */}
                    {activeScheme?.fields && activeScheme.fields.length > 0 && (
                      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                        {activeScheme.fields.map((field) => (
                          <div key={field.name} className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              {(field as AuthSchemeField & { display_name?: string }).display_name ?? field.name}
                              {field.required && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                            </Label>
                            <Input
                              type={
                                field.type === "password" ||
                                field.name.toLowerCase().includes("secret") ||
                                field.name.toLowerCase().includes("token") ||
                                field.name.toLowerCase().includes("password")
                                  ? "password"
                                  : "text"
                              }
                              placeholder={
                                field.description || (field as AuthSchemeField & { display_name?: string }).display_name || field.name
                              }
                              value={authFields[field.name] || ""}
                              onChange={(e) =>
                                setAuthFields((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                            />
                            {field.description && (
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeScheme?.fields?.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedAuthMode?.toUpperCase() === "NONE"
                          ? "This app works without authentication. Actions are available immediately."
                          : "No additional configuration needed. You will be redirected to authorize."}
                      </p>
                    )}
                  </div>
                )}

                {/* Permissions Info */}
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Info className="size-3" />
                    This integration will allow agents to:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside ml-1">
                    <li>Read data from {selectedApp.name}</li>
                    <li>Perform actions on your behalf</li>
                    <li>Access information for task completion</li>
                  </ul>
                </div>
              </div>
            </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={
                    connectMutation.isPending ||
                    (connectScope === "department" && !selectedDepartment) ||
                    (connectScope === "agent" && !selectedAgent) ||
                    !requiredAuthFieldsFilled
                  }
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : selectedAuthMode?.toUpperCase() === "NONE" ? (
                    <Zap className="mr-2 size-4" />
                  ) : (
                    <ExternalLink className="mr-2 size-4" />
                  )}
                  {selectedAuthMode?.toUpperCase() === "NONE"
                    ? `Enable ${selectedApp.name}`
                    : selectedAppConnections.length > 0
                      ? `Connect Another ${selectedApp.name} Account`
                      : `Connect ${selectedApp.name}`}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog
        open={!!disconnectingId}
        onOpenChange={() => setDisconnectingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Agents at this scope level will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                disconnectingId && disconnectMutation.mutate(disconnectingId)
              }
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Link2Off className="mr-2 size-4" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
