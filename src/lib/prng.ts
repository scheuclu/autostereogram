/** Deterministic 2D hash → [0, 1). Stable for a given (x, y, seed). */
export function hash3(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 0x27d4eb2f) ^ Math.imul(y, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca77)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae3d)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
