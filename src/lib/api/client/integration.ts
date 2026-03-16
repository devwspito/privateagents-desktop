/**
 * API Client - Integration methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  ApiKeyListResponse,
  ApiKeyResponse,
  ApiKeyService,
  AppAuthSchemaResponse,
  AppDetailResponse,
  ComposioApp,
  CreateApiKeyRequest,
  EffectiveApiKey,
  EffectiveConnections,
  GoogleAccount,
  GoogleCallbackResponse,
  GoogleConnectResponse,
  ScopedConnectRequest,
  ScopedConnection,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withIntegrationApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class IntegrationApi extends Base {
    async getScopedConnections(params: {
      enterprise_id: string
      scope?: "enterprise" | "department" | "agent"
      scopeId?: string
    }) {
      const queryParts: string[] = [`enterprise_id=${params.enterprise_id}`]
      if (params.scope) queryParts.push(`scope=${params.scope}`)
      if (params.scopeId) queryParts.push(`scope_id=${params.scopeId}`)
      return this.request<ScopedConnection[]>(
        `/integrations/scoped/connections?${queryParts.join("&")}`
      )
    }

    async getComposioApps(params?: { category?: string; limit?: number }) {
      const queryParts: string[] = []
      if (params?.category) queryParts.push(`category=${params.category}`)
      if (params?.limit) queryParts.push(`limit=${params.limit}`)
      const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : ""
      return this.request<ComposioApp[]>(`/integrations/scoped/available${query}`)
    }

    async connectScopedApp(data: ScopedConnectRequest) {
      return this.request<{ auth_url: string }>("/integrations/scoped/connect", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async disconnectScopedApp(connectionId: string) {
      return this.request<void>(`/integrations/scoped/connections/${connectionId}`, {
        method: "DELETE",
      })
    }

    async refreshComposioTools(enterpriseId: string) {
      return this.request<{ refreshed: number; errors: number; total_agents: number }>(
        `/integrations/scoped/refresh-tools?enterprise_id=${enterpriseId}`,
        { method: "POST" }
      )
    }

    async getEffectiveConnections(
      agentId: string,
      enterpriseId: string
    ) {
      return this.request<EffectiveConnections>(
        `/integrations/scoped/effective/${agentId}?enterprise_id=${enterpriseId}`
      )
    }

    async getComposioIntegrations() {
      return this.request<{ connected: string[] }>("/integrations/scoped/integrations")
    }

    async getAppAuthSchema(appKey: string) {
      return this.request<AppAuthSchemaResponse>(
        `/integrations/scoped/apps/${appKey}/auth-schema`
      )
    }

    async getAppDetails(appKey: string) {
      return this.request<AppDetailResponse>(
        `/integrations/scoped/apps/${appKey}/details`
      )
    }

    async getGoogleStatus() {
      return this.request<{ connected: boolean; email?: string }>(
        "/integrations/google/status"
      )
    }

    async getGoogleAccounts() {
      return this.request<GoogleAccount[]>("/integrations/google/accounts")
    }

    async connectGoogle(data: { email: string; services?: string }) {
      return this.request<GoogleConnectResponse>("/integrations/google/connect", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async googleCallback(data: { email: string; code: string }) {
      return this.request<GoogleCallbackResponse>("/integrations/google/callback", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async removeGoogleAccount(email: string) {
      return this.request<void>(
        `/integrations/google/accounts/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      )
    }

    async testGoogleConnection(email: string) {
      return this.request<{ success: boolean; message: string }>(
        `/integrations/google/accounts/${encodeURIComponent(email)}/test`
      )
    }

    async getApiKeyServices() {
      return this.request<ApiKeyService[]>("/api-keys/services")
    }

    async getApiKeys(params: {
      scope?: "enterprise" | "department" | "agent"
      scope_id?: string
      enterprise_id?: string
    }) {
      const query = new URLSearchParams()
      if (params.scope) query.set("scope", params.scope)
      if (params.scope_id) query.set("scope_id", params.scope_id)
      if (params.enterprise_id) query.set("enterprise_id", params.enterprise_id)
      const queryStr = query.toString()
      return this.request<ApiKeyListResponse>(
        `/api-keys${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async createApiKey(data: CreateApiKeyRequest) {
      return this.request<ApiKeyResponse & { key: string }>("/api-keys", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async deleteApiKey(keyId: string) {
      return this.request<void>(`/api-keys/${keyId}`, { method: "DELETE" })
    }

    async getEffectiveApiKeys(agentId: string) {
      return this.request<EffectiveApiKey[]>(
        `/api-keys/effective/${agentId}`
      )
    }

    async getSubscriptionGateways(enterpriseId: string) {
      return this.request<{ gateways: { id: string; name: string; scope: string }[] }>(
        `/api-keys/subscription-gateways?enterprise_id=${enterpriseId}`
      )
    }
  }
}
