/**
 * API Client - Channels, Webhooks, Email methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  ChannelInstance,
  ChannelInstanceUpdate,
  CreateOAuthEmailAccountRequest,
  CreateWebhookRequest,
  CreateWebmailAccountRequest,
  EmailAccount,
  RoutingRule,
  SendEmailRequest,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withChannelApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class ChannelApi extends Base {
    async getChannelsStatus() {
      return this.request<
        Record<string, { connected: boolean; status: string }>
      >("/channels/status")
    }

    async getAvailableChannels() {
      return this.request<{
        channels: { id: string; name: string; type: string }[]
      }>("/channels/available")
    }

    async sendChannelMessage(data: {
      channel: string
      recipient: string
      message: string
      metadata?: Record<string, unknown>
    }) {
      return this.request<{ message_id: string }>("/channels/send", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async connectChannel(channel: string, config: Record<string, unknown>) {
      return this.request<void>("/channels/connect", {
        method: "POST",
        body: JSON.stringify({ channel, ...config }),
      })
    }

    async disconnectChannel(channelId: string) {
      return this.request<void>(`/channels/${channelId}/disconnect`, {
        method: "POST",
      })
    }

    async getChannelQR(channelId: string) {
      return this.request<{
        qr_code: string
        status: string
        expires_in?: number
        qr_data?: string
      }>(`/channels/${channelId}/qr`)
    }

    async getRoutingRules() {
      return this.request<{ rules: RoutingRule[] }>("/channels/routing")
    }

    async updateRoutingRules(rules: RoutingRule[]) {
      return this.request<void>("/channels/routing", {
        method: "POST",
        body: JSON.stringify({ rules }),
      })
    }

    async getChannelInstances(params?: {
      enterprise_id?: string
      channel?: string
    }) {
      const query = new URLSearchParams()
      if (params?.enterprise_id)
        query.set("enterprise_id", params.enterprise_id)
      if (params?.channel) query.set("channel", params.channel)
      const queryStr = query.toString()
      return this.request<{ instances: ChannelInstance[] }>(
        `/channel-instances${queryStr ? `?${queryStr}` : ""}`
      )
    }

    async getChannelInstance(instanceId: string) {
      return this.request<{
        id: string
        channel: string
        name: string
        config: Record<string, unknown>
        status: string
      }>(`/channel-instances/${instanceId}`)
    }

    async updateChannelInstance(
      instanceId: string,
      data: ChannelInstanceUpdate
    ) {
      return this.request<void>(`/channel-instances/${instanceId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async reconnectChannelInstance(instanceId: string) {
      return this.request<void>(`/channel-instances/${instanceId}/connect`, {
        method: "POST",
      })
    }

    async deleteChannelInstance(instanceId: string) {
      return this.request<void>(`/channel-instances/${instanceId}`, {
        method: "DELETE",
      })
    }
  }
}

export function withWebhookApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class WebhookApi extends Base {
    async getWebhooks(params: { enterprise_id: string; is_active?: boolean }) {
      const query = new URLSearchParams()
      query.set("enterprise_id", params.enterprise_id)
      if (params.is_active !== undefined)
        query.set("is_active", String(params.is_active))
      return this.request<{
        webhooks: {
          id: string
          name: string
          url: string
          events: string[]
          is_active: boolean
        }[]
      }>(`/webhook-registrations?${query}`)
    }

    async getWebhook(webhookId: string, enterpriseId: string) {
      return this.request<{
        id: string
        name: string
        url: string
        events: string[]
        secret?: string
        is_active: boolean
      }>(`/webhook-registrations/${webhookId}?enterprise_id=${enterpriseId}`)
    }

    async createWebhook(enterpriseId: string, data: CreateWebhookRequest) {
      return this.request<{ id: string; name: string; url: string }>(
        `/webhook-registrations?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async updateWebhook(
      webhookId: string,
      enterpriseId: string,
      data: Partial<CreateWebhookRequest>
    ) {
      return this.request<void>(
        `/webhook-registrations/${webhookId}?enterprise_id=${enterpriseId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async deleteWebhook(webhookId: string, enterpriseId: string) {
      return this.request<void>(
        `/webhook-registrations/${webhookId}?enterprise_id=${enterpriseId}`,
        { method: "DELETE" }
      )
    }

    async testWebhook(webhookId: string, enterpriseId: string) {
      return this.request<{ success: boolean; response_time_ms: number }>(
        `/webhook-registrations/${webhookId}/test?enterprise_id=${enterpriseId}`,
        { method: "POST" }
      )
    }
  }
}

export function withEmailApi<TBase extends ApiClientConstructor>(Base: TBase) {
  return class EmailApi extends Base {
    async createWebmailAccount(data: CreateWebmailAccountRequest) {
      return this.request<{ account_id: string }>("/email/accounts/webmail", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }

    async createOAuthEmailAccount(data: CreateOAuthEmailAccountRequest) {
      return this.request<{ account_id: string; auth_url?: string }>(
        "/email/accounts/oauth",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async finalizeOAuthEmail(accountId: string, code: string) {
      return this.request<{ success: boolean }>(
        `/email/accounts/${accountId}/oauth-callback`,
        {
          method: "POST",
          body: JSON.stringify({ code }),
        }
      )
    }

    async getEmailAccounts() {
      return this.request<{ accounts: EmailAccount[] }>("/email/accounts")
    }

    async deleteEmailAccount(accountId: string) {
      return this.request<void>(`/email/accounts/${accountId}`, {
        method: "DELETE",
      })
    }

    async syncEmailAccount(accountId: string) {
      return this.request<{ synced: number; new_messages: number }>(
        `/email/accounts/${accountId}/sync`,
        { method: "POST" }
      )
    }

    async getEmailMessages(params?: {
      account_id?: string
      folder?: string
      limit?: number
      offset?: number
    }) {
      const query = new URLSearchParams()
      if (params?.account_id) query.set("account_id", params.account_id)
      if (params?.folder) query.set("folder", params.folder)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.offset) query.set("offset", String(params.offset))
      const queryStr = query.toString()
      return this.request<{
        messages: {
          id: string
          subject: string
          from: string
          date: string
          is_read: boolean
        }[]
        items?: {
          id: string
          subject: string
          from: string
          date: string
          is_read: boolean
        }[]
        total: number
        unread_counts?: Record<string, number>
      }>(`/email/messages${queryStr ? `?${queryStr}` : ""}`)
    }

    async getEmailMessage(messageId: string) {
      return this.request<{
        id: string
        subject: string
        from: string
        to: string[]
        date: string
        body: string
        is_read: boolean
      }>(`/email/messages/${messageId}`)
    }

    async updateEmailMessage(
      messageId: string,
      data: { is_read?: boolean; folder?: string }
    ) {
      return this.request<void>(`/email/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    }

    async bulkUpdateEmailMessages(
      messageIds: string[],
      data: { is_read?: boolean; folder?: string }
    ) {
      return this.request<void>("/email/messages/bulk", {
        method: "PATCH",
        body: JSON.stringify({ message_ids: messageIds, ...data }),
      })
    }

    async sendEmail(data: SendEmailRequest) {
      return this.request<{ message_id: string }>("/email/send", {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  }
}
