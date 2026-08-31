import type { CSSProperties, ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-mono text-xs text-zinc-500">{display ?? value}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${pct}%` } as CSSProperties}
      />
    </label>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg py-1 text-sm text-zinc-300"
    >
      {label}
      <span
        className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            value === o.id ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
