
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // API Keys should not be exposed to the client bundle
        // The application uses /api-proxy to handle secure requests
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
