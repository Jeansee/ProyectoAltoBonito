// frontend/vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const inDocker = !!env.DOCKER || !!process.env.DOCKER;
  const target =
    env.VITE_PROXY_TARGET || (inDocker ? "http://backend:3000" : "http://localhost:3000");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target,
          /**
           * IMPORTANTE:
           * - Mantén el Host original (localhost:5173) para que el backend
           *   pueda calcular correctamente el redirect_uri.
           * - Enviamos x-forwarded-* para que el backend los lea.
           */
          changeOrigin: false,
          headers: {
            "x-forwarded-host": "localhost:5173",
            "x-forwarded-proto": "http",
          },
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target,
          changeOrigin: false,
          headers: {
            "x-forwarded-host": "localhost:5173",
            "x-forwarded-proto": "http",
          },
        },
      },
    },
  };
});
