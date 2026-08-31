# autostereogram.lol

A little web app for making autostereograms ("Magic Eye" images) — single-image
random-dot stereograms that hide a 3D shape you can see by relaxing your eyes.

**Live at [autostereogram.lol](https://autostereogram.lol)**

## Features

- Preset depth maps (sphere, ring, ripples, hills), custom text, or your own image
- Color palettes, adjustable dot size, depth strength, and eye separation
- Hidden-surface removal for clean edges (Thimbleby–Inglis–Witten algorithm)
- Focus dots to help you lock in the 3D effect
- PNG export

## Development

```sh
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build
```

Built with Vite, React, TypeScript, and Tailwind CSS.
