"use client"

import { useQuery } from "@tanstack/react-query"

import api from "../client"

export function useAppDetails(appKey: string | null) {
  return useQuery({
    queryKey: ["integrations", "app-details", appKey],
    queryFn: () => api.getAppDetails(appKey!),
    enabled: !!appKey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useEffectiveConnections(agentId: string | null, enterpriseId: string | null) {
  return useQuery({
    queryKey: ["integrations", "effective", agentId],
    queryFn: () => api.getEffectiveConnections(agentId!, enterpriseId!),
    enabled: !!agentId && !!enterpriseId,
    staleTime: 2 * 60 * 1000,
  })
}
