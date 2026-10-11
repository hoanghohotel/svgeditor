import express, { Request, Response, Router } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/database';
import { sanitizeAndValidateSvg } from './svgSecurity';
import { runSvgoOptimization } from './svgoService';
import { queryPubChemCompound } from './scienceService';
import { runFontAwesomeImport } from '../../scripts/import-font-awesome';
import {
  checkSupabaseHealth,
  syncLocalDatabaseToSupabase,
  getSupabaseConfigInfo,
} from '../db/supabaseClient';

export const apiRouter = Router();

// ==========================================
// Zod Schemas for Request Validation
// ==========================================

const createSvgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  svg_content: z.string().min(10, 'Valid SVG content is required'),
  collection_id: z.string().optional(),
  category_id: z.string().optional(),
  license_id: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  style: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  storage_path: z.string().max(500).optional(),
  content_hash: z.string().max(64).optional(),
  is_pro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSvgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  svg_content: z.string().min(10).optional(),
  collection_id: z.string().optional(),
  category_id: z.string().optional(),
  license_id: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  style: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  storage_path: z.string().max(500).optional(),
  content_hash: z.string().max(64).optional(),
  is_pro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const optimizeSchema = z.object({
  svg: z.string().min(1, 'SVG content is required'),
  multipass: z.boolean().optional(),
  precision: z.number().min(0).max(5).optional(),
});

