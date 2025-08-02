import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    join(__dirname, '../../packages/niivue-react/src/**/*.{js,ts,jsx,tsx}'),
  ],
  safelist: [
    'text-white',
    'p-0',
    'w-screen', 
    'h-screen'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}