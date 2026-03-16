"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { InvitationRequest } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations,
    queryFn: () => api.listInvitations(),
  })
}

export function useInvitationInfo(token: string | null) {
  return useQuery({
    queryKey: queryKeys.invitationInfo(token || ""),
    queryFn: () => api.getInvitationInfo(token!),
    enabled: !!token,
    retry: false,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InvitationRequest) => api.createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => api.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations })
    },
  })
}
