/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le dashboard appelle l'API backend ; proxy de dev pour éviter les soucis de CORS localement
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // 5173 est utilisé par un autre projet local (MediQora)
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
