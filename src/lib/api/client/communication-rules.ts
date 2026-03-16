/**
 * Private Agents API Client - Communication Rules (A2A)
 */

import type {
  CommunicationRule,
  CreateCommunicationRuleRequest,
  UpdateCommunicationRuleRequest,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withCommunicationRulesApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class CommunicationRulesApi extends Base {
    async getCommunicationRules(): Promise<CommunicationRule[]> {
      return this.request<CommunicationRule[]>("/communication-rules")
    }

    async createCommunicationRule(
      data: CreateCommunicationRuleRequest
    ): Promise<CommunicationRule> {
      return this.request<CommunicationRule>("/communication-rules", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async updateCommunicationRule(
      id: string,
      data: UpdateCommunicationRuleRequest
    ): Promise<CommunicationRule> {
      return this.request<CommunicationRule>(`/communication-rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async deleteCommunicationRule(id: string): Promise<void> {
      await this.request<void>(`/communication-rules/${id}`, {
        method: "DELETE",
      })
    }
  }
}
