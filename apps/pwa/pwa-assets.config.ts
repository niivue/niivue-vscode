import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // Add maskable icons for better Android support
    maskable: {
      sizes: [512],
      padding: 0,
    },
    // Add apple touch icons
    apple: {
      sizes: [180],
      padding: 0,
    },
  },
  images: ['public/logo.png'],
})
