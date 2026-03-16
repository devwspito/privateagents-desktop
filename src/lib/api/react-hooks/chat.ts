"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"
import { useEventStore } from "@/lib/stores/event-store"

export function useChatHistory(sessionKey: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.chatHistory(sessionKey),
    queryFn: () => api.getChatHistory(sessionKey, limit),
    enabled: !!sessionKey,
    staleTime: 30000,
    // SSE-invalidated via useEventInvalidation — no polling needed
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      message: string
      session_key?: string
      agent_id?: string
    }) => api.sendChatMessage(data as { session_key: string; message: string; stream?: boolean }),
    onSuccess: (response) => {
      const res = response as { session_key: string }
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(res.session_key),
      })
    },
  })
}

export function useClearConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionKey: string) => api.deleteConversation(sessionKey, true),
    onSuccess: (_, sessionKey) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(sessionKey),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.unifiedSidebar })
    },
  })
}

export function useAbortChat() {
  return useMutation({
    mutationFn: (sessionKey: string) => api.abortChat(sessionKey),
  })
}

export function useConversations(params?: {
  user_id?: string
  agent_id?: string
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.conversations(params),
    queryFn: () => api.getConversations(params),
    staleTime: 30000,
    // SSE-invalidated via useEventInvalidation — no polling needed
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      label,
      initialMessage: _initialMessage,
    }: {
      agentId: string
      label?: string
      initialMessage?: string
    }) => api.startConversation(agentId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() })
    },
  })
}

export function useApproveChatAction() {
  return useMutation({
    mutationFn: (data: {
      approval_id: string
      approved: boolean
      session_key?: string
      comments?: string
    }) => api.approveChatAction({
      session_key: data.session_key ?? "",
      action_id: data.approval_id,
      approved: data.approved,
      comments: data.comments,
    }),
  })
}

export function useAvailableAgentsForChat(departmentId?: string) {
  return useQuery({
    queryKey: queryKeys.chatAgents(departmentId),
    queryFn: () => api.getAvailableAgentsForChat(departmentId),
  })
}

export function useUnifiedSidebar() {
  const sseError = useEventStore((s) => s.sseError)
  return useQuery({
    queryKey: queryKeys.unifiedSidebar,
    queryFn: () => api.getUnifiedSidebar(),
    staleTime: 30000,
    refetchOnWindowFocus: true, // Recover from idle/background
    // Poll every 30s as fallback when SSE is down
    refetchInterval: sseError ? 30_000 : false,
  })
}

export function useThreads(agentId?: string) {
  return useQuery({
    queryKey: queryKeys.threads(agentId),
    queryFn: () => api.getThreads(agentId),
    staleTime: 30000,
    // SSE-invalidated via useEventInvalidation — no polling needed
  })
}

export function useAgentSessions(agentId: string | undefined, currentSessionKey?: string) {
  return useQuery({
    queryKey: queryKeys.agentSessions(agentId || ""),
    queryFn: () => api.getAgentSessions(agentId!, currentSessionKey),
    enabled: !!agentId,
    staleTime: 30000,
    // SSE-invalidated via useEventInvalidation — no polling needed
  })
}

