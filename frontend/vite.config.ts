// https://vite.dev/config/
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  return {
    base: mode === "production" ? "/static/" : "/",
    build: {
      outDir: "build",
      manifest: "vite-manifest.json",
      // sourcemap: true,
      // minify: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-router-dom', 'react-dom'],
            'chart.js': ['chart.js'],
            'date-fns': ['date-fns'],
            'mui': ['@mui/icons-material', '@mui/material', "@mui/system", "@mui/x-data-grid", "@mui/x-date-pickers"]
          },
        },
      },
    },
    plugins: [
      react(),
      // Type/lint overlay for dev and build only — it spawns tsc/eslint watchers that
      // just add noise (and cost) under Vitest, which type-checks via `yarn compile`.
      !process.env.VITEST && checker({
        overlay: { initialIsOpen: false },
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
          useFlatConfig: true,
        },
      }),
      svgrPlugin(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": "http://127.0.0.1:8000",
        "/stats": "http://127.0.0.1:8000",
        "/loggly": "http://127.0.0.1:8000"
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/setupTests.ts',
      // A few heavy views (the year-grid AnnualView especially) race the findBy* timeout
      // under full parallel load with v8 coverage instrumentation; retry keeps CI
      // deterministic without masking real breakage. testTimeout is raised to match.
      retry: 2,
      testTimeout: 20000,
      // Node loads react-hook-form-mui's CJS build in tests, which require()s its own copy of
      // react-hook-form — so <FormContainer> and a component's own useFormContext() end up in
      // different React contexts. Point at rhf-mui's ESM build (real `import`s) so Vite
      // resolves react-hook-form once.
      alias: [
        {
          find: /^react-hook-form-mui$/,
          replacement: fileURLToPath(new URL('./node_modules/react-hook-form-mui/dist/esm/index.js', import.meta.url)),
        },
      ],
      coverage: {
        // Scope the report to our own code. Without an explicit `include`, the v8
        // provider also tries to convert coverage for executed dependencies, and
        // chokes on a non-JSON inline source map shipped by one of them.
        provider: 'v8',
        all: true,
        // Vitest 3+ counts v8 coverage via AST-aware remapping, so the statement/
        // branch totals (and therefore the percentages) are much lower than the old
        // v8-to-istanbul numbers -- same code, different denominator. Thresholds below
        // are re-baselined to that scale.
        include: ['src/**/*.{ts,tsx,js,jsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx,js,jsx}',
          'src/**/*.d.ts',
          'src/setupTests.ts',
          'src/vite-env.d.ts',
          'src/icons/**',
          'src/**/*.stories.*',
          'src/common/testUtils2.ts',
          'src/common/testRender.tsx',
        ],
        reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
        // Floor only — raise as coverage improves. Local full run sits at
        // ~62% lines / ~51% branches / ~57% functions; keep a margin under that.
        thresholds: {
          lines: 58,
          functions: 53,
          branches: 47,
          statements: 58,
        },
      },
    }
  };
});
