import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildDepth, PRESETS, type PresetId } from './lib/depth'
import { renderStereogram, separationAt } from './lib/stereogram'
import { PALETTES } from './lib/palettes'
import { Section, Segmented, Slider, Toggle } from './components/ui'
import {
  DownloadIcon,
  EyeLogo,
  MaximizeIcon,
  MinimizeIcon,
  PresetIcon,
  ShuffleIcon,
} from './components/icons'

const SIZES = {
  S: { label: 'Small', w: 640, h: 400 },
  M: { label: 'Medium', w: 960, h: 600 },
  L: { label: 'Large', w: 1280, h: 800 },
  XL: { label: 'Full HD', w: 1920, h: 1080 },
} as const
type SizeId = keyof typeof SIZES

const SIZE_OPTIONS = (Object.keys(SIZES) as SizeId[]).map((id) => ({
  id,
  label: SIZES[id].label,
}))

export default function App() {
  const [preset, setPreset] = useState<PresetId>('disc')
  const [text, setText] = useState('HELLO')
  const [image, setImage] = useState<ImageBitmap | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const [size, setSize] = useState<SizeId>('M')
  const [eyeSep, setEyeSep] = useState(240)
  const [mu, setMu] = useState(0.34)
  const [invert, setInvert] = useState(false)
  const [paletteId, setPaletteId] = useState('nebula')
  const [cell, setCell] = useState(2)
  const [guides, setGuides] = useState(true)
  const [seed, setSeed] = useState(() => (Math.random() * 0xffffffff) >>> 0)
  const [ms, setMs] = useState<number | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const { w, h } = SIZES[size]
  const depth = useMemo(
    () => buildDepth(preset, w, h, { text, image }),
    [preset, w, h, text, image],
  )
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0]

  // Render the stereogram (rAF-batched so slider drags collapse into one render).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = w
      canvas.height = h
      const t0 = performance.now()
      const img = renderStereogram(depth, {
        eyeSep,
        mu,
        invert,
        seed,
        cell,
        colors: palette.colors.length > 0 ? palette.colors : null,
      })
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(img, 0, 0)
      if (guides) {
        const sep = separationAt(0, eyeSep, mu)
        for (const dir of [-1, 1]) {
          const cx = w / 2 + (dir * sep) / 2
          ctx.beginPath()
          ctx.arc(cx, 28, 7, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(cx, 28, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = '#fafafa'
          ctx.fill()
        }
      }
      setMs(Math.max(1, Math.round(performance.now() - t0)))
    })
    return () => cancelAnimationFrame(id)
  }, [depth, w, h, eyeSep, mu, invert, seed, cell, palette, guides])

  // Small grayscale preview of the depth map in the sidebar.
  useEffect(() => {
    const cv = previewRef.current
    if (!cv) return
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const timg = new ImageData(w, h)
    for (let i = 0; i < w * h; i++) {
      let v = depth.data[i]
      if (invert) v = 1 - v
      const b = (v * 255) | 0
      timg.data[i * 4] = b
      timg.data[i * 4 + 1] = b
      timg.data[i * 4 + 2] = b
      timg.data[i * 4 + 3] = 255
    }
    tmp.getContext('2d')!.putImageData(timg, 0, 0)
    const pw = 560
    const ph = Math.round((h / w) * pw)
    cv.width = pw
    cv.height = ph
    cv.getContext('2d')!.drawImage(tmp, 0, 0, pw, ph)
  }, [depth, w, h, invert])

  const shuffle = useCallback(() => setSeed((Math.random() * 0xffffffff) >>> 0), [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void stageRef.current?.requestFullscreen()
    }
  }, [])

  const download = useCallback(() => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `autostereogram-${preset}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }, [preset])

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    createImageBitmap(f).then((bmp) => {
      setImage(bmp)
      setImageName(f.name)
      setPreset('image')
    })
    e.target.value = ''
  }, [])

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-200">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.13),transparent)]"
      />

      <header className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
            <EyeLogo className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">autostereogram.lol</h1>
            <p className="text-xs text-zinc-500">free Magic Eye maker — hide 3D in plain sight</p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid w-full max-w-[1440px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1">
          <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.03]">
            <Section title="Depth map">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs transition-colors ${
                      preset === p.id
                        ? 'border-indigo-400/60 bg-indigo-500/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <PresetIcon id={p.id} className="h-[18px] w-[18px]" />
                    {p.label}
                  </button>
                ))}
              </div>

              {preset === 'text' && (
                <input
                  type="text"
                  value={text}
                  maxLength={24}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type something…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-400/60 focus:outline-none"
                />
              )}

              {preset === 'image' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-indigo-400/50 hover:text-white"
                  >
                    {imageName ? 'Choose a different image…' : 'Choose an image…'}
                  </button>
                  <p className="truncate text-xs text-zinc-500">
                    {imageName
                      ? imageName
                      : 'Bright areas pop out, dark areas recede. Showing the disc until you pick one.'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onFile}
                    className="hidden"
                  />
                </div>
              )}

              <canvas
                ref={previewRef}
                className="w-full rounded-lg border border-white/10"
                aria-label="Depth map preview"
              />
              <Slider
                label="Depth strength"
                value={mu}
                min={0.12}
                max={0.6}
                step={0.01}
                onChange={setMu}
                display={`${Math.round(mu * 100)}%`}
              />
              <Toggle label="Invert depth" checked={invert} onChange={setInvert} />
            </Section>

            <Section title="Pattern">
              <div className="grid grid-cols-4 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.name}
                    aria-label={`${p.name} palette`}
                    onClick={() => setPaletteId(p.id)}
                    className={`h-7 rounded-lg transition-shadow ${
                      paletteId === p.id
                        ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950'
                        : 'ring-1 ring-white/10 hover:ring-white/30'
                    }`}
                    style={{ background: p.swatch }}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-500">{palette.name}</p>
              <Slider
                label="Dot size"
                value={cell}
                min={1}
                max={4}
                onChange={setCell}
                display={`${cell}px`}
              />
            </Section>

            <Section title="Viewing">
              <Segmented options={SIZE_OPTIONS} value={size} onChange={setSize} />
              <Slider
                label="Eye separation"
                value={eyeSep}
                min={140}
                max={340}
                step={10}
                onChange={setEyeSep}
                display={`${eyeSep}px`}
              />
              <Toggle label="Focus dots" checked={guides} onChange={setGuides} />
            </Section>
          </div>
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs text-zinc-500">
                {w} × {h} px{ms !== null ? ` · rendered in ${ms} ms` : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
                >
                  <MaximizeIcon className="h-4 w-4" />
                  Fullscreen
                </button>
                <button
                  type="button"
                  onClick={shuffle}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
                >
                  <ShuffleIcon className="h-4 w-4" />
                  New pattern
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-400"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download PNG
                </button>
              </div>
            </div>
            <div ref={stageRef} className="stage dotgrid relative overflow-auto rounded-xl p-3 sm:p-5">
              <canvas
                ref={canvasRef}
                className="mx-auto block h-auto max-w-full rounded-lg shadow-2xl shadow-black/60"
                aria-label="Generated autostereogram"
              />
              <button
                type="button"
                onClick={() => void document.exitFullscreen()}
                className="fs-exit hidden items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-200 backdrop-blur transition-colors hover:bg-zinc-800"
              >
                <MinimizeIcon className="h-4 w-4" />
                Exit fullscreen
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-2 text-sm font-semibold text-white">How to see the hidden 3D image</h2>
            <div className="grid gap-4 text-sm text-zinc-400 sm:grid-cols-2">
              <p>
                Relax your eyes and focus <em>behind</em> the screen, as if looking into the
                distance. The two focus dots above the pattern will drift apart into three — when
                the middle one locks in, the hidden shape pops out.
              </p>
              <p>
                Struggling? Bring your face close to the screen, let your eyes unfocus completely,
                then move back very slowly without refocusing. It can take a minute the first time
                — keep your head level and be patient.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-2 text-sm font-semibold text-white">What is an autostereogram?</h2>
            <div className="space-y-3 text-sm text-zinc-400">
              <p>
                An autostereogram is a single 2D image that hides a 3D scene in plain sight —
                popularized in the 1990s by the &ldquo;Magic Eye&rdquo; books. The depth is encoded
                in subtle horizontal repetitions of the pattern: when you let each eye lock onto a
                different repeat, your brain fuses them and the hidden shape floats out of the
                noise. No glasses, no special hardware — just your own stereo vision.
              </p>
              <p>
                This generator builds single-image random-dot stereograms (SIRDS) using the classic
                Thimbleby–Inglis–Witten algorithm, entirely in your browser. Pick a built-in depth
                map, type your own text, or upload a photo, then download the result as a PNG and
                share it. It&rsquo;s free, with no signup and no uploads — your images never leave
                your device.
              </p>
            </div>
          </div>

          <footer className="pb-2 text-center text-xs text-zinc-600">
            <a
              href="https://autostereogram.lol"
              className="transition-colors hover:text-zinc-400"
            >
              autostereogram.lol
            </a>
            {' · '}
            <a
              href="https://github.com/scheuclu/autostereogram"
              className="transition-colors hover:text-zinc-400"
            >
              open source on GitHub
            </a>
          </footer>
        </section>
      </main>
    </div>
  )
}
