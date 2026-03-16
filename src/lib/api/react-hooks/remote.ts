"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"

export function useRemoteTunnelInfo() {
  return useQuery({
    queryKey: ["desktop", "remote-info"],
    queryFn: () => api.getRemoteTunnelInfo(),
  })
}

export function useRegenerateRemoteTunnel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.regenerateRemoteTunnel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desktop", "remote-info"] })
    },
  })
}
