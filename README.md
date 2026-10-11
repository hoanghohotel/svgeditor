# VectorHub — Production-Ready Full-Stack SVG Library & Studio

VectorHub is an open-source vector library, SVG inspector, and client/server optimization platform inspired by SVGViewer.dev. Built with a production-grade full-stack architecture, PostgreSQL relational schema, Zod request validation, SVGO optimization pipeline, SVG security sanitization engine, and DeepMind Science skill integrations.

---

## 1. Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons | Responsive directory, zoom stage, code editor, admin dashboard |
| **Backend API** | Node.js, Express, tsx | RESTful API endpoints, rate limiting, security headers, cookie auth |
| **Database** | PostgreSQL / Supabase, Relational Store | Relational schema for assets, collections, categories, licenses, tags |
| **Validation** | Zod | Server-side runtime request schema validation |
| **SVG Engine** | SVGO (v3) & DOM Sanitizer | XSS script stripping, whitespace minification, float coordinate rounding |
| **Science Skill** | Google DeepMind Science / PubChem PUG REST | Molecular compound resolution, 2D structure vectors, SMILES metadata |

---

## 2. Directory Structure

```
├── .data/                      # Local relational database storage
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Protected operations studio (CRUD, imports, tests)
│   │   ├── DirectoryPage.tsx    # Responsive SVG grid, sorting, 24-item pagination
│   │   ├── EditorPage.tsx       # Live vector code editor, zoom, multi-pass optimizer
│   │   ├── Header.tsx           # Top navigation following Top Bar Contract
│   │   └── IconDetailPage.tsx   # Detailed preview, PNG exporter (16-1024px), Data URI
│   ├── data/
│   │   └── iconDataset.ts       # 56+ production-ready curated vector assets
│   ├── db/
│   │   ├── database.ts          # Relational database engine, indexing, pagination
│   │   └── schema.ts            # PostgreSQL DDL migrations, relational interfaces
│   ├── server/
│   │   ├── api.ts               # Express REST API routes with Zod validation
│   │   ├── scienceService.ts    # DeepMind Science PubChem API connector
│   │   ├── svgoService.ts       # Server-side SVGO optimization engine
│   │   └── svgSecurity.ts       # Stored XSS defense, script tag stripping, sanitization
│   ├── types/
│   │   └── icon.ts              # TypeScript domain types & optimizer interfaces
│   ├── utils/
│   │   ├── router.ts            # Client-side SPA routing & browser history sync
│   │   ├── svgExporter.ts       # PNG canvas rasterizer & Data URI generator
│   │   └── svgOptimizer.ts      # Multi-pass client optimizer & XML prettifier
│   ├── App.tsx                  # Root application router & dark mode state
│   ├── index.css                # Tailwind styling, checkerboard canvas textures
│   └── main.tsx                 # React DOM mount point
├── server.ts                    # Express server entry point mounting Vite middlewares
├── .env.example                 # Documented environment variables
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript strict configuration
```

---

## 3. Database Schema & Migrations

The database models 7 relational entities with foreign keys and indexes:

- **`svg_assets`**: `id` (UUID), `name`, `slug` (unique), `description`, `svg_content`, `thumbnail_path`, `collection_id` (FK), `category_id` (FK), `license_id` (FK), `width`, `height`, `view_box`, `file_size`, `status` (`published` | `draft` | `archived`), `created_at`, `updated_at`, `published_at`.
- **`categories`**: `id` (UUID), `name`, `slug` (unique), `description`.
- **`collections`**: `id` (UUID), `name`, `slug` (unique), `description`, `source_url`, `author`.
- **`licenses`**: `id` (UUID), `name`, `license_url`, `attribution_required`, `commercial_use_allowed`.
- **`tags`**: `id` (UUID), `name`, `slug` (unique).
- **`svg_asset_tags`**: `asset_id` (FK), `tag_id` (FK) composite primary key.
- **`profiles`**: `id` (UUID), `email` (unique), `display_name`, `role` (`admin` | `editor` | `viewer`), `created_at`.

DDL migrations are available in `src/db/schema.ts` (`POSTGRES_MIGRATION_SQL`).

---

## 4. REST API Documentation

### Public Endpoints

- `GET /api/svg`
  - Query params: `page` (default: 1), `limit` (default: 24), `category`, `collection`, `tag`, `q`, `sort`, `status`
  - Response: `{ items: SvgAsset[], total: number, page: number, limit: number, totalPages: number }`
- `GET /api/svg/:id`
  - Retrieve detailed SVG record by UUID or slug with linked taxonomy.
- `GET /api/categories` — List all categories with published asset counts.
- `GET /api/collections` — List all collections with author details.
- `GET /api/search?q=query` — Fast search across titles, descriptions, and tags.
- `POST /api/svg/optimize`
  - Request: `{ svg: string, multipass?: boolean, precision?: number }`
  - Response: `{ success: true, optimizedSvg: string, originalBytes: number, optimizedBytes: number, bytesSaved: number, percentageSaved: number, durationMs: number }`

