"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useSessions(params?: {
  limit?: number
  agent_id?: string
  label?: string
}) {
  return useQuery({
    queryKey: queryKeys.sessions(params),
    queryFn: () => api.getSessions(params),
    staleTime: 30000,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { agent_id: string; label?: string; model?: string }) =>
      api.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

export function usePatchSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionKey,
      data,
    }: {
      sessionKey: string
      data: { label?: string; model?: string }
    }) => api.patchSession(sessionKey, { title: data.label, metadata: data.model ? { model: data.model } : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
    },
  })
}

export function useResetSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionKey,
      reason,
    }: {
      sessionKey: string
      reason?: string
    }) => api.resetSession(sessionKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
      queryClient.invalidateQueries({ queryKey: ["chat", "history"] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionKey,
      deleteTranscript,
    }: {
      sessionKey: string
      deleteTranscript?: boolean
    }) => api.deleteSession(sessionKey, deleteTranscript),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
      queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
    },
  })
}

export function useSessionUsage(sessionKey: string) {
  return useQuery({
    queryKey: queryKeys.sessionUsage(sessionKey),
    queryFn: () => api.getSessionUsage(sessionKey),
    enabled: !!sessionKey,
  })
}
