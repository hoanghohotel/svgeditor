import { createClient, type User } from '@supabase/supabase-js';
import { type Request, type Response, type NextFunction } from 'express';
import { getSupabaseClient } from '../db/supabaseClient';
import { z } from 'zod';

const cookieName = 'vh_session';
const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  sameSite: 'strict' as const, path: '/',
});

// A fresh client avoids sharing login state across concurrent serverless requests.
export function createAuthClient() {
  const url = process.env.SVG_SUPABASE_URL;
  const key = process.env.SVG_SUPABASE_PUBLISHABLE_KEY || process.env.SVG_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function isAdmin(user: User): boolean {
  const emails = (process.env.SVG_ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  return Boolean(user.email_confirmed_at && user.email && emails.includes(user.email.toLowerCase()));
}

function profile(user: User) {
  return { id: user.id, email: user.email, display_name: user.email?.split('@')[0] || '', role: isAdmin(user) ? 'admin' : 'viewer' };
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  (req as any).user = null;
  const token = req.cookies?.[cookieName];
  if (!token) return next();
  try {
    const client = createAuthClient();
    if (client) {
      const { data, error } = await client.auth.getUser(token);
      if (!error && data.user) (req as any).user = profile(data.user);
      else res.clearCookie(cookieName, cookieOptions());
    }
  } catch {
    // Failed verification never grants access.
  }
  next();
}

export function protectOperations(req: Request, res: Response, next: NextFunction) {
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  // Only optimization and login/logout may be used without admin rights.
  const publicMutation = ['/svg/optimize', '/auth/login', '/auth/logout'].includes(req.path);
  if (mutating) {
    const origin = req.get('origin');
    const host = req.get('x-forwarded-host') || req.get('host');
    let crossOrigin = req.get('sec-fetch-site') === 'cross-site';
    try { if (origin && new URL(origin).host !== host) crossOrigin = true; } catch { crossOrigin = true; }
    if (crossOrigin) {
      return res.status(403).json({ error: 'Cross-origin request rejected' });
    }
    if (!req.is('application/json')) return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  if (req.path === '/admin' || req.path.startsWith('/admin/') || (mutating && !publicMutation)) {
    res.setHeader('Cache-Control', 'no-store');
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) });

export async function login(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password format' });
  try {
    const client = createAuthClient();
    if (!client) return res.status(503).json({ error: 'Authentication is not configured' });
    const { data, error } = await client.auth.signInWithPassword(parsed.data);
    if (error || !data.session || !data.user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!isAdmin(data.user)) return res.status(403).json({ error: 'This account does not have admin access' });
    res.cookie(cookieName, data.session.access_token, { ...cookieOptions(), maxAge: data.session.expires_in * 1000 });
    res.clearCookie('vh_user', { path: '/' });
    res.json({ profile: profile(data.user), authenticated: true });
  } catch {
    res.status(503).json({ error: 'Authentication service unavailable' });
  }
}

export async function logout(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const token = req.cookies?.[cookieName];
  res.clearCookie(cookieName, cookieOptions());
  res.clearCookie('vh_user', { path: '/' });
  try {
    if (token) await getSupabaseClient()?.auth.admin.signOut(token, 'local');
  } catch { /* Clear the browser cookie even if Supabase is unavailable. */ }
  res.json({ authenticated: false });
}
