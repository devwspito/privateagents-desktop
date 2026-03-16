/**
 * API Client - Audit Log methods
 */

import type { ApiClientConstructor } from "./utils"

export interface AuditEntry {
  id: number
  enterprise_id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  changes: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditListResponse {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

export interface AuditQueryParams {
  enterprise_id: string
  action?: string
  resource_type?: string
  resource_id?: string
  user_id?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export function withAuditApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class extends Base {
    async listAuditEntries(params: AuditQueryParams): Promise<AuditListResponse> {
      const searchParams = new URLSearchParams()
      searchParams.set("enterprise_id", params.enterprise_id)
      if (params.action) searchParams.set("action", params.action)
      if (params.resource_type) searchParams.set("resource_type", params.resource_type)
      if (params.resource_id) searchParams.set("resource_id", params.resource_id)
      if (params.user_id) searchParams.set("user_id", params.user_id)
      if (params.from) searchParams.set("from", params.from)
      if (params.to) searchParams.set("to", params.to)
      if (params.limit != null) searchParams.set("limit", String(params.limit))
      if (params.offset != null) searchParams.set("offset", String(params.offset))

      return this.request<AuditListResponse>(`/audit?${searchParams.toString()}`)
    }
  }
}
