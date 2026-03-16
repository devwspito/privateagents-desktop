import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"

import type { ChannelStatusInfo } from "@/app/[lang]/(dashboard-layout)/apps/channels/types"
import type { Agent, Approval, Department, User } from "@/lib/api/client"
import type { RenderOptions } from "@testing-library/react"
import type { ReactElement } from "react"

interface Delegation {
  id: string
  delegator_id: string
  delegator_name: string
  delegate_id: string
  delegate_name: string
  scope: string
  status: string
  expires_at: string
  created_at: string
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: React.ReactNode
}

export function createWrapper(
  queryClient?: QueryClient
): ({ children }: WrapperProps) => ReactElement {
  const client = queryClient ?? createTestQueryClient()
  return function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient
}

export function renderWithQueryClient(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options
  const wrapper = createWrapper(queryClient)
  return render(ui, { wrapper, ...renderOptions })
}

export const mockUser: User = {
  id: "user-1",
  enterprise_id: "enterprise-1",
  department_id: "department-1",
  email: "test@example.com",
  name: "Test User",
  job_title: "Software Engineer",
  phone: "+1234567890",
  avatar_url: null,
  role: "admin",
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
}

export const mockUser2: User = {
  id: "user-2",
  enterprise_id: "enterprise-1",
  department_id: "department-1",
  email: "test2@example.com",
  name: "Test User 2",
  job_title: "Product Manager",
  phone: "+0987654321",
  avatar_url: null,
  role: "user",
  status: "active",
  created_at: "2024-01-02T00:00:00Z",
}

export const mockViewerUser: User = {
  id: "user-3",
  enterprise_id: "enterprise-1",
  department_id: "department-2",
  email: "viewer@example.com",
  name: "Viewer User",
  job_title: "Viewer",
  phone: null,
  avatar_url: null,
  role: "viewer",
  status: "active",
  created_at: "2024-01-03T00:00:00Z",
}

export const mockDepartment: Department = {
  id: "department-1",
  enterprise_id: "enterprise-1",
  name: "Engineering",
  display_name: "Engineering Team",
  description: "Engineering department",
  parent_id: null,
  role: "engineering",
  can_approve: true,
  enabled: true,
  manager_user_id: null,
  created_at: "2024-01-01T00:00:00Z",
}

export const mockDepartment2: Department = {
  id: "department-2",
  enterprise_id: "enterprise-1",
  name: "Marketing",
  display_name: "Marketing Team",
  description: "Marketing department",
  parent_id: null,
  role: "marketing",
  can_approve: false,
  enabled: true,
  manager_user_id: null,
  created_at: "2024-01-01T00:00:00Z",
}

export const mockDelegation: Delegation = {
  id: "delegation-1",
  delegator_id: "user-1",
  delegator_name: "Test User",
  delegate_id: "user-2",
  delegate_name: "Test User 2",
  scope: "approvals",
  status: "active",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: "2024-01-15T10:00:00Z",
}

export const mockExpiredDelegation: Delegation = {
  id: "delegation-2",
  delegator_id: "user-1",
  delegator_name: "Test User",
  delegate_id: "user-2",
  delegate_name: "Test User 2",
  scope: "tasks",
  status: "expired",
  expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  created_at: "2024-01-10T10:00:00Z",
}

export const mockAgent: Agent = {
  id: "agent-1",
  enterprise_id: "enterprise-1",
  department_id: "department-1",
  user_id: null,
  name: "Sales Bot",
  display_name: "Sales Bot",
  description: "Sales agent",
  avatar_url: null,
  role: "sales_agent",
  specialization: null,
  status: "idle",
  enabled: true,
  model_provider: "openai",
  model_id: "gpt-4",
  temperature: 0.7,
  max_tokens: 4096,
  language: null,
  capabilities: [],
  can_use_tools: null,
  can_communicate_with: null,
  gateway_key_id: null,
  requires_human_approval: false,
  approval_threshold: null,
  autonomy_level: "supervised",
  llm_config: {},
  openclaw_agent_id: null,
  workspace_path: null,
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
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

export const mockApproval: Approval = {
  id: "approval-1",
  enterprise_id: "enterprise-1",
  department_id: "department-1",
  agent_id: "agent-1",
  type: "action",
  title: "Test Approval",
  description: "Test approval description",
  status: "pending",
  priority: "medium",
  metadata: {},
  requested_by: "user-1",
  requested_at: "2024-01-15T10:00:00Z",
  expires_at: null,
  resolved_by: null,
  resolved_at: null,
  resolution_notes: null,
}

export const mockChannelStatus: ChannelStatusInfo = {
  connected: true,
  username: "+1234567890",
  workspace: undefined,
  last_seen: "2024-01-15T10:30:00Z",
}

export const mockDisconnectedChannelStatus: ChannelStatusInfo = {
  connected: false,
  username: undefined,
  workspace: undefined,
  last_seen: null,
}

export const mockUsersResponse = {
  items: [mockUser, mockUser2, mockViewerUser],
  total: 3,
  limit: 50,
  offset: 0,
  has_more: false,
}

export const mockDepartmentsResponse = {
  items: [mockDepartment, mockDepartment2],
  total: 2,
}

export const mockDelegationsResponse = {
  items: [mockDelegation, mockExpiredDelegation],
  total: 2,
}

export function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error("Condition not met within timeout"))
      } else {
        setTimeout(check, interval)
      }
    }
    check()
  })
}

export const mockApiResponse = <T,>(data: T, delay = 0): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay))
}

export const mockApiError = (
  message: string,
  _status = 500
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), 0)
  })
}
