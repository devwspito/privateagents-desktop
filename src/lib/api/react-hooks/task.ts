"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateTaskRequest } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useTasks(params?: {
  enterprise_id?: string
  agent_id?: string
}) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.getTasks(params),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useTaskStats(enterpriseId?: string) {
  return useQuery({
    queryKey: ["tasks", "stats", { enterpriseId }],
    queryFn: () => api.getTaskStats(enterpriseId),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.getTask(id),
    enabled: !!id,
  })
}
