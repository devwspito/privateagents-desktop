/**
 * API Client - Agent methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  Agent,
  AgentHumanLoopConfig,
  AgentSoul,
  CreateAgentRequest,
  MemoryConfig,
  NativeMemoryDetailResponse,
  NativeMemoryEntriesResponse,
  PaginatedResponse,
  SyncSoulRequest,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withAgentApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class AgentApi extends Base {
    async getMyAgent() {
      return this.request<Agent>("/auth/me/agent")
    }

    async getAgentMemoryConfig(agentId: string) {
      return this.request<MemoryConfig>(`/agents/${agentId}/memory`)
    }

    async updateAgentMemoryConfig(
      agentId: string,
      config: Partial<MemoryConfig>
    ) {
      return this.request<void>(`/agents/${agentId}/memory`, {
        method: "PATCH",
        body: JSON.stringify(config),
      })
    }

    async previewAgentMemory(agentId: string, query: string, limit?: number) {
      const params = new URLSearchParams({ query })
      if (limit) params.set("limit", String(limit))
      return this.request<{ results: { content: string; score: number }[] }>(
        `/agents/${agentId}/memory/preview?${params}`
      )
    }

    // -- OpenClaw Native Memory (Sessions) --

    async getAgentMemoryEntries(
      agentId: string,
      params?: { offset?: number; limit?: number }
    ) {
      const query = new URLSearchParams()
      if (params?.offset != null) query.set("offset", String(params.offset))
      if (params?.limit != null) query.set("limit", String(params.limit))
      const qs = query.toString()
      return this.request<NativeMemoryEntriesResponse>(
        `/agents/${agentId}/memory/entries${qs ? `?${qs}` : ""}`
      )
    }

    async getAgentMemoryDetail(agentId: string, sessionKey: string) {
      return this.request<NativeMemoryDetailResponse>(
        `/agents/${agentId}/memory/entries/${encodeURIComponent(sessionKey)}`
      )
    }

    async deleteAgentMemoryEntry(agentId: string, sessionKey: string) {
      return this.request<{ ok: boolean }>(
        `/agents/${agentId}/memory/entries/${encodeURIComponent(sessionKey)}`,
        { method: "DELETE" }
      )
    }

    async clearAgentMemoryEntries(agentId: string) {
      return this.request<{ ok: boolean; deleted: number }>(
        `/agents/${agentId}/memory/entries`,
        { method: "DELETE" }
      )
    }

    async getAgents(params?: {
      enterprise_id?: string
      department_id?: string
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.department_id)
        query.set("department_id", params.department_id)
      const queryStr = query.toString()
      return this.request<PaginatedResponse<Agent>>(
        `/agents${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async getAgent(id: string) {
      return this.request<Agent>(`/agents/${id}`)
    }

    async createAgent(data: CreateAgentRequest) {
      return this.request<Agent>("/agents", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateAgent(id: string, data: Partial<Agent>) {
      return this.request<Agent>(`/agents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async deleteAgent(id: string) {
      return this.request<void>(`/agents/${id}`, { method: "DELETE" })
    }

    async linkAgentToUser(agentId: string, userId: string) {
      return this.request<Agent>(`/agents/${agentId}/link-user`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      })
    }

    async unlinkAgentFromUser(agentId: string) {
      return this.request<Agent>(`/agents/${agentId}/link-user`, {
        method: "DELETE",
      })
    }

    async getAgentsByUser(userId: string) {
      return this.request<Agent[]>(`/agents/by-user/${userId}`)
    }

    async getAgentSoul(agentId: string) {
      return this.request<AgentSoul>(`/agents/${agentId}/soul`)
    }

    async syncAgentSoul(agentId: string, data: SyncSoulRequest) {
      return this.request<AgentSoul>(`/agents/${agentId}/soul/sync`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async getAgentHumanLoopConfig(agentId: string) {
      return this.request<AgentHumanLoopConfig>(
        `/agents/${agentId}/human-loop-config`
      )
    }

    async updateAgentHumanLoopConfig(
      agentId: string,
      data: Partial<AgentHumanLoopConfig>
    ) {
      return this.request<AgentHumanLoopConfig>(
        `/agents/${agentId}/human-loop-config`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async updateAgentSoul(agentId: string, soul: Partial<AgentSoul>) {
      return this.request<AgentSoul>(`/agents/${agentId}/soul`, {
        method: "PATCH",
        body: JSON.stringify(soul),
      })
    }
  }
}
