"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CreateCommunicationRuleRequest,
  UpdateCommunicationRuleRequest,
} from "../client"
import api from "../client"
import { queryKeys } from "./query-keys"

export function useCommunicationRules() {
  return useQuery({
    queryKey: queryKeys.communicationRules,
    queryFn: () => api.getCommunicationRules(),
  })
}

export function useCreateCommunicationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommunicationRuleRequest) =>
      api.createCommunicationRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communicationRules })
    },
  })
}

export function useUpdateCommunicationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateCommunicationRuleRequest
    }) => api.updateCommunicationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communicationRules })
    },
  })
}

export function useDeleteCommunicationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCommunicationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communicationRules })
    },
  })
}
