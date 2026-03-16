/**
 * Private Agents API Client - Types
 */

export interface ApiError {
  detail: string
  status: number
}

export interface User {
  id: string
  email: string
  name: string | null
  job_title: string | null
  avatar_url: string | null
  phone: string | null
  enterprise_id: string
  department_id: string | null
  department_ids?: string[]
  role: string
  status: string
  created_at: string
  permissions?: string[]
  visible_agent_ids?: string[]
}

export interface Enterprise {
  id: string
  name: string
  slug: string
  status: string
  tier: string
  settings: Record<string, unknown>
  director_agent_id?: string | null
  created_at: string
}

export interface Department {
  id: string
  enterprise_id: string
  name: string
  display_name: string | null
  description: string | null
  parent_id: string | null
  role: string | null
  can_approve: boolean
  enabled: boolean
  tools_autonomous: boolean
  manager_user_id: string | null
  orchestrator_enabled: boolean
  orchestrator_agent_id: string | null
  orchestrator_config: Record<string, unknown>
  created_at: string
}

export interface Agent {
  id: string
  enterprise_id: string
  department_id: string | null
  user_id: string | null
  name: string
  display_name: string | null
  description: string | null
  avatar_url: string | null
  role: string
  specialization: string | null
  status: string
  enabled: boolean
  model_provider: string
  model_id: string
  temperature: number
  max_tokens: number
  language: string | null
  capabilities: string[]
  can_use_tools: string[] | null
  can_communicate_with: string[] | null
  gateway_key_id: string | null
  requires_human_approval: boolean
  approval_threshold: number | null
  autonomy_level: string
  llm_config: Record<string, unknown>
  openclaw_agent_id: string | null
  workspace_path: string | null
  // OpenClaw runtime config
  thinking_level: string | null
  subagent_max_depth: number | null
  subagent_max_children: number | null
  subagent_max_concurrent: number | null
  subagent_timeout_seconds: number | null
  // Heartbeat config
  heartbeat_enabled: boolean
  heartbeat_interval_minutes: number | null
  heartbeat_active_hours: string | null
  heartbeat_instructions: string | null
  // Exec security + browser
  exec_security: 'full' | 'allowlist' | 'deny'
  exec_allowlist: string[] | null
  exec_denylist: string[] | null
  browser_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AgentSoul {
  agent_id: string
  traits: Record<string, number>
  values: string[]
  communication_style: Record<string, unknown>
  expertise_areas: string[]
  backstory: string
  cached_content?: string
  source_type?: string
  source_config?: Record<string, unknown>
  source_document_url?: string
  last_sync_at?: string
  version?: number
}

export interface DepartmentHumanLoopConfig {
  department_id: string
  require_approval_for: string[]
  auto_approve_threshold: number
  auto_approve_up_to?: number
  autonomy_level?: AutonomyLevel
  escalation_rules: Record<string, unknown>
}

export type AutonomyLevel = "full" | "supervised" | "manual"

export type A2ASupervisionMode = "supervised" | "autonomous"

export interface AgentHumanLoopConfig {
  agent_id: string
  autonomy_level: AutonomyLevel
  require_approval_for: string[]
  auto_approve_conditions: Record<string, unknown>
  supervisor_id: string | null
  primary_supervisor_id: string | null
  backup_supervisor_id: string | null
  a2a_supervision_mode: A2ASupervisionMode
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired"
export type ApprovalPriority = "low" | "medium" | "high" | "urgent"
export type ApprovalType =
  | "expense"
  | "document"
  | "action"
  | "schedule"
  | "communication"
  | "data_access"
  | "payment"
  | "contract"
  | "hiring"
  | "other"

export interface Approval {
  id: string
  enterprise_id: string
  department_id: string | null
  agent_id: string
  type: ApprovalType
  title: string
  description: string
  status: ApprovalStatus
  priority: ApprovalPriority
  amount?: number
  currency?: string
  metadata: Record<string, unknown>
  requested_by: string
  requested_at: string
  expires_at: string | null
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  context?: Record<string, unknown>
}

export interface DepartmentMember {
  id: string
  user_id: string
  user_name: string
  user_email: string
  name?: string
  email?: string
  role: string
  is_head: boolean
  joined_at: string
}

export interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  total: number
  avg_response_minutes?: number
  approved_today?: number
  rejected_today?: number
}

export interface Task {
  id: string
  agent_id: string
  enterprise_id: string
  title: string
  description: string | null
  status: string
  priority: string
  input: Record<string, unknown>
  result: Record<string, unknown> | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  deadline: string | null
  error: string | null
  input_text?: string
  requires_approval?: boolean
  approval_status?: string
  output?: Record<string, unknown>
  human_action_type?: string
  human_action_reason?: string
  requires_human_action?: boolean
  duration_ms?: number
  conversation_id?: string
  error_message?: string
}

export interface TaskToolCall {
  id: string
  task_id: string
  tool_name: string
  tool_args: Record<string, unknown>
  result: Record<string, unknown> | null
  status: string
  created_at: string
}

export interface Integration {
  id: string
  enterprise_id: string
  app_name: string
  status: string
  created_at: string
  config: Record<string, unknown>
}

export type IntegrationScope = "enterprise" | "department" | "agent"

export interface ScopedConnection {
  id: string
  app_key: string
  app_name: string
  app?: string
  scope: IntegrationScope
  scope_id: string
  department_id?: string
  agent_id?: string
  status: string
  created_at: string
}

export interface ScopedConnectRequest {
  app_key: string
  scope: IntegrationScope
  scope_id: string
  app?: string
  enterprise_id?: string
  department_id?: string
  agent_id?: string
  auth_mode?: string
  auth_config?: Record<string, unknown>
  connected_account_params?: Record<string, unknown>
  redirect_uri?: string
}

export interface ComposioApp {
  key: string
  name: string
  logo: string
  description: string
  categories: string[]
  category?: string
  logo_url?: string
  auth_schemes?: (AppAuthScheme | string)[]
  tools_count?: number
  triggers_count?: number
  managed_auth?: boolean
}

export interface AppToolInfo {
  name: string
  display_name: string
  description: string | null
}

export interface AppDetailResponse {
  key: string
  tools: AppToolInfo[]
  triggers: AppToolInfo[]
}

export interface EffectiveConnections {
  agent_id: string
  connections: ScopedConnection[]
  inherited_from: Record<string, string[]>
}

export interface AuthSchemeField {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

export interface ApiKeyService {
  id: string
  name: string
  description: string
  service: string
  key_url?: string
  fields?: AuthSchemeField[]
}

export interface ApiKeyResponse {
  id: string
  key_prefix: string
  service_id: string
  scope: ApiKeyScope
  scope_id: string
  created_at: string
  last_used_at: string | null
  service?: string
  masked_key?: string
  label?: string
  department_id?: string
  agent_id?: string
}

export interface ApiKeyListResponse {
  keys: ApiKeyResponse[]
  total: number
}

export interface CreateApiKeyRequest {
  service_id: string
  scope: ApiKeyScope
  scope_id: string
  service?: string
  enterprise_id?: string
  department_id?: string
  agent_id?: string
  metadata?: Record<string, unknown>
  api_key?: string
  label?: string
  instance_name?: string
}

export interface AppAuthScheme {
  scheme_type: string
  fields: AuthSchemeField[]
  name?: string
  scheme_name?: string
  auth_mode?: string
  auth_config?: Record<string, unknown>
}

export interface AppAuthSchemaResponse {
  app_key: string
  auth_schemes: AppAuthScheme[]
  requires_custom_auth?: boolean
}

export interface GoogleAccount {
  email: string
  status: string
}

export interface GoogleConnectResponse {
  auth_url: string
}

export interface GoogleCallbackResponse {
  success: boolean
  email: string
}

export type ApiKeyScope = "enterprise" | "department" | "agent"


export interface EffectiveApiKey {
  service_id: string
  service_name: string
  scope: ApiKeyScope
  scope_id: string
  has_key: boolean
}

export interface SubscriptionGateway {
  id: string
  name: string
  type: string
  description: string
  features: string[]
  scope?: "enterprise" | "department" | "agent"
  service?: string
  masked_key?: string
  label?: string
  instance_name?: string
  department_id?: string
  agent_id?: string
}

export interface SubscriptionGatewayListResponse {
  gateways: SubscriptionGateway[]
}

export interface SubscriptionGatewayItem {
  id: string
  name: string
  instance_name: string
  scope: "enterprise" | "department" | "agent"
  masked_key?: string
  status: string
  created_at: string
}

export const SUBSCRIPTION_PROVIDERS = new Set(["zai-coding", "openai-codex"])

export interface AgentTemplate {
  id: string
  name: string
  description: string
  role: string
  capabilities: string[]
  llm_config: Record<string, unknown>
  soul_template: Partial<AgentSoul>
}

export interface DepartmentTemplate {
  id: string
  name: string
  description: string
  agent_templates: AgentTemplate[]
}

export interface TemplateListItem {
  id: string
  name: string
  display_name: string
  type: "agent" | "department"
  description: string
  icon: string
  sector: string
  agent_count: number
}

export interface SectorInfo {
  id: string
  display_name: string
  template_count: number
}

export interface RoleInfo {
  id: string
  name: string
}

export interface ApplyTemplateRequest {
  name?: string
  variables?: Record<string, string>
}

export interface ApplyTemplateResponse {
  success: boolean
  resource_id: string
  department_name: string
  agents_created: number
  message: string
}

export interface TemplateAgentPreview {
  id: string
  display_name: string
  description: string
  role: string
}

export interface TemplateDetail {
  id: string
  name: string
  display_name: string
  type: "agent" | "department"
  description: string
  icon: string
  sector: string
  variables: string[]
  agents: TemplateAgentPreview[]
}

export interface Collection {
  id: string
  collection_id?: string
  name: string
  description: string | null
  document_count: number
  chunk_count?: number
  total_tokens?: number
  scope?: string
  department_id?: string | null
  agent_id?: string | null
  created_at: string
}

export interface CollectionDetail {
  id: string
  name: string
  description: string | null
  documents: Document[]
  created_at: string
}

export interface CollectionCreateRequest {
  name: string
  description?: string
  scope?: IntegrationScope
  department_id?: string
  agent_id?: string
}

export interface CollectionUpdateRequest {
  name?: string
  description?: string
}

export interface Document {
  document_id: string
  title: string | null
  source: string | null
  path: string | null
  chunk_count: number
  total_tokens: number
  created_at: string | null
  has_file?: boolean
  mime_type?: string | null
}

export interface ScopedSearchRequest {
  query: string
  scope: IntegrationScope
  scope_id: string
  collection_ids?: string[]
  limit?: number
}

export interface SearchResult {
  content: string
  score: number
  source: string
  metadata: Record<string, unknown>
  chunk_id?: string
  document_title?: string
}

export interface SearchResponseDetailed {
  results: SearchResult[]
  total: number
}

export interface IngestUrlRequest {
  url: string
  collection_id?: string
  scope?: IntegrationScope
  department_id?: string
  agent_id?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface CreateEnterpriseRequest {
  name: string
  slug: string
  tier?: string
}

export interface CreateDepartmentRequest {
  enterprise_id: string
  name: string
  description?: string
  parent_id?: string
}

export interface CreateAgentRequest {
  enterprise_id: string
  department_id?: string
  user_id?: string
  name: string
  role: string
  description?: string
}

export interface SyncSoulRequest {
  traits?: Record<string, number>
  values?: string[]
  communication_style?: Record<string, unknown>
  expertise_areas?: string[]
  backstory?: string
  cached_content?: string
  source_type?: string
  source_config?: Record<string, unknown>
}

export interface CreateTaskRequest {
  agent_id: string
  enterprise_id?: string
  title: string
  description?: string
  priority?: string
  input?: Record<string, unknown>
  deadline?: string
}

export interface CreateUserRequest {
  email: string
  name: string
  enterprise_id: string
  department_id?: string
  role?: string
}

export interface IngestRequest {
  content: string
  collection_id?: string
  metadata?: Record<string, unknown>
  scope?: IntegrationScope
  department_id?: string
  agent_id?: string
}

export interface IngestResponse {
  document_id: string
  status: string
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  total?: number
}

export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  failed: number
  auto_approved?: number
  human_approved?: number
}

export interface AvailableApp {
  key: string
  name: string
  description: string
  category?: string | null
  logo_url?: string | null
  auth_schemes?: string[]
}

export interface SessionInfo {
  session_key: string
  agent_id: string
  agent_name: string
  created_at: string
  last_message_at: string | null
  message_count: number
}

export interface SessionsListResponse {
  sessions: SessionInfo[]
}

export interface SessionUsage {
  message_count: number
  tokens_used: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  tool_calls?: Record<string, unknown>[]
  thinking?: string
}

export interface ChatSendResponse {
  session_key: string
  message_id: string
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
}

export interface ConversationInfo {
  session_key: string
  agent_id: string
  agent_name: string
  last_message: string | null
  last_message_at: string | null
  unread: boolean
}

export interface ConversationsListResponse {
  conversations: ConversationInfo[]
}

export interface StartConversationResponse {
  session_key: string
  agent_id: string
}

export interface ChatAgent {
  id: string
  name: string
  display_name: string | null
  description: string | null
  avatar_url: string | null
  role: string
  department_id: string | null
  department_name: string | null
  is_orchestrator?: boolean
}

export interface MyAgentInfo {
  agent_id: string
  agent_name: string
  agent_avatar: string | null
  session_key: string | null
  last_message: string | null
  last_activity: string | null
}

export interface UnifiedSidebarResponse {
  my_agents: MyAgentInfo[]  // Changed from single my_agent to array
  all_agents: MyAgentInfo[] | null
}

export interface ThreadInfoResponse {
  session_key: string
  agent_id: string
  agent_name: string
  agent_avatar: string | null
  label: string | null
  last_message: string | null
  last_activity: string | null
  is_spawned: boolean
  spawned_by: string | null
  caller_agent_id: string | null
  caller_agent_name: string | null
}

export interface SessionSummary {
  session_key: string
  label: string | null
  last_message: string | null
  last_activity: string | null
  message_count: number
  is_current: boolean
  channel: "private" | "a2a"
}

export interface RoutingRule {
  id: string
  channel: string
  pattern: string | null
  keywords: string[] | null
  agent_id: string
  department_id: string | null
  priority: number
}

export interface ChannelInstanceUpdate {
  name?: string
  description?: string
  department_id?: string
  config?: Record<string, unknown>
  routing_mode?: string
  default_agent_id?: string | null
  director_agent_id?: string | null
  routing_rules?: Record<string, unknown>
  enabled?: boolean
}

export interface CreateDelegationRequest {
  from_agent_id: string
  to_agent_id: string
  delegate_id?: string
  task_types: string[]
  conditions: Record<string, unknown>
  expires_at?: string
}

export interface ClarificationCreate {
  title: string
  description: string
  context: Record<string, unknown>
  options?: string[]
  requested_agent_id: string
  priority: string
}

export interface CreateWebhookRequest {
  name: string
  url: string
  events: string[]
  secret?: string
  is_active?: boolean
  description?: string
}

export interface WebhookRegistration {
  id: string
  name: string
  description?: string
  url: string
  target_url?: string
  department_id?: string
  secret_key?: string
  trigger_events?: string[]
  events: string[]
  enabled?: boolean
  is_active?: boolean
  secret?: string
  created_at?: string
  updated_at?: string
  last_triggered_at?: string | null
  status?: string
  total_triggers?: number
  success_count?: number
}

export interface InvitationRequest {
  email: string
  enterprise_id: string
  role?: string
  department_id?: string
  department_ids?: string[]
  permissions?: string[]
  visible_agent_ids?: string[]
}

export interface AcceptInvitationRequest {
  token: string
  name: string
  password: string
}

export interface EmailAccount {
  id: string
  email: string
  provider: string
  status: string
  display_name?: string
  color?: string
  email_address?: string
}

export interface EmailMessageDetail {
  id: string
  subject?: string
  from?: string
  to?: string[]
  date?: string
  body?: string
  content?: string
  is_read?: boolean
  read?: boolean
  folder?: string
  is_starred?: boolean
  starred?: boolean
  label?: string
  from_name?: string
  from_address?: string
  received_at?: string
  account_color?: string
  account_email?: string
  account_provider?: string
  body_html?: string
  body_text?: string
  createdAt?: Date | string
  sender?: {
    id?: string
    name: string
    email: string
    avatar?: string
    status?: string
  }
  isDeleted?: boolean
  isSent?: boolean
  isDraft?: boolean
  isSpam?: boolean
  isStarred?: boolean
}

export interface EmailMessageUpdate {
  is_read?: boolean
  folder?: string
  is_starred?: boolean
}

export interface CreateWebmailAccountRequest {
  email?: string
  password: string
  imap_server?: string
  smtp_server?: string
  imap_port?: number
  smtp_port?: number
  username?: string
  email_address?: string
  imap_host?: string
  smtp_host?: string
  use_tls?: boolean
  display_name?: string
}

export interface CreateOAuthEmailAccountRequest {
  provider: string
  email?: string
  integration_id?: string
}

export interface SendEmailRequest {
  account_id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body?: string
  body_html?: string
  in_reply_to?: string
  attachments?: {
    filename: string
    content: string
    content_type: string
  }[]
}

export interface RecurringTaskRequest {
  title: string
  schedule: string
  agent_id: string
  description?: string
  timezone?: string
}

export interface IntegrationSuggestionEvent {
  app_key: string
  app_name: string
  logo_url: string
  description: string
  missing_tool: string
}

export interface RecurringTaskSuggestionEvent {
  title: string
  schedule: string
  timezone: string
  description?: string
}

export interface RecurringTask {
  id: string
  enterprise_id: string
  agent_id: string
  department_id: string | null
  title: string
  description: string | null
  schedule_cron: string
  schedule_human?: string
  timezone: string
  enabled: boolean
  run_count: number
  last_run_at: string | null
  last_run_status: string | null
  last_task_id: string | null
  openclaw_cron_id: string | null
  created_at: string
  updated_at: string
}

export interface ChannelInstance {
  id: string
  enterprise_id: string
  department_id: string | null
  channel_type: string
  platform?: string
  name: string
  description: string | null
  config: Record<string, unknown>
  account?: string | Record<string, unknown>
  routing_mode: string
  default_agent_id: string | null
  director_agent_id: string | null
  routing_rules: Record<string, unknown>
  enabled: boolean
  status: string
  error_message?: string | null
  total_messages?: number
  message_count?: number
  last_message_at?: string | null
  last_activity?: string | null
  created_at: string
  updated_at: string | null
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  timezone: string | null
  command: string
  agent_id: string | null
  enabled: boolean
  last_run: string | null
  next_run: string | null
  description: string | null
  // Enriched from recurring_tasks DB (if linked)
  recurring_task_id: string | null
  title: string | null
  schedule_human: string | null
  run_count: number | null
  last_run_status: string | null
}

export interface CronJobRun {
  id: string
  job_id: string
  started_at: string
  finished_at: string | null
  exit_code: number | null
  status: string
  error: string | null
}

export interface MemoryConfig {
  enabled: boolean
  max_messages: number
  relevance_threshold: number
  strategy?: string
  include_sender_history?: boolean
  include_similar_tasks?: boolean
  include_kb_context?: boolean
  max_context_pct?: number
  min_relevance_score?: number
  conversation_lookback_days?: number
  task_lookback_days?: number
  max_memories?: number
}

// OpenClaw Native Memory (Sessions)
export interface NativeMemoryEntry {
  id: string // session key
  session_id: string
  source: string // chat_type: direct, a2a
  text: string // last user message preview
  message_count: number
  updated_at: number // unix ms
  origin: string
}

export interface NativeMemoryEntriesResponse {
  items: NativeMemoryEntry[]
  total: number
}

export interface NativeMemoryMessage {
  role: string
  content: string
  timestamp: string
}

export interface NativeMemoryDetailResponse {
  key: string
  messages: NativeMemoryMessage[]
}

export type ClarificationStatus = "pending" | "answered" | "expired"

export interface ClarificationAnswer {
  clarification_id: string
  response: string
  responded_at: string
}

export type DelegationStatus = "active" | "revoked" | "expired"

export interface DepartmentToolsUpdate {
  tools: string[]
  reasoning_tools?: string[]
  governance_mode?: string
}

export interface DepartmentToolsResponse {
  tools: string[]
  reasoning_tools?: string[]
  governance_mode?: string
}

export type DelegationScope = "approvals" | "tasks" | "communications" | "all"

export interface GoogleOAuthStatus {
  connected: boolean
  email?: string
}

export interface UpdateWebhookRequest {
  name?: string
  url?: string
  events?: string[]
  secret?: string
  is_active?: boolean
  description?: string
}

export interface InvitationListItem {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at?: string
}

export type LucideIconName = string

// Communication Rules (A2A)
export interface CommunicationRule {
  id: string
  enterprise_id: string
  from_department_id: string
  from_department_name: string
  to_department_id: string
  to_department_name: string
  can_query: boolean
  can_request: boolean
  can_escalate: boolean
  can_delegate: boolean
  requires_justification: boolean
  max_requests_per_day: number | null
}

export interface CreateCommunicationRuleRequest {
  from_department_id: string
  to_department_id: string
  can_query?: boolean
  can_request?: boolean
  can_escalate?: boolean
  can_delegate?: boolean
  requires_justification?: boolean
  max_requests_per_day?: number | null
}

export interface UpdateCommunicationRuleRequest {
  can_query?: boolean
  can_request?: boolean
  can_escalate?: boolean
  can_delegate?: boolean
  requires_justification?: boolean
  max_requests_per_day?: number | null
}

// Workflow Templates & Runs
export interface WorkflowStepDef {
  step: number
  type: 'agent_task' | 'require_approval'
  agent_id?: string
  prompt?: string
  output_key?: string
  title?: string
}

export interface WorkflowTemplate {
  id: string
  enterprise_id: string
  name: string
  description: string | null
  steps: WorkflowStepDef[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowRun {
  id: string
  template_id: string
  enterprise_id: string
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed'
  current_step: number
  context: Record<string, unknown>
  error: string | null
  created_at: string
  completed_at: string | null
}

export interface CreateWorkflowTemplateRequest {
  name: string
  description?: string
  steps: WorkflowStepDef[]
  enterprise_id: string
}

export interface UpdateWorkflowTemplateRequest {
  name?: string
  description?: string
  steps?: WorkflowStepDef[]
  enabled?: boolean
}

export interface StartWorkflowRunRequest {
  template_id: string
  enterprise_id: string
  initial_context?: Record<string, unknown>
}

// Workflow Catalog (pre-designed workflows)
export interface CatalogEntry {
  id: string
  name: string
  display_name: string
  description: string
  department_template_id: string
  category: string
  pattern: string
  trigger_type: string
  trigger_config: Record<string, unknown> | null
  steps: Record<string, unknown>[]
  required_tools: string[]
  estimated_duration_minutes: number
  icon: string
  tags: string[]
}

export interface CatalogReadinessResponse {
  catalog_id: string
  ready: boolean
  required_tools: string[]
  connected_tools: string[]
  missing_tools: string[]
  agents_resolved: boolean
  agent_mapping: Record<string, string | null>
}

export interface CatalogActivateRequest {
  enterprise_id: string
  department_id: string
  trigger_config?: Record<string, unknown>
  custom_name?: string
  initial_variables?: Record<string, unknown>
}

// Orchestration (full types for visualization)
export interface OrchestrationTask {
  id: string
  enterprise_id: string
  primary_agent_id: string
  original_message: string
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled'
  current_step: number
  total_steps: number
  conversation_id: string
  summary: string | null
  steps: OrchestrationStep[]
  created_at: string
  completed_at: string | null
}

export interface OrchestrationStep {
  id: string
  step_number: number
  action: string
  description: string | null
  target_agent_id: string | null
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'waiting_human'
  message_sent: string | null
  response_received: string | null
  error: string | null
  started_at: string | null
  completed_at: string | null
}

export interface OrchestrationEvent {
  id: number
  type: string
  step_id?: string
  agent_id?: string
  data: Record<string, unknown>
}

// Custom Tools
export interface CustomToolRequest {
  id: string
  enterprise_id: string
  requested_by_agent_id: string
  requested_by_session_key: string | null
  builder_agent_id: string | null
  reviewer_user_id: string | null
  title: string
  description: string
  use_case: string | null
  status: 'researching' | 'proposed' | 'building' | 'review' | 'available' | 'rejected'
  status_message: string | null
  tool_name: string | null
  tool_path: string | null
  tool_meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
  approved_at: string | null
  estimated_delivery: string | null
}

export interface CustomTool {
  id: string
  enterprise_id: string
  request_id: string | null
  name: string
  display_name: string
  description: string
  version: string
  tool_path: string
  parameters: Record<string, unknown>
  examples: unknown[] | null
  scope_type: "enterprise" | "department" | "agent"
  department_id: string | null
  agent_id: string | null
  enabled: boolean
  tested: boolean
  created_by: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateCustomToolRequestPayload {
  enterprise_id: string
  requested_by_agent_id: string
  requested_by_session_key?: string
  title: string
  description: string
  use_case?: string
}

export interface UpdateCustomToolRequestPayload {
  status?: string
  status_message?: string
  builder_agent_id?: string
  reviewer_user_id?: string
  tool_name?: string
  tool_path?: string
  tool_meta?: Record<string, unknown>
  estimated_delivery?: string
  feedback_target_agent_id?: string
}

export interface ApproveCustomToolRequestPayload {
  tool_name: string
  display_name: string
  description: string
  tool_path: string
  parameters?: Record<string, unknown>
  examples?: unknown[]
  scope_type?: "enterprise" | "department" | "agent"
  department_id?: string
  agent_id?: string
}

export interface TestCustomToolPayload {
  params: Record<string, unknown>
  mode?: "manual" | "predefined"
}

export interface ToolInfoResponse {
  tool_dir: string | null
  runtime: string | null
  entry: string | null
  test_file: string | null
  tool_json: Record<string, unknown> | null
  files: string[]
}

export interface TestCustomToolResponse {
  success: boolean
  exit_code: number
  stdout: string
  stderr: string
  duration_ms: number
}

export interface UpdateCustomToolPayload {
  display_name?: string
  description?: string
  version?: string
  tool_path?: string
  parameters?: Record<string, unknown>
  examples?: unknown[]
  enabled?: boolean
  tested?: boolean
  scope_type?: "enterprise" | "department" | "agent"
  department_id?: string | null
  agent_id?: string | null
}

// Support Tickets
export interface SupportTicket {
  id: string
  enterprise_id: string
  created_by_user_id: string
  title: string
  description: string | null
  error_data: Record<string, unknown> | null
  status: string
  priority: string
  assigned_agent_id: string | null
  conversation_id: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

// Department Projects
export interface DepartmentProject {
  id: string
  enterprise_id: string
  department_id: string
  name: string
  description: string | null
  local_paths: string[]
  repositories: { url: string; branch?: string; provider?: string }[]
  tool_connections: { app_name: string; entity_id?: string }[]
  config: Record<string, unknown>
  is_active: boolean
  agent_ids: string[]
  created_at: string
  updated_at: string
}

// Resource Browser
export interface BrowsedResource {
  id: string
  name: string
  url: string | null
  description: string | null
  metadata: Record<string, unknown>
}

export interface BrowseResourcesResponse {
  items: BrowsedResource[]
  app: string
  resource_type: string
  connected: boolean
}

export interface ResourceConfigItem {
  app: string
  resource_type: string
  label: string
  icon: string
  connected: boolean
}

export interface ResourceConfigResponse {
  department_name: string
  resources: ResourceConfigItem[]
  supports_local_paths: boolean
}

export interface RecommendedIntegration {
  app_key: string
  app_name: string
  logo_url: string | null
  description: string | null
  auth_type: string
  requires_oauth: boolean
  connected: boolean
  connection_scope: string | null
}

export interface RecommendedIntegrationsResponse {
  department_id: string
  template_id: string
  integrations: RecommendedIntegration[]
}
