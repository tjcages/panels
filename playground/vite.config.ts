import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const playgroundRoot = fileURLToPath(new URL(".", import.meta.url))
const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const panelsEntry = fileURLToPath(new URL("../src/index.ts", import.meta.url))

export default defineConfig({
  root: playgroundRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@tjcages/panels": panelsEntry,
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    exclude: ["@tjcages/panels"],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
})
