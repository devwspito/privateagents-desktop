/**
 * API Client - Miscellaneous methods (templates, gateway, cron, tunnel, etc.)
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  AcceptInvitationRequest,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
  ClarificationCreate,
  CreateDelegationRequest,
  CronJob,
  CronJobRun,
  InvitationRequest,
  RoleInfo,
  SectorInfo,
  SubscriptionGatewayListResponse as _SubscriptionGatewayListResponse,
  TemplateDetail,
  TemplateListItem,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withMiscApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class MiscApi extends Base {
    async listTemplates(params?: { sector?: string; type?: string }) {
      const queryParts: string[] = []
      if (params?.type) queryParts.push(`type=${params.type}`)
      if (params?.sector) queryParts.push(`sector=${params.sector}`)
      const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : ""
      return this.request<{ templates: TemplateListItem[] }>(
        `/templates${query}`
      )
    }

    async listSectors() {
      return this.request<{ sectors: SectorInfo[] }>("/templates/sectors")
    }

    async listRoles() {
      return this.request<{ roles: RoleInfo[] }>("/templates/roles")
    }

    async getTemplate(templateId: string) {
      return this.request<TemplateDetail>(`/templates/${templateId}`)
    }

    async previewTemplate(
      templateId: string,
      variables: Record<string, string>
    ) {
      return this.request<{ preview: Record<string, unknown> }>(
        `/templates/${templateId}/preview`,
        {
          method: "POST",
          body: JSON.stringify({ variables }),
        }
      )
    }

    async getTemplateVariables(templateId: string) {
      return this.request<{
        variables: { name: string; description: string; required: boolean }[]
      }>(`/templates/${templateId}/variables`)
    }

    async applyTemplate(templateId: string, data: ApplyTemplateRequest) {
      return this.request<ApplyTemplateResponse>(
        `/templates/${templateId}/apply`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async getGatewayConfig() {
      return this.request<Record<string, unknown>>("/config")
    }

    async setGatewayConfig(config: Record<string, unknown>) {
      return this.request<void>("/config", {
        method: "PUT",
        body: JSON.stringify(config),
      })
    }

    async patchGatewayConfig(patch: Record<string, unknown>) {
      return this.request<void>("/config", {
        method: "PATCH",
        body: JSON.stringify(patch),
      })
    }

    async applyGatewayConfig(agentId: string, config: Record<string, unknown>) {
      return this.request<void>("/config/apply", {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId, ...config }),
      })
    }

    async getGatewayConfigSchema() {
      return this.request<Record<string, unknown>>("/config/schema")
    }

    async getGatewayConfigKeys() {
      return this.request<{ keys: string[] }>("/config/keys")
    }

    async getGatewayConfigPresets() {
      return this.request<{
        presets: { id: string; name: string; config: Record<string, unknown> }[]
      }>("/config/presets")
    }

    async applyGatewayConfigPreset(presetId: string) {
      return this.request<void>(`/config/presets/${presetId}/apply`, {
        method: "POST",
      })
    }

    async initiateCodexAuth() {
      return this.request<{
        auth_url: string
        user_code?: string
        verification_url?: string
        interval?: number
        expires_in?: number
      }>("/codex-auth/initiate")
    }

    async checkCodexAuthStatus() {
      return this.request<{
        authenticated: boolean
        expires_at?: string
        status?: string
        email?: string
        error?: string
      }>("/codex-auth/status")
    }

    async revokeCodexAuth() {
      return this.request<void>("/codex-auth", { method: "DELETE" })
    }

    async checkCodexConnected() {
      return this.request<{ connected: boolean; email?: string }>(
        "/codex-auth/connected"
      )
    }

    async getAvailableModels() {
      return this.request<{
        providers: Array<{
          id: string
          name: string
          requires_key: boolean
          has_key: boolean
          models: Array<{ id: string; name: string; context_window: number }>
        }>
      }>("/models/available")
    }

    async getCronJobs() {
      return this.request<{ items: CronJob[]; total: number }>("/cron")
    }

    async createCronJob(data: {
      name: string
      schedule: string
      task_type: string
      agent_id: string
      params?: Record<string, unknown>
    }) {
      return this.request<{ id: string }>("/cron", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateCronJob(
      jobId: string,
      data: { name?: string; schedule?: string; command?: string; enabled?: boolean }
    ) {
      return this.request<void>(`/cron/${jobId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async deleteCronJob(jobId: string) {
      return this.request<void>(`/cron/${jobId}`, { method: "DELETE" })
    }

    async runCronJob(jobId: string) {
      return this.request<{ task_id: string }>(`/cron/${jobId}/run`, {
        method: "POST",
      })
    }

    async toggleCronJob(jobId: string) {
      return this.request<void>(`/cron/${jobId}/toggle`, { method: "POST" })
    }

    async getCronJobRuns(jobId: string, limit = 20) {
      return this.request<{ items: CronJobRun[]; total: number }>(
        `/cron/${jobId}/runs?limit=${limit}`
      )
    }

    async getCronTemplates() {
      return this.request<{
        templates: { id: string; name: string; description: string }[]
      }>("/cron/templates/list")
    }

    async getRemoteTunnelInfo() {
      return this.request<{
        token: string | null
        remote_url: string | null
      }>("/desktop/remote-info")
    }

    async regenerateRemoteTunnel() {
      return this.request<{ token: string; remote_url: string }>(
        "/desktop/remote-info/regenerate",
        {
          method: "POST",
        }
      )
    }

    async remoteTunnelAuth(tunnelToken: string) {
      return this.request<{
        access_token: string
        user: { id: string; name: string }
      }>("/desktop/remote-tunnel/auth", {
        method: "POST",
        body: JSON.stringify({ token: tunnelToken }),
      })
    }

    async getRemoteTunnelStatus() {
      return this.request<{ is_active: boolean }>("/desktop/remote-tunnel/status")
    }

    async createInvitation(data: InvitationRequest) {
      return this.request<{ id: string; token: string; invite_url: string }>(
        "/auth/invite",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async getInvitationInfo(token: string) {
      return this.request<{
        email: string
        enterprise_name: string
        role: string
        expires_at: string
      }>(`/auth/invitation/${token}`)
    }

    async acceptInvitation(data: AcceptInvitationRequest) {
      return this.request<{
        access_token: string
        user: { id: string; email: string }
      }>("/auth/accept-invitation", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async listInvitations() {
      return this.request<{
        items: { id: string; email: string; status: string }[]
      }>("/auth/invitations")
    }

    async revokeInvitation(invitationId: string) {
      return this.request<void>(`/auth/invitations/${invitationId}`, {
        method: "DELETE",
      })
    }

    async getDelegations(params?: {
      enterprise_id?: string
      agent_id?: string
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.agent_id) query.set("agent_id", params.agent_id)
      const queryStr = query.toString()
      return this.request<{
        delegations: { id: string; from_agent: string; to_agent: string }[]
      }>(`/users/delegations${queryStr ? `?${queryStr}` : ""}`)
    }

    async getDelegation(id: string) {
      return this.request<{
        id: string
        from_agent_id: string
        to_agent_id: string
        task_types: string[]
        conditions: Record<string, unknown>
      }>(`/users/delegations/${id}`)
    }

    async createDelegation(data: CreateDelegationRequest) {
      return this.request<{ id: string }>("/users/delegations", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async revokeDelegation(id: string) {
      return this.request<void>(`/users/delegations/${id}`, { method: "DELETE" })
    }

    async getClarifications(params: {
      enterprise_id: string
      status?: string
      limit?: number
    }) {
      const query = new URLSearchParams()
      query.set("enterprise_id", params.enterprise_id)
      if (params.status) query.set("status", params.status)
      if (params.limit) query.set("limit", String(params.limit))
      return this.request<{
        clarifications: {
          id: string
          title: string
          status: string
          requested_agent_id: string
        }[]
      }>(`/clarifications?${query}`)
    }

    async getPendingClarifications(enterpriseId: string) {
      return this.request<{
        count: number
        items: { id: string; title: string }[]
      }>(
        `/clarifications/pending?enterprise_id=${enterpriseId}`
      )
    }

    async getClarification(enterpriseId: string, clarificationId: string) {
      return this.request<{
        id: string
        title: string
        description: string
        options?: string[]
        status: string
      }>(`/clarifications/${clarificationId}?enterprise_id=${enterpriseId}`)
    }

    async createClarification(enterpriseId: string, data: ClarificationCreate) {
      return this.request<{ id: string }>(
        `/clarifications?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async respondToClarification(
      enterpriseId: string,
      clarificationId: string,
      response: string
    ) {
      return this.request<void>(
        `/clarifications/${clarificationId}/respond?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify({ response }),
        }
      )
    }

    async cancelClarification(enterpriseId: string, clarificationId: string) {
      return this.request<void>(
        `/clarifications/${clarificationId}/cancel?enterprise_id=${enterpriseId}`,
        { method: "POST" }
      )
    }
  }
}
