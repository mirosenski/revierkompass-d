import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import biomePlugin from "vite-plugin-biome"

export default defineConfig({
  plugins: [
    react(),
    biomePlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // JSON-Importe sind standardmäßig unterstützt
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5179',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

