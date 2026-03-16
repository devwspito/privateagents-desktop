"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useDepartmentProjects(departmentId: string) {
  return useQuery({
    queryKey: queryKeys.departmentProjects(departmentId),
    queryFn: () => api.getDepartmentProjects(departmentId),
    enabled: !!departmentId,
    staleTime: 30000,
  })
}

export function useCreateDepartmentProject(departmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createDepartmentProject>[1]) =>
      api.createDepartmentProject(departmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentProjects(departmentId),
      })
    },
  })
}

export function useUpdateDepartmentProject(departmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: Parameters<typeof api.updateDepartmentProject>[2]
    }) => api.updateDepartmentProject(departmentId, projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentProjects(departmentId),
      })
    },
  })
}

export function useDeleteDepartmentProject(departmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      api.deleteDepartmentProject(departmentId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentProjects(departmentId),
      })
    },
  })
}

export function useAssignProjectAgents(departmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      agentIds,
    }: {
      projectId: string
      agentIds: string[]
    }) => api.assignProjectAgents(departmentId, projectId, agentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentProjects(departmentId),
      })
    },
  })
}

export function useProjectResourceConfig(departmentId: string) {
  return useQuery({
    queryKey: [...queryKeys.departmentProjects(departmentId), "resource-config"],
    queryFn: () => api.getProjectResourceConfig(departmentId),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBrowseResources(
  departmentId: string,
  app: string,
  resourceType: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      ...queryKeys.departmentProjects(departmentId),
      "browse",
      app,
      resourceType,
    ],
    queryFn: () =>
      api.browseProjectResources(departmentId, {
        app,
        resource_type: resourceType,
      }),
    enabled: enabled && !!departmentId && !!app,
    staleTime: 60000,
  })
}

export function useRecommendedIntegrations(departmentId: string) {
  return useQuery({
    queryKey: [...queryKeys.departmentProjects(departmentId), "recommended-integrations"],
    queryFn: () => api.getRecommendedIntegrations(departmentId),
    enabled: !!departmentId,
    staleTime: 2 * 60 * 1000,
  })
}
