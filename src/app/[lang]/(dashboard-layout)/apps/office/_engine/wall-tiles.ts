/** Top-down wall rendering */

import { TileType } from "./types"
import type { TileType as TileTypeVal } from "./types"
import { TD_TILE, gridToScreen, zDepth } from "./iso"
import { getCachedSprite } from "./sprite-cache"
import { getWallSpriteByMask } from "./sprites"

// Dark wall color (fallback when sprite not available)
const WALL_COLOR = "#1a1a2e"
const WALL_HIGHLIGHT = "#252540"

export interface WallInstance {
  gridCol: number
  gridRow: number
  zDepth: number
  mask: number // bitmask: N=1, S=2, E=4, W=8
}

/** Collect all wall tile positions with neighbor bitmask */
export function getWallInstances(tileMap: TileTypeVal[][]): WallInstance[] {
  const instances: WallInstance[] = []
  const rows = tileMap.length
  const cols = rows > 0 ? tileMap[0]!.length : 0

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (tileMap[r]![c] !== TileType.WALL) continue

      // Build neighbor bitmask: N=1, S=2, E=4, W=8
      let mask = 0
      if (r > 0 && tileMap[r - 1]![c] === TileType.WALL) mask |= 1
      if (r < rows - 1 && tileMap[r + 1]![c] === TileType.WALL) mask |= 2
      if (c < cols - 1 && tileMap[r]![c + 1] === TileType.WALL) mask |= 4
      if (c > 0 && tileMap[r]![c - 1] === TileType.WALL) mask |= 8

      instances.push({
        gridCol: c,
        gridRow: r,
        zDepth: zDepth(c, r),
        mask,
      })
    }
  }
  return instances
}

/** Draw a single wall tile */
export function drawWall(
  ctx: CanvasRenderingContext2D,
  wall: WallInstance,
  originX: number,
  originY: number,
  zoom: number
): void {
  const screen = gridToScreen(wall.gridCol, wall.gridRow, originX, originY, zoom)
  const tileSize = TD_TILE * zoom

  // Try sprite-based wall first
  const spriteData = getWallSpriteByMask(wall.mask)
  if (spriteData) {
    const cached = getCachedSprite(spriteData, zoom)
    // Wall sprites are 16x32 — top half is the upper part, draws above the tile
    ctx.drawImage(cached, screen.x, screen.y - cached.height + tileSize)
    return
  }

  // Fallback: solid dark rectangle
  ctx.fillStyle = WALL_COLOR
  ctx.fillRect(screen.x, screen.y, tileSize, tileSize)

  // Subtle highlight on top edge
  ctx.fillStyle = WALL_HIGHLIGHT
  ctx.fillRect(screen.x, screen.y, tileSize, Math.max(1, zoom * 0.5))
}

// Legacy exports for compatibility
export const getIsoWallInstances = getWallInstances
export type IsoWallInstance = WallInstance
export const drawIsoWall = drawWall
