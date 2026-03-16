"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CreateDepartmentRequest,
  Department,
  DepartmentHumanLoopConfig,
  DepartmentToolsUpdate,
} from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useDepartments(enterpriseId?: string) {
  return useQuery({
    queryKey: queryKeys.departments(enterpriseId),
    queryFn: () => api.getDepartments(enterpriseId),
  })
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.department(id),
    queryFn: () => api.getDepartment(id),
    enabled: !!id,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) => api.createDepartment(data),
    onSuccess: (_, { enterprise_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments(enterprise_id),
      })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      api.updateDepartment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.department(id) })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
    },
  })
}

export function useDepartmentHumanLoopConfig(departmentId: string) {
  return useQuery({
    queryKey: queryKeys.departmentHumanLoopConfig(departmentId),
    queryFn: () => api.getDepartmentHumanLoopConfig(departmentId),
    enabled: !!departmentId,
  })
}

export function useUpdateDepartmentHumanLoopConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      data,
    }: {
      departmentId: string
      data: Partial<DepartmentHumanLoopConfig>
    }) => api.updateDepartmentHumanLoopConfig(departmentId, data),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentHumanLoopConfig(departmentId),
      })
    },
  })
}

export function useDepartmentTools(departmentId: string) {
  return useQuery({
    queryKey: queryKeys.departmentTools(departmentId),
    queryFn: () => api.getDepartmentTools(departmentId),
    enabled: !!departmentId,
  })
}

export function useUpdateDepartmentTools() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      data,
    }: {
      departmentId: string
      data: DepartmentToolsUpdate
    }) => api.updateDepartmentTools(departmentId, data.tools, data.reasoning_tools),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departmentTools(departmentId),
      })
    },
  })
}

export function useDepartmentMembers(departmentId: string) {
  return useQuery({
    queryKey: ["departments", departmentId, "members"],
    queryFn: () => api.getDepartmentMembers(departmentId),
    enabled: !!departmentId,
  })
}

export function useAddDepartmentMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      userIds,
    }: {
      departmentId: string
      userIds: string[]
    }) => api.addDepartmentMembers(departmentId, userIds),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "members"],
      })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useRemoveDepartmentMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      userId,
    }: {
      departmentId: string
      userId: string
    }) => api.removeDepartmentMember(departmentId, userId),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "members"],
      })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useSetDepartmentHead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      userId,
    }: {
      departmentId: string
      userId: string
    }) => api.setDepartmentHead(departmentId, userId),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "members"],
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.department(departmentId),
      })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
    },
  })
}
