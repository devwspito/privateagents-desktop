"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateWebhookRequest, UpdateWebhookRequest } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useWebhooks(params: {
  enterprise_id: string
  department_id?: string
  enabled?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.webhooks(params),
    queryFn: () => api.getWebhooks(params),
    enabled: !!params.enterprise_id,
  })
}

export function useWebhook(webhookId: string, enterpriseId: string) {
  return useQuery({
    queryKey: queryKeys.webhook(webhookId),
    queryFn: () => api.getWebhook(webhookId, enterpriseId),
    enabled: !!webhookId && !!enterpriseId,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: CreateWebhookRequest
    }) => api.createWebhook(enterpriseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks"],
      })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      webhookId,
      enterpriseId,
      data,
    }: {
      webhookId: string
      enterpriseId: string
      data: UpdateWebhookRequest
    }) => api.updateWebhook(webhookId, enterpriseId, data),
    onSuccess: (_, { webhookId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhook(webhookId),
      })
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      webhookId,
      enterpriseId,
    }: {
      webhookId: string
      enterpriseId: string
    }) => api.deleteWebhook(webhookId, enterpriseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    },
  })
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: ({
      webhookId,
      enterpriseId,
    }: {
      webhookId: string
      enterpriseId: string
    }) => api.testWebhook(webhookId, enterpriseId),
  })
}
