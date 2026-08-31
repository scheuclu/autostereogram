export interface Palette {
  id: string
  name: string
  /** Empty array = fully random RGB noise. */
  colors: string[]
  /** CSS background used for the swatch button. */
  swatch: string
}

const strip = (colors: string[]) => {
  const n = colors.length
  const stops = colors
    .map((c, i) => `${c} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`)
    .join(', ')
  return `linear-gradient(90deg, ${stops})`
}

const make = (id: string, name: string, colors: string[]): Palette => ({
  id,
  name,
  colors,
  swatch: strip(colors),
})

export const PALETTES: Palette[] = [
  make('nebula', 'Nebula', ['#1e1b4b', '#4338ca', '#7c3aed', '#c026d3', '#22d3ee']),
  make('ember', 'Ember', ['#450a0a', '#b91c1c', '#f97316', '#facc15', '#fef3c7']),
  make('reef', 'Reef', ['#042f2e', '#0f766e', '#14b8a6', '#67e8f9', '#f0fdfa']),
  make('meadow', 'Meadow', ['#14532d', '#16a34a', '#84cc16', '#fde047', '#f7fee7']),
  make('candy', 'Candy', ['#500724', '#db2777', '#fb7185', '#fbcfe8', '#fdf2f8']),
  make('mono', 'Mono', ['#09090b', '#fafafa']),
  {
    id: 'rgb',
    name: 'Static',
    colors: [],
    swatch:
      'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #6366f1, #d946ef)',
  },
]