const importBatchSchema = z.object({
  assets: z.array(
    z.object({
      name: z.string().min(1),
      svg_content: z.string().min(10),
      description: z.string().optional(),
      category_slug: z.string().optional(),
      collection_slug: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
  ).min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const scienceQuerySchema = z.object({
  compound_name: z.string().min(1, 'Compound name or identifier is required'),
});

// Simple Mock Session Middleware for Full-Stack Demo
const authenticateUser = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  const cookieUser = req.cookies?.vh_user;

  if (authHeader?.startsWith('Bearer admin-token') || cookieUser === 'admin@vectorhub.dev') {
    (req as any).user = dbStore.getProfileByEmail('admin@vectorhub.dev');
  } else if (authHeader?.startsWith('Bearer editor-token') || cookieUser === 'editor@vectorhub.dev') {
    (req as any).user = dbStore.getProfileByEmail('editor@vectorhub.dev');
  } else {
    // Default viewer
    (req as any).user = null;
  }
  next();
};

apiRouter.use(authenticateUser);

// ==========================================
// 1. SVG Assets Endpoints
// ==========================================

// GET /api/svg - List, search, filter, sort, paginate
apiRouter.get('/svg', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;
    const categorySlug = req.query.category as string | undefined;
    const collectionSlug = req.query.collection as string | undefined;
    const tagSlug = req.query.tag as string | undefined;
    const style = req.query.style as string | undefined;
    const source = req.query.source as string | undefined;
    const isProQuery = req.query.is_pro as string | undefined;
    const is_pro = isProQuery === 'true' ? true : isProQuery === 'false' ? false : undefined;
    const search = req.query.q as string | undefined;
    const sort = req.query.sort as string | undefined;
    const status = req.query.status as string | undefined;

    const result = dbStore.getSvgAssets({
      page,
      limit,
      categorySlug,
      collectionSlug,
      tagSlug,
      style,
      source,
      is_pro,
      search,
      sort,
      status,
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching SVGs:', err);
    res.status(500).json({ error: 'Failed to retrieve SVG assets' });
  }
});

// GET /api/search - Dedicated Search API
apiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;

    const result = dbStore.getSvgAssets({
      page,
      limit,
      search: q,
      status: 'published',
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/svg/:id - Retrieve SVG details
apiRouter.get('/svg/:id', (req: Request, res: Response) => {
  try {
    const asset = dbStore.getSvgAssetById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve asset details' });
  }
});

// POST /api/svg - Create an SVG asset (Security Sanitization + Zod Validation)
apiRouter.post('/svg', (req: Request, res: Response) => {
  try {
    const validationResult = createSvgSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const {
      name,
      slug,
      description,
      svg_content,
      collection_id,
      category_id,
      license_id,
      status,
      style,
      source,
      storage_path,
      content_hash,
      is_pro,
      tags,
    } = validationResult.data;

    // Security sanitization
    const security = sanitizeAndValidateSvg(svg_content);
    if (!security.isValid) {
      return res.status(400).json({
        error: 'SVG Security validation failed',
        violations: security.violations,
      });
    }

    const newAsset = dbStore.createSvgAsset({
      name,
      slug,
      description,
      svg_content: security.sanitizedSvg,
      collection_id,
      category_id,
      license_id,
      width: security.width,
      height: security.height,
      view_box: security.viewBox,
      file_size: security.fileSizeBytes,
      status,
      style,
      source,
      storage_path,
      content_hash,
      is_pro,
      tags,
    });

    res.status(201).json({
      message: 'SVG created successfully',
      asset: dbStore.getSvgAssetById(newAsset.id),
      securityNotes: security.violations.length > 0 ? security.violations : undefined,
    });
  } catch (err) {
    console.error('Error creating SVG:', err);
    res.status(500).json({ error: 'Failed to create SVG asset' });
  }
});

// PATCH /api/svg/:id - Update an SVG asset
apiRouter.patch('/svg/:id', (req: Request, res: Response) => {
  try {
    const parseRes = updateSvgSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseRes.error.issues,
      });
    }

    const updateData: any = { ...parseRes.data };

    if (updateData.svg_content) {
      const security = sanitizeAndValidateSvg(updateData.svg_content);
      if (!security.isValid) {
        return res.status(400).json({
          error: 'SVG security check failed',
          violations: security.violations,
        });
      }
      updateData.svg_content = security.sanitizedSvg;
      updateData.width = security.width;
      updateData.height = security.height;
      updateData.view_box = security.viewBox;
      updateData.file_size = security.fileSizeBytes;
    }

    const updated = dbStore.updateSvgAsset(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }

    res.json({
      message: 'SVG updated successfully',
      asset: dbStore.getSvgAssetById(updated.id),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SVG asset' });
  }
});

// DELETE /api/svg/:id - Delete an SVG asset
apiRouter.delete('/svg/:id', (req: Request, res: Response) => {
  try {
    const success = dbStore.deleteSvgAsset(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }
    res.json({ message: 'SVG asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete SVG asset' });
  }
});

// ==========================================
// 2. Taxonomy Endpoints
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  res.json(dbStore.getCategories());
});

apiRouter.get('/collections', (_req: Request, res: Response) => {
  res.json(dbStore.getCollections());
});

apiRouter.get('/licenses', (_req: Request, res: Response) => {
  res.json(dbStore.getLicenses());
});

apiRouter.get('/tags', (_req: Request, res: Response) => {
  res.json(dbStore.getTags());
});

apiRouter.get('/styles', (_req: Request, res: Response) => {
  res.json(dbStore.getStyles());
});

// ==========================================
// 3. Optimization & Import Endpoints
// ==========================================

// POST /api/svg/optimize - SVGO optimization
apiRouter.post('/svg/optimize', (req: Request, res: Response) => {
  try {
    const parseRes = optimizeSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Invalid optimization request', details: parseRes.error.issues });
    }

    const { svg, multipass, precision } = parseRes.data;
    const result = runSvgoOptimization(svg, { multipass, precision });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Optimization service error' });
  }
});

// POST /api/svg/import - Batch Import
apiRouter.post('/svg/import', (req: Request, res: Response) => {
  try {
    const parseRes = importBatchSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Invalid batch format', details: parseRes.error.issues });
    }

    const { assets } = parseRes.data;
    const imported: any[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    const categories = dbStore.getCategories();
    const collections = dbStore.getCollections();

    for (const item of assets) {
      try {
        const security = sanitizeAndValidateSvg(item.svg_content);
        if (!security.isValid) {
          errors.push({ name: item.name, error: security.violations.join(', ') });
          continue;
        }

        const category = categories.find((c) => c.slug === item.category_slug) || categories[0];
        const collection = collections.find((col) => col.slug === item.collection_slug) || collections[0];

        const created = dbStore.createSvgAsset({
          name: item.name,
          description: item.description,
          svg_content: security.sanitizedSvg,
          category_id: category.id,
          collection_id: collection.id,
          width: security.width,
          height: security.height,
          view_box: security.viewBox,
          file_size: security.fileSizeBytes,
          status: 'published',
          tags: item.tags,
        });

        imported.push(dbStore.getSvgAssetById(created.id));
      } catch (e) {
        errors.push({ name: item.name, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      importedCount: imported.length,
      failedCount: errors.length,
      imported,
      errors,
    });
  } catch (err) {
    res.status(500).json({ error: 'Batch import failed' });
  }
});

// ==========================================
// 4. Admin & Auth Endpoints
// ==========================================

apiRouter.get('/admin/stats', (_req: Request, res: Response) => {
  res.json(dbStore.getAdminStats());
});

// POST /api/admin/import-fa - Run or trigger Font Awesome Pro local directory import
apiRouter.post('/admin/import-fa', async (req: Request, res: Response) => {
  try {
    const dir = req.body.dir || process.env.FA_PRO_DIR || './assets/sample-fa-pro';
    const dryRun = Boolean(req.body.dryRun);
    const force = Boolean(req.body.force);
    const batchSize = parseInt(req.body.batchSize, 10) || 50;

    const result = await runFontAwesomeImport({
      dir,
      dryRun,
      batchSize,
      resumeFile: './.import-cache/fa-import-resume.json',
      collectionName: req.body.collectionName || 'Font Awesome Pro',
      force,
      help: false,
    });

    res.json(result);
  } catch (err) {
    console.error('Error in Font Awesome import:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Import failed' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const parseRes = loginSchema.safeParse(req.body);
  if (!parseRes.success) {
    return res.status(400).json({ error: 'Invalid login credentials format' });
  }

  const { email } = parseRes.data;
  const profile = dbStore.getProfileByEmail(email);

  if (!profile) {
    return res.status(401).json({ error: 'Invalid credentials or user not found' });
  }

  res.cookie('vh_user', profile.email, { httpOnly: false, path: '/' });
  res.json({
    message: 'Authentication successful',
    token: `${profile.role}-token-${Date.now()}`,
    profile,
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    // Return admin profile as default demo operator so user can experience the Admin Dashboard immediately
    const demoAdmin = dbStore.getProfileByEmail('admin@vectorhub.dev');
    return res.json({ profile: demoAdmin, authenticated: true });
  }
  res.json({ profile: user, authenticated: true });
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('vh_user', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// 5. Science Skill Integration Endpoint
// ==========================================

apiRouter.post('/science/fetch-chemical-svg', async (req: Request, res: Response) => {
  try {
    const parseRes = scienceQuerySchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Compound identifier is required' });
    }

    const { compound_name } = parseRes.data;
    const compoundInfo = await queryPubChemCompound(compound_name);

    res.json({
      success: true,
      compound: compoundInfo,
    });
  } catch (err) {
    console.error('PubChem resolution error:', err);
    res.status(404).json({
      error: err instanceof Error ? err.message : 'Could not resolve chemical compound',
    });
  }
});

// ==========================================
// 6. Supabase / PostgreSQL Integration Endpoints
// ==========================================

apiRouter.get('/admin/supabase-status', async (_req: Request, res: Response) => {
  try {
    const configInfo = getSupabaseConfigInfo();
    const health = await checkSupabaseHealth();
    res.json({
      config: configInfo,
      health,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to query Supabase status',
    });
  }
});

apiRouter.post('/admin/supabase-sync', async (_req: Request, res: Response) => {
  try {
    const syncResult = await syncLocalDatabaseToSupabase();
    res.json(syncResult);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to sync to Supabase',
    });
  }
});

