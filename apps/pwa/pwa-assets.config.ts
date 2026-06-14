import { defineConfig } from '@vite-pwa/assets-generator/config'

// Shared PNG output options: 256-color palette mode for ~5x smaller
// generated icons vs RGBA defaults. Sharp adaptively quantizes per
// output size, so each generated PNG gets a palette tuned to its
// resolution.
const png = {
  compressionLevel: 9,
  quality: 80,
  palette: true,
  colors: 256,
} as const

// The source logo (public/logo.png) is a 512x512 RGB downscale of the
// 1024x1024 master at niivue/niivue (packages/docs/static/img/niivue-icon.png).
// The icon has a baked-in near-black background (~#0a0a10), so padding
// is set to 0 — the icon already sits inside its own safe area, and
// adding white padding would create an ugly border on dark icons.
const background = '#0a0a10'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      png,
    },
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { fit: 'contain', background },
      png,
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { fit: 'contain', background },
      png,
    },
  },
  images: ['public/logo.png'],
})
