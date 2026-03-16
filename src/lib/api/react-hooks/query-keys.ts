import type { DelegationStatus } from "../client"

export const queryKeys = {
  // Auth
  me: ["me"] as const,

  // Enterprises
  enterprises: ["enterprises"] as const,
  enterprise: (id: string) => ["enterprises", id] as const,

  // Departments
  departments: (enterpriseId?: string) =>
    ["departments", { enterpriseId }] as const,
  department: (id: string) => ["departments", id] as const,
  departmentHumanLoopConfig: (departmentId: string) =>
    ["departments", departmentId, "human-loop-config"] as const,
  departmentTools: (departmentId: string) =>
    ["departments", departmentId, "tools"] as const,
  myAgent: () => ["users", "me", "agent"] as const,

  // Agents
  agents: (params?: { enterprise_id?: string; department_id?: string }) =>
    ["agents", params] as const,
  agent: (id: string) => ["agents", id] as const,
  agentMemoryConfig: (agentId: string) =>
    ["agents", agentId, "memory"] as const,
  agentMemoryEntries: (agentId: string) =>
    ["agents", agentId, "memory-entries"] as const,
  agentSoul: (agentId: string) => ["agents", agentId, "soul"] as const,
  agentHumanLoopConfig: (agentId: string) =>
    ["agents", agentId, "human-loop-config"] as const,
  agentsByUser: (userId: string) => ["agents", "by-user", userId] as const,

  // Approvals
  approvals: (params?: {
    status?: string
    enterprise_id?: string
    type?: string
    requesting_agent_id?: string
  }) => ["approvals", params] as const,
  approval: (id: string) => ["approvals", id] as const,
  approvalStats: (enterpriseId?: string) =>
    ["approvals", "stats", { enterpriseId }] as const,

  // Tasks
  tasks: (params?: { enterprise_id?: string; agent_id?: string }) =>
    ["tasks", params] as const,

  // Users
  users: (params?: { enterprise_id?: string }) => ["users", params] as const,
  user: (id: string) => ["users", id] as const,

  // Knowledge
  collections: (enterpriseId: string) =>
    ["knowledge", "collections", enterpriseId] as const,
  effectiveCollections: (enterpriseId: string, agentId: string) =>
    ["knowledge", "collections", "effective", enterpriseId, agentId] as const,
  collectionDocuments: (enterpriseId: string, collectionId: string) =>
    ["knowledge", "documents", enterpriseId, collectionId] as const,

  // Sessions (OpenClaw)
  sessions: (params?: { agent_id?: string; label?: string }) =>
    ["sessions", params] as const,
  session: (key: string) => ["sessions", key] as const,
  sessionUsage: (key: string) => ["sessions", key, "usage"] as const,

  // Chat (OpenClaw)
  chatHistory: (sessionKey: string) => ["chat", "history", sessionKey] as const,
  conversations: (params?: { agent_id?: string }) =>
    ["chat", "conversations", params] as const,
  chatAgents: (departmentId?: string) =>
    ["chat", "agents", { departmentId }] as const,
  unifiedSidebar: ["chat", "unified-sidebar"] as const,
  threads: (agentId?: string) =>
    ["chat", "threads", agentId ?? "all"] as const,
  agentSessions: (agentId: string) =>
    ["chat", "agent-sessions", agentId] as const,

  // Models
  availableModels: ["models", "available"] as const,

  // Gateway Config (OpenClaw)
  config: ["config"] as const,
  configSchema: ["config", "schema"] as const,
  configKeys: ["config", "keys"] as const,
  configPresets: ["config", "presets"] as const,

  // Cron Jobs (OpenClaw)
  cronJobs: ["cron"] as const,
  cronJobRuns: (jobId: string) => ["cron", jobId, "runs"] as const,
  cronTemplates: ["cron", "templates"] as const,

  // Channels (OpenClaw)
  channelsStatus: ["channels", "status"] as const,
  availableChannels: ["channels", "available"] as const,
  channelQR: (channelId: string) => ["channels", channelId, "qr"] as const,
  routingRules: ["channels", "routing"] as const,
  channelInstances: (params?: { platform?: string; status?: string }) =>
    ["channels", "instances", params] as const,
  channelInstance: (instanceId: string) =>
    ["channels", "instances", instanceId] as const,

  // Delegations
  delegations: (params?: {
    user_id?: string
    status?: DelegationStatus
    as_delegator?: boolean
  }) => ["delegations", params] as const,
  delegation: (id: string) => ["delegations", id] as const,

  // Clarifications
  clarifications: (params?: {
    enterprise_id?: string
    status?: string
    agent_id?: string
    target_user_id?: string
  }) => ["clarifications", params] as const,
  clarification: (id: string) => ["clarifications", id] as const,
  pendingClarifications: (enterpriseId: string) =>
    ["clarifications", "pending", enterpriseId] as const,

  // Webhooks
  webhooks: (params?: {
    enterprise_id?: string
    department_id?: string
    enabled?: boolean
  }) => ["webhooks", params] as const,
  webhook: (id: string) => ["webhooks", id] as const,

  // Templates
  templates: (params?: { sector?: string }) => ["templates", params] as const,
  templateSectors: () => ["templates", "sectors"] as const,

  // Invitations
  invitations: ["invitations"] as const,
  invitationInfo: (token: string) => ["invitation", token] as const,

  // DataLab
  datalabProjects: (enterpriseId: string) =>
    ["datalab", "projects", enterpriseId] as const,
  datalabProject: (projectId: string) =>
    ["datalab", "projects", "detail", projectId] as const,
  datalabProjectPreview: (projectId: string) =>
    ["datalab", "projects", "preview", projectId] as const,
  datalabDeployments: (enterpriseId: string) =>
    ["datalab", "deployments", enterpriseId] as const,
  datalabDeployment: (deploymentId: string) =>
    ["datalab", "deployments", "detail", deploymentId] as const,
  datalabEntries: (projectId: string) =>
    ["datalab", "entries", projectId] as const,
  datalabStats: (projectId: string) =>
    ["datalab", "stats", projectId] as const,

  // Communication Rules (A2A)
  communicationRules: ["communication-rules"] as const,

  // Workflows
  workflowTemplates: (params?: {
    enterprise_id?: string
    enabled?: boolean
    limit?: number
    offset?: number
  }) => ["workflow-templates", params] as const,
  workflowTemplate: (id: string) => ["workflow-templates", id] as const,
  workflowRuns: (params?: {
    enterprise_id?: string
    template_id?: string
    status?: string
    limit?: number
    offset?: number
  }) => ["workflow-runs", params] as const,
  workflowRun: (id: string) => ["workflow-runs", id] as const,
  workflowCatalog: (params?: {
    department_template_id?: string
    category?: string
    q?: string
  }) => ["workflow-catalog", params] as const,

  // Orchestrations
  orchestrations: (params?: {
    status?: string
    limit?: number
    offset?: number
  }) => ["orchestrations", params] as const,
  orchestration: (id: string) => ["orchestrations", id] as const,

  // Communications (A2A enterprise messaging)
  enterpriseMessages: (
    enterpriseId: string,
    params?: Record<string, string>
  ) => ["enterprise-messages", enterpriseId, params] as const,

  // Audit
  auditEntries: (params?: Record<string, unknown>) =>
    ["audit", params] as const,

  // Custom Tools
  customTools: (params?: {
    enterprise_id?: string
    enabled?: boolean
  }) => ["custom-tools", params] as const,
  customTool: (id: string) => ["custom-tools", id] as const,
  customToolRequests: (params?: {
    enterprise_id?: string
    status?: string
  }) => ["custom-tool-requests", params] as const,
  customToolRequest: (id: string) => ["custom-tool-requests", id] as const,

  // Support Tickets
  supportTickets: (params?: {
    status?: string
    priority?: string
  }) => ["support-tickets", params] as const,
  supportTicket: (id: string) => ["support-tickets", id] as const,

  // Department Projects
  departmentProjects: (departmentId: string) =>
    ["department-projects", departmentId] as const,

  // Email
  emailAccounts: ["email", "accounts"] as const,
  emailMessages: (params?: {
    folder?: string
    account_id?: string
    search?: string
    label?: string
  }) => ["email", "messages", params] as const,
  emailMessage: (id: string) => ["email", "messages", id] as const,
}

export type QueryKeys = typeof queryKeys
