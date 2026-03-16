"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useAvailableModels() {
  return useQuery({
    queryKey: queryKeys.availableModels,
    queryFn: () => api.getAvailableModels(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useGatewayConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => api.getGatewayConfig(),
  })
}

export function useGatewayConfigSchema() {
  return useQuery({
    queryKey: queryKeys.configSchema,
    queryFn: () => api.getGatewayConfigSchema(),
  })
}

export function useGatewayConfigKeys() {
  return useQuery({
    queryKey: queryKeys.configKeys,
    queryFn: () => api.getGatewayConfigKeys(),
  })
}

export function useGatewayConfigPresets() {
  return useQuery({
    queryKey: queryKeys.configPresets,
    queryFn: () => api.getGatewayConfigPresets(),
  })
}

export function usePatchGatewayConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      api.patchGatewayConfig(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useApplyGatewayConfigPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (presetId: string) => api.applyGatewayConfigPreset(presetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
    },
  })
}

export function useSubscriptionGateways(params: {
  enterprise_id: string
  department_id?: string
  agent_id?: string
  service?: string
}) {
  return useQuery({
    queryKey: ["subscription-gateways", params],
    queryFn: () => api.getSubscriptionGateways(params.enterprise_id),
    enabled: !!params.enterprise_id,
  })
}
