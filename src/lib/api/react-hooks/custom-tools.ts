"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

// Tool Requests
export function useCustomToolRequests(params?: {
  enterprise_id?: string
  status?: string
}) {
  return useQuery({
    queryKey: queryKeys.customToolRequests(params),
    queryFn: () => api.listCustomToolRequests(params),
    staleTime: 30000,
  })
}

export function useCustomToolRequest(requestId: string) {
  return useQuery({
    queryKey: queryKeys.customToolRequest(requestId),
    queryFn: () => api.getCustomToolRequest(requestId),
    enabled: !!requestId,
    staleTime: 30000,
  })
}

export function useCreateCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createCustomToolRequest.bind(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useUpdateCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string
      data: Parameters<typeof api.updateCustomToolRequest>[1]
    }) => api.updateCustomToolRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useApproveCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string
      data: Parameters<typeof api.approveCustomToolRequest>[1]
    }) => api.approveCustomToolRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
      queryClient.invalidateQueries({ queryKey: ["custom-tools"] })
    },
  })
}

export function useRejectCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      feedback,
    }: {
      requestId: string
      feedback: string
    }) => api.rejectCustomToolRequest(requestId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useAdvanceCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => api.advanceCustomToolRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useRetryCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => api.retryCustomToolRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useTestCustomToolRequest() {
  return useMutation({
    mutationFn: ({
      requestId,
      params,
      mode,
    }: {
      requestId: string
      params: Record<string, unknown>
      mode?: "manual" | "predefined"
    }) => api.testCustomToolRequest(requestId, { params, mode }),
  })
}

export function useToolInfo(requestId: string) {
  return useQuery({
    queryKey: ["tool-info", requestId],
    queryFn: () => api.getToolInfo(requestId),
    enabled: !!requestId,
    staleTime: 60000,
  })
}

export function useRequestDepartmentAgents(requestId: string) {
  return useQuery({
    queryKey: ["request-department-agents", requestId],
    queryFn: () => api.getRequestDepartmentAgents(requestId),
    enabled: !!requestId,
  })
}

// Custom Tools (approved)
export function useCustomTools(params?: {
  enterprise_id?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.customTools(params),
    queryFn: () => api.listCustomTools(params),
    staleTime: 30000,
  })
}

export function useCustomTool(toolId: string) {
  return useQuery({
    queryKey: queryKeys.customTool(toolId),
    queryFn: () => api.getCustomTool(toolId),
    enabled: !!toolId,
  })
}

export function useUpdateCustomTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      toolId,
      data,
    }: {
      toolId: string
      data: Parameters<typeof api.updateCustomTool>[1]
    }) => api.updateCustomTool(toolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tools"] })
    },
  })
}

export function useDeleteCustomTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => api.deleteCustomTool(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tools"] })
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
    },
  })
}

export function useDeleteCustomToolRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => api.deleteCustomToolRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
      queryClient.invalidateQueries({ queryKey: ["custom-tools"] })
    },
  })
}
