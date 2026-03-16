/**
 * Private Agents API Client
 *
 * Modular API client with domain-specific methods.
 * Re-exports types and creates the singleton instance.
 */

import { withAgentApi } from "./agent"
import { withAuthApi, withEnterpriseApi } from "./auth"
import { BaseApiClient } from "./base"
import { withChannelApi, withEmailApi, withWebhookApi } from "./channels"
import { withChatApi } from "./chat"
import { withCommunicationRulesApi } from "./communication-rules"
import { withCommunicationsApi } from "./communications"
import { withDepartmentApi } from "./department"
import { withIntegrationApi } from "./integration"
import { withDataLabApi } from "./datalab"
import { withKnowledgeApi } from "./knowledge"
import { withMiscApi } from "./misc"
import { withOrchestrationApi } from "./orchestration"
import { withTaskApi } from "./task"
import { withApprovalApi, withUserApi } from "./user"
import { withAuditApi } from "./audit"
import { withCustomToolsApi } from "./custom-tools"
import { withSupportTicketsApi } from "./support-tickets"
import { withWorkflowApi } from "./workflow"
import type { ApiClientConstructor } from "./utils"

import type {
  Agent,
  AgentHumanLoopConfig,
  AgentSoul,
  ApiKeyListResponse,
  ApiKeyResponse,
  ApiKeyService,
  Approval,
  ApprovalStats,
  AppAuthSchemaResponse,
  AppDetailResponse,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
  ChannelInstance,
  ChannelInstanceUpdate,
  ChatAgent,
  ChatHistoryResponse,
  ChatSendResponse,
  ClarificationCreate,
  Collection,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CommunicationRule,
  ConversationsListResponse,
  CreateAgentRequest,
  CreateApiKeyRequest,
  CreateCommunicationRuleRequest,
  CreateDelegationRequest,
  CreateDepartmentRequest,
  CreateEnterpriseRequest,
  CreateTaskRequest,
  CreateUserRequest,
  CreateWebhookRequest,
  CreateWebmailAccountRequest,
  CreateOAuthEmailAccountRequest,
  CreateWorkflowTemplateRequest,
  CatalogEntry,
  CatalogReadinessResponse,
  CatalogActivateRequest,
  CronJob,
  CronJobRun,
  ComposioApp,
  Department,
  DepartmentHumanLoopConfig,
  DepartmentMember,
  DepartmentProject,
  DepartmentToolsResponse,
  BrowseResourcesResponse,
  RecommendedIntegrationsResponse,
  ResourceConfigResponse,
  Document,
  EffectiveApiKey,
  EffectiveConnections,
  Enterprise,
  GoogleAccount,
  GoogleCallbackResponse,
  GoogleConnectResponse,
  IngestRequest,
  IngestResponse,
  IngestUrlRequest,
  InvitationRequest,
  AcceptInvitationRequest,
  MemoryConfig,
  OrchestrationTask,
  PaginatedResponse,
  RecurringTask,
  RecurringTaskRequest,
  RoleInfo,
  RoutingRule,
  ScopedConnectRequest,
  ScopedConnection,
  ScopedSearchRequest,
  SearchResponse,
  SearchResponseDetailed,
  SectorInfo,
  SendEmailRequest,
  SessionSummary,
  SessionUsage,
  SessionsListResponse,
  StartConversationResponse,
  StartWorkflowRunRequest,
  SyncSoulRequest,
  Task,
  TaskStats,
  TaskToolCall,
  TemplateDetail,
  TemplateListItem,
  ThreadInfoResponse,
  UnifiedSidebarResponse,
  UpdateCommunicationRuleRequest,
  UpdateWorkflowTemplateRequest,
  User,
  WorkflowRun,
  WorkflowTemplate,
  CustomToolRequest,
  CustomTool,
  CreateCustomToolRequestPayload,
  UpdateCustomToolRequestPayload,
  ApproveCustomToolRequestPayload,
  ToolInfoResponse,
  UpdateCustomToolPayload,
} from "./types"

import type { AuditQueryParams, AuditListResponse } from "./audit"
import type { DataLabProject, DataLabProjectCreate, DataLabProjectUpdate, DataLabPreview, MCPDeployment } from "./datalab"
import type { SendA2AMessageRequest, SendA2AMessageResponse } from "./communications"