### Admin & Operations Endpoints

- `POST /api/svg` — Create SVG asset with security validation and XSS neutralization.
- `PATCH /api/svg/:id` — Update asset metadata, status, or markup.
- `DELETE /api/svg/:id` — Delete asset and cascade tag associations.
- `POST /api/svg/import` — Batch import multiple SVGs with duplicate detection.
- `POST /api/science/fetch-chemical-svg` — PubChem API connector resolving 2D chemical structure vectors.
- `GET /api/admin/supabase-status` — Health check, endpoint status, and table readiness for Supabase project.
- `POST /api/admin/supabase-sync` — Synchronize local database icons and Font Awesome Pro assets to Supabase.

---

## 5. Security & Sanitization

1. **Stored XSS Prevention**:
   - Rejects or neutralizes executable tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<foreignObject>` with arbitrary scripts.
   - Strips all `on*` event handlers (`onload`, `onclick`, `onerror`, `onmouseover`).
   - Strips dangerous URI schemes (`javascript:`, `vbscript:`, `data:text/html`).
2. **Denial of Service (DoS) Defense**:
   - 512 KB payload size ceiling per asset.
   - Rejects XML External Entity (XXE) and DTD entity injection attacks.
3. **Data Integrity**:
   - Runtime Zod schema enforcement on all payload fields.

---

## 6. Science Skill Integration

VectorHub integrates the Google DeepMind Science Skill connecting to the **PubChem PUG REST API**:
- Query chemical molecules by common or IUPAC name (e.g., *Aspirin*, *Caffeine*, *Dopamine*, *Ibuprofen*).
- Resolves Compound IDs (CID), molecular formulas, and canonical SMILES using the `fetchWithRetry` backoff algorithm.
- Renders vector representations into the library's **Science & Molecules** collection.

---

## 7. Font Awesome Pro Local Asset Importer

VectorHub includes a dedicated, server-side batch importer (`scripts/import-font-awesome.ts`) designed to ingest locally owned Font Awesome Pro SVG collections safely without exposing raw files to public buckets or modifying the original directory structure.

### Features
- **Recursive Scanning**: Automatically discovers all `.svg` files across nested directories.
- **Style Detection**: Identifies icon styles from directory naming (`solid`, `regular`, `light`, `thin`, `duotone`, `brands`, `sharp-solid`).
- **Name & Slug Extraction**: Normalizes filenames into human-readable titles (e.g. `arrow-up-right` → `Arrow Up Right`) and unique prefixed slugs (`fa-solid-arrow-up-right`).
- **Non-Destructive File Ingestion**: Preserves the original files in place; never writes to, moves, or deletes source files.
- **Security Validation & Sanitization**: Validates XML structure, rejects embedded executable scripts or dangerous event handlers, and prevents stored XSS attacks.
- **Duplicate Detection & Content Hashing**: Generates SHA-256 hashes of each SVG payload to avoid creating duplicates and safely update existing database records.
- **Resumable Batching & Dry-Run Mode**: Supports interruption recovery via a local resume cache (`.import-cache/fa-import-resume.json`), configurable chunk sizes, and simulation without DB mutations.

### Configuration
Set the source directory via the environment variable in `.env` or pass the path directly to the CLI:
```bash
# In .env
FA_PRO_DIR="/path/to/fontawesome-pro-svgs"
```

Expected directory hierarchy:
```
/path/to/fontawesome-pro-svgs/
  ├── solid/
  │   ├── camera.svg
  │   └── shield-check.svg
  ├── duotone/
  │   └── bolt.svg
  ├── light/
  │   └── heart.svg
  ├── regular/
  │   └── star.svg
  ├── thin/
  │   └── bookmark.svg
  ├── brands/
  │   └── github.svg
  └── sharp-solid/
      └── key.svg
```

### CLI Commands
```bash
# 1. Dry run simulation (checks files and displays summary without writing to DB)
npm run import:fa -- --dry-run

# 2. Dry run with a custom directory
npm run import:fa -- --dir ./assets/sample-fa-pro --dry-run

# 3. Live import with custom batch size
npm run import:fa -- --dir ./assets/sample-fa-pro --batch-size 50

# 4. Force re-processing all files (bypassing resume cache)
npm run import:fa -- --force

# 5. Display command-line help
npm run import:fa -- --help
```

---

## 8. Running the Platform

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Import Font Awesome Pro Assets (Optional)**:
   ```bash
   npm run import:fa
   ```
3. **Start Dev Server (Port 3000)**:
   ```bash
   npm run dev
   ```
4. **Execute Verification & Tests**:
   - Open `/admin` in the browser and navigate to the **Test Runner** tab, or run:
   ```bash
   npm run lint
   ```
5. **Build for Production**:
   ```bash
   npm run build
   ```
