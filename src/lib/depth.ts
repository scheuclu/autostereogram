import { hash3 } from './prng'
import type { DepthField } from './stereogram'

export type PresetId = 'disc' | 'ring' | 'bullseye' | 'blobs' | 'text' | 'image'

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'disc', label: 'Disc' },
  { id: 'ring', label: 'Ring' },
  { id: 'bullseye', label: 'Bullseye' },
  { id: 'blobs', label: 'Blobs' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
]

export interface DepthSources {
  text: string
  image: ImageBitmap | null
}

export function buildDepth(preset: PresetId, w: number, h: number, src: DepthSources): DepthField {
  switch (preset) {
    case 'disc':
      return disc(w, h)
    case 'ring':
      return ring(w, h)
    case 'bullseye':
      return bullseye(w, h)
    case 'blobs':
      return blobs(w, h)
    case 'text':
      return text(w, h, src.text)
    case 'image':
      // Fall back to the disc until an image has been chosen.
      return src.image ? fromImage(w, h, src.image) : disc(w, h)
  }
}

function field(w: number, h: number): DepthField {
  return { data: new Float32Array(w * h), w, h }
}

// The built-in shapes are strictly two-level (0 = background, 1 = shape) with
// hard edges: a flat cutout floating in front of a flat wall. Soft gradients
// smear the stereo separation across many pixels, which blurs the silhouette
// and makes the shape harder to fuse than a crisp step does.

function disc(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const R2 = (Math.min(w, h) * 0.34) ** 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy < R2) f.data[y * w + x] = 1
    }
  }
  return f
}

function ring(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const m = Math.min(w, h)
  const inner = m * 0.2
  const outer = m * 0.36
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot(x - cx, y - cy)
      if (r >= inner && r < outer) f.data[y * w + x] = 1
    }
  }
  return f
}

function bullseye(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const m = Math.min(w, h)
  const band = m * 0.075
  const limit = m * 0.45
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot(x - cx, y - cy)
      if (r < limit && ((r / band) | 0) % 2 === 0) f.data[y * w + x] = 1
    }
  }
  return f
}

function blobs(w: number, h: number): DepthField {
  const f = field(w, h)
  const m = Math.min(w, h)
  const discs: { x: number; y: number; r2: number }[] = []
  for (let i = 0; i < 6; i++) {
    const r = m * (0.08 + 0.11 * hash3(i, 3, 99))
    discs.push({
      x: w * (0.14 + 0.72 * hash3(i, 1, 99)),
      y: h * (0.16 + 0.68 * hash3(i, 2, 99)),
      r2: r * r,
    })
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (const d of discs) {
        const dx = x - d.x
        const dy = y - d.y
        if (dx * dx + dy * dy < d.r2) {
          f.data[y * w + x] = 1
          break
        }
      }
    }
  }
  return f
}

function text(w: number, h: number, str: string): DepthField {
  const f = field(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const s = str.trim() || 'HELLO'
  let size = h * 0.5
  ctx.font = `900 ${size}px system-ui, sans-serif`
  const tw = ctx.measureText(s).width
  const maxW = w * 0.86
  if (tw > maxW) {
    size *= maxW / tw
    ctx.font = `900 ${size}px system-ui, sans-serif`
  }
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(s, w / 2, h / 2)
  const data = ctx.getImageData(0, 0, w, h).data
  // Threshold so the glyphs' antialiased edges become hard steps too.
  for (let i = 0; i < w * h; i++) f.data[i] = data[i * 4] > 127 ? 1 : 0
  return f
}

function fromImage(w: number, h: number, img: ImageBitmap): DepthField {
  const f = field(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  const data = ctx.getImageData(0, 0, w, h).data
  let min = 1
  let max = 0
  for (let i = 0; i < w * h; i++) {
    const v = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
    f.data[i] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  // Stretch to the full [0, 1] range so flat images still have depth to work with.
  const range = max - min
  if (range > 0.01) for (let i = 0; i < f.data.length; i++) f.data[i] = (f.data[i] - min) / range
  return f
}
