import { hash3 } from './prng'

/** Depth values in [0, 1] per pixel; 1 = closest to the viewer. */
export interface DepthField {
  data: Float32Array
  w: number
  h: number
}

export interface RenderOptions {
  /** Assumed distance between the viewer's eyes, in pixels. */
  eyeSep: number
  /** Depth of field µ (0..1): how far the near plane sits in front of the far plane. */
  mu: number
  invert: boolean
  seed: number
  /** Dot size: colors are constant on cell×cell blocks. */
  cell: number
  /** Palette to draw random dots from, or null for fully random RGB. */
  colors: string[] | null
}

/** Stereo separation (px) for a depth value z, per Thimbleby–Inglis–Witten. */
export function separationAt(z: number, eyeSep: number, mu: number): number {
  return Math.round(((1 - mu * z) * eyeSep) / (2 - mu * z))
}

/**
 * Classic single-image random-dot stereogram algorithm
 * ("Displaying 3D Images: Algorithms for Single Image Random Dot Stereograms",
 * Thimbleby, Inglis & Witten, 1994) with hidden-surface removal, plus
 * palette-based coloring via a positional hash so results are seed-stable.
 */
export function renderStereogram(depth: DepthField, o: RenderOptions): ImageData {
  const { data: z, w, h } = depth
  const img = new ImageData(w, h)
  const px = img.data
  const same = new Int32Array(w)
  const zrow = new Float32Array(w)
  const E = o.eyeSep
  const mu = o.mu
  const cell = Math.max(1, o.cell | 0)

  let pal: Uint8Array | null = null
  if (o.colors && o.colors.length > 0) {
    pal = new Uint8Array(o.colors.length * 3)
    o.colors.forEach((c, i) => {
      const v = parseInt(c.slice(1), 16)
      pal![i * 3] = (v >> 16) & 255
      pal![i * 3 + 1] = (v >> 8) & 255
      pal![i * 3 + 2] = v & 255
    })
  }
  const nPal = pal ? pal.length / 3 : 0

  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      same[x] = x
      const d = z[row + x]
      zrow[x] = o.invert ? 1 - d : d
    }

    for (let x = 0; x < w; x++) {
      const zz = zrow[x]
      const s = separationAt(zz, E, mu)
      const left = x - (s >> 1)
      const right = left + s
      if (left < 0 || right >= w) continue

      // Hidden-surface removal: skip the constraint if a nearer surface
      // blocks either eye's view of this point.
      let visible = true
      let t = 1
      let zt: number
      do {
        zt = zz + (2 * (2 - mu * zz) * t) / (mu * E)
        const xl = x - t
        const xr = x + t
        visible = (xl < 0 || zrow[xl] < zt) && (xr >= w || zrow[xr] < zt)
        t++
      } while (visible && zt < 1)
      if (!visible) continue

      // Record "pixel a must equal pixel b" in an ordered union structure
      // where same[i] >= i and same[i] === i means the pixel is free.
      let a = left
      let b = right
      for (;;) {
        if (a === b) break
        if (a > b) {
          const tmp = a
          a = b
          b = tmp
        }
        const n = same[a]
        if (n === a) {
          same[a] = b
          break
        }
        if (n === b) break
        if (n < b) {
          a = n
        } else {
          same[a] = b
          a = b
          b = n
        }
      }
    }

    // Assign colors right-to-left so every linked pixel copies its partner.
    for (let x = w - 1; x >= 0; x--) {
      const i = (row + x) * 4
      if (same[x] === x) {
        const cx = (x / cell) | 0
        const cy = (y / cell) | 0
        if (pal) {
          const k = ((hash3(cx, cy, o.seed) * nPal) | 0) * 3
          px[i] = pal[k]
          px[i + 1] = pal[k + 1]
          px[i + 2] = pal[k + 2]
        } else {
          px[i] = (hash3(cx, cy, o.seed) * 256) | 0
          px[i + 1] = (hash3(cx, cy, o.seed ^ 0x68bc21) * 256) | 0
          px[i + 2] = (hash3(cx, cy, o.seed ^ 0x2545f4) * 256) | 0
        }
      } else {
        const j = (row + same[x]) * 4
        px[i] = px[j]
        px[i + 1] = px[j + 1]
        px[i + 2] = px[j + 2]
      }
      px[i + 3] = 255
    }
  }
  return img
}
