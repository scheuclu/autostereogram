import { hash3 } from './prng'
import type { DepthField } from './stereogram'

export type PresetId = 'sphere' | 'ring' | 'ripples' | 'hills' | 'text' | 'image'

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'sphere', label: 'Sphere' },
  { id: 'ring', label: 'Ring' },
  { id: 'ripples', label: 'Ripples' },
  { id: 'hills', label: 'Hills' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
]

export interface DepthSources {
  text: string
  image: ImageBitmap | null
}

export function buildDepth(preset: PresetId, w: number, h: number, src: DepthSources): DepthField {
  switch (preset) {
    case 'sphere':
      return sphere(w, h)
    case 'ring':
      return ring(w, h)
    case 'ripples':
      return ripples(w, h)
    case 'hills':
      return hills(w, h)
    case 'text':
      return text(w, h, src.text)
    case 'image':
      // Fall back to the sphere until an image has been chosen.
      return src.image ? fromImage(w, h, src.image) : sphere(w, h)
  }
}

function field(w: number, h: number): DepthField {
  return { data: new Float32Array(w * h), w, h }
}

function sphere(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const R = Math.min(w, h) * 0.38
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / R
      const dy = (y - cy) / R
      const rr = dx * dx + dy * dy
      if (rr < 1) f.data[y * w + x] = Math.sqrt(1 - rr)
    }
  }
  return f
}

function ring(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const m = Math.min(w, h)
  const R = m * 0.3
  const tube = m * 0.13
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.abs(Math.hypot(x - cx, y - cy) - R) / tube
      if (d < 1) f.data[y * w + x] = Math.sqrt(1 - d * d)
    }
  }
  return f
}

function ripples(w: number, h: number): DepthField {
  const f = field(w, h)
  const cx = w / 2
  const cy = h / 2
  const m = Math.min(w, h)
  const k = (2 * Math.PI) / (m / 4.5)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot(x - cx, y - cy)
      const env = Math.max(0, 1 - r / (m * 0.52))
      f.data[y * w + x] = env * (0.5 + 0.5 * Math.cos(r * k))
    }
  }
  return f
}

function hills(w: number, h: number): DepthField {
  const f = field(w, h)
  const m = Math.min(w, h)
  const blobs: { x: number; y: number; s2: number; a: number }[] = []
  for (let i = 0; i < 6; i++) {
    const s = m * (0.1 + 0.14 * hash3(i, 3, 99))
    blobs.push({
      x: w * (0.12 + 0.76 * hash3(i, 1, 99)),
      y: h * (0.15 + 0.7 * hash3(i, 2, 99)),
      s2: 2 * s * s,
      a: 0.45 + 0.55 * hash3(i, 4, 99),
    })
  }
  let max = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let z = 0
      for (const b of blobs) {
        const dx = x - b.x
        const dy = y - b.y
        z += b.a * Math.exp(-(dx * dx + dy * dy) / b.s2)
      }
      f.data[y * w + x] = z
      if (z > max) max = z
    }
  }
  if (max > 0) for (let i = 0; i < f.data.length; i++) f.data[i] = Math.min(1, f.data[i] / max)
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
  ctx.filter = 'blur(1.5px)'
  ctx.fillText(s, w / 2, h / 2)
  const data = ctx.getImageData(0, 0, w, h).data
  for (let i = 0; i < w * h; i++) f.data[i] = data[i * 4] / 255
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