// ---------------------------------------------------------------------------
// Compose mixins (runtime)
// ---------------------------------------------------------------------------
// The mixin chain exceeds TypeScript's structural type resolution depth.
// We cast the inner composition to ApiClientConstructor so the outer mixins type-check.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InnerComposed = withCommunicationsApi(
  withMiscApi(
    withEmailApi(
      withWebhookApi(
        withChannelApi(
          withOrchestrationApi(
            withDataLabApi(
              withChatApi(
                withKnowledgeApi(
                  withIntegrationApi(
                    withTaskApi(
                      withApprovalApi(
                        withUserApi(
                          withAgentApi(
                            withDepartmentApi(
                              withEnterpriseApi(withAuthApi(BaseApiClient))
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  )
) as any as ApiClientConstructor

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OuterComposed = withCommunicationRulesApi(InnerComposed) as any as ApiClientConstructor
const ComposedApiClient = withSupportTicketsApi(
  withCustomToolsApi(
    withAuditApi(
      withWorkflowApi(OuterComposed)
    )
  )
) as unknown as typeof BaseApiClient

// ---------------------------------------------------------------------------
// ApiClient interface — explicit method declarations for TypeScript
// TypeScript can't resolve deeply nested mixin chains, so we declare
// every public method here for full type safety.
// ---------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiClient {
  // -- Agent --
  getMyAgent(): Promise<Agent>
  getAgentMemoryConfig(agentId: string): Promise<MemoryConfig>
  updateAgentMemoryConfig(agentId: string, config: Partial<MemoryConfig>): Promise<void>
  previewAgentMemory(agentId: string, query: string, limit?: number): Promise<{ results: { content: string; score: number }[] }>
  getAgents(params?: { enterprise_id?: string; department_id?: string }): Promise<PaginatedResponse<Agent>>
  getAgent(id: string): Promise<Agent>
  createAgent(data: CreateAgentRequest): Promise<Agent>
  updateAgent(id: string, data: Partial<Agent>): Promise<Agent>
  deleteAgent(id: string): Promise<void>
  linkAgentToUser(agentId: string, userId: string): Promise<Agent>
  unlinkAgentFromUser(agentId: string): Promise<Agent>
  getAgentsByUser(userId: string): Promise<Agent[]>
  getAgentSoul(agentId: string): Promise<AgentSoul>
  syncAgentSoul(agentId: string, data: SyncSoulRequest): Promise<AgentSoul>
  getAgentHumanLoopConfig(agentId: string): Promise<AgentHumanLoopConfig>
  updateAgentHumanLoopConfig(agentId: string, data: Partial<AgentHumanLoopConfig>): Promise<AgentHumanLoopConfig>
  updateAgentSoul(agentId: string, soul: Partial<AgentSoul>): Promise<AgentSoul>

  // -- Auth --
  login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: { id: string; email: string; name: string; enterprise_id: string } }>
  logout(): Promise<void>
  getMe(): Promise<{ id: string; email: string; name: string; enterprise_id: string }>

  // -- Enterprise --
  getEnterprises(params?: { status?: string; tier?: string }): Promise<Enterprise[]>
  getEnterprise(id: string): Promise<Enterprise>
  createEnterprise(data: CreateEnterpriseRequest): Promise<Enterprise>
  updateEnterprise(id: string, data: Partial<Enterprise>): Promise<Enterprise>

  // -- Department --
  getDepartments(enterpriseId?: string): Promise<PaginatedResponse<Department>>
  getDepartment(id: string): Promise<Department>
  createDepartment(data: CreateDepartmentRequest): Promise<Department>
  updateDepartment(id: string, data: Partial<Department>): Promise<Department>
  deleteDepartment(id: string): Promise<void>
  getDepartmentHumanLoopConfig(departmentId: string): Promise<DepartmentHumanLoopConfig>
  updateDepartmentHumanLoopConfig(departmentId: string, data: Partial<DepartmentHumanLoopConfig>): Promise<DepartmentHumanLoopConfig>
  getDepartmentTools(departmentId: string): Promise<DepartmentToolsResponse>
  updateDepartmentTools(departmentId: string, tools: string[], reasoningTools?: string[]): Promise<{ tools: string[] }>
  getDepartmentMembers(departmentId: string): Promise<DepartmentMember[]>
  addDepartmentMembers(departmentId: string, userIds: string[]): Promise<void>
  removeDepartmentMember(departmentId: string, userId: string): Promise<void>
  setDepartmentHead(departmentId: string, userId: string): Promise<void>

  // -- Department Projects --
  getDepartmentProjects(departmentId: string): Promise<{ items: DepartmentProject[]; total: number }>
  createDepartmentProject(departmentId: string, data: { name: string; description?: string; local_paths?: string[]; repositories?: { url: string; branch?: string; provider?: string }[]; tool_connections?: { app_name: string; entity_id?: string }[]; config?: Record<string, unknown>; agent_ids?: string[] }): Promise<DepartmentProject>
  updateDepartmentProject(departmentId: string, projectId: string, data: Partial<{ name: string; description: string; local_paths: string[]; repositories: { url: string; branch?: string; provider?: string }[]; tool_connections: { app_name: string; entity_id?: string }[]; config: Record<string, unknown>; is_active: boolean }>): Promise<DepartmentProject>
  deleteDepartmentProject(departmentId: string, projectId: string): Promise<void>
  assignProjectAgents(departmentId: string, projectId: string, agentIds: string[]): Promise<{ agent_ids: string[] }>
  getProjectResourceConfig(departmentId: string): Promise<ResourceConfigResponse>
  browseProjectResources(departmentId: string, params: { app: string; resource_type: string }): Promise<BrowseResourcesResponse>
  getRecommendedIntegrations(departmentId: string): Promise<RecommendedIntegrationsResponse>

  // -- User --
  getUsers(params?: { enterprise_id?: string; role?: string }): Promise<PaginatedResponse<User>>
  getUser(id: string): Promise<User>
  createUser(data: CreateUserRequest): Promise<User>
  updateUser(id: string, data: Partial<User>): Promise<User>
  updateUserPermissions(id: string, permissions: string[]): Promise<User>
  deleteUser(id: string): Promise<void>

  // -- Approval --
  getApprovals(params?: { status?: string; enterprise_id?: string; department_id?: string; type?: string; requesting_agent_id?: string }): Promise<Approval[]>
  getApproval(id: string): Promise<Approval>
  approveApproval(id: string, comments?: string): Promise<Approval>
  rejectApproval(id: string, reason: string): Promise<Approval>
  escalateApproval(id: string, reason?: string): Promise<Approval>
  getApprovalStats(enterpriseId?: string): Promise<ApprovalStats>

  // -- Task --
  getTasks(params?: { agent_id?: string; enterprise_id?: string; status?: string; limit?: number }): Promise<PaginatedResponse<Task>>
  createTask(data: CreateTaskRequest): Promise<Task>
  retryTask(taskId: string): Promise<Task>
  getTaskToolCalls(taskId: string): Promise<TaskToolCall[]>
  getTask(id: string): Promise<Task>
  getTaskStats(enterpriseId?: string): Promise<TaskStats>

  // -- Integration --
  getScopedConnections(params: { enterprise_id: string; scope?: string; scopeId?: string }): Promise<ScopedConnection[]>
  getComposioApps(params?: { category?: string; limit?: number }): Promise<ComposioApp[]>
  connectScopedApp(data: ScopedConnectRequest): Promise<{ auth_url: string }>
  disconnectScopedApp(connectionId: string): Promise<void>
  getEffectiveConnections(agentId: string, enterpriseId: string): Promise<EffectiveConnections>
  getComposioIntegrations(): Promise<{ connected: string[] }>
  getAppAuthSchema(appKey: string): Promise<AppAuthSchemaResponse>
  getAppDetails(appKey: string): Promise<AppDetailResponse>
  getGoogleStatus(): Promise<{ connected: boolean; email?: string }>
  getGoogleAccounts(): Promise<GoogleAccount[]>
  connectGoogle(data: { email: string; services?: string }): Promise<GoogleConnectResponse>
  googleCallback(data: { email: string; code: string }): Promise<GoogleCallbackResponse>
  removeGoogleAccount(email: string): Promise<void>
  testGoogleConnection(email: string): Promise<{ success: boolean; message: string }>
  getApiKeyServices(): Promise<ApiKeyService[]>
  getApiKeys(params: { scope?: string; scope_id?: string; enterprise_id?: string }): Promise<ApiKeyListResponse>
  createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyResponse & { key: string }>
  deleteApiKey(keyId: string): Promise<void>
  getEffectiveApiKeys(agentId: string): Promise<EffectiveApiKey[]>
  getSubscriptionGateways(enterpriseId: string): Promise<{ gateways: { id: string; name: string; scope: string }[] }>

  // -- Knowledge --
  getCollections(enterpriseId: string): Promise<Collection[]>
  searchKnowledge(enterpriseId: string, query: string): Promise<SearchResponse>
  ingestDocument(enterpriseId: string, data: IngestRequest): Promise<IngestResponse>
  ingestFromUrl(enterpriseId: string, data: IngestUrlRequest): Promise<IngestResponse>
  ingestFile(enterpriseId: string, file: File, collectionId?: string, onProgress?: (progress: number) => void): Promise<IngestResponse>
  searchKnowledgeScoped(enterpriseId: string, data: ScopedSearchRequest): Promise<SearchResponseDetailed>
  getEffectiveCollections(enterpriseId: string, agentId: string): Promise<Collection[]>
  createCollection(enterpriseId: string, data: CollectionCreateRequest): Promise<Collection>
  updateCollection(enterpriseId: string, collectionId: string, data: CollectionUpdateRequest): Promise<Collection>
  deleteCollection(enterpriseId: string, collectionId: string): Promise<void>
  getCollectionDocuments(enterpriseId: string, collectionId: string): Promise<Document[]>
  getDocumentContent(enterpriseId: string, documentId: string): Promise<{ document_id: string; title: string; content: string; chunk_count: number }>
  deleteDocument(enterpriseId: string, documentId: string): Promise<void>

  // -- Chat --
  getSessions(params?: { agent_id?: string; limit?: number }): Promise<SessionsListResponse>
  resolveSession(params: { agent_id?: string; user_id?: string }): Promise<{ session_key: string }>
  createSession(data: { agent_id: string; title?: string }): Promise<{ session_key: string }>
  patchSession(sessionKey: string, data: { title?: string; metadata?: Record<string, unknown> }): Promise<void>
  resetSession(sessionKey: string, reason?: string): Promise<void>
  deleteSession(sessionKey: string, deleteTranscript?: boolean): Promise<void>
  getSessionUsage(sessionKey: string): Promise<SessionUsage>
  compactSession(sessionKey: string): Promise<void>
  sendChatMessage(data: { session_key: string; message: string; stream?: boolean }): Promise<ChatSendResponse>
  getChatHistory(sessionKey: string, limit?: number): Promise<ChatHistoryResponse>
  abortChat(sessionKey: string): Promise<void>
  getConversations(params?: { agent_id?: string; limit?: number }): Promise<ConversationsListResponse>
  startConversation(agentId: string, title?: string): Promise<StartConversationResponse>
  approveChatAction(data: { session_key: string; action_id: string; approved: boolean; comments?: string }): Promise<void>
  deleteConversation(sessionKey: string, deleteTranscript?: boolean): Promise<void>
  getAvailableAgentsForChat(departmentId?: string): Promise<{ agents: ChatAgent[] }>
  parseSchedule(text: string): Promise<{ schedule: string; timezone: string }>
  createRecurringTaskFromChat(data: RecurringTaskRequest): Promise<RecurringTask>
  getUnifiedSidebar(): Promise<UnifiedSidebarResponse>
  getThreads(agentId?: string): Promise<ThreadInfoResponse[]>
  getAgentSessions(agentId: string, currentSessionKey?: string): Promise<SessionSummary[]>
  searchChatMemory(params: { agent_id: string; query: string; limit?: number }): Promise<{ results: { content: string; score: number; source: string }[] }>

  // -- DataLab --
  getDataLabProjects(enterpriseId: string, projectType?: string): Promise<DataLabProject[]>
  getDataLabProject(enterpriseId: string, projectId: string): Promise<DataLabProject>
  createDataLabProject(enterpriseId: string, data: DataLabProjectCreate): Promise<DataLabProject>
  updateDataLabProject(enterpriseId: string, projectId: string, data: DataLabProjectUpdate): Promise<DataLabProject>
  deleteDataLabProject(enterpriseId: string, projectId: string): Promise<{ deleted: boolean }>
  previewDataLabProject(enterpriseId: string, projectId: string, limit?: number): Promise<DataLabPreview>
  buildMCPServer(enterpriseId: string, projectId: string): Promise<MCPDeployment>
  deployMCPServer(enterpriseId: string, deploymentId: string): Promise<MCPDeployment>
  stopMCPServer(enterpriseId: string, deploymentId: string): Promise<MCPDeployment>
  bindMCPToAgents(enterpriseId: string, deploymentId: string, agentIds: string[]): Promise<MCPDeployment>
  unbindMCPFromAgents(enterpriseId: string, deploymentId: string, agentIds: string[]): Promise<MCPDeployment>
  getDataLabDeployments(enterpriseId: string, projectId?: string): Promise<MCPDeployment[]>
  getDataLabDeployment(enterpriseId: string, deploymentId: string): Promise<MCPDeployment>

  // -- Orchestration --
  startOrchestration(data: { message: string; primary_agent_id: string; session_key?: string }): Promise<{ orchestration_id: string; conversation_id: string; status: string }>
  getOrchestration(orchestrationId: string): Promise<OrchestrationTask>
  listOrchestrations(params?: { status?: string; limit?: number; offset?: number }): Promise<{ orchestrations: OrchestrationTask[]; total: number }>
  respondToOrchestrationStep(data: { orchestration_id: string; step_id: string; response: string }): Promise<void>
  cancelOrchestration(orchestrationId: string): Promise<void>

  // -- Channels --
  getChannelsStatus(): Promise<Record<string, { connected: boolean; status: string }>>
  getAvailableChannels(): Promise<{ channels: { id: string; name: string; type: string }[] }>
  sendChannelMessage(data: { channel: string; recipient: string; message: string; metadata?: Record<string, unknown> }): Promise<{ message_id: string }>
  connectChannel(channel: string, config: Record<string, unknown>): Promise<void>
  disconnectChannel(channelId: string): Promise<void>
  getChannelQR(channelId: string): Promise<{ qr_code: string; status: string; expires_in?: number; qr_data?: string }>
  getRoutingRules(): Promise<{ rules: RoutingRule[] }>
  updateRoutingRules(rules: RoutingRule[]): Promise<void>
  getChannelInstances(params?: { enterprise_id?: string; channel?: string }): Promise<{ instances: ChannelInstance[] }>
  getChannelInstance(instanceId: string): Promise<{ id: string; channel: string; name: string; config: Record<string, unknown>; status: string }>
  updateChannelInstance(instanceId: string, data: ChannelInstanceUpdate): Promise<void>
  reconnectChannelInstance(instanceId: string): Promise<void>
  deleteChannelInstance(instanceId: string): Promise<void>

  // -- Webhook --
  getWebhooks(params: { enterprise_id: string; is_active?: boolean }): Promise<{ webhooks: any[] }>
  getWebhook(webhookId: string, enterpriseId: string): Promise<any>
  createWebhook(enterpriseId: string, data: CreateWebhookRequest): Promise<any>
  updateWebhook(webhookId: string, enterpriseId: string, data: Partial<CreateWebhookRequest>): Promise<void>
  deleteWebhook(webhookId: string, enterpriseId: string): Promise<void>
  testWebhook(webhookId: string, enterpriseId: string): Promise<{ success: boolean; response_time_ms: number }>

  // -- Email --
  createWebmailAccount(data: CreateWebmailAccountRequest): Promise<{ account_id: string }>
  createOAuthEmailAccount(data: CreateOAuthEmailAccountRequest): Promise<{ account_id: string; auth_url?: string }>
  finalizeOAuthEmail(accountId: string, code: string): Promise<{ success: boolean }>
  getEmailAccounts(): Promise<{ accounts: any[] }>
  deleteEmailAccount(accountId: string): Promise<void>
  syncEmailAccount(accountId: string): Promise<{ synced: number; new_messages: number }>
  getEmailMessages(params?: { account_id?: string; folder?: string; limit?: number; offset?: number }): Promise<{ messages: any[]; items?: any[]; total: number; unread_counts?: Record<string, number> }>
  getEmailMessage(messageId: string): Promise<any>
  updateEmailMessage(messageId: string, data: { is_read?: boolean; folder?: string }): Promise<void>
  bulkUpdateEmailMessages(messageIds: string[], data: { is_read?: boolean; folder?: string }): Promise<void>
  sendEmail(data: SendEmailRequest): Promise<{ message_id: string }>

  // -- Misc --
  listTemplates(params?: { sector?: string; type?: string }): Promise<{ templates: TemplateListItem[] }>
  listSectors(): Promise<{ sectors: SectorInfo[] }>
  listRoles(): Promise<{ roles: RoleInfo[] }>
  getTemplate(templateId: string): Promise<TemplateDetail>
  previewTemplate(templateId: string, variables: Record<string, string>): Promise<{ preview: Record<string, unknown> }>
  getTemplateVariables(templateId: string): Promise<{ variables: { name: string; description: string; required: boolean }[] }>
  applyTemplate(templateId: string, data: ApplyTemplateRequest): Promise<ApplyTemplateResponse>
  getGatewayConfig(): Promise<Record<string, unknown>>
  setGatewayConfig(config: Record<string, unknown>): Promise<void>
  patchGatewayConfig(patch: Record<string, unknown>): Promise<void>
  applyGatewayConfig(agentId: string, config: Record<string, unknown>): Promise<void>
  getGatewayConfigSchema(): Promise<Record<string, unknown>>
  getGatewayConfigKeys(): Promise<{ keys: string[] }>
  getGatewayConfigPresets(): Promise<{ presets: { id: string; name: string; config: Record<string, unknown> }[] }>
  applyGatewayConfigPreset(presetId: string): Promise<void>
  initiateCodexAuth(): Promise<{ auth_url: string; user_code?: string; verification_url?: string; interval?: number; expires_in?: number }>
  checkCodexAuthStatus(): Promise<{ authenticated: boolean; expires_at?: string; status?: string; email?: string; error?: string }>
  revokeCodexAuth(): Promise<void>
  checkCodexConnected(): Promise<{ connected: boolean; email?: string }>
  getAvailableModels(): Promise<{ models: { id: string; name: string; provider: string }[]; providers?: { id: string; name: string }[] }>
  getCronJobs(): Promise<{ items: CronJob[]; total: number }>
  createCronJob(data: { name: string; schedule: string; task_type: string; agent_id: string; params?: Record<string, unknown> }): Promise<{ id: string }>
  updateCronJob(jobId: string, data: { name?: string; schedule?: string; command?: string; enabled?: boolean }): Promise<void>
  deleteCronJob(jobId: string): Promise<void>
  runCronJob(jobId: string): Promise<{ task_id: string }>
  toggleCronJob(jobId: string): Promise<void>
  getCronJobRuns(jobId: string, limit?: number): Promise<{ items: CronJobRun[]; total: number }>
  getCronTemplates(): Promise<{ templates: { id: string; name: string; description: string }[] }>
  getRemoteTunnelInfo(): Promise<{ token: string | null; remote_url: string | null }>
  regenerateRemoteTunnel(): Promise<{ token: string; remote_url: string }>
  remoteTunnelAuth(tunnelToken: string): Promise<{ access_token: string; user: { id: string; name: string } }>
  getRemoteTunnelStatus(): Promise<{ is_active: boolean }>
  createInvitation(data: InvitationRequest): Promise<{ id: string; token: string; invite_url: string }>
  getInvitationInfo(token: string): Promise<{ email: string; enterprise_name: string; role: string; expires_at: string }>
  acceptInvitation(data: AcceptInvitationRequest): Promise<{ access_token: string; user: { id: string; email: string } }>
  listInvitations(): Promise<{ items: { id: string; email: string; status: string }[] }>
  revokeInvitation(invitationId: string): Promise<void>
  getDelegations(params?: { enterprise_id?: string; agent_id?: string }): Promise<{ delegations: any[] }>
  getDelegation(id: string): Promise<any>
  createDelegation(data: CreateDelegationRequest): Promise<{ id: string }>
  revokeDelegation(id: string): Promise<void>
  getClarifications(params: { enterprise_id: string; status?: string; limit?: number }): Promise<{ clarifications: any[] }>
  getPendingClarifications(enterpriseId: string): Promise<{ count: number; items: any[] }>
  getClarification(enterpriseId: string, clarificationId: string): Promise<any>
  createClarification(enterpriseId: string, data: ClarificationCreate): Promise<{ id: string }>
  respondToClarification(enterpriseId: string, clarificationId: string, response: string): Promise<void>
  cancelClarification(enterpriseId: string, clarificationId: string): Promise<void>

  // -- Communication Rules --
  getCommunicationRules(): Promise<CommunicationRule[]>
  createCommunicationRule(data: CreateCommunicationRuleRequest): Promise<CommunicationRule>
  updateCommunicationRule(id: string, data: UpdateCommunicationRuleRequest): Promise<CommunicationRule>
  deleteCommunicationRule(id: string): Promise<void>

  // -- Communications (A2A) --
  getEnterpriseMessages(enterpriseId: string, params?: Record<string, string>): Promise<any[]>
  sendA2AMessage(data: SendA2AMessageRequest): Promise<SendA2AMessageResponse>

  // -- Workflow --
  listWorkflowTemplates(params?: { enterprise_id?: string; enabled?: boolean; limit?: number; offset?: number }): Promise<WorkflowTemplate[]>
  getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate>
  createWorkflowTemplate(data: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate>
  updateWorkflowTemplate(templateId: string, data: UpdateWorkflowTemplateRequest): Promise<WorkflowTemplate>
  deleteWorkflowTemplate(templateId: string): Promise<void>
  listWorkflowRuns(params?: { enterprise_id?: string; template_id?: string; status?: string; limit?: number; offset?: number }): Promise<WorkflowRun[]>
  getWorkflowRun(runId: string): Promise<WorkflowRun>
  startWorkflowRun(data: StartWorkflowRunRequest): Promise<WorkflowRun>
  resumeWorkflowRun(runId: string, approvalContext?: Record<string, unknown>): Promise<WorkflowRun>
  listCatalog(params?: { department_template_id?: string; category?: string; pattern?: string; tags?: string[]; q?: string }): Promise<CatalogEntry[]>
  getCatalogEntry(catalogId: string): Promise<CatalogEntry>
  checkCatalogReadiness(catalogId: string, data: { enterprise_id: string; department_id: string }): Promise<CatalogReadinessResponse>
  activateCatalogWorkflow(catalogId: string, data: CatalogActivateRequest): Promise<WorkflowTemplate>

  // -- Audit --
  listAuditEntries(params: AuditQueryParams): Promise<AuditListResponse>

  // -- Custom Tools --
  listCustomToolRequests(params?: { enterprise_id?: string; status?: string; limit?: number; offset?: number }): Promise<CustomToolRequest[]>
  getCustomToolRequest(requestId: string): Promise<CustomToolRequest>
  createCustomToolRequest(data: CreateCustomToolRequestPayload): Promise<CustomToolRequest>
  updateCustomToolRequest(requestId: string, data: UpdateCustomToolRequestPayload): Promise<CustomToolRequest>
  approveCustomToolRequest(requestId: string, data: ApproveCustomToolRequestPayload): Promise<CustomTool>
  rejectCustomToolRequest(requestId: string, feedback: string): Promise<CustomToolRequest>
  listCustomTools(params?: { enterprise_id?: string; enabled?: boolean; limit?: number; offset?: number }): Promise<CustomTool[]>
  getCustomTool(toolId: string): Promise<CustomTool>
  updateCustomTool(toolId: string, data: UpdateCustomToolPayload): Promise<CustomTool>
  deleteCustomTool(toolId: string): Promise<void>
  deleteCustomToolRequest(requestId: string): Promise<void>
  getToolInfo(requestId: string): Promise<ToolInfoResponse>
  getRequestDepartmentAgents(requestId: string): Promise<{ id: string; name: string; display_name: string }[]>

  // Support Tickets
  listSupportTickets(params?: { status?: string; priority?: string; limit?: number; offset?: number }): Promise<{ items: SupportTicket[]; total: number }>
  getSupportTicket(ticketId: string): Promise<SupportTicket>
  createSupportTicket(data: { title: string; description?: string; error_data?: Record<string, unknown>; priority?: string }): Promise<SupportTicket>
  updateSupportTicket(ticketId: string, data: { status?: string; priority?: string; resolution?: string; assigned_agent_id?: string }): Promise<SupportTicket>
}

// ---------------------------------------------------------------------------
// Runtime class
// ---------------------------------------------------------------------------
export class ApiClient extends ComposedApiClient {}

export const api = new ApiClient()
export default api

export * from "./types"
