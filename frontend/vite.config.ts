// https://vitejs.dev/config/
import { fileURLToPath } from "node:url";
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

const muteWarningsPlugin = (warningsToIgnore: string[][]): Plugin => {
  const mutedMessages = new Set()
  return {
    name: 'mute-warnings',
    // @ts-ignore
    enforce: 'pre',
    config: (userConfig) => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            if (warning.code) {
              const muted = warningsToIgnore.find(
                ([code, message]) =>
                  code === warning.code && warning.message.includes(message),
              )

              if (muted) {
                mutedMessages.add(muted.join())
                return
              }
            }

            if (userConfig.build?.rollupOptions?.onwarn) {
              userConfig.build.rollupOptions.onwarn(warning, defaultHandler)
            } else {
              defaultHandler(warning)
            }
          },
        },
      },
    }),
    closeBundle() {
      const diff = warningsToIgnore.filter((x) => !mutedMessages.has(x.join()))
      if (diff.length > 0) {
        this.warn(
          'Some of your muted warnings never appeared during the build process:',
        )
        diff.forEach((m) => this.warn(`- ${m.join(': ')}`))
      }
    },
  }
}

const warningsToIgnore = [
  ['SOURCEMAP_ERROR', "Can't resolve original location of error"],
  ['INVALID_ANNOTATION', 'contains an annotation that Rollup cannot interpret'],
]

export default defineConfig(({ command, mode, isSsrBuild }) => {
  return {
    base: mode === "production" ? "/static/" : "/",
    // base: "/static/",
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
      svgrPlugin(),
      // handlebars({
      //   partialDirectory: resolve(__dirname, 'src/partials'),
      // }) as Plugin,
      muteWarningsPlugin(warningsToIgnore),
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": "http://127.0.0.1:8000",
        "/stats": "http://127.0.0.1:8000",
        "/loggly": "http://127.0.0.1:8000"
        // '/authorization/': '...',
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/setupTests.ts',
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
        include: ['src/**/*.{ts,tsx,js,jsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx,js,jsx}',
          'src/**/*.d.ts',
          'src/setupTests.ts',
          'src/react-app-env.d.ts',
          'src/vite-env.d.ts',
          'src/global.d.ts',
          'src/icons/**',
          'src/**/*.stories.*',
          'src/common/testUtils2.ts',
          'src/common/testRender.tsx',
        ],
        reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
        // Floor only — raise these as coverage improves, never lower them.
        thresholds: {
          lines: 57,
          functions: 57,
          branches: 79,
          statements: 57,
        },
      },
    }
  };
});
