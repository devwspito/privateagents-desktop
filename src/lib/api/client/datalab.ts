/**
 * API Client - DataLab methods
 */

import type { ApiClientConstructor } from "./utils"

// Types
export interface DataLabProject {
  id: string
  enterprise_id: string
  name: string
  description: string | null
  project_type: "mcp_server" | "dataset" | "both"
  scope: string
  department_id: string | null
  agent_id: string | null
  source_collection_ids: string[] | null
  source_config: Record<string, unknown>
  mcp_config: Record<string, unknown>
  dataset_config: Record<string, unknown>
  status: string
  total_entries: number
  quality_score: number | null
  last_built_at: string | null
  build_error: string | null
  deployed_at: string | null
  deployment_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DataLabProjectCreate {
  name: string
  description?: string
  project_type?: string
  scope?: string
  department_id?: string
  agent_id?: string
  source_collection_ids?: string[]
  source_config?: Record<string, unknown>
  mcp_config?: Record<string, unknown>
  dataset_config?: Record<string, unknown>
}

export interface DataLabProjectUpdate {
  name?: string
  description?: string
  source_collection_ids?: string[]
  source_config?: Record<string, unknown>
  mcp_config?: Record<string, unknown>
  dataset_config?: Record<string, unknown>
}

export interface MCPDeployment {
  id: string
  project_id: string
  enterprise_id: string
  server_name: string
  server_version: number
  description: string | null
  status: string
  pid: number | null
  config_snapshot: Record<string, unknown>
  tools_manifest: Record<string, unknown>
  custom_tools: Record<string, unknown>
  bound_agent_ids: string[] | null
  total_queries: number
  last_query_at: string | null
  server_file_path: string | null
  deployed_at: string | null
  stopped_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DataLabPreview {
  collections: Array<{
    id: string
    name: string
    description: string | null
    document_count: number
    chunk_count: number
  }>
  sample_chunks: Array<{
    id: string
    document_id: string
    document_title: string | null
    content: string
    token_count: number | null
    collection_id: string
  }>
  stats: {
    total_chunks: number
    total_documents: number
    total_tokens: number
  }
}

export interface DataLabEntry {
  id: string
  entry_type: string
  input_text: string | null
  output_text: string | null
  instruction: string | null
  quality_score: number | null
  quality_flags: Record<string, unknown>
  human_reviewed: boolean
  human_approved: boolean | null
  reviewed_by: string | null
  source_document_id: string | null
  source_chunk_ids: string[] | null
  token_count: number | null
  created_at: string | null
}

export interface DataLabEntriesResponse {
  items: DataLabEntry[]
  total: number
  offset: number
  limit: number
}

export interface DataLabStats {
  total_entries: number
  reviewed: number
  approved: number
  rejected: number
  pending_review: number
  avg_quality: number | null
  total_tokens: number
}

export interface BuildDatasetResult {
  entries_created: number
  entries_skipped: number
  avg_quality: number | null
  error?: string
}

export interface EntryReviewRequest {
  approved: boolean
  input_text?: string
  output_text?: string
}

export function withDataLabApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class DataLabApi extends Base {
    // --- Projects ---

    async getDataLabProjects(enterpriseId: string, projectType?: string) {
      const params = new URLSearchParams()
      if (projectType) params.set("project_type", projectType)
      const qs = params.toString()
      return this.request<DataLabProject[]>(
        `/enterprises/${enterpriseId}/datalab/projects${qs ? `?${qs}` : ""}`
      )
    }

    async getDataLabProject(enterpriseId: string, projectId: string) {
      return this.request<DataLabProject>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}`
      )
    }

    async createDataLabProject(
      enterpriseId: string,
      data: DataLabProjectCreate
    ) {
      return this.request<DataLabProject>(
        `/enterprises/${enterpriseId}/datalab/projects`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async updateDataLabProject(
      enterpriseId: string,
      projectId: string,
      data: DataLabProjectUpdate
    ) {
      return this.request<DataLabProject>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async deleteDataLabProject(enterpriseId: string, projectId: string) {
      return this.request<{ deleted: boolean }>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}`,
        { method: "DELETE" }
      )
    }

