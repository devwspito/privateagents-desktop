"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  DataLabProjectCreate,
  DataLabProjectUpdate,
  EntryReviewRequest,
} from "../client/datalab"

import api from "../client"
import { queryKeys } from "./query-keys"

// --- Projects ---

export function useDataLabProjects(enterpriseId: string) {
  return useQuery({
    queryKey: queryKeys.datalabProjects(enterpriseId),
    queryFn: () => api.getDataLabProjects(enterpriseId),
    enabled: !!enterpriseId,
  })
}

export function useDataLabProject(
  enterpriseId: string,
  projectId: string
) {
  return useQuery({
    queryKey: queryKeys.datalabProject(projectId),
    queryFn: () => api.getDataLabProject(enterpriseId, projectId),
    enabled: !!enterpriseId && !!projectId,
  })
}

export function useDataLabProjectPreview(
  enterpriseId: string,
  projectId: string
) {
  return useQuery({
    queryKey: queryKeys.datalabProjectPreview(projectId),
    queryFn: () => api.previewDataLabProject(enterpriseId, projectId),
    enabled: !!enterpriseId && !!projectId,
  })
}

export function useCreateDataLabProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: DataLabProjectCreate
    }) => api.createDataLabProject(enterpriseId, data),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjects(enterpriseId),
      })
    },
  })
}

export function useUpdateDataLabProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      projectId,
      data,
    }: {
      enterpriseId: string
      projectId: string
      data: DataLabProjectUpdate
    }) => api.updateDataLabProject(enterpriseId, projectId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjects(result.enterprise_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProject(result.id),
      })
    },
  })
}

export function useDeleteDataLabProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      projectId,
    }: {
      enterpriseId: string
      projectId: string
    }) => api.deleteDataLabProject(enterpriseId, projectId),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjects(enterpriseId),
      })
    },
  })
}

// --- Document Upload ---

export function useUploadFileToProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      projectId,
      file,
      title,
    }: {
      enterpriseId: string
      projectId: string
      file: File
      title?: string
    }) => api.uploadFileToProject(enterpriseId, projectId, file, title),
    onSuccess: (_, { enterpriseId, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjects(enterpriseId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjectPreview(projectId),
      })
    },
  })
}

// --- Dataset Building & Entries ---

export function useBuildDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      projectId,
    }: {
      enterpriseId: string
      projectId: string
    }) => api.buildDataset(enterpriseId, projectId),
    onSuccess: (_, { enterpriseId, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProjects(enterpriseId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabEntries(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabStats(projectId),
      })
    },
  })
}

export function useDataLabEntries(
  enterpriseId: string,
  projectId: string,
  params?: {
    offset?: number
    limit?: number
    min_quality?: number
    reviewed?: boolean
    approved?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKeys.datalabEntries(projectId), params],
    queryFn: () => api.getDataLabEntries(enterpriseId, projectId, params),
    enabled: !!enterpriseId && !!projectId,
  })
}

export function useDataLabStats(enterpriseId: string, projectId: string) {
  return useQuery({
    queryKey: queryKeys.datalabStats(projectId),
    queryFn: () => api.getDataLabStats(enterpriseId, projectId),
    enabled: !!enterpriseId && !!projectId,
  })
}

export function useReviewDataLabEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      entryId,
      data,
    }: {
      enterpriseId: string
      entryId: string
      projectId: string
      data: EntryReviewRequest
    }) => api.reviewDataLabEntry(enterpriseId, entryId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabEntries(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabStats(projectId),
      })
    },
  })
}

export function useDeleteDataLabEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      entryId,
    }: {
      enterpriseId: string
      entryId: string
      projectId: string
    }) => api.deleteDataLabEntry(enterpriseId, entryId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabEntries(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabStats(projectId),
      })
    },
  })
}

// --- MCP Server ---

export function useBuildMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      projectId,
    }: {
      enterpriseId: string
      projectId: string
    }) => api.buildMCPServer(enterpriseId, projectId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployments(result.enterprise_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabProject(result.project_id),
      })
    },
  })
}

export function useDeployMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      deploymentId,
    }: {
      enterpriseId: string
      deploymentId: string
    }) => api.deployMCPServer(enterpriseId, deploymentId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployments(result.enterprise_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployment(result.id),
      })
    },
  })
}

export function useStopMCPServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      deploymentId,
    }: {
      enterpriseId: string
      deploymentId: string
    }) => api.stopMCPServer(enterpriseId, deploymentId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployments(result.enterprise_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployment(result.id),
      })
    },
  })
}

export function useBindMCPToAgents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      deploymentId,
      agentIds,
    }: {
      enterpriseId: string
      deploymentId: string
      agentIds: string[]
    }) => api.bindMCPToAgents(enterpriseId, deploymentId, agentIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployment(result.id),
      })
    },
  })
}

export function useUnbindMCPFromAgents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      deploymentId,
      agentIds,
    }: {
      enterpriseId: string
      deploymentId: string
      agentIds: string[]
    }) => api.unbindMCPFromAgents(enterpriseId, deploymentId, agentIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datalabDeployment(result.id),
      })
    },
  })
}

// --- Deployments ---

export function useDataLabDeployments(
  enterpriseId: string,
  projectId?: string
) {
  return useQuery({
    queryKey: queryKeys.datalabDeployments(enterpriseId),
    queryFn: () => api.getDataLabDeployments(enterpriseId, projectId),
    enabled: !!enterpriseId,
  })
}

export function useDataLabDeployment(
  enterpriseId: string,
  deploymentId: string
) {
  return useQuery({
    queryKey: queryKeys.datalabDeployment(deploymentId),
    queryFn: () => api.getDataLabDeployment(enterpriseId, deploymentId),
    enabled: !!enterpriseId && !!deploymentId,
  })
}
