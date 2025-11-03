// frontend/vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const inDocker = !!env.DOCKER || !!process.env.DOCKER;

  // Si defines VITE_PROXY_TARGET en docker-compose → usa eso.
  // Si no, si estás en Docker, cae a backend:3000. En local, localhost:3000.
  const target =
    env.VITE_PROXY_TARGET ||
    (inDocker ? "http://backend:3000" : "http://localhost:3000");

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
          changeOrigin: false, // dejamos el Host original (localhost:5173)
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = req.headers.host || "localhost:5173";
              // Si tu frontend está detrás de HTTPS, cambia a 'https'
              const proto = (req.headers["x-forwarded-proto"] as string) || "http";
              proxyReq.setHeader("x-forwarded-host", host);
              proxyReq.setHeader("x-forwarded-proto", proto);
            });
          },
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target,
          changeOrigin: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = req.headers.host || "localhost:5173";
              const proto = (req.headers["x-forwarded-proto"] as string) || "http";
              proxyReq.setHeader("x-forwarded-host", host);
              proxyReq.setHeader("x-forwarded-proto", proto);
            });
          },
        },
      },
    },
  };
});
