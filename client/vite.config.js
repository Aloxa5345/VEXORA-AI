import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Make env vars available at build time
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
  build: {
    // Suppress the 500KB warning — our app is intentionally large
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor core
          'vendor-react': ['react', 'react-dom'],
          'vendor-axios': ['axios'],
          // Monaco editor (largest chunk)
          'vendor-monaco': ['@monaco-editor/react'],
          // Markdown + syntax highlight
          'vendor-markdown': ['react-markdown', 'react-syntax-highlighter'],
          // UUID
          'vendor-utils': ['uuid'],
        },
      },
    },
  },
})
