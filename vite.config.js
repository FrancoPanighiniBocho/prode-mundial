import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/prode-mundial/',
  test: {
    globals: true,
  },
})
