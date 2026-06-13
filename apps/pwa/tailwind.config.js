import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Tailwind's glob engine only understands POSIX separators, so normalize the
    // Windows backslashes that join() produces — otherwise the @niivue/react
    // source isn't scanned on Windows and its utility classes (flex-col, etc.)
    // go missing from the build.
    join(__dirname, '../../packages/niivue-react/src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