    async previewDataLabProject(
      enterpriseId: string,
      projectId: string,
      limit = 20
    ) {
      return this.request<DataLabPreview>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/preview?limit=${limit}`
      )
    }

    // --- Document Upload ---

    async uploadFileToProject(
      enterpriseId: string,
      projectId: string,
      file: File,
      title?: string
    ) {
      const formData = new FormData()
      formData.append("file", file)
      if (title) formData.append("title", title)

      return this.request<{
        document_id: string
        chunks_created: number
        tokens_total: number
        collection_id: string
      }>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/upload`,
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type — browser sets it with boundary for FormData
        }
      )
    }

    // --- Dataset Building & Entries ---

    async buildDataset(enterpriseId: string, projectId: string) {
      return this.request<BuildDatasetResult>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/build-dataset`,
        { method: "POST" }
      )
    }

    async getDataLabEntries(
      enterpriseId: string,
      projectId: string,
      params?: {
        offset?: number
        limit?: number
        min_quality?: number
        reviewed?: boolean
        approved?: boolean
      }
    ) {
      const searchParams = new URLSearchParams()
      if (params?.offset !== undefined) searchParams.set("offset", String(params.offset))
      if (params?.limit !== undefined) searchParams.set("limit", String(params.limit))
      if (params?.min_quality !== undefined) searchParams.set("min_quality", String(params.min_quality))
      if (params?.reviewed !== undefined) searchParams.set("reviewed", String(params.reviewed))
      if (params?.approved !== undefined) searchParams.set("approved", String(params.approved))
      const qs = searchParams.toString()
      return this.request<DataLabEntriesResponse>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/entries${qs ? `?${qs}` : ""}`
      )
    }

    async getDataLabStats(enterpriseId: string, projectId: string) {
      return this.request<DataLabStats>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/stats`
      )
    }

    async reviewDataLabEntry(
      enterpriseId: string,
      entryId: string,
      data: EntryReviewRequest
    ) {
      return this.request<{ id: string; human_reviewed: boolean; human_approved: boolean; reviewed_by: string }>(
        `/enterprises/${enterpriseId}/datalab/entries/${entryId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async deleteDataLabEntry(enterpriseId: string, entryId: string) {
      return this.request<{ deleted: boolean }>(
        `/enterprises/${enterpriseId}/datalab/entries/${entryId}`,
        { method: "DELETE" }
      )
    }

    async exportDataset(
      enterpriseId: string,
      projectId: string,
      params?: { min_quality?: number; only_approved?: boolean }
    ) {
      const searchParams = new URLSearchParams()
      searchParams.set("format", "jsonl")
      if (params?.min_quality !== undefined) searchParams.set("min_quality", String(params.min_quality))
      if (params?.only_approved) searchParams.set("only_approved", "true")
      const qs = searchParams.toString()
      return this.request<string>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/export?${qs}`,
        { rawResponse: true } as RequestInit
      )
    }

    // --- MCP Server ---

    async buildMCPServer(enterpriseId: string, projectId: string) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/projects/${projectId}/build-mcp`,
        { method: "POST" }
      )
    }

    async deployMCPServer(enterpriseId: string, deploymentId: string) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/deployments/${deploymentId}/deploy`,
        { method: "POST" }
      )
    }

    async stopMCPServer(enterpriseId: string, deploymentId: string) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/deployments/${deploymentId}/stop`,
        { method: "POST" }
      )
    }

    async bindMCPToAgents(
      enterpriseId: string,
      deploymentId: string,
      agentIds: string[]
    ) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/deployments/${deploymentId}/bind`,
        {
          method: "POST",
          body: JSON.stringify({ agent_ids: agentIds }),
        }
      )
    }

    async unbindMCPFromAgents(
      enterpriseId: string,
      deploymentId: string,
      agentIds: string[]
    ) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/deployments/${deploymentId}/unbind`,
        {
          method: "POST",
          body: JSON.stringify({ agent_ids: agentIds }),
        }
      )
    }

    async getDataLabDeployments(
      enterpriseId: string,
      projectId?: string
    ) {
      const params = new URLSearchParams()
      if (projectId) params.set("project_id", projectId)
      const qs = params.toString()
      return this.request<MCPDeployment[]>(
        `/enterprises/${enterpriseId}/datalab/deployments${qs ? `?${qs}` : ""}`
      )
    }

    async getDataLabDeployment(enterpriseId: string, deploymentId: string) {
      return this.request<MCPDeployment>(
        `/enterprises/${enterpriseId}/datalab/deployments/${deploymentId}`
      )
    }
  }
}
