/**
 * API Client - Auth & Enterprise methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type { CreateEnterpriseRequest, Enterprise } from "./types"
import type { ApiClientConstructor } from "./utils"

export function withAuthApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class AuthApi extends Base {
    async login(email: string, password: string) {
      const data = await this.request<{
        access_token: string
        refresh_token: string
        user: { id: string; email: string; name: string; enterprise_id: string }
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      this.setToken(data.access_token)
      if (typeof window !== "undefined") {
        localStorage.setItem("refresh_token", data.refresh_token)
      }
      return data
    }

    async logout() {
      try {
        await this.request("/auth/logout", { method: "POST" })
      } finally {
        this.clearToken()
      }
    }

    async getMe() {
      return this.request<{
        id: string
        email: string
        name: string
        enterprise_id: string
      }>("/auth/me")
    }
  }
}

export function withEnterpriseApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class EnterpriseApi extends Base {
    async getEnterprises(params?: { status?: string; tier?: string }) {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.tier) query.set("tier", params.tier)
      const queryStr = query.toString()
      return this.request<Enterprise[]>(
        `/enterprises${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async getEnterprise(id: string) {
      return this.request<Enterprise>(`/enterprises/${id}`)
    }

    async createEnterprise(data: CreateEnterpriseRequest) {
      return this.request<Enterprise>("/enterprises", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateEnterprise(id: string, data: Partial<Enterprise>) {
      return this.request<Enterprise>(`/enterprises/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }
  }
}
