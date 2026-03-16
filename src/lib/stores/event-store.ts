/**
 * Zustand store for the unified event bus.
 *
 * Consumed by:
 * - Office: `useEventStore.getState()` (imperative, 0 re-renders, 60fps game loop)
 * - Chat:   `useEventStore(selector)` (reactive, triggers query invalidation)
 */

import { create } from "zustand"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnifiedSSEEvent {
  category: "activity" | "a2a" | "chat" | "orchestration" | "data"
  type: string
  agent_id: string | null
  target_agent_id: string | null
  data: Record<string, unknown>
  ts: number
}

export interface AgentActivity {
  agentId: string
  type: "thinking" | "tool_call" | "responding" | "error"
  toolName?: string
  preview?: string
  updatedAt: number
}

export interface A2AInteraction {
  fromAgentId: string
  toAgentId: string
  status: "active" | "completed"
  startedAt: number
  completedAt?: number
}

// Stale thresholds (client-side safety net)
const STALE_ACTIVITY_MS = 5 * 60 * 1000   // 5 minutes
const STALE_A2A_MS = 10 * 60 * 1000       // 10 minutes

interface EventStoreState {
  /** Agent activity map: agentId → latest activity (no idle entries) */
  activities: Map<string, AgentActivity>

  /** Active A2A interactions: "from:to" → interaction */
  a2aInteractions: Map<string, A2AInteraction>

  /** Version counters — increment to trigger React Query invalidation */
  sidebarVersion: number
  threadsVersion: number
  historyVersion: number
  approvalsVersion: number
  tasksVersion: number
  workflowsVersion: number
  customToolsVersion: number
  clarificationsVersion: number

  /** SSE connection error (null = connected OK) */
  sseError: string | null

  /** Process a raw SSE event into store state */
  processEvent: (event: UnifiedSSEEvent) => void

  /** Set SSE connection error state */
  setSseError: (error: string | null) => void

