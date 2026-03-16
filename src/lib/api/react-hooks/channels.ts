"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ChannelInstanceUpdate, RoutingRule } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useChannelsStatus() {
  return useQuery({
    queryKey: queryKeys.channelsStatus,
    queryFn: () => api.getChannelsStatus(),
    staleTime: 60000,
  })
}

export function useAvailableChannels() {
  return useQuery({
    queryKey: queryKeys.availableChannels,
    queryFn: () => api.getAvailableChannels(),
  })
}

export function useSendChannelMessage() {
  return useMutation({
    mutationFn: (data: {
      channel: string
      to: string
      text: string
      thread_id?: string
    }) => api.sendChannelMessage({
      channel: data.channel,
      recipient: data.to,
      message: data.text,
    }),
  })
}

export function useConnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      channel,
      config,
    }: {
      channel: string
      config: Record<string, unknown>
    }) => api.connectChannel(channel, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })
}

export function useDisconnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) => api.disconnectChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })
}

export function useChannelQR(channelId: string) {
  return useQuery({
    queryKey: queryKeys.channelQR(channelId),
    queryFn: () => api.getChannelQR(channelId),
    enabled: !!channelId,
    refetchInterval: 20000, // QR codes expire — must refresh while user waits to scan
  })
}

export function useRoutingRules() {
  return useQuery({
    queryKey: queryKeys.routingRules,
    queryFn: () => api.getRoutingRules(),
  })
}

export function useUpdateRoutingRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rules: RoutingRule[]) => api.updateRoutingRules(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routingRules })
    },
  })
}

export function useChannelInstances(params?: {
  platform?: string
  status?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.channelInstances(params),
    queryFn: () => api.getChannelInstances(params as { enterprise_id?: string; channel?: string } | undefined),
  })
}

export function useChannelInstance(instanceId: string) {
  return useQuery({
    queryKey: queryKeys.channelInstance(instanceId),
    queryFn: () => api.getChannelInstance(instanceId),
    enabled: !!instanceId,
  })
}

export function useUpdateChannelInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      instanceId,
      data,
    }: {
      instanceId: string
      data: ChannelInstanceUpdate
    }) => api.updateChannelInstance(instanceId, data),
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.channelInstance(instanceId),
      })
      queryClient.invalidateQueries({ queryKey: ["channels", "instances"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelsStatus })
    },
  })
}

export function useReconnectChannelInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) =>
      api.reconnectChannelInstance(instanceId),
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.channelInstance(instanceId),
      })
      queryClient.invalidateQueries({ queryKey: ["channels", "instances"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelsStatus })
    },
  })
}

export function useDeleteChannelInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) => api.deleteChannelInstance(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", "instances"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelsStatus })
    },
  })
}
