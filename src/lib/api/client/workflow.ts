/**
 * API Client - Workflow methods
 */

import type { ApiClientConstructor } from "./utils"
import type {
  WorkflowTemplate,
  WorkflowRun,
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  StartWorkflowRunRequest,
  CatalogEntry,
  CatalogReadinessResponse,
  CatalogActivateRequest,
} from "./types"

export function withWorkflowApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class WorkflowApi extends Base {
    // Template CRUD
    async listWorkflowTemplates(params?: {
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
      return this.request<WorkflowTemplate[]>(
        `/workflows/templates${qs ? `?${qs}` : ""}`
      )
    }

    async getWorkflowTemplate(templateId: string) {
      return this.request<WorkflowTemplate>(
        `/workflows/templates/${templateId}`
      )
    }

    async createWorkflowTemplate(data: CreateWorkflowTemplateRequest) {
      return this.request<WorkflowTemplate>("/workflows/templates", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateWorkflowTemplate(
      templateId: string,
      data: UpdateWorkflowTemplateRequest
    ) {
      return this.request<WorkflowTemplate>(
        `/workflows/templates/${templateId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async deleteWorkflowTemplate(templateId: string) {
      return this.request<void>(`/workflows/templates/${templateId}`, {
        method: "DELETE",
      })
    }

    // Run management
    async listWorkflowRuns(params?: {
      enterprise_id?: string
      template_id?: string
      status?: string
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.template_id) query.set("template_id", params.template_id)
      if (params?.status) query.set("status", params.status)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const qs = query.toString()
      return this.request<WorkflowRun[]>(
        `/workflows/runs${qs ? `?${qs}` : ""}`
      )
    }

    async getWorkflowRun(runId: string) {
      return this.request<WorkflowRun>(`/workflows/runs/${runId}`)
    }

    async startWorkflowRun(data: StartWorkflowRunRequest) {
      return this.request<WorkflowRun>("/workflows/runs", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async resumeWorkflowRun(
      runId: string,
      approvalContext?: Record<string, unknown>
    ) {
      return this.request<WorkflowRun>(`/workflows/runs/${runId}/resume`, {
        method: "POST",
        body: JSON.stringify({ approval_context: approvalContext }),
      })
    }

    // Catalog
    async listCatalog(params?: {
      department_template_id?: string
      category?: string
      pattern?: string
      tags?: string[]
      q?: string
    }) {
      const query = new URLSearchParams()
      if (params?.department_template_id)
        query.set("department_template_id", params.department_template_id)
      if (params?.category) query.set("category", params.category)
      if (params?.pattern) query.set("pattern", params.pattern)
      if (params?.tags) params.tags.forEach((t) => query.append("tags", t))
      if (params?.q) query.set("q", params.q)
      const qs = query.toString()
      return this.request<CatalogEntry[]>(
        `/workflows/catalog${qs ? `?${qs}` : ""}`
      )
    }

    async getCatalogEntry(catalogId: string) {
      return this.request<CatalogEntry>(`/workflows/catalog/${catalogId}`)
    }

    async checkCatalogReadiness(
      catalogId: string,
      data: { enterprise_id: string; department_id: string }
    ) {
      return this.request<CatalogReadinessResponse>(
        `/workflows/catalog/${catalogId}/check`,
        { method: "POST", body: JSON.stringify(data) }
      )
    }

    async activateCatalogWorkflow(
      catalogId: string,
      data: CatalogActivateRequest
    ) {
      return this.request<WorkflowTemplate>(
        `/workflows/catalog/${catalogId}/activate`,
        { method: "POST", body: JSON.stringify(data) }
      )
    }
  }
}
