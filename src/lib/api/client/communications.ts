/**
 * API Client - Communications (A2A enterprise messaging)
 */

import type { A2AEnterpriseMessage } from "../../../app/[lang]/(dashboard-layout)/apps/communications/types"
import type { ApiClientConstructor } from "./utils"

export interface SendA2AMessageRequest {
  from_agent_id: string
  to: string
  body: string
  subject?: string
  message_type?: string
  priority?: string
  task_id?: string
  thread_id?: string
  metadata?: Record<string, unknown>
}

export interface SendA2AMessageResponse {
  message_id: string
  status: string
  target_agent_id?: string
  target_department_id?: string
  error?: string
}

export function withCommunicationsApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class CommunicationsApi extends Base {
    async getEnterpriseMessages(
      enterpriseId: string,
      params?: Record<string, string>
    ) {
      const query = new URLSearchParams()
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          query.set(k, v)
        }
      }
      const queryStr = query.toString()
      return this.request<A2AEnterpriseMessage[]>(
        `/communications/enterprise/${enterpriseId}${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async sendA2AMessage(data: SendA2AMessageRequest) {
      return this.request<SendA2AMessageResponse>("/communications/send", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  }
}
