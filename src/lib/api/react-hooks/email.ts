"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CreateOAuthEmailAccountRequest,
  CreateWebmailAccountRequest,
  EmailMessageUpdate,
  SendEmailRequest,
} from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useEmailAccounts() {
  return useQuery({
    queryKey: queryKeys.emailAccounts,
    queryFn: () => api.getEmailAccounts(),
  })
}

export function useEmailMessages(params?: {
  folder?: string
  account_id?: string
  search?: string
  label?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.emailMessages(params),
    queryFn: () => api.getEmailMessages(params),
  })
}

export function useEmailMessage(id: string | null) {
  return useQuery({
    queryKey: queryKeys.emailMessage(id || ""),
    queryFn: () => api.getEmailMessage(id!),
    enabled: !!id,
  })
}

export function useCreateWebmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWebmailAccountRequest) =>
      api.createWebmailAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts })
    },
  })
}

export function useCreateOAuthEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOAuthEmailAccountRequest) =>
      api.createOAuthEmailAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts })
    },
  })
}

export function useFinalizeOAuthEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => api.finalizeOAuthEmail(accountId, ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts })
    },
  })
}

export function useDeleteEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => api.deleteEmailAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts })
      queryClient.invalidateQueries({
        queryKey: ["email", "messages"],
      })
    },
  })
}

export function useSyncEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => api.syncEmailAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email", "messages"],
      })
    },
  })
}

export function useSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SendEmailRequest) => api.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email", "messages"],
      })
    },
  })
}

export function useUpdateEmailMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string
      data: EmailMessageUpdate
    }) => api.updateEmailMessage(messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email", "messages"],
      })
    },
  })
}

export function useBulkUpdateEmailMessages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      messageIds,
      updates,
    }: {
      messageIds: string[]
      updates: EmailMessageUpdate
    }) => api.bulkUpdateEmailMessages(messageIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email", "messages"],
      })
    },
  })
}
