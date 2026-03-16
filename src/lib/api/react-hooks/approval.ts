"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useApprovals(params?: {
  status?: string
  enterprise_id?: string
  type?: string
  requesting_agent_id?: string
}) {
  return useQuery({
    queryKey: queryKeys.approvals(params),
    queryFn: () => api.getApprovals(params),
    staleTime: 30000,
  })
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approval(id),
    queryFn: () => api.getApproval(id),
    enabled: !!id,
  })
}

export function useApprovalStats(enterpriseId?: string) {
  return useQuery({
    queryKey: queryKeys.approvalStats(enterpriseId),
    queryFn: () => api.getApprovalStats(enterpriseId),
    staleTime: 30000,
  })
}

export function useApproveApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      api.approveApproval(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
    },
  })
}

export function useRejectApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectApproval(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
    },
  })
}

export function useEscalateApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.escalateApproval(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
    },
  })
}
