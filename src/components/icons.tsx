import type { PresetId } from '../lib/depth'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function EyeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <path d="M15 3h6v6" />
      <path d="m21 3-7 7" />
      <path d="m3 21 7-7" />
      <path d="M9 21H3v-6" />
    </svg>
  )
}

export function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <path d="M4 14h6v6" />
      <path d="m10 14-7 7" />
      <path d="M20 10h-6V4" />
      <path d="m14 10 7-7" />
    </svg>
  )
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

export function PresetIcon({ id, className }: { id: PresetId; className?: string }) {
  switch (id) {
    case 'disc':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <circle cx="10" cy="10" r="7" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'ring':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <path
            d="M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14Zm0 4a3 3 0 1 1 0 6 3 3 0 1 1 0-6Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      )
    case 'bullseye':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <path
            d="M10 2a8 8 0 1 0 0 16 8 8 0 1 0 0-16Zm0 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 1 1 0-11Z"
            fill="currentColor"
            stroke="none"
          />
          <circle cx="10" cy="10" r="3" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'blobs':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <circle cx="7" cy="7" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="14" cy="13" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="5" r="2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'text':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <path d="M4 6V4h12v2M10 4v12M7.5 16h5" />
        </svg>
      )
    case 'image':
      return (
        <svg viewBox="0 0 20 20" className={className} {...base}>
          <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
          <circle cx="7" cy="8" r="1.4" />
          <path d="m4 14 4-4 3 3 3-3 3.5 3.5" />
        </svg>
      )
  }
}
