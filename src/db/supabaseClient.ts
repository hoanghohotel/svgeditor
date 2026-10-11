import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dbStore } from './database';
import { POSTGRES_MIGRATION_SQL } from './schema';

export interface SupabaseConfigInfo {
  isConfigured: boolean;
  supabaseUrl: string | null;
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasDatabaseUrl: boolean;
  databaseUrlRequiresPassword: boolean;
  databaseHost: string | null;
}

function getCredentials() {
  const url = process.env.SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  return { url, key };
}

// Lazy/singleton client
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const { url, key } = getCredentials();
  if (!url || !key) return null;

  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getSupabaseConfigInfo(): SupabaseConfigInfo {
  const dbUrl = process.env.DATABASE_URL || '';
  const url = process.env.SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const pubKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  const requiresPassword = dbUrl.includes('[YOUR-PASSWORD]');
  let dbHost: string | null = null;
  if (dbUrl) {
    const match = dbUrl.match(/@([^:/]+)/);
    if (match) dbHost = match[1];
  }

  return {
    isConfigured: Boolean(url && (secretKey || pubKey)),
    supabaseUrl: url || null,
    hasSecretKey: Boolean(secretKey),
    hasPublishableKey: Boolean(pubKey),
    hasDatabaseUrl: Boolean(dbUrl),
    databaseUrlRequiresPassword: requiresPassword,
    databaseHost: dbHost,
  };
}

