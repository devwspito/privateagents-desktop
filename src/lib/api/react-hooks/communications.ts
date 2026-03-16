"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import type { SendA2AMessageRequest } from "../client/communications"
import { queryKeys } from "./query-keys"

export function useEnterpriseMessages(
  enterpriseId: string,
  params?: Record<string, string>
) {
  return useQuery({
    queryKey: queryKeys.enterpriseMessages(enterpriseId, params),
    queryFn: () => api.getEnterpriseMessages(enterpriseId, params),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })
}

export function useSendA2AMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SendA2AMessageRequest) => api.sendA2AMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-messages"] })
    },
  })
}
