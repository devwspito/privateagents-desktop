/** Office state — imperative world state bridging React data to the game engine */

import type {
  Character,
  Seat,
  Room,
  FurnitureInstance,
  TileType as TileTypeVal,
} from "./types"
import { CharacterState, TILE_SIZE } from "./types"
import { createCharacter, updateCharacter, triggerError, triggerCelebrate, triggerThink } from "./characters"
import { getWalkableTiles } from "./pathfinder"
import { buildOfficeLayout } from "./room-builder"
import type { LayoutFilter } from "./room-builder"
import { renderFrame, hitTestCharacter } from "./renderer"
import type { Camera } from "./camera"
import type { ActivityBubble } from "./activity-bubbles"
import { updateBubble } from "./activity-bubbles"
import type { Emote } from "./emotes"
import { createEmote, updateEmote } from "./emotes"
import { ParticlePool } from "./particles"
import { gridToScreen, getOrigin, TD_TILE } from "./iso"

interface AgentData {
  id: string
  name: string
  display_name: string | null
  department_id: string | null
  status: string
  enabled: boolean
  role: string
}

interface DepartmentData {
  id: string
  name: string
  display_name: string | null
  role: string | null
  orchestrator_enabled?: boolean
  orchestrator_agent_id?: string | null
}

export class OfficeState {
  tileMap: TileTypeVal[][] = []
  rooms: Room[] = []
  seats: Map<string, Seat> = new Map()
  furniture: FurnitureInstance[] = []
  characters: Map<string, Character> = new Map()
  walkableTiles: Array<{ col: number; row: number }> = []
  blockedTiles: Set<string> = new Set()
  totalCols = 0
  totalRows = 0
  hoveredAgentId: string | null = null
  bubbles: Map<string, ActivityBubble> = new Map()
  emotes: Map<string, Emote> = new Map()
  particlePool = new ParticlePool()
  frameCount = 0

  private paletteCounter = 0
  /** Active A2A calls: key → { fromId, toId } — agents stay at desk, show phone visual */
  _activeA2A: Map<string, { fromId: string; toId: string }> = new Map()
  private _coffeeTiles: Map<string, { col: number; row: number }> = new Map()

  /** Rebuild layout from API data */
  syncFromApi(agents: AgentData[], departments: DepartmentData[], filter?: LayoutFilter, directorAgentId?: string | null): void {
    const agentInfos = agents
      .filter((a) => a.enabled)
      .map((a) => ({
        id: a.id,
        name: a.display_name || a.name,
        department_id: a.department_id || null,
        status: this.resolveStatus(a),
      }))

    // Find director's department
    const directorDeptId = directorAgentId
      ? agents.find((a) => a.id === directorAgentId)?.department_id
      : null

    const deptInfos = departments.map((d) => ({
      id: d.id,
      name: d.display_name || d.name,
      role: d.role,
      is_director_dept: d.id === directorDeptId,
    }))

    // Build set of orchestrator agent IDs
    const orchestratorIds = new Set(
      departments
        .filter((d) => d.orchestrator_enabled && d.orchestrator_agent_id)
        .map((d) => d.orchestrator_agent_id!)
    )

    const layout = buildOfficeLayout(deptInfos, agentInfos, filter)
    this.tileMap = layout.tileMap
    this.rooms = layout.rooms
    this.furniture = layout.furniture
    this.totalCols = layout.totalCols
    this.totalRows = layout.totalRows

    // Index seats
    this.seats.clear()
    for (const seat of layout.seats) {
      this.seats.set(seat.uid, seat)
    }

    // Build blocked tiles (furniture that characters cannot walk through)
    this.blockedTiles.clear()
    const blockingTypes = new Set(["desk", "bookshelf", "tv", "whiteboard", "coffee", "printer", "cooler", "plant"])
    for (const f of this.furniture) {
      if (blockingTypes.has(f.type)) {
        this.blockedTiles.add(`${f.gridCol},${f.gridRow}`)
      }
    }

    this.walkableTiles = getWalkableTiles(this.tileMap, this.blockedTiles)

    // Index coffee/cooler positions for break routine
    this._coffeeTiles.clear()
    for (const room of this.rooms) {
      if (this._coffeeTiles.has(room.departmentId || "__none")) continue
      for (const f of this.furniture) {
        if ((f.type === "coffee" || f.type === "cooler") &&
          f.gridCol >= room.col && f.gridCol < room.col + room.width &&
          f.gridRow >= room.row && f.gridRow < room.row + room.height) {
          // Find adjacent walkable tile for the coffee machine
          const adj = this._findAdjacentWalkable(f.gridCol, f.gridRow)
          if (adj) {
            this._coffeeTiles.set(room.departmentId || "__none", adj)
            break
          }
        }
      }
    }

    // Sync characters: only show agents that have seats in the filtered layout
    const seatedAgentIds = new Set(layout.seats.map((s) => s.assignedTo))
    const visibleAgents = agentInfos.filter((a) => seatedAgentIds.has(a.id))
    const currentIds = new Set(visibleAgents.map((a) => a.id))
    // Remove characters for agents no longer present
    for (const id of this.characters.keys()) {
      if (!currentIds.has(id)) {
        this.characters.delete(id)
      }
    }

    // Add or update characters
    for (const agentInfo of visibleAgents) {
      const existing = this.characters.get(agentInfo.id)
      if (existing) {
        // Update status
        const newActive =
          agentInfo.status === "online" || agentInfo.status === "busy"
        if (existing.isActive !== newActive) {
          existing.isActive = newActive
        }
        existing.status = agentInfo.status as "online" | "busy" | "offline"
        existing.agentName = agentInfo.name
        existing.isOrchestrator = orchestratorIds.has(agentInfo.id)
      } else {
        // Find seat for this agent
        let assignedSeat: Seat | null = null
        for (const seat of this.seats.values()) {
          if (seat.assignedTo === agentInfo.id) {
            assignedSeat = seat
            break
          }
        }

        const palette = this.paletteCounter % 6
        this.paletteCounter++

        const character = createCharacter(
          agentInfo.id,
          agentInfo.name,
          agentInfo.department_id,
          palette,
          assignedSeat,
          agentInfo.status as "online" | "busy" | "offline",
          orchestratorIds.has(agentInfo.id),
        )
        // Assign coffee target for break routine
        character.coffeeTarget = this._coffeeTiles.get(agentInfo.department_id || "__none") || null
        this.characters.set(agentInfo.id, character)
      }
    }
  }

