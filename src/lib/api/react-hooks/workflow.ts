"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"
import type {
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  StartWorkflowRunRequest,
  CatalogActivateRequest,
} from "../client"

// Templates

export function useWorkflowTemplates(params?: {
  enterprise_id?: string
  enabled?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.workflowTemplates(params),
    queryFn: () => api.listWorkflowTemplates(params),
  })
}

export function useWorkflowTemplate(templateId: string | null) {
  return useQuery({
    queryKey: queryKeys.workflowTemplate(templateId ?? ""),
    queryFn: () => api.getWorkflowTemplate(templateId!),
    enabled: !!templateId,
  })
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWorkflowTemplateRequest) =>
      api.createWorkflowTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-templates"],
      })
    },
  })
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string
      data: UpdateWorkflowTemplateRequest
    }) => api.updateWorkflowTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-templates"],
      })
    },
  })
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) =>
      api.deleteWorkflowTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-templates"],
      })
    },
  })
}

// Runs

export function useWorkflowRuns(params?: {
  enterprise_id?: string
  template_id?: string
  status?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.workflowRuns(params),
    queryFn: () => api.listWorkflowRuns(params),
    staleTime: 30000,
  })
}

export function useWorkflowRun(runId: string | null) {
  return useQuery({
    queryKey: queryKeys.workflowRun(runId ?? ""),
    queryFn: () => api.getWorkflowRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "running" || status === "pending") return 3000
      return false
    },
  })
}

export function useStartWorkflowRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StartWorkflowRunRequest) =>
      api.startWorkflowRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] })
    },
  })
}

export function useResumeWorkflowRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      runId,
      approvalContext,
    }: {
      runId: string
      approvalContext?: Record<string, unknown>
    }) => api.resumeWorkflowRun(runId, approvalContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] })
    },
  })
}

// Catalog

export function useWorkflowCatalog(params?: {
  department_template_id?: string
  category?: string
  q?: string
}) {
  return useQuery({
    queryKey: queryKeys.workflowCatalog(params),
    queryFn: () => api.listCatalog(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCheckCatalogReadiness() {
  return useMutation({
    mutationFn: ({
      catalogId,
      enterprise_id,
      department_id,
    }: {
      catalogId: string
      enterprise_id: string
      department_id: string
    }) => api.checkCatalogReadiness(catalogId, { enterprise_id, department_id }),
  })
}

export function useActivateCatalogWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      catalogId,
      data,
    }: {
      catalogId: string
      data: CatalogActivateRequest
    }) => api.activateCatalogWorkflow(catalogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] })
    },
  })
}
