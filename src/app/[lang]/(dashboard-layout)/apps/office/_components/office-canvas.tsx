"use client"

import { useEffect, useRef, useCallback, useState } from "react"

import { OfficeState } from "../_engine/office-state"
import { startGameLoop } from "../_engine/game-loop"
import { loadCharacterSprites, loadWallSprites } from "../_engine/sprites"
import {
  createCamera,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  animateCamera,
  panToRoom,
  panToAll,
  fitZoomForMap,
} from "../_engine/camera"
import type { Camera } from "../_engine/camera"
import type { LayoutFilter } from "../_engine/room-builder"
import { AgentPanel } from "./agent-panel"
import { QuickChatDialog } from "./quick-chat-dialog"
import { useEventStore } from "@/lib/stores/event-store"

interface Agent {
  id: string
  name: string
  display_name: string | null
  department_id: string | null
  status: string
  enabled: boolean
  role: string
}

interface Department {
  id: string
  name: string
  display_name: string | null
  role: string | null
  orchestrator_enabled?: boolean
  orchestrator_agent_id?: string | null
}

interface OfficeCanvasProps {
  agents: Agent[]
  departments: Department[]
  isAdmin: boolean
  lang: string
  selectedDepartments?: Set<string>
  searchQuery?: string
  directorAgentId?: string | null
}

