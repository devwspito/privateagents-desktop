"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateEnterpriseRequest, Enterprise } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useEnterprises(params?: { status?: string; tier?: string }) {
  return useQuery({
    queryKey: queryKeys.enterprises,
    queryFn: () => api.getEnterprises(params),
  })
}

export function useEnterprise(id: string) {
  return useQuery({
    queryKey: queryKeys.enterprise(id),
    queryFn: () => api.getEnterprise(id),
    enabled: !!id,
  })
}

export function useCreateEnterprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEnterpriseRequest) => api.createEnterprise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enterprises })
    },
  })
}

export function useUpdateEnterprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Enterprise> }) =>
      api.updateEnterprise(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enterprise(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.enterprises })
    },
  })
}
