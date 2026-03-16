/**
 * API Client - Task methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskStats,
  TaskToolCall,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withTaskApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class TaskApi extends Base {
    async getTasks(params?: {
      agent_id?: string
      enterprise_id?: string
      status?: string
      limit?: number
    }) {
      const query = new URLSearchParams()
      if (params?.agent_id) query.set("agent_id", params.agent_id)
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.status) query.set("status", params.status)
      if (params?.limit) query.set("limit", String(params.limit))
      const queryStr = query.toString()
      return this.request<PaginatedResponse<Task>>(
        `/tasks${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async createTask(data: CreateTaskRequest) {
      return this.request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async retryTask(taskId: string) {
      return this.request<Task>(`/tasks/${taskId}/retry`, { method: "POST" })
    }

    async getTaskToolCalls(taskId: string) {
      return this.request<TaskToolCall[]>(`/tasks/${taskId}/tool-calls`)
    }

    async getTask(id: string) {
      return this.request<Task>(`/tasks/${id}`)
    }

    async getTaskStats(enterpriseId?: string) {
      const query = enterpriseId ? `?enterprise_id=${enterpriseId}` : ""
      return this.request<TaskStats>(`/tasks/stats${query}`)
    }
  }
}
