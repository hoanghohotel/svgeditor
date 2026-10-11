import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './api';

export const app = express();

// Body parsing and cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Permissive CORS & Headers for API calls
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount Backend REST API router
// In serverless environments (like Vercel), the route might arrive as /api/... or as /...
// Mounting at both paths guarantees that all endpoints are reachable.
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
