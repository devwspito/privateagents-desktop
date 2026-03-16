"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateDelegationRequest, DelegationStatus } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useDelegations(params?: {
  user_id?: string
  status?: DelegationStatus
  as_delegator?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.delegations(params),
    queryFn: () => api.getDelegations(params as { enterprise_id?: string; agent_id?: string } | undefined),
    enabled: !!params?.user_id,
  })
}

export function useDelegation(id: string) {
  return useQuery({
    queryKey: queryKeys.delegation(id),
    queryFn: () => api.getDelegation(id),
    enabled: !!id,
  })
}

export function useCreateDelegation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDelegationRequest) => api.createDelegation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] })
    },
  })
}

export function useRevokeDelegation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.revokeDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] })
    },
  })
}
