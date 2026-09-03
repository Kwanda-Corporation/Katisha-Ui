import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// The pre-renderer (scripts/prerender.mjs) writes route `/` to dist/index.html,
// which would otherwise clobber the pristine Vite shell that later runs use as
// their HTML template. Preserve a canonical copy as the pre-render template.
function ssrShellPreserve(): Plugin {
  return {
    name: 'katisha-ssr-shell-preserve',
    apply: 'build',
    closeBundle() {
      const src = resolve('dist/index.html')
      const dest = resolve('dist/.ssr-shell.html')
      if (existsSync(src)) copyFileSync(src, dest)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ssrShellPreserve(),
  ],
  resolve: {
    alias: {
      // react-country-flag ships a CJS build that references `module` and
      // breaks under Vite's SSR evaluation. Point at its ESM build, which is
      // SSR-safe (used on the public onboarding/nav/phone pages we pre-render).
      'react-country-flag': 'react-country-flag/dist/react-country-flag.esm.js',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router', 'react-router-dom', 'socket.io-client'],
          ui: ['framer-motion', 'lucide-react', 'react-helmet-async'],
          data: ['axios', 'i18next', 'react-i18next', 'date-fns'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
    cssMinify: true,
    chunkSizeWarningLimit: 700,
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
