/**
 * API Client - Department methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  BrowseResourcesResponse,
  CreateDepartmentRequest,
  Department,
  DepartmentHumanLoopConfig,
  DepartmentMember,
  DepartmentProject,
  DepartmentToolsResponse,
  PaginatedResponse,
  RecommendedIntegrationsResponse,
  ResourceConfigResponse,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withDepartmentApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class DepartmentApi extends Base {
    async getDepartments(enterpriseId?: string) {
      const query = enterpriseId ? `?enterprise_id=${enterpriseId}` : ""
      return this.request<PaginatedResponse<Department>>(`/departments${query}`)
    }

    async getDepartment(id: string) {
      return this.request<Department>(`/departments/${id}`)
    }

    async createDepartment(data: CreateDepartmentRequest) {
      return this.request<Department>("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateDepartment(id: string, data: Partial<Department>) {
      return this.request<Department>(`/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async deleteDepartment(id: string) {
      return this.request<void>(`/departments/${id}`, { method: "DELETE" })
    }

    async getDepartmentHumanLoopConfig(departmentId: string) {
      return this.request<DepartmentHumanLoopConfig>(
        `/departments/${departmentId}/human-loop-config`
      )
    }

    async updateDepartmentHumanLoopConfig(
      departmentId: string,
      data: Partial<DepartmentHumanLoopConfig>
    ) {
      return this.request<DepartmentHumanLoopConfig>(
        `/departments/${departmentId}/human-loop-config`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async getDepartmentTools(departmentId: string) {
      return this.request<DepartmentToolsResponse>(
        `/departments/${departmentId}/tools`
      )
    }

    async updateDepartmentTools(
      departmentId: string,
      tools: string[],
      reasoningTools?: string[]
    ) {
      return this.request<{ tools: string[] }>(
        `/departments/${departmentId}/tools`,
        {
          method: "PUT",
          body: JSON.stringify({ tools, reasoning_tools: reasoningTools }),
        }
      )
    }

    async getDepartmentMembers(departmentId: string) {
      return this.request<DepartmentMember[]>(
        `/departments/${departmentId}/members`
      )
    }

    async addDepartmentMembers(departmentId: string, userIds: string[]) {
      return this.request<void>(`/departments/${departmentId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
      })
    }

    async removeDepartmentMember(departmentId: string, userId: string) {
      return this.request<void>(
        `/departments/${departmentId}/members/${userId}`,
        {
          method: "DELETE",
        }
      )
    }

    async setDepartmentHead(departmentId: string, userId: string) {
      return this.request<void>(`/departments/${departmentId}/head`, {
        method: "PUT",
        body: JSON.stringify({ user_id: userId }),
      })
    }

    // -- Department Projects --
    async getDepartmentProjects(departmentId: string) {
      return this.request<{ items: DepartmentProject[]; total: number }>(
        `/departments/${departmentId}/projects`
      )
    }

    async createDepartmentProject(
      departmentId: string,
      data: {
        name: string
        description?: string
        local_paths?: string[]
        repositories?: { url: string; branch?: string; provider?: string }[]
        tool_connections?: { app_name: string; entity_id?: string }[]
        config?: Record<string, unknown>
        agent_ids?: string[]
      }
    ) {
      return this.request<DepartmentProject>(
        `/departments/${departmentId}/projects`,
        { method: "POST", body: JSON.stringify(data) }
      )
    }

    async updateDepartmentProject(
      departmentId: string,
      projectId: string,
      data: Partial<{
        name: string
        description: string
        local_paths: string[]
        repositories: { url: string; branch?: string; provider?: string }[]
        tool_connections: { app_name: string; entity_id?: string }[]
        config: Record<string, unknown>
        is_active: boolean
      }>
    ) {
      return this.request<DepartmentProject>(
        `/departments/${departmentId}/projects/${projectId}`,
        { method: "PATCH", body: JSON.stringify(data) }
      )
    }

    async deleteDepartmentProject(departmentId: string, projectId: string) {
      return this.request<void>(
        `/departments/${departmentId}/projects/${projectId}`,
        { method: "DELETE" }
      )
    }

    async assignProjectAgents(
      departmentId: string,
      projectId: string,
      agentIds: string[]
    ) {
      return this.request<{ agent_ids: string[] }>(
        `/departments/${departmentId}/projects/${projectId}/agents`,
        { method: "PUT", body: JSON.stringify({ agent_ids: agentIds }) }
      )
    }

    // -- Resource Browser --
    async getProjectResourceConfig(departmentId: string) {
      return this.request<ResourceConfigResponse>(
        `/departments/${departmentId}/projects/resource-config`
      )
    }

    async browseProjectResources(
      departmentId: string,
      params: { app: string; resource_type: string }
    ) {
      const query = new URLSearchParams({
        app: params.app,
        resource_type: params.resource_type,
      })
      return this.request<BrowseResourcesResponse>(
        `/departments/${departmentId}/projects/browse-resources?${query}`
      )
    }

    // -- Recommended Integrations --
    async getRecommendedIntegrations(departmentId: string) {
      return this.request<RecommendedIntegrationsResponse>(
        `/departments/${departmentId}/recommended-integrations`
      )
    }
  }
}
