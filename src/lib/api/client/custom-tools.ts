/**
 * API Client - Custom Tools methods
 */

import type { ApiClientConstructor } from "./utils"
import type {
  CustomTool,
  CustomToolRequest,
  CreateCustomToolRequestPayload,
  UpdateCustomToolRequestPayload,
  ApproveCustomToolRequestPayload,
  TestCustomToolPayload,
  TestCustomToolResponse,
  ToolInfoResponse,
  UpdateCustomToolPayload,
} from "./types"

export function withCustomToolsApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class CustomToolsApi extends Base {
    // Tool Requests
    async listCustomToolRequests(params?: {
      enterprise_id?: string
      status?: string
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.status) query.set("status", params.status)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const qs = query.toString()
      return this.request<CustomToolRequest[]>(
        `/custom-tools/requests${qs ? `?${qs}` : ""}`
      )
    }

    async getCustomToolRequest(requestId: string) {
      return this.request<CustomToolRequest>(
        `/custom-tools/requests/${requestId}`
      )
    }

    async createCustomToolRequest(data: CreateCustomToolRequestPayload) {
      return this.request<CustomToolRequest>("/custom-tools/requests", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateCustomToolRequest(
      requestId: string,
      data: UpdateCustomToolRequestPayload
    ) {
      return this.request<CustomToolRequest>(
        `/custom-tools/requests/${requestId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async approveCustomToolRequest(
      requestId: string,
      data: ApproveCustomToolRequestPayload
    ) {
      return this.request<CustomTool>(
        `/custom-tools/requests/${requestId}/approve`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async rejectCustomToolRequest(requestId: string, feedback: string) {
      return this.request<CustomToolRequest>(
        `/custom-tools/requests/${requestId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ feedback }),
        }
      )
    }

    async advanceCustomToolRequest(requestId: string) {
      return this.request<CustomToolRequest>(
        `/custom-tools/requests/${requestId}/advance`,
        { method: "POST" }
      )
    }

    async retryCustomToolRequest(requestId: string) {
      return this.request<CustomToolRequest>(
        `/custom-tools/requests/${requestId}/retry`,
        { method: "POST" }
      )
    }

    async testCustomToolRequest(requestId: string, data: TestCustomToolPayload) {
      return this.request<TestCustomToolResponse>(
        `/custom-tools/requests/${requestId}/test`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async getToolInfo(requestId: string) {
      return this.request<ToolInfoResponse>(
        `/custom-tools/requests/${requestId}/info`
      )
    }

    async getRequestDepartmentAgents(requestId: string) {
      return this.request<{ id: string; name: string; display_name: string }[]>(
        `/custom-tools/requests/${requestId}/department-agents`
      )
    }

    // Custom Tools (approved)
    async listCustomTools(params?: {
      enterprise_id?: string
      enabled?: boolean
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.enabled !== undefined)
        query.set("enabled", String(params.enabled))
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const qs = query.toString()
      return this.request<CustomTool[]>(
        `/custom-tools${qs ? `?${qs}` : ""}`
      )
    }

    async getCustomTool(toolId: string) {
      return this.request<CustomTool>(`/custom-tools/${toolId}`)
    }

    async updateCustomTool(toolId: string, data: UpdateCustomToolPayload) {
      return this.request<CustomTool>(`/custom-tools/${toolId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async deleteCustomTool(toolId: string) {
      return this.request<void>(`/custom-tools/${toolId}`, {
        method: "DELETE",
      })
    }

    async deleteCustomToolRequest(requestId: string) {
      return this.request<void>(`/custom-tools/requests/${requestId}`, {
        method: "DELETE",
      })
    }
  }
}
