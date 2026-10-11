import 'dotenv/config';
import {createServer as createHttpServer} from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './src/server/api.ts';
import path from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = createHttpServer(app);

  // Body parsing and cookies
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  // Mount Backend REST API
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  if (!isProd) {
    // Mount Vite dev server in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // The preview proxy does not forward Vite's HMR WebSocket reliably.
        // Disable HMR so the injected Vite client does not repeatedly reconnect.
        hmr: false,
      },
      appType: 'custom',
    });

    // Serve index.html for all client-side navigation routes (SPA fallback).
    // Vite middleware only handles module imports and static assets; client routes
    // like /editor, /portfolio, /s/:id, /directory/:category need index.html fallback
    // so refreshing (F5) never yields a 404 error.
    // Serve index.html for all client-side navigation routes (SPA fallback).
    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/@') || req.path.startsWith('/src')) {
        return next();
      }
    
      const acceptsHtml = req.headers.accept?.includes('text/html');
      const hasNoExtension = !path.extname(req.path);
    
      if (acceptsHtml || hasNoExtension) {
        const indexPath = path.resolve(__dirname, 'index.html');
        const source = await readFile(indexPath, 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl || req.url, source);
        res.type('html').send(html);
        return;
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`VectorHub Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
