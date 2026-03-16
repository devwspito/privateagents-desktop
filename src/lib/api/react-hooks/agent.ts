"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  Agent,
  AgentHumanLoopConfig,
  CreateAgentRequest,
  MemoryConfig,
  SyncSoulRequest,
} from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useMyAgent() {
  return useQuery({
    queryKey: queryKeys.myAgent(),
    queryFn: () => api.getMyAgent(),
  })
}

export function useAgentMemoryConfig(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agentMemoryConfig(agentId),
    queryFn: () => api.getAgentMemoryConfig(agentId),
    enabled: !!agentId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateAgentMemoryConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string
      data: Partial<MemoryConfig>
    }) => api.updateAgentMemoryConfig(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentMemoryConfig(agentId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agentId) })
    },
  })
}

export function usePreviewAgentMemory() {
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string
      data: { query: string; sender_id?: string }
    }) => api.previewAgentMemory(agentId, data.query),
  })
}

// -- OpenClaw Native Memory (Sessions) --

export function useAgentMemoryEntries(
  agentId: string,
  params?: { offset?: number; limit?: number }
) {
  return useQuery({
    queryKey: [...queryKeys.agentMemoryEntries(agentId), params],
    queryFn: () => api.getAgentMemoryEntries(agentId, params),
    enabled: !!agentId,
    staleTime: 30_000,
  })
}

export function useDeleteAgentMemoryEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      sessionKey,
    }: {
      agentId: string
      sessionKey: string
    }) => api.deleteAgentMemoryEntry(agentId, sessionKey),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentMemoryEntries(agentId),
      })
    },
  })
}

export function useClearAgentMemoryEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agentId: string) => api.clearAgentMemoryEntries(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentMemoryEntries(agentId),
      })
    },
  })
}

export function useAgents(params?: {
  enterprise_id?: string
  department_id?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.agents(params),
    queryFn: () => api.getAgents(params),
    enabled: params?.enabled !== false,
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => api.getAgent(id),
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAgentRequest) => api.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      api.updateAgent(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["agents"] })
      type AgentsData = { items?: Agent[] }
      const snapshots: [readonly unknown[], AgentsData][] = []
      queryClient.getQueriesData<AgentsData>({ queryKey: ["agents"] }).forEach(([key, old]) => {
        if (old?.items) {
          snapshots.push([key, old])
          queryClient.setQueryData<AgentsData>(key, {
            ...old,
            items: old.items.map((a: Agent) =>
              a.id === id ? { ...a, ...data } : a
            ),
          })
        }
      })
      return { snapshots }
    },
    onError: (_, __, ctx) => {
      ctx?.snapshots?.forEach(([key, old]) => queryClient.setQueryData(key, old as never))
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(id) })
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })
}

export function useLinkAgentToUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      api.linkAgentToUser(agentId, userId),
    onSettled: (_, __, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agentId) })
      queryClient.invalidateQueries({ queryKey: ["agents"] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentsByUser(userId),
      })
    },
  })
}

export function useUnlinkAgentFromUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      userId: _userId,
    }: {
      agentId: string
      userId?: string
    }) => api.unlinkAgentFromUser(agentId),
    onSettled: (_, __, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agentId) })
      queryClient.invalidateQueries({ queryKey: ["agents"] })
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.agentsByUser(userId),
        })
      }
    },
  })
}

export function useAgentsByUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.agentsByUser(userId),
    queryFn: () => api.getAgentsByUser(userId),
    enabled: !!userId,
  })
}

export function useAgentSoul(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agentSoul(agentId),
    queryFn: () => api.getAgentSoul(agentId),
    enabled: !!agentId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useSyncAgentSoul() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string
      data: SyncSoulRequest
    }) => api.syncAgentSoul(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentSoul(agentId) })
    },
  })
}

export function useUpdateAgentSoul() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string
      data: { cached_content: string }
    }) => api.updateAgentSoul(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentSoul(agentId) })
    },
  })
}

export function useAgentHumanLoopConfig(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agentHumanLoopConfig(agentId),
    queryFn: () => api.getAgentHumanLoopConfig(agentId),
    enabled: !!agentId,
  })
}

export function useUpdateAgentHumanLoopConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string
      data: Partial<AgentHumanLoopConfig>
    }) => api.updateAgentHumanLoopConfig(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentHumanLoopConfig(agentId),
      })
    },
  })
}
