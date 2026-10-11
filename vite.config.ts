import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'disable-preview-hmr-client',
        transformIndexHtml(html) {
          return html.replace(/<script[^>]+src=["']\/?@vite\/client["'][^>]*><\/script>/g, '');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The preview proxy does not forward Vite's HMR WebSocket reliably.
      // Disable HMR to prevent the client from repeatedly reconnecting.
      hmr: false,
      watch: null,
    },
  };
});
