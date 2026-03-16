/** Top-down RPG ¾ view renderer */

import { TILE_SIZE, TileType } from "./types"
import type {
  TileType as TileTypeVal,
  FurnitureInstance,
  Character,
  Room,
} from "./types"
import { getCachedSprite } from "./sprite-cache"
import { getCharacterSprites, getCharacterSprite } from "./sprites"
import { LABEL_COLOR } from "./constants"
import { TD_TILE, gridToScreen, getOrigin, zDepth } from "./iso"
import { getWallInstances, drawWall } from "./wall-tiles"
import { getFurnitureSprite, FURNITURE_Z_OFFSETS } from "./iso-furniture"
import type { ActivityBubble } from "./activity-bubbles"
import { drawBubble } from "./activity-bubbles"
import type { Emote } from "./emotes"
import { drawEmote } from "./emotes"
import type { ParticlePool } from "./particles"
import { getHeadsetCanvas, HEADSET_Y_OFFSET_ROWS } from "./headset"

interface ZDrawable {
  zDepth: number
  draw: (ctx: CanvasRenderingContext2D) => void
}

/** Darken a hex color by a factor (0-1, where 0.8 = 20% darker) */
function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.round(r * factor).toString(16).padStart(2, "0")}${Math.round(g * factor).toString(16).padStart(2, "0")}${Math.round(b * factor).toString(16).padStart(2, "0")}`
}

export interface A2AMeeting {
  fromId: string
  toId: string
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tileMap: TileTypeVal[][],
  furniture: FurnitureInstance[],
  characters: Character[],
  rooms: Room[],
  zoom: number,
  panX: number,
  panY: number,
  hoveredAgentId: string | null,
  bubbles?: Map<string, ActivityBubble>,
  frameCount?: number,
  emotes?: Map<string, Emote>,
  particlePool?: ParticlePool,
  a2aMeetings?: Map<string, A2AMeeting>,
): void {
  ctx.fillStyle = "#1a1a2e"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const tmRows = tileMap.length
  const tmCols = tmRows > 0 ? tileMap[0]!.length : 0
  if (tmRows === 0 || tmCols === 0) return

  const { originX, originY } = getOrigin(
    canvasWidth, canvasHeight, tmCols, tmRows, zoom, panX, panY
  )

  const tileSize = TD_TILE * zoom

  // Build room color lookup
  const roomColorMap = new Map<string, string>()
  for (const room of rooms) {
    for (let r = room.row; r < room.row + room.height; r++) {
      for (let c = room.col; c < room.col + room.width; c++) {
        roomColorMap.set(`${c},${r}`, room.floorColor)
      }
    }
  }

  // Collect all drawables for z-sorting
  const drawables: ZDrawable[] = []

  // ─── Floor tiles (simple rectangles with checker pattern) ──
  for (let row = 0; row < tmRows; row++) {
    for (let col = 0; col < tmCols; col++) {
      const tile = tileMap[row]![col]!
      if (tile === TileType.VOID) continue
      if (tile === TileType.WALL) continue

      const screen = gridToScreen(col, row, originX, originY, zoom)
      const sx = screen.x
      const sy = screen.y

      const roomColor = roomColorMap.get(`${col},${row}`)
      const baseColor = roomColor || "#6A6A5A"
      const variant = (col + row) % 2
      const tileColor = variant === 0 ? baseColor : darkenColor(baseColor, 0.92)

      drawables.push({
        zDepth: row - 0.5,
        draw: (c) => {
          // Tile fill
          c.fillStyle = tileColor
          c.fillRect(sx, sy, tileSize, tileSize)
          // Subtle border for tile texture
          c.strokeStyle = darkenColor(baseColor, 0.85)
          c.lineWidth = 0.5
          c.strokeRect(sx + 0.5, sy + 0.5, tileSize - 1, tileSize - 1)
        },
      })
    }
  }

  // ─── Wall instances ─────────────────────────────────
  const wallInstances = getWallInstances(tileMap)
  for (const wall of wallInstances) {
    drawables.push({
      zDepth: wall.zDepth,
      draw: (c) => drawWall(c, wall, originX, originY, zoom),
    })
  }

  // ─── Furniture (pixel art sprites) ─────────────────
  for (const f of furniture) {
    const d = zDepth(f.gridCol, f.gridRow)
    const screen = gridToScreen(f.gridCol, f.gridRow, originX, originY, zoom)
    const sx = screen.x
    const sy = screen.y
    const spriteData = getFurnitureSprite(f.type, f.variant)
    const cached = getCachedSprite(spriteData, zoom)
    if (f.type === "desk") {
      // Split desk into back (surface) and front (panel) for sitting illusion
      // 35% = surface area (behind agent), 65% = front panel + legs (covers agent legs)
      const splitY = Math.floor(cached.height * 0.35)
      const drawY = sy + tileSize - cached.height

      // Back part (surface) — draws BEFORE agent (low z-offset)
      drawables.push({
        zDepth: d + 0.01,
        draw: (c) => {
          c.drawImage(cached, 0, 0, cached.width, splitY,
                      sx, drawY, cached.width, splitY)
        },
      })

      // Front part (panel + legs) — draws AFTER agent (high z-offset)
      drawables.push({
        zDepth: d + 1.8,
        draw: (c) => {
          c.drawImage(cached, 0, splitY, cached.width, cached.height - splitY,
                      sx, drawY + splitY, cached.width, cached.height - splitY)
        },
      })
    } else if (f.type === "laptop" || f.type === "phone") {
      // Laptop/phone: draw on desk surface (pull up so they sit on the desk back area)
      const deskSurfaceOffset = tileSize * 0.65
      drawables.push({
        zDepth: d + 2.0,
        draw: (c) => {
          c.drawImage(cached, sx, sy + tileSize - cached.height - deskSurfaceOffset)
        },
      })
    } else {
      const zOff = FURNITURE_Z_OFFSETS[f.type] ?? 0.1
      drawables.push({
        zDepth: d + zOff,
        draw: (c) => {
          c.drawImage(cached, sx, sy + tileSize - cached.height)
        },
      })
    }
  }

  // ─── Characters ─────────────────────────────────────
  for (const ch of characters) {
    if (ch.status === "offline") continue

    const sprites = getCharacterSprites(ch.palette, ch.hueShift)
    if (!sprites) continue

    const spriteData = getCharacterSprite(sprites, ch.state, ch.dir, ch.frame)
    const cached = getCachedSprite(spriteData, zoom)

    // Convert character world position to screen position
    const gridCol = ch.x / TILE_SIZE
    const gridRow = ch.y / TILE_SIZE
    const screen = gridToScreen(gridCol, gridRow, originX, originY, zoom)

    // Center character on tile
    const charCenterX = screen.x + tileSize / 2
    const charCenterY = screen.y + tileSize / 2

    // Pull agent north (up) so desk front panel covers legs — always applied
    const sittingOffset = -tileSize * 0.7

    // Apply shake (error) and bounce (celebrate) offsets
    const shakeOff = (ch.shakeOffset ?? 0) * zoom
    const bounceOff = (ch.bounceOffset ?? 0) * zoom

    const drawX = Math.round(charCenterX - cached.width / 2 + shakeOff)
    const drawY = Math.round(charCenterY - cached.height / 2 + sittingOffset + bounceOff)

    const charDepth = zDepth(gridCol, gridRow) + 1.1

    // Shadow
    drawables.push({
      zDepth: charDepth - 0.05,
      draw: (c) => {
        c.save()
        c.globalAlpha = 0.3
        c.fillStyle = "#000000"
        c.beginPath()
        c.ellipse(
          charCenterX,
          charCenterY + tileSize * 0.3,
          tileSize * 0.3,
          tileSize * 0.15,
          0, 0, Math.PI * 2
        )
        c.fill()
        c.restore()
      },
    })

    // Hover highlight
    if (hoveredAgentId === ch.id) {
      drawables.push({
        zDepth: charDepth - 0.1,
        draw: (c) => {
          c.save()
          c.globalAlpha = 0.25
          c.fillStyle = "#FFFFFF"
          c.beginPath()
          c.ellipse(
            charCenterX,
            charCenterY,
            tileSize * 0.45,
            tileSize * 0.45,
            0, 0, Math.PI * 2
          )
          c.fill()
          c.restore()
        },
      })
    }

    // Character sprite + tint overlay + speed lines
    const chTintColor = ch.tintColor
    const chTintAlpha = ch.tintAlpha ?? 0
    const chIntensity = ch.intensityMultiplier ?? 1
    const fc = frameCount ?? 0
    drawables.push({
      zDepth: charDepth,
      draw: (c) => {
        c.save()
        if (ch.status === "busy") c.globalAlpha = 0.7
        c.drawImage(cached, drawX, drawY)

        // Red tint overlay for error state
        if (chTintColor && chTintAlpha > 0) {
          c.globalAlpha = chTintAlpha
          c.fillStyle = chTintColor
          c.fillRect(drawX, drawY, cached.width, cached.height)
        }
        c.restore()

        // Speed lines for intense typing (tool_call)
        if (chIntensity > 1 && fc % 6 < 3) {
          c.save()
          c.strokeStyle = "rgba(255,255,200,0.55)"
          c.lineWidth = Math.max(1, zoom * 0.4)
          const lx = drawX + cached.width + zoom * 1
          const ly = drawY + cached.height * 0.3
          for (let i = 0; i < 3; i++) {
            const offY = i * zoom * 2.5
            c.beginPath()
            c.moveTo(lx, ly + offY)
            c.lineTo(lx + zoom * 2.5, ly + offY - zoom * 1.5)
            c.stroke()
          }
          c.restore()
        }
      },
    })

    // Headset overlay for A2A calls
    if (ch.meetTarget) {
      const hsCanvas = getHeadsetCanvas(ch.dir, zoom)
      const headsetDrawX = drawX  // Same X as character (both 16px wide with outline)
      const headsetDrawY = drawY + HEADSET_Y_OFFSET_ROWS * zoom
      drawables.push({
        zDepth: charDepth + 0.05,
        draw: (c) => {
          c.drawImage(hsCanvas, headsetDrawX, headsetDrawY)
        },
      })
    }

    // Name label
    drawables.push({
      zDepth: charDepth + 0.1,
      draw: (c) => {
        const labelX = charCenterX
        const labelY = drawY - 2 * zoom
        const fontSize = Math.max(8, zoom * 3)

        c.save()
        c.font = `${fontSize}px monospace`
        c.textAlign = "center"
        c.textBaseline = "bottom"

        const textW = c.measureText(ch.agentName).width
        c.fillStyle = "rgba(0,0,0,0.6)"
        const pad = zoom * 1.5
        c.beginPath()
        c.roundRect(
          labelX - textW / 2 - pad,
          labelY - fontSize - pad * 0.5,
          textW + pad * 2,
          fontSize + pad,
          pad * 0.5
        )
        c.fill()

        c.fillStyle = LABEL_COLOR
        c.fillText(ch.agentName, labelX, labelY)

        // Crown icon for orchestrator agents
        if (ch.isOrchestrator) {
          const crownSize = Math.max(8, fontSize * 0.9)
          const crownX = labelX - textW / 2 - crownSize - 2
          const crownY = labelY - fontSize - pad * 0.2
          c.fillStyle = "#F59E0B"
          c.font = `${crownSize}px sans-serif`
          c.textAlign = "left"
          c.textBaseline = "bottom"
          c.fillText("👑", crownX, crownY + crownSize)
          c.font = `${fontSize}px monospace`
          c.textAlign = "center"
          c.textBaseline = "bottom"
        }

        const dotR = Math.max(2, zoom * 0.8)
        const dotX = labelX + textW / 2 + dotR + 2
        const dotY = labelY - fontSize / 2
        c.beginPath()
        c.arc(dotX, dotY, dotR, 0, Math.PI * 2)
        c.fillStyle =
          ch.status === "online"
            ? "#44CC66"
            : ch.status === "busy"
              ? "#DDAA33"
              : "#888888"
        c.fill()

        c.restore()
      },
    })

    // Activity bubble
    const bubble = bubbles?.get(ch.id)
    if (bubble && fc >= 0) {
      drawables.push({
        zDepth: charDepth + 0.2,
        draw: (c) => {
          drawBubble(c, bubble, charCenterX, drawY, zoom, fc)
        },
      })
    }

    // Emote (above bubble)
    const emote = emotes?.get(ch.id)
    if (emote) {
      drawables.push({
        zDepth: charDepth + 0.3,
        draw: (c) => {
          drawEmote(c, emote, charCenterX, drawY, zoom, !!bubble)
        },
      })
    }
  }

  // ─── Room ambiance overlay ──────────────────────────
  for (const room of rooms) {
    const topLeft = gridToScreen(room.col, room.row, originX, originY, zoom)
    const roomW = room.width * tileSize
    const roomH = room.height * tileSize
    const ambDepth = zDepth(room.col, room.row) - 0.9

    drawables.push({
      zDepth: ambDepth,
      draw: (c) => {
        c.save()
        c.globalAlpha = 0.08
        c.fillStyle = room.floorColor
        c.fillRect(topLeft.x, topLeft.y, roomW, roomH)
        c.restore()

        // Room border
        c.save()
        c.strokeStyle = "rgba(0,0,0,0.15)"
        c.lineWidth = Math.max(1, zoom * 0.5)
        c.strokeRect(topLeft.x, topLeft.y, roomW, roomH)
        c.restore()
      },
    })
  }

  // ─── Room labels (sign above room) ─────────────────
  for (const room of rooms) {
    // Position: centered horizontally, above the top wall
    const labelScreen = gridToScreen(
      room.col + room.width / 2,
      room.row - 0.3,
      originX,
      originY,
      zoom
    )
    const labelX = labelScreen.x + tileSize / 2
    const labelY = labelScreen.y + tileSize / 2
    const fontSize = Math.max(10, zoom * 3.2)
    // Draw on top of everything (high z-depth = last to render)
    const labelDepth = 9999

    drawables.push({
      zDepth: labelDepth,
      draw: (c) => {
        c.save()
        const textW = c.measureText(room.departmentName).width
        const padX = zoom * 3
        const padY = zoom * 1.8
        const signW = textW + padX * 2
        const signH = fontSize + padY * 2
        const signX = labelX - signW / 2
        const signY = labelY - signH / 2
        const radius = zoom * 1.5

        // Sign background with subtle gradient
        const grad = c.createLinearGradient(signX, signY, signX, signY + signH)
        grad.addColorStop(0, room.floorColor || "#5A5A4A")
        grad.addColorStop(1, darkenColor(room.floorColor || "#5A5A4A", 0.75))
        c.fillStyle = grad
        c.beginPath()
        c.roundRect(signX, signY, signW, signH, radius)
        c.fill()

        // Border
        c.strokeStyle = darkenColor(room.floorColor || "#5A5A4A", 0.5)
        c.lineWidth = Math.max(1, zoom * 0.4)
        c.stroke()

        // Inner highlight line at top
        c.strokeStyle = "rgba(255,255,255,0.15)"
        c.lineWidth = Math.max(0.5, zoom * 0.2)
        c.beginPath()
        c.moveTo(signX + radius, signY + zoom * 0.4)
        c.lineTo(signX + signW - radius, signY + zoom * 0.4)
        c.stroke()

        // Text with slight shadow
        c.font = `bold ${fontSize}px monospace`
        c.textAlign = "center"
        c.textBaseline = "middle"
        c.fillStyle = "rgba(0,0,0,0.4)"
        c.fillText(room.departmentName, labelX + 0.5, labelY + 0.5)
        c.fillStyle = "#FFFFFF"
        c.fillText(room.departmentName, labelX, labelY)

        c.restore()
      },
    })
  }

  // ─── Sort and draw ──────────────────────────────────
  drawables.sort((a, b) => a.zDepth - b.zDepth)
  for (const d of drawables) {
    d.draw(ctx)
  }

  // ─── Particles ──────────────────────────────────────
  if (particlePool?.hasActive()) {
    ctx.save()
    particlePool.draw(ctx, zoom)
    ctx.restore()
  }

  // ─── A2A call connection lines (on top of everything) ──
  if (a2aMeetings && a2aMeetings.size > 0) {
    const charMap = new Map<string, Character>()
    for (const ch of characters) charMap.set(ch.id, ch)

    const fc = frameCount ?? 0

    for (const [, meeting] of a2aMeetings) {
      const chFrom = charMap.get(meeting.fromId)
      const chTo = charMap.get(meeting.toId)
      if (!chFrom || !chTo) continue

      const fromScreen = gridToScreen(chFrom.x / TILE_SIZE, chFrom.y / TILE_SIZE, originX, originY, zoom)
      const toScreen = gridToScreen(chTo.x / TILE_SIZE, chTo.y / TILE_SIZE, originX, originY, zoom)

      const fromX = fromScreen.x + tileSize / 2
      const fromY = fromScreen.y - tileSize * 0.2
      const toX = toScreen.x + tileSize / 2
      const toY = toScreen.y - tileSize * 0.2

      ctx.save()

      // Animated dashed line
      ctx.setLineDash([zoom * 2, zoom * 1.5])
      ctx.lineDashOffset = -(fc * 0.5)
      ctx.strokeStyle = "rgba(68, 221, 170, 0.6)"
      ctx.lineWidth = Math.max(1.5, zoom * 0.5)
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()

      // Glow dots at endpoints
      for (const [px, py] of [[fromX, fromY], [toX, toY]] as const) {
        ctx.beginPath()
        ctx.arc(px, py, zoom * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(68, 221, 170, 0.8)"
        ctx.fill()
      }

      ctx.restore()
    }
  }
}

/** Hit-test: find which character is at canvas coordinates */
export function hitTestCharacter(
  canvasX: number,
  canvasY: number,
  characters: Character[],
  canvasWidth: number,
  canvasHeight: number,
  totalCols: number,
  totalRows: number,
  zoom: number,
  panX: number,
  panY: number
): Character | null {
  const { originX, originY } = getOrigin(
    canvasWidth, canvasHeight, totalCols, totalRows, zoom, panX, panY
  )

  const tileSize = TD_TILE * zoom

  for (let i = characters.length - 1; i >= 0; i--) {
    const ch = characters[i]!
    if (ch.status === "offline") continue

    const gridCol = ch.x / TILE_SIZE
    const gridRow = ch.y / TILE_SIZE
    const screen = gridToScreen(gridCol, gridRow, originX, originY, zoom)

    // Character is centered on tile
    const cx = screen.x + tileSize / 2
    const cy = screen.y + tileSize / 2
    const halfW = tileSize * 0.6
    const halfH = tileSize * 1.2

    if (
      canvasX >= cx - halfW &&
      canvasX <= cx + halfW &&
      canvasY >= cy - halfH &&
      canvasY <= cy + halfH
    ) {
      return ch
    }
  }

  return null
}
