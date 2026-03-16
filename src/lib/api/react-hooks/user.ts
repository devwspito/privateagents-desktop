"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateUserRequest, User } from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useUsers(params?: { enterprise_id?: string; role?: string }) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => api.getUsers(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.getUser(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      api.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      api.updateUserPermissions(id, permissions),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
