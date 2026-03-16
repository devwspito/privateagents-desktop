/** HSL colorization — Photoshop-style colorize for floor tiles */

/** Convert HSL (h: 0-360, s: 0-1, l: 0-1) to RGB hex */
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const ri = Math.round((r + m) * 255)
  const gi = Math.round((g + m) * 255)
  const bi = Math.round((b + m) * 255)
  return `#${ri.toString(16).padStart(2, "0")}${gi.toString(16).padStart(2, "0")}${bi.toString(16).padStart(2, "0")}`
}

export interface FloorColorParams {
  hue: number        // 0-360
  saturation: number // 0-100
  brightness: number // -50 to 50
  contrast: number   // -50 to 50
}

/**
 * Colorize a grayscale luminance value using HSL params.
 * The lightness from the grayscale source is preserved; hue and saturation are replaced.
 */
export function colorizeGray(
  gray: number, // 0-255
  params: FloorColorParams
): string {
  let lightness = gray / 255

  // Apply contrast
  if (params.contrast !== 0) {
    lightness = 0.5 + (lightness - 0.5) * ((100 + params.contrast) / 100)
  }

  // Apply brightness
  if (params.brightness !== 0) {
    lightness += params.brightness / 200
  }

  lightness = Math.max(0, Math.min(1, lightness))

  return hslToHex(params.hue, params.saturation / 100, lightness)
}

/** Generate a 16x16 floor pattern with subtle texture (grayscale values) */
export function generateFloorPattern(variant: number): number[][] {
  const pattern: number[][] = []
  const base = 160 // base gray
  for (let y = 0; y < 16; y++) {
    const row: number[] = []
    for (let x = 0; x < 16; x++) {
      // Subtle noise based on position
      const noise = ((x * 7 + y * 13 + variant * 31) % 17) - 8
      // Edge darkening for subtle tile borders
      const edgeDist = Math.min(x, y, 15 - x, 15 - y)
      const edgeDarken = edgeDist === 0 ? -20 : edgeDist === 1 ? -8 : 0
      row.push(Math.max(0, Math.min(255, base + noise + edgeDarken)))
    }
    pattern.push(row)
  }
  return pattern
}

/** Convert hex room color to HSL params for colorization */
export function hexToFloorParams(hex: string): FloorColorParams {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min

  let h = 0
  let s = 0
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }

  return {
    hue: Math.round(h),
    saturation: Math.round(s * 60), // Reduce saturation for floors
    brightness: Math.round((l - 0.5) * 30),
    contrast: 10,
  }
}