export interface SupabaseHealthCheck {
  connected: boolean;
  url: string;
  tablesStatus: {
    svg_assets: boolean;
    categories: boolean;
    collections: boolean;
    licenses: boolean;
    profiles: boolean;
  };
  remoteCounts: {
    svg_assets?: number;
    categories?: number;
    collections?: number;
  };
  tablesExist: boolean;
  message: string;
  error?: string;
  migrationSql: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthCheck> {
  const client = getSupabaseClient();
  const info = getSupabaseConfigInfo();

  if (!client || !info.supabaseUrl) {
    return {
      connected: false,
      url: info.supabaseUrl || 'Not configured',
      tablesStatus: {
        svg_assets: false,
        categories: false,
        collections: false,
        licenses: false,
        profiles: false,
      },
      remoteCounts: {},
      tablesExist: false,
      message: 'Supabase credentials are not configured in environment variables.',
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  }

  const tablesStatus = {
    svg_assets: false,
    categories: false,
    collections: false,
    licenses: false,
    profiles: false,
  };
  const remoteCounts: Record<string, number> = {};

  try {
    // Check svg_assets table
    const { error: assetErr } = await client.from('svg_assets').select('id').limit(1);
    if (!assetErr) {
      tablesStatus.svg_assets = true;
      const { count } = await client.from('svg_assets').select('*', { count: 'exact', head: true });
      remoteCounts.svg_assets = count || 0;
    }

    // Check categories table
    const { error: catErr } = await client.from('categories').select('id').limit(1);
    if (!catErr) {
      tablesStatus.categories = true;
      const { count } = await client.from('categories').select('*', { count: 'exact', head: true });
      remoteCounts.categories = count || 0;
    }

    // Check collections table
    const { error: colErr } = await client.from('collections').select('id').limit(1);
    if (!colErr) {
      tablesStatus.collections = true;
      const { count } = await client.from('collections').select('*', { count: 'exact', head: true });
      remoteCounts.collections = count || 0;
    }

    // Check licenses
    const { error: licErr } = await client.from('licenses').select('id').limit(1);
    if (!licErr) tablesStatus.licenses = true;

    // Check profiles
    const { error: profErr } = await client.from('profiles').select('id').limit(1);
    if (!profErr) tablesStatus.profiles = true;

    const allExist = tablesStatus.svg_assets && tablesStatus.categories && tablesStatus.collections;

    return {
      connected: true,
      url: info.supabaseUrl,
      tablesStatus,
      remoteCounts,
      tablesExist: allExist,
      message: allExist
        ? `Successfully connected to Supabase (${info.supabaseUrl}). All required tables are active.`
        : `Connected to Supabase endpoint (${info.supabaseUrl}), but database tables are not created yet. Copy and run the SQL migration schema in your Supabase SQL Editor.`,
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: info.supabaseUrl,
      tablesStatus,
      remoteCounts,
      tablesExist: false,
      message: 'Failed to communicate with Supabase API: ' + (err?.message || String(err)),
      error: err?.message || String(err),
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  }
}

export interface SyncResult {
  success: boolean;
  categoriesSynced: number;
  collectionsSynced: number;
  licensesSynced: number;
  assetsSynced: number;
  errors: string[];
  durationMs: number;
}

/**
 * Syncs local database collections, categories, licenses, and SVG assets to Supabase
 */
export async function syncLocalDatabaseToSupabase(): Promise<SyncResult> {
  const start = Date.now();
  const client = getSupabaseClient();
  const errors: string[] = [];

  if (!client) {
    return {
      success: false,
      categoriesSynced: 0,
      collectionsSynced: 0,
      licensesSynced: 0,
      assetsSynced: 0,
      errors: ['Supabase client not configured'],
      durationMs: 0,
    };
  }

  const health = await checkSupabaseHealth();
  if (!health.tablesExist) {
    return {
      success: false,
      categoriesSynced: 0,
      collectionsSynced: 0,
      licensesSynced: 0,
      assetsSynced: 0,
      errors: [
        'Database tables do not exist in Supabase yet. Please click "Copy SQL Migration DDL" in the Admin Dashboard and execute it in your Supabase SQL Editor, then retry syncing.'
      ],
      durationMs: Date.now() - start,
    };
  }

  let categoriesSynced = 0;
  let collectionsSynced = 0;
  let licensesSynced = 0;
  let assetsSynced = 0;

  try {
    // 1. Sync Categories
    const categories = dbStore.getCategories();
    for (const cat of categories) {
      const { error } = await client.from('categories').upsert(
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
        },
        { onConflict: 'slug' }
      );
      if (error) errors.push(`Category ${cat.slug}: ${error.message}`);
      else categoriesSynced++;
    }

    // 2. Sync Collections
    const collections = dbStore.getCollections();
    for (const col of collections) {
      const { error } = await client.from('collections').upsert(
        {
          name: col.name,
          slug: col.slug,
          description: col.description || '',
          source_url: col.source_url || '',
          author: col.author || 'VectorHub',
        },
        { onConflict: 'slug' }
      );
      if (error) errors.push(`Collection ${col.slug}: ${error.message}`);
      else collectionsSynced++;
    }

    // 3. Sync Licenses
    const licenses = dbStore.getLicenses();
    for (const lic of licenses) {
      const { error } = await client.from('licenses').upsert(
        {
          name: lic.name,
          license_url: lic.license_url || '',
          attribution_required: lic.attribution_required || false,
          commercial_use_allowed: lic.commercial_use_allowed !== false,
        },
        { onConflict: 'name' }
      );
      if (error) errors.push(`License ${lic.name}: ${error.message}`);
      else licensesSynced++;
    }

    // 4. Sync SVG Assets (in batches of 25)
    const allAssets = dbStore.getSvgAssets({ limit: 1000 }).items;
    const batchSize = 25;

    for (let i = 0; i < allAssets.length; i += batchSize) {
      const batch = allAssets.slice(i, i + batchSize);
      const rows = batch.map((a) => ({
        name: a.name,
        slug: a.slug,
        description: a.description || '',
        svg_content: a.svg_content,
        width: a.width || 24,
        height: a.height || 24,
        view_box: a.view_box || '0 0 24 24',
        file_size: a.file_size || 0,
        status: a.status || 'published',
        storage_path: a.storage_path || '',
        thumbnail_path: a.thumbnail_path || '',
      }));

      const { error } = await client.from('svg_assets').upsert(rows, { onConflict: 'slug' });
      if (error) {
        errors.push(`Assets batch ${i}-${i + batch.length}: ${error.message}`);
      } else {
        assetsSynced += batch.length;
      }
    }
  } catch (err: any) {
    errors.push('Sync exception: ' + (err?.message || String(err)));
  }

  return {
    success: errors.length === 0,
    categoriesSynced,
    collectionsSynced,
    licensesSynced,
    assetsSynced,
    errors,
    durationMs: Date.now() - start,
  };
}
