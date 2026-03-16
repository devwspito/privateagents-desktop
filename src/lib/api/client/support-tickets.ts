/**
 * API Client - Support Tickets methods
 */

import type { ApiClientConstructor } from "./utils"
import type { SupportTicket } from "./types"

export function withSupportTicketsApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class SupportTicketsApi extends Base {
    async listSupportTickets(params?: {
      status?: string
      priority?: string
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.priority) query.set("priority", params.priority)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const qs = query.toString()
      return this.request<{ items: SupportTicket[]; total: number }>(
        `/support-tickets${qs ? `?${qs}` : ""}`
      )
    }

    async getSupportTicket(ticketId: string) {
      return this.request<SupportTicket>(`/support-tickets/${ticketId}`)
    }

    async createSupportTicket(data: {
      title: string
      description?: string
      error_data?: Record<string, unknown>
      priority?: string
    }) {
      return this.request<SupportTicket>("/support-tickets", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateSupportTicket(
      ticketId: string,
      data: {
        status?: string
        priority?: string
        resolution?: string
        assigned_agent_id?: string
      }
    ) {
      return this.request<SupportTicket>(`/support-tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }
  }
}
