import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "../app/dist",
  },
 server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api/, ""),
      configure: (proxy) => {
        proxy.on("proxyReq", (_, req) => {
          console.log(">>> PROXY:", req.url)
        })
      }
    }
  }
}
,
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})