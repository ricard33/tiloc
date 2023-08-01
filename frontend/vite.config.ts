// https://vitejs.dev/config/
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";

// // @ts-ignore
// import { dependencies } from './package.json';
//
// const exclVendors = ['react', 'react-router-dom', 'react-dom']
// function renderChunks(deps: Record<string, string>) {
//   let chunks = {}
//   Object.keys(deps).forEach((key) => {
//     if (exclVendors.includes(key)) return
//     chunks[key] = [key]
//   })
//   return chunks
// }

export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    base: mode === "production" ? "/static/" : "/",
    // base: "/static/",
    build: {
      outDir: "build",
      manifest: "vite-manifest.json",
      sourcemap: true,
      // minify: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-router-dom', 'react-dom'],
            'chart.js': ['chart.js'],
            'date-fns': ['date-fns'],
            'mui': ['@mui/icons-material', '@mui/material', "@mui/styles", "@mui/system", "@mui/x-data-grid", "@mui/x-date-pickers"]
            // ...renderChunks(dependencies),
          },
        },
      },
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