  /** Remove stale activities/A2A interactions (client-side safety net) */
  sweepStale: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEventStore = create<EventStoreState>((set, get) => ({
  activities: new Map(),
  a2aInteractions: new Map(),
  sidebarVersion: 0,
  threadsVersion: 0,
  historyVersion: 0,
  approvalsVersion: 0,
  tasksVersion: 0,
  workflowsVersion: 0,
  customToolsVersion: 0,
  clarificationsVersion: 0,
  sseError: null,
  setSseError: (error) => set({ sseError: error }),

  sweepStale: () => {
    const state = get()
    const now = Date.now()
    let changed = false

    // Sweep stale activities (>5 min without update)
    const newActivities = new Map(state.activities)
    for (const [agentId, act] of newActivities) {
      if (now - act.updatedAt > STALE_ACTIVITY_MS) {
        newActivities.delete(agentId)
        changed = true
      }
    }

    // Sweep stale A2A interactions (>10 min active)
    const newA2A = new Map(state.a2aInteractions)
    for (const [key, interaction] of newA2A) {
      if (interaction.status === "active" && now - interaction.startedAt > STALE_A2A_MS) {
        newA2A.delete(key)
        changed = true
      }
    }

    if (changed) {
      set({ activities: newActivities, a2aInteractions: newA2A })
    }
  },

  processEvent: (event) => {
    const state = get()

    // --- A2A snapshot (sent on SSE connect to restore state after refresh) ---
    if (event.type === "a2a_snapshot" && event.data?.interactions) {
      const newA2A = new Map(state.a2aInteractions)
      for (const interaction of event.data.interactions as Array<{ from: string; to: string; ts: number }>) {
        const key = `${interaction.from}:${interaction.to}`
        if (!newA2A.has(key)) {
          newA2A.set(key, {
            fromAgentId: interaction.from,
            toAgentId: interaction.to,
            status: "active",
            startedAt: interaction.ts * 1000,
          })
        }
      }
      set({ a2aInteractions: newA2A })
      return
    }

    // --- Activity snapshot (restore agent running states after refresh) ---
    // Replaces all activities with the server snapshot (source of truth)
    if (event.type === "activity_snapshot" && event.data?.activities) {
      const newActivities = new Map<string, AgentActivity>()
      for (const activity of event.data.activities as Array<{ agent_id: string; type: string; tool_name?: string; ts: number }>) {
        newActivities.set(activity.agent_id, {
          agentId: activity.agent_id,
          type: activity.type as AgentActivity["type"],
          toolName: activity.tool_name,
          updatedAt: activity.ts * 1000,
        })
      }
      set({ activities: newActivities })
      return
    }

    // --- Activity events ---
    if (event.category === "activity" || event.category === "a2a") {
      if (event.agent_id) {
        const newActivities = new Map(state.activities)

        if (event.type === "idle") {
          newActivities.delete(event.agent_id)
        } else {
          // Detect errors from event data
          const activityType: AgentActivity["type"] = event.data["error"]
            ? "error"
            : (event.type as AgentActivity["type"])
          newActivities.set(event.agent_id, {
            agentId: event.agent_id,
            type: activityType,
            toolName: (event.data.tool_name as string) || undefined,
            preview: (event.data.preview as string) || undefined,
            updatedAt: Date.now(),
          })
        }

        // --- A2A tracking ---
        const newA2A = new Map(state.a2aInteractions)

        if (event.category === "a2a" && event.target_agent_id) {
          const key = `${event.agent_id}:${event.target_agent_id}`
          if (event.type === "idle") {
            // Mark completed instead of deleting (so Office can animate return)
            const existing = newA2A.get(key)
            if (existing) {
              newA2A.set(key, { ...existing, status: "completed", completedAt: Date.now() })
            }
          } else {
            if (!newA2A.has(key)) {
              newA2A.set(key, {
                fromAgentId: event.agent_id,
                toAgentId: event.target_agent_id,
                status: "active",
                startedAt: Date.now(),
              })
            }
          }
        }

        // Clean up completed A2A interactions 5s after completion
        const now = Date.now()
        for (const [key, interaction] of newA2A) {
          if (interaction.status === "completed" && interaction.completedAt && now - interaction.completedAt > 5000) {
            newA2A.delete(key)
          }
        }

        set({ activities: newActivities, a2aInteractions: newA2A })
      }
    }

    // --- A2A spawn → invalidate sidebar ---
    if (event.category === "a2a") {
      set({
        sidebarVersion: state.sidebarVersion + 1,
        threadsVersion: state.threadsVersion + 1,
      })
    }

    // --- Chat lifecycle → invalidation signals ---
    if (event.category === "activity" && event.type === "idle") {
      // Agent finished responding → history may have new messages
      set({
        historyVersion: state.historyVersion + 1,
        sidebarVersion: state.sidebarVersion + 1,
      })
    }

    // --- Data change events (invalidation signals) ---
    if (event.category === "data") {
      const updates: Record<string, number> = {}
      if (event.type === "data.approvals") updates.approvalsVersion = state.approvalsVersion + 1
      if (event.type === "data.tasks") updates.tasksVersion = state.tasksVersion + 1
      if (event.type === "data.workflows") updates.workflowsVersion = state.workflowsVersion + 1
      if (event.type === "data.custom_tools") updates.customToolsVersion = state.customToolsVersion + 1
      if (event.type === "data.clarifications") updates.clarificationsVersion = state.clarificationsVersion + 1
      if (Object.keys(updates).length > 0) set(updates)
    }

    // --- Orchestration step events ---
    if (event.category === "orchestration" && event.agent_id && event.target_agent_id) {
      const newA2A = new Map(state.a2aInteractions)
      const key = `${event.agent_id}:${event.target_agent_id}`

      if (event.type === "step_started") {
        newA2A.set(key, {
          fromAgentId: event.agent_id,
          toAgentId: event.target_agent_id,
          status: "active",
          startedAt: Date.now(),
        })
      } else if (event.type === "step_completed" || event.type === "step_failed") {
        const existing = newA2A.get(key)
        if (existing) {
          newA2A.set(key, { ...existing, status: "completed", completedAt: Date.now() })
        }
      }

      // Generate error activity for step_failed on the target agent
      if (event.type === "step_failed" && event.target_agent_id) {
        const newActivities = new Map(state.activities)
        newActivities.set(event.target_agent_id, {
          agentId: event.target_agent_id,
          type: "error",
          preview: "Task failed",
          updatedAt: Date.now(),
        })
        set({ a2aInteractions: newA2A, activities: newActivities })
        return
      }

      set({ a2aInteractions: newA2A })
    }
  },
}))