  /** Update all characters (game tick) */
  update(dt: number): void {
    this.frameCount++

    for (const ch of this.characters.values()) {
      updateCharacter(
        ch,
        dt,
        this.walkableTiles,
        this.seats,
        this.tileMap,
        this.blockedTiles
      )
    }

    // Update bubbles — remove expired
    const now = Date.now()
    for (const [agentId, bubble] of this.bubbles) {
      if (!updateBubble(bubble, now)) {
        this.bubbles.delete(agentId)
      }
    }

    // Update emotes — remove expired
    for (const [agentId, emote] of this.emotes) {
      if (!updateEmote(emote, now)) {
        this.emotes.delete(agentId)
      }
    }

    // Re-emit phone emotes for active A2A calls (emotes expire after 2.5s)
    for (const [, call] of this._activeA2A) {
      if (!this.emotes.has(call.fromId)) {
        this.emotes.set(call.fromId, createEmote(call.fromId, "phone"))
      }
      if (!this.emotes.has(call.toId)) {
        this.emotes.set(call.toId, createEmote(call.toId, "phone"))
      }
    }

    // Update particles
    this.particlePool.update(dt)
  }

  /** Render the full scene */
  render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    camera: Camera
  ): void {
    renderFrame(
      ctx,
      canvasWidth,
      canvasHeight,
      this.tileMap,
      this.furniture,
      Array.from(this.characters.values()),
      this.rooms,
      camera.zoom,
      camera.panX,
      camera.panY,
      this.hoveredAgentId,
      this.bubbles,
      this.frameCount,
      this.emotes,
      this.particlePool,
      this._activeA2A
    )
  }

  /** Hit-test at canvas coordinates */
  hitTest(
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    camera: Camera
  ): Character | null {
    return hitTestCharacter(
      canvasX,
      canvasY,
      Array.from(this.characters.values()),
      canvasWidth,
      canvasHeight,
      this.totalCols,
      this.totalRows,
      camera.zoom,
      camera.panX,
      camera.panY
    )
  }

  /** Handle activity state changes — triggers animations, emotes, particles */
  handleActivityChange(
    agentId: string,
    newType: string | null,
    prevType: string | null,
    data?: Record<string, unknown>
  ): void {
    const ch = this.characters.get(agentId)
    if (!ch) return

    // Don't override A2A walking/meeting states with activity changes
    if (ch.meetTarget) return

    // Error detection
    if (newType === "error" || (data?.["error"])) {
      triggerError(ch)
      this.emotes.set(agentId, createEmote(agentId, "error"))
      this._emitParticlesAtAgent(agentId, "spark")
      return
    }

    // Thinking → THINK state
    if (newType === "thinking") {
      triggerThink(ch)
      return
    }

    // Tool call → fast typing + intensity
    if (newType === "tool_call") {
      if (ch.state !== CharacterState.ERROR && ch.state !== CharacterState.CELEBRATE) {
        ch.state = CharacterState.TYPE
        ch.intensityMultiplier = 2.0
        ch.frame = 0
        ch.frameTimer = 0
      }
      return
    }

    // Responding (from thinking) → TYPE + lightbulb emote
    if (newType === "responding") {
      if (prevType === "thinking") {
        this.emotes.set(agentId, createEmote(agentId, "lightbulb"))
      }
      if (ch.state !== CharacterState.ERROR && ch.state !== CharacterState.CELEBRATE) {
        ch.state = CharacterState.TYPE
        ch.intensityMultiplier = 1
        ch.frame = 0
        ch.frameTimer = 0
      }
      return
    }

    // Idle (from responding/tool_call) → CELEBRATE
    if (newType === null && (prevType === "responding" || prevType === "tool_call")) {
      triggerCelebrate(ch)
      this.emotes.set(agentId, createEmote(agentId, "star"))
      this._emitParticlesAtAgent(agentId, "confetti")
      return
    }

    // Default: reset intensity
    ch.intensityMultiplier = 1
  }

  /** Emit particles at an agent's screen position */
  private _emitParticlesAtAgent(agentId: string, type: "confetti" | "spark"): void {
    const ch = this.characters.get(agentId)
    if (!ch) return
    // We store screen-space coords; compute them from grid position
    // Particles are drawn in screen space, so we need to convert
    // The actual screen position will be computed at draw time in the game loop
    // For now, store world position and convert in the canvas update
    const gridCol = ch.x / TILE_SIZE
    const gridRow = ch.y / TILE_SIZE
    // Store pending particle emission — resolved to screen coords in render
    this._pendingParticles.push({ agentId, type, gridCol, gridRow })
  }

  _pendingParticles: Array<{ agentId: string; type: "confetti" | "spark"; gridCol: number; gridRow: number }> = []

  /** Resolve pending particles to screen coords (called from game loop with camera info) */
  resolvePendingParticles(canvasWidth: number, canvasHeight: number, zoom: number, panX: number, panY: number): void {
    if (this._pendingParticles.length === 0) return
    const { originX, originY } = getOrigin(canvasWidth, canvasHeight, this.totalCols, this.totalRows, zoom, panX, panY)
    for (const p of this._pendingParticles) {
      const screen = gridToScreen(p.gridCol, p.gridRow, originX, originY, zoom)
      const cx = screen.x + TD_TILE * zoom / 2
      const cy = screen.y
      this.particlePool.emit(p.type, cx, cy)
    }
    this._pendingParticles = []
  }

  /** Handle A2A interaction — agents stay at desks, phone call visual */
  handleA2AInteraction(fromId: string, toId: string, status: string): void {
    const key = `${fromId}:${toId}`

    if (status === "completed") {
      this._activeA2A.delete(key)
      const charFrom = this.characters.get(fromId)
      const charTo = this.characters.get(toId)

      // Only reset agents that aren't in another active call
      const fromInOtherCall = [...this._activeA2A.values()].some(
        m => m.fromId === fromId || m.toId === fromId
      )
      const toInOtherCall = [...this._activeA2A.values()].some(
        m => m.fromId === toId || m.toId === toId
      )

      if (charFrom && !fromInOtherCall) {
        charFrom.meetTarget = null
        charFrom.state = CharacterState.IDLE
        charFrom.frame = 0
        charFrom.frameTimer = 0
        triggerCelebrate(charFrom)
        this.emotes.set(fromId, createEmote(fromId, "star"))
        this._emitParticlesAtAgent(fromId, "confetti")
      }
      if (charTo && !toInOtherCall) {
        charTo.meetTarget = null
        charTo.state = CharacterState.IDLE
        charTo.frame = 0
        charTo.frameTimer = 0
      }
      return
    }

    if (this._activeA2A.has(key)) return // Already in call

    const charFrom = this.characters.get(fromId)
    const charTo = this.characters.get(toId)
    if (!charFrom || !charTo) return

    // Register the call (agents stay at their desks)
    this._activeA2A.set(key, { fromId, toId })

    // Both agents enter MEET state (typing animation) with phone emote
    charFrom.meetTarget = toId
    charFrom.state = CharacterState.MEET
    charFrom.frame = 0
    charFrom.frameTimer = 0
    this.emotes.set(fromId, createEmote(fromId, "phone"))

    charTo.meetTarget = fromId
    charTo.state = CharacterState.MEET
    charTo.frame = 0
    charTo.frameTimer = 0
    this.emotes.set(toId, createEmote(toId, "phone"))
  }

  /** Emit coffee emote for agent at coffee machine */
  emitCoffeeEmote(agentId: string): void {
    this.emotes.set(agentId, createEmote(agentId, "coffee"))
  }

  /** Find a walkable tile adjacent to (col, row) */
  private _findAdjacentWalkable(col: number, row: number): { col: number; row: number } | null {
    const offsets = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }]
    for (const { dc, dr } of offsets) {
      const c = col + dc
      const r = row + dr
      const key = `${c},${r}`
      if (
        r >= 0 && r < this.tileMap.length &&
        c >= 0 && c < (this.tileMap[0]?.length || 0) &&
        this.tileMap[r]?.[c] === 1 && // FLOOR
        !this.blockedTiles.has(key)
      ) {
        return { col: c, row: r }
      }
    }
    return null
  }


  private resolveStatus(
    agent: AgentData
  ): "online" | "busy" | "offline" {
    if (!agent.enabled) return "offline"
    const s = agent.status?.toLowerCase()
    if (s === "busy" || s === "working") return "busy"
    if (s === "online" || s === "active" || s === "idle") return "online"
    return "online" // Default enabled agents to online
  }
}
