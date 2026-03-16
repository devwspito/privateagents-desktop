import type {
  Agent,
  Department,
} from "@/lib/api/client"

/**
 * Monitoring-oriented types for the Agent Communications page.
 * This is a read-only monitoring view of agent-to-agent discussions.
 */

// A2A types (local to communications module, pending full module removal)
export type A2AMessageType =
  | "request"
  | "response"
  | "notification"
  | "handoff"
  | "escalation"

export type A2APriority = "low" | "normal" | "high" | "urgent"

export interface A2AEnterpriseMessage {
  id: string
  enterprise_id: string
  from_agent_id: string
  from_agent_name?: string
  from_department_id?: string | null
  from_department_name?: string | null
  to_agent_id: string | null
  to_agent_name?: string | null
  to_department_id: string | null
  to_department_name?: string | null
  thread_id: string | null
  conversation_id?: string | null
  reply_to_id?: string | null
  task_id?: string | null
  message_type: A2AMessageType
  priority: A2APriority
  subject: string | null
  body: string
  payload: Record<string, unknown> | null
  status: string
  created_at: string
  delivered_at: string | null
  read_at: string | null
}

export interface ThreadParticipant {
  agentId: string
  agentName: string
  departmentId: string | null
  departmentName: string | null
}

export interface MonitoringThread {
  id: string
  subject: string
  messages: A2AEnterpriseMessage[]
  participants: ThreadParticipant[]
  latestMessage: A2AEnterpriseMessage
  messageTypes: A2AMessageType[]
  highestPriority: A2APriority
  taskId: string | null
  conversationId: string | null
  departmentPair: {
    from: { id: string; name: string } | null
    to: { id: string; name: string } | null
  }
  messageCount: number
  lastActivity: string
}

export type MessageTypeFilter =
  | "all"
  | "request"
  | "response"
  | "notification"
  | "handoff"
  | "escalation"

export type PriorityFilter = "all" | "low" | "normal" | "high" | "urgent"

export interface CommunicationsFilterState {
  search: string
  departmentId: string
  messageType: MessageTypeFilter
  agentId: string
  priority: PriorityFilter
}

export interface CommunicationsContextType {
  threads: MonitoringThread[]
  selectedThread: MonitoringThread | null
  isLoading: boolean
  error: string | null
  filters: CommunicationsFilterState
  setFilters: (filters: Partial<CommunicationsFilterState>) => void
  selectThread: (thread: MonitoringThread | null) => void
  agents: Agent[]
  departments: Department[]
}

export const DEFAULT_FILTERS: CommunicationsFilterState = {
  search: "",
  departmentId: "all",
  messageType: "all",
  agentId: "all",
  priority: "all",
}
