/**
 * API Client - User & Approval methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  Approval,
  ApprovalStats,
  CreateUserRequest,
  PaginatedResponse,
  User,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withUserApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class UserApi extends Base {
    async getUsers(params?: { enterprise_id?: string; role?: string }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.role) query.set("role", params.role)
      const queryStr = query.toString()
      return this.request<PaginatedResponse<User>>(
        `/users${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async getUser(id: string) {
      return this.request<User>(`/users/${id}`)
    }

    async createUser(data: CreateUserRequest) {
      return this.request<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateUser(id: string, data: Partial<User>) {
      return this.request<User>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async updateUserPermissions(id: string, permissions: string[]) {
      return this.request<User>(`/users/${id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
      })
    }

    async deleteUser(id: string) {
      return this.request<void>(`/users/${id}`, { method: "DELETE" })
    }
  }
}

export function withApprovalApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class ApprovalApi extends Base {
    async getApprovals(params?: {
      status?: string
      enterprise_id?: string
      department_id?: string
      type?: string
      requesting_agent_id?: string
    }) {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.department_id)
        query.set("department_id", params.department_id)
      if (params?.type) query.set("type", params.type)
      if (params?.requesting_agent_id)
        query.set("requesting_agent_id", params.requesting_agent_id)
      const queryStr = query.toString()
      const res = await this.request<{ items: Approval[]; total: number; has_more: boolean }>(
        `/approvals${queryStr ? `?${queryStr}` : ""}`
      )
      return res.items
    }

    async getApproval(id: string) {
      return this.request<Approval>(`/approvals/${id}`)
    }

    async approveApproval(id: string, comments?: string) {
      return this.request<Approval>(`/approvals/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      })
    }

    async rejectApproval(id: string, reason: string) {
      return this.request<Approval>(`/approvals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
    }

    async escalateApproval(id: string, reason?: string) {
      return this.request<Approval>(`/approvals/${id}/escalate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
    }

    async getApprovalStats(enterpriseId?: string) {
      const query = enterpriseId ? `?enterprise_id=${enterpriseId}` : ""
      return this.request<ApprovalStats>(`/approvals/stats${query}`)
    }
  }
}
