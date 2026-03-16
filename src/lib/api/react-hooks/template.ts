"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ApplyTemplateResponse } from "../client/types"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useTemplates(params?: { sector?: string }) {
  return useQuery({
    queryKey: queryKeys.templates(params),
    queryFn: () => api.listTemplates(params),
  })
}

export function useTemplateSectors() {
  return useQuery({
    queryKey: queryKeys.templateSectors(),
    queryFn: () => api.listSectors(),
  })
}

export function useApplyTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string
      data: { enterprise_id: string; variables: Record<string, string> }
    }): Promise<ApplyTemplateResponse> => api.applyTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })
}
