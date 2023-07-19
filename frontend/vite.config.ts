// https://vitejs.dev/config/
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    base: mode === "production" ? "/static/" : "/",
    // base: "/static/",
    build: {
      outDir: "build",
      manifest: "vite-manifest.json"
    },
    plugins: [
      react(),
      checker({
        overlay: { initialIsOpen: false },
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        },
      }),
      reactRefresh(),
      viteTsconfigPaths(),
      svgrPlugin()
      // handlebars({
      //   partialDirectory: resolve(__dirname, 'src/partials'),
      // }) as Plugin,
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": "http://127.0.0.1:8000",
        "/stats": "http://127.0.0.1:8000"
        // '/authorization/': '...',
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/setupTests.ts',
    }
  };
});
