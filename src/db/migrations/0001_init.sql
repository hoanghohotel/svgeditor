-- ============================================================================
-- VectorHub PostgreSQL Database Schema Migration 0001
-- Compatible with Supabase, PostgreSQL 15+, Cloud SQL, and Drizzle ORM
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Auth Users, RBAC Roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT ''
);

-- 3. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'VectorHub Open Source'
);

-- 4. Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_url TEXT DEFAULT '',
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- 6. SVG Assets Table
CREATE TABLE IF NOT EXISTS svg_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  svg_content TEXT NOT NULL,
  storage_path TEXT DEFAULT '',
  thumbnail_path TEXT DEFAULT '',
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  width INTEGER NOT NULL DEFAULT 24,
  height INTEGER NOT NULL DEFAULT 24,
  view_box TEXT NOT NULL DEFAULT '0 0 24 24',
  file_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Join Table for Many-to-Many Tags Relationship
CREATE TABLE IF NOT EXISTS svg_asset_tags (
  asset_id UUID REFERENCES svg_assets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, tag_id)
);

-- ============================================================================
-- High-Performance Indexes for Database-Backed Pagination & Search
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_svg_assets_status_created ON svg_assets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_svg_assets_category_status ON svg_assets (category_id, status);
CREATE INDEX IF NOT EXISTS idx_svg_assets_collection_status ON svg_assets (collection_id, status);
CREATE INDEX IF NOT EXISTS idx_svg_assets_slug ON svg_assets (slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections (slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags (slug);
CREATE INDEX IF NOT EXISTS idx_svg_asset_tags_tag ON svg_asset_tags (tag_id);

-- Full-Text Search Index on asset name and description
CREATE INDEX IF NOT EXISTS idx_svg_assets_fts ON svg_assets USING gin(to_tsvector('english', name || ' ' || description));

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE svg_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE svg_asset_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for published assets
CREATE POLICY "Public published assets are viewable by everyone"
  ON svg_assets FOR SELECT
  USING (status = 'published');

-- Public read access for taxonomies
CREATE POLICY "Categories viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Collections viewable by everyone" ON collections FOR SELECT USING (true);
CREATE POLICY "Licenses viewable by everyone" ON licenses FOR SELECT USING (true);
CREATE POLICY "Tags viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Asset tags viewable by everyone" ON svg_asset_tags FOR SELECT USING (true);
