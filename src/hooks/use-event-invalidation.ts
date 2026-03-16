"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useShallow } from "zustand/react/shallow"

import { useEventStore } from "@/lib/stores/event-store"

/**
 * Centralized SSE → React Query invalidation.
 *
 * Mount once at the dashboard layout level (next to useUnifiedEvents).
 * When the event-store version counters change, the corresponding
 * React Query caches are invalidated — replacing polling entirely.
 */
export function useEventInvalidation() {
  const queryClient = useQueryClient()

  const {
    sidebarVersion,
    threadsVersion,
    historyVersion,
    approvalsVersion,
    tasksVersion,
    workflowsVersion,
    customToolsVersion,
    clarificationsVersion,
  } = useEventStore(
    useShallow((s) => ({
      sidebarVersion: s.sidebarVersion,
      threadsVersion: s.threadsVersion,
      historyVersion: s.historyVersion,
      approvalsVersion: s.approvalsVersion,
      tasksVersion: s.tasksVersion,
      workflowsVersion: s.workflowsVersion,
      customToolsVersion: s.customToolsVersion,
      clarificationsVersion: s.clarificationsVersion,
    }))
  )

  // Chat-related invalidation
  useEffect(() => {
    if (sidebarVersion > 0)
      queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
  }, [sidebarVersion, queryClient])

  useEffect(() => {
    if (threadsVersion > 0)
      queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
  }, [threadsVersion, queryClient])

  useEffect(() => {
    if (historyVersion > 0)
      queryClient.invalidateQueries({ queryKey: ["chat", "history"] })
  }, [historyVersion, queryClient])

  // Data-change invalidation
  useEffect(() => {
    if (approvalsVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      queryClient.invalidateQueries({ queryKey: ["approval-stats"] })
    }
  }, [approvalsVersion, queryClient])

  useEffect(() => {
    if (tasksVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    }
  }, [tasksVersion, queryClient])

  useEffect(() => {
    if (workflowsVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ["workflows"] })
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] })
    }
  }, [workflowsVersion, queryClient])

  useEffect(() => {
    if (customToolsVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ["custom-tool-requests"] })
      queryClient.invalidateQueries({ queryKey: ["custom-tools"] })
    }
  }, [customToolsVersion, queryClient])

  useEffect(() => {
    if (clarificationsVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ["clarifications"] })
      queryClient.invalidateQueries({ queryKey: ["pending-clarifications"] })
    }
  }, [clarificationsVersion, queryClient])
}
