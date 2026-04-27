import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env / .env.local (all keys). Client code only sees VITE_* unless we define below.
  const env = loadEnv(mode, __dirname, '')
  const openaiKeyForClient =
    env.VITE_OPENAI_API_KEY ?? env.OPENAI_API_KEY ?? ''

  return {
    plugins: [react()],
    define: {
      // Reuse OPENAI_API_KEY from .env.local for the browser bundle (local dev only).
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(openaiKeyForClient),
    },
  }
})