export function OfficeCanvas({
  agents,
  departments,
  isAdmin,
  lang,
  selectedDepartments,
  searchQuery,
  directorAgentId,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const officeRef = useRef<OfficeState | null>(null)
  const cameraRef = useRef<Camera>((() => {
    const cam = createCamera()
    try {
      const raw = localStorage.getItem("office:camera")
      if (raw) {
        const saved = JSON.parse(raw) as { panX: number; panY: number; zoom: number }
        cam.panX = saved.panX; cam.targetPanX = saved.panX
        cam.panY = saved.panY; cam.targetPanY = saved.panY
        cam.zoom = saved.zoom; cam.targetZoom = saved.zoom
      }
    } catch { /* ignore */ }
    return cam
  })())
  const spritesLoadedRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [chatAgentId, setChatAgentId] = useState<string | null>(null)
  const [chatAgentName, setChatAgentName] = useState<string>("")
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    name: string
    status: string
  } | null>(null)

  // Build filter object
  const filter: LayoutFilter | undefined =
    (selectedDepartments && selectedDepartments.size > 0) || searchQuery
      ? {
          departmentIds:
            selectedDepartments && selectedDepartments.size > 0
              ? selectedDepartments
              : undefined,
          searchQuery: searchQuery || undefined,
        }
      : undefined

  // Initialize office state and game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const office = new OfficeState()
    officeRef.current = office
    const camera = cameraRef.current

    Promise.all([loadCharacterSprites(), loadWallSprites()]).then(() => {
      spritesLoadedRef.current = true
      office.syncFromApi(agents, departments, filter, directorAgentId)

      // Auto-fit zoom only if no persisted camera state
      const hasPersistedCamera = !!localStorage.getItem("office:camera")
      if (!hasPersistedCamera) {
        const initZoom = fitZoomForMap(canvas.width, canvas.height, office.totalCols, office.totalRows)
        camera.zoom = initZoom
        camera.targetZoom = initZoom
      }

      const prevActivities = new Map<string, string>()
      let cameraSaveTimer = 0
      let staleSweepTimer = 0

      const stop = startGameLoop(canvas, {
        update: (dt) => {
          const storeState = useEventStore.getState()

          // Build current activity type map
          const currentTypes = new Map<string, string>()
          for (const [agentId, act] of storeState.activities) {
            currentTypes.set(agentId, act.type)
          }

          // Detect transitions and sync bubbles
          for (const [agentId, act] of storeState.activities) {
            const prevType = prevActivities.get(agentId) || null
            if (prevType !== act.type) {
              office.handleActivityChange(agentId, act.type, prevType)
            }

            const bubbleType = act.type === "error" ? "tool_call" as const : act.type as "thinking" | "tool_call" | "responding"
            const existingBubble = office.bubbles.get(agentId)
            // Refresh createdAt when: new bubble, type changed, or near expiry (>3s)
            // This keeps bubbles alive while the activity persists in the store
            const shouldRefresh = !existingBubble || existingBubble.type !== bubbleType ||
              (Date.now() - existingBubble.createdAt > 3000)
            office.bubbles.set(agentId, {
              agentId,
              type: bubbleType,
              text: act.type === "error" ? "Error!" : act.type === "tool_call" ? (act.toolName || "tool") : "...",
              createdAt: shouldRefresh ? Date.now() : existingBubble.createdAt,
              opacity: existingBubble?.opacity ?? 1,
            })
          }

          // Check for removed activities (agent went idle)
          for (const [agentId, prevType] of prevActivities) {
            if (!currentTypes.has(agentId)) {
              office.handleActivityChange(agentId, null, prevType)
              office.bubbles.delete(agentId)
            }
          }

          // Update tracking map
          prevActivities.clear()
          for (const [agentId, type] of currentTypes) {
            prevActivities.set(agentId, type)
          }

          // Coffee emote for agents at coffee machine
          for (const ch of office.characters.values()) {
            if (ch.breakPhase === "at_coffee" && !office.emotes.has(ch.id)) {
              office.emitCoffeeEmote(ch.id)
            }
          }

          // A2A → character movement
          for (const [, interaction] of storeState.a2aInteractions) {
            office.handleA2AInteraction(
              interaction.fromAgentId,
              interaction.toAgentId,
              interaction.status
            )
          }

          // Animate camera transitions
          animateCamera(camera, dt)
          office.update(dt)

          // Persist camera state every ~2s
          cameraSaveTimer += dt
          if (cameraSaveTimer > 2) {
            cameraSaveTimer = 0
            try {
              localStorage.setItem("office:camera", JSON.stringify({
                panX: camera.panX, panY: camera.panY, zoom: camera.zoom,
              }))
            } catch { /* ignore */ }
          }

          // Sweep stale activities/A2A every ~30s (client-side safety net)
          staleSweepTimer += dt
          if (staleSweepTimer > 30) {
            staleSweepTimer = 0
            useEventStore.getState().sweepStale()
          }

          // Resolve pending particles to screen coords
          office.resolvePendingParticles(canvas.width, canvas.height, camera.zoom, camera.panX, camera.panY)
        },
        render: (ctx) => {
          office.render(ctx, canvas.width, canvas.height, camera)
        },
      })

      cleanupRef.current = stop
    })

    return () => {
      cleanupRef.current?.()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync API data + filter when they change
  useEffect(() => {
    const office = officeRef.current
    const canvas = canvasRef.current
    if (!office || !spritesLoadedRef.current || !canvas) return
    if (agents.length === 0) return

    office.syncFromApi(agents, departments, filter, directorAgentId)

    // Camera: if filtering to exactly 1 department, pan to that room
    if (selectedDepartments && selectedDepartments.size === 1) {
      const deptId = [...selectedDepartments][0]
      const room = office.rooms.find((r) => r.departmentId === deptId)
      if (room) {
        panToRoom(
          cameraRef.current,
          room,
          canvas.width,
          canvas.height,
          office.totalCols,
          office.totalRows
        )
      }
    } else if (!selectedDepartments || selectedDepartments.size === 0) {
      panToAll(cameraRef.current, canvas.width, canvas.height, office.totalCols, office.totalRows)
    }
  }, [agents, departments, selectedDepartments, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      // Re-fit zoom on resize
      const office = officeRef.current
      if (office && office.totalCols > 0) {
        const cam = cameraRef.current
        const newZoom = fitZoomForMap(rect.width, rect.height, office.totalCols, office.totalRows)
        cam.zoom = newZoom
        cam.targetZoom = newZoom
      }
    })

    observer.observe(container)

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    return () => observer.disconnect()
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    handleWheel(cameraRef.current, e.nativeEvent)
    e.preventDefault()
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleMouseDown(cameraRef.current, e.nativeEvent)
  }, [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMouseMove(cameraRef.current, e.nativeEvent)

      const canvas = canvasRef.current
      const office = officeRef.current
      if (!canvas || !office) return

      if (cameraRef.current.isDragging) {
        setTooltip(null)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const hit = office.hitTest(
        x,
        y,
        canvas.width,
        canvas.height,
        cameraRef.current
      )

      if (hit) {
        office.hoveredAgentId = hit.id
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          name: hit.agentName,
          status: hit.status,
        })
        canvas.style.cursor = "pointer"
      } else {
        office.hoveredAgentId = null
        setTooltip(null)
        canvas.style.cursor = cameraRef.current.isDragging
          ? "grabbing"
          : "default"
      }
    },
    []
  )

  const wasDraggingRef = useRef(false)

  const onMouseUp2 = useCallback(() => {
    // Capture drag state before handleMouseUp resets it
    wasDraggingRef.current = cameraRef.current.isDragging
    handleMouseUp(cameraRef.current)
  }, [])

  const onClick = useCallback((e: React.MouseEvent) => {
    // If user was panning, don't register click
    if (wasDraggingRef.current) return

    const canvas = canvasRef.current
    const office = officeRef.current
    if (!canvas || !office) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hit = office.hitTest(
      x,
      y,
      canvas.width,
      canvas.height,
      cameraRef.current
    )

    if (hit) {
      // Open chat modal directly
      setChatAgentId(hit.id)
      setChatAgentName(hit.agentName)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#1a1a2e]"
    >
      <canvas
        ref={canvasRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp2}
        onMouseLeave={() => {
          handleMouseUp(cameraRef.current)
          setTooltip(null)
          if (officeRef.current) officeRef.current.hoveredAgentId = null
        }}
        onClick={onClick}
        className="block"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-2 py-1 rounded bg-black/80 text-white text-xs whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          <span className="font-medium">{tooltip.name}</span>
          <span
            className={`ml-2 inline-block w-2 h-2 rounded-full ${
              tooltip.status === "online"
                ? "bg-green-400"
                : tooltip.status === "busy"
                  ? "bg-yellow-400"
                  : "bg-gray-400"
            }`}
          />
          <span className="ml-1 text-[10px] text-gray-300">
            {tooltip.status}
          </span>
        </div>
      )}

      {selectedAgentId && (
        <AgentPanel
          agentId={selectedAgentId}
          isAdmin={isAdmin}
          lang={lang}
          onClose={() => setSelectedAgentId(null)}
          departments={departments}
        />
      )}

      <QuickChatDialog
        open={!!chatAgentId}
        onOpenChange={(open) => {
          if (!open) {
            setChatAgentId(null)
            setChatAgentName("")
          }
        }}
        agentId={chatAgentId || ""}
        agentName={chatAgentName}
        lang={lang}
      />
    </div>
  )
}
