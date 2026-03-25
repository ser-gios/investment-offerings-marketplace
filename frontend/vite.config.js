import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // In production, always use Render backend
  const renderBackendUrl = 'https://investment-marketplace-api.onrender.com'
  const apiUrl = mode === 'production' ? renderBackendUrl : (env.VITE_API_URL || renderBackendUrl)
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      '__VITE_API_URL__': JSON.stringify(apiUrl),
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
