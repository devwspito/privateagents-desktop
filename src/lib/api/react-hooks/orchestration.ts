"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"

export function useOrchestration(orchestrationId: string) {
  return useQuery({
    queryKey: ["orchestration", orchestrationId],
    queryFn: () => api.getOrchestration(orchestrationId),
    enabled: !!orchestrationId,
    refetchInterval: 5000,
  })
}

export function useOrchestrations(params?: {
  status?: string
  conversation_id?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ["orchestration", "list", params],
    queryFn: () => api.listOrchestrations(params),
    refetchInterval: 10000,
  })
}

export function useStartOrchestration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      message: string
      primary_agent_id: string
      session_key?: string
    }) => api.startOrchestration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration"] })
    },
  })
}

export function useRespondToOrchestrationStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orchestrationId,
      stepId,
      response,
    }: {
      orchestrationId: string
      stepId: string
      response: string
    }) => api.respondToOrchestrationStep({
      orchestration_id: orchestrationId,
      step_id: stepId,
      response,
    }),
    onSuccess: (_, { orchestrationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["orchestration", orchestrationId],
      })
    },
  })
}

export function useCancelOrchestration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orchestrationId: string) =>
      api.cancelOrchestration(orchestrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration"] })
    },
  })
}
