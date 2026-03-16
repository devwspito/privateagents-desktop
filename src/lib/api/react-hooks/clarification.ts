"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ClarificationAnswer,
  ClarificationCreate,
  ClarificationStatus,
} from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useClarifications(params: {
  enterprise_id: string
  status?: ClarificationStatus
  agent_id?: string
  target_user_id?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.clarifications(params),
    queryFn: () => api.getClarifications(params),
    enabled: !!params.enterprise_id,
  })
}

export function usePendingClarifications(enterpriseId: string) {
  return useQuery({
    queryKey: queryKeys.pendingClarifications(enterpriseId),
    queryFn: () => api.getPendingClarifications(enterpriseId),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })
}

export function useClarification(
  enterpriseId: string,
  clarificationId: string
) {
  return useQuery({
    queryKey: queryKeys.clarification(clarificationId),
    queryFn: () => api.getClarification(enterpriseId, clarificationId),
    enabled: !!enterpriseId && !!clarificationId,
  })
}

export function useCreateClarification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: ClarificationCreate
    }) => api.createClarification(enterpriseId, data),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingClarifications(enterpriseId),
      })
      queryClient.invalidateQueries({ queryKey: ["clarifications"] })
    },
  })
}

export function useRespondToClarification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      clarificationId,
      data,
    }: {
      enterpriseId: string
      clarificationId: string
      data: ClarificationAnswer
    }) => api.respondToClarification(enterpriseId, clarificationId, data.response),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingClarifications(enterpriseId),
      })
      queryClient.invalidateQueries({ queryKey: ["clarifications"] })
    },
  })
}

export function useCancelClarification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      clarificationId,
    }: {
      enterpriseId: string
      clarificationId: string
    }) => api.cancelClarification(enterpriseId, clarificationId),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingClarifications(enterpriseId),
      })
      queryClient.invalidateQueries({ queryKey: ["clarifications"] })
    },
  })
}
