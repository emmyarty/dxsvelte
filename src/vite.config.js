import { defineConfig } from 'vite'
import { dxsvelte, defineBuild } from 'dxsvelte'

// vite.config.js
export default defineConfig({
  plugins: [
    dxsvelte()
  ],
  build: defineBuild()
})