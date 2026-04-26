import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3000";
  const shouldRewriteApiPrefix = env.VITE_API_PROXY_REWRITE !== "false";

  return {
    base: env.VITE_APP_BASE_PATH || "/",
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: shouldRewriteApiPrefix ? (path) => path.replace(/^\/api/, "") : undefined
        },
        "/uploads": {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
