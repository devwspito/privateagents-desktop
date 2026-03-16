"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useSupportTickets(params?: {
  status?: string
  priority?: string
}) {
  return useQuery({
    queryKey: queryKeys.supportTickets(params),
    queryFn: () => api.listSupportTickets(params),
    staleTime: 30000,
  })
}

export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.supportTicket(ticketId),
    queryFn: () => api.getSupportTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 30000,
  })
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createSupportTicket.bind(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] })
    },
  })
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string
      data: Parameters<typeof api.updateSupportTicket>[1]
    }) => api.updateSupportTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] })
    },
  })
}
