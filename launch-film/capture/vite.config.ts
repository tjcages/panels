import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The film captures the real package source from the panels checkout.
const panelsRoot = process.env.PANELS_ROOT || fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@tjcages/panels": `${panelsRoot}/src/index.ts` },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: { exclude: ["@tjcages/panels"] },
  server: { fs: { allow: [panelsRoot, "."] } },
})
