export type IconCategory = 'all' | 'ui-actions' | 'tech-logos' | 'system-devices' | 'media-controls' | 'science-molecules';

export interface SvgIcon {
  id: string; // e.g. "1001" or "asset-..."
  slug: string; // e.g. "trophy" or "fa-solid-camera"
  name: string; // e.g. "Trophy Champion"
  collection: string; // e.g. "UI Actions" or "Font Awesome Pro"
  categorySlug: Exclude<IconCategory, 'all'>;
  tags: string[];
  viewBox: string;
  author: string;
  license: string;
  svgContent: string;
  rawBytes: number;
  createdAt: string;
  style?: string | null; // e.g. 'solid', 'regular', 'light', 'thin', 'duotone', 'brands'
  source?: string | null; // e.g. 'font-awesome-pro', 'vectorhub-core'
  is_pro?: boolean | null; // Font Awesome Pro license flag
  content_hash?: string | null; // Content SHA-256
  storage_path?: string | null; // Local preserved file path
}

export type SortOption = 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'newest';

export interface OptimizerOptions {
  removeComments: boolean;
  removeDoctype: boolean;
  removeMetadata: boolean;
  collapseGroups: boolean;
  roundFloats: boolean;
  floatPrecision: number;
  minifyWhitespace: boolean;
  removeEmptyAttrs: boolean;
}

export interface OptimizerResult {
  originalCode: string;
  optimizedCode: string;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  percentageSaved: number;
  durationMs: number;
}
