"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useCronJobs() {
  return useQuery({
    queryKey: queryKeys.cronJobs,
    queryFn: () => api.getCronJobs(),
    staleTime: 60000,
  })
}

export function useCreateCronJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      schedule: string
      command: string
      agent_id?: string
      enabled?: boolean
    }) => api.createCronJob({
      name: data.name,
      schedule: data.schedule,
      task_type: data.command,
      agent_id: data.agent_id ?? "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cronJobs })
    },
  })
}

export function useUpdateCronJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string
      data: { schedule?: string; command?: string; enabled?: boolean }
    }) => api.updateCronJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cronJobs })
    },
  })
}

export function useDeleteCronJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => api.deleteCronJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cronJobs })
    },
  })
}

export function useCronJobRuns(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.cronJobRuns(jobId ?? ""),
    queryFn: () => api.getCronJobRuns(jobId!),
    enabled: !!jobId,
  })
}

export function useRunCronJob() {
  return useMutation({
    mutationFn: (jobId: string) => api.runCronJob(jobId),
  })
}

export function useToggleCronJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => api.toggleCronJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cronJobs })
    },
  })
}

export function useCronTemplates() {
  return useQuery({
    queryKey: queryKeys.cronTemplates,
    queryFn: () => api.getCronTemplates(),
  })
}
