/**
 * API Client - Orchestration methods
 */

import type { ApiClientConstructor } from "./utils"
import type { OrchestrationTask } from "./types"

export function withOrchestrationApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class OrchestrationApi extends Base {
    async startOrchestration(data: {
      message: string
      primary_agent_id: string
      session_key?: string
    }) {
      return this.request<{
        orchestration_id: string
        conversation_id: string
        status: string
      }>("/orchestration/start", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async getOrchestration(orchestrationId: string) {
      return this.request<OrchestrationTask>(
        `/orchestration/${orchestrationId}`
      )
    }

    async listOrchestrations(params?: {
      status?: string
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const qs = query.toString()
      return this.request<{
        orchestrations: OrchestrationTask[]
        total: number
      }>(`/orchestration/list${qs ? `?${qs}` : ""}`)
    }

    async respondToOrchestrationStep(data: {
      orchestration_id: string
      step_id: string
      response: string
    }) {
      return this.request<void>(
        `/orchestration/${data.orchestration_id}/step/${data.step_id}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ response: data.response }),
        }
      )
    }

    async cancelOrchestration(orchestrationId: string) {
      return this.request<void>(`/orchestration/${orchestrationId}/cancel`, {
        method: "POST",
      })
    }

  }
}
