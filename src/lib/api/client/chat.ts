/**
 * API Client - Chat & Session methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  ChatAgent,
  ChatHistoryResponse,
  ChatSendResponse,
  ConversationsListResponse,
  RecurringTask,
  RecurringTaskRequest,
  SessionUsage,
  SessionsListResponse,
  StartConversationResponse,
  SessionSummary,
  ThreadInfoResponse,
  UnifiedSidebarResponse,
  ChatMessage as _ChatMessage,
  ConversationInfo as _ConversationInfo,
  SessionInfo as _SessionInfo,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withChatApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class ChatApi extends Base {
    async getSessions(params?: { agent_id?: string; limit?: number }) {
      const query = new URLSearchParams()
      if (params?.agent_id) query.set("agent_id", params.agent_id)
      if (params?.limit) query.set("limit", String(params.limit))
      const queryStr = query.toString()
      return this.request<SessionsListResponse>(
        `/sessions${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async resolveSession(params: { agent_id?: string; user_id?: string }) {
      const query = new URLSearchParams()
      if (params.agent_id) query.set("agent_id", params.agent_id)
      if (params.user_id) query.set("user_id", params.user_id)
      return this.request<{ session_key: string }>(
        `/sessions/resolve?${query}`
      )
    }

    async createSession(data: { agent_id: string; title?: string }) {
      return this.request<{ session_key: string }>("/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async patchSession(
      sessionKey: string,
      data: { title?: string; metadata?: Record<string, unknown> }
    ) {
      return this.request<void>(`/sessions/${sessionKey}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async resetSession(sessionKey: string, reason?: string) {
      return this.request<void>(`/sessions/${sessionKey}/reset`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
    }

    async deleteSession(sessionKey: string, deleteTranscript?: boolean) {
      const query = deleteTranscript ? "?delete_transcript=true" : ""
      return this.request<void>(`/sessions/${sessionKey}${query}`, {
        method: "DELETE",
      })
    }

    async getSessionUsage(sessionKey: string) {
      return this.request<SessionUsage>(`/sessions/${sessionKey}/usage`)
    }

    async compactSession(sessionKey: string) {
      return this.request<void>(`/sessions/${sessionKey}/compact`, {
        method: "POST",
      })
    }

    async sendChatMessage(data: {
      session_key: string
      message: string
      stream?: boolean
    }) {
      return this.request<ChatSendResponse>("/chat/send", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async getChatHistory(sessionKey: string, limit?: number) {
      const query = limit ? `?limit=${limit}` : ""
      return this.request<ChatHistoryResponse>(
        `/chat/history/${sessionKey}${query}`
      )
    }

    async abortChat(sessionKey: string) {
      return this.request<void>(`/chat/${sessionKey}/abort`, { method: "POST" })
    }

    async getConversations(params?: { agent_id?: string; limit?: number }) {
      const query = new URLSearchParams()
      if (params?.agent_id) query.set("agent_id", params.agent_id)
      if (params?.limit) query.set("limit", String(params.limit))
      const queryStr = query.toString()
      return this.request<ConversationsListResponse>(
        `/chat/conversations${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async startConversation(agentId: string, title?: string) {
      return this.request<StartConversationResponse>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId, title }),
      })
    }

    async approveChatAction(data: {
      session_key: string
      action_id: string
      approved: boolean
      comments?: string
    }) {
      return this.request<void>("/chat/approve", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async deleteConversation(sessionKey: string, deleteTranscript?: boolean) {
      const query = deleteTranscript ? "?delete_transcript=true" : ""
      return this.request<void>(`/chat/conversations/${sessionKey}${query}`, {
        method: "DELETE",
      })
    }

    async getAvailableAgentsForChat(departmentId?: string) {
      const query = departmentId ? `?department_id=${departmentId}` : ""
      return this.request<{ agents: ChatAgent[] }>(`/chat/agents/available${query}`)
    }

    async parseSchedule(text: string) {
      return this.request<{ schedule: string; timezone: string }>(
        `/recurring-tasks/parse-schedule?text=${encodeURIComponent(text)}`
      )
    }

    async createRecurringTaskFromChat(data: RecurringTaskRequest) {
      return this.request<RecurringTask>("/recurring-tasks/from-chat", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async getUnifiedSidebar() {
      return this.request<UnifiedSidebarResponse>("/chat/unified-sidebar")
    }

    async getThreads(agentId?: string) {
      const query = new URLSearchParams()
      if (agentId) query.set("agent_id", agentId)
      const qs = query.toString()
      return this.request<ThreadInfoResponse[]>(`/chat/threads${qs ? `?${qs}` : ""}`)
    }

    async getAgentSessions(agentId: string, currentSessionKey?: string) {
      const query = new URLSearchParams()
      if (currentSessionKey) query.set("current_session_key", currentSessionKey)
      const qs = query.toString()
      return this.request<SessionSummary[]>(
        `/chat/agents/${agentId}/sessions${qs ? `?${qs}` : ""}`
      )
    }

    async searchChatMemory(params: {
      agent_id: string
      query: string
      limit?: number
    }) {
      const query = new URLSearchParams()
      query.set("agent_id", params.agent_id)
      query.set("query", params.query)
      if (params.limit) query.set("limit", String(params.limit))
      return this.request<{
        results: { content: string; score: number; source: string }[]
      }>(`/chat/memory/search?${query}`)
    }
  }
}
