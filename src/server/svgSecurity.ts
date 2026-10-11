/**
 * SVG Security, Sanitization & Validation Engine
 * Protects against Stored XSS, Malicious Script Injection, XXE, and Resource Exhaustion
 */

export interface SvgSecurityReport {
  isValid: boolean;
  isClean: boolean;
  fileSizeBytes: number;
  width: number;
  height: number;
  viewBox: string;
  violations: string[];
  sanitizedSvg: string;
}

const MAX_SVG_SIZE_BYTES = 512 * 1024; // 512 KB
const BANNED_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
];

const BANNED_ATTR_PREFIXES = ['on']; // onload, onclick, onerror, onmouseover, etc.
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html', 'data:application/'];

export function sanitizeAndValidateSvg(rawSvg: string): SvgSecurityReport {
  const violations: string[] = [];
  const fileSizeBytes = new TextEncoder().encode(rawSvg).length;

  if (!rawSvg || !rawSvg.trim()) {
    return {
      isValid: false,
      isClean: false,
      fileSizeBytes: 0,
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      violations: ['SVG payload is empty.'],
      sanitizedSvg: '',
    };
  }

  // 1. Enforce size limits
  if (fileSizeBytes > MAX_SVG_SIZE_BYTES) {
    violations.push(`File size (${(fileSizeBytes / 1024).toFixed(1)} KB) exceeds 512 KB limit.`);
  }

  // 2. Reject XML Entity Declarations / XXE attempts
  if (/<!ENTITY/i.test(rawSvg) || /SYSTEM\s+["']/i.test(rawSvg)) {
    violations.push('XML External Entity (XXE) declarations are strictly forbidden.');
  }

  let cleaned = rawSvg;

  // 3. Strip DOCTYPE and processing instructions
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  // 4. Check & Remove Banned Tags
  for (const tag of BANNED_TAGS) {
    const tagRegex = new RegExp(`<${tag}[\\s\\S]*?(?:\\/>|<\\/${tag}>)`, 'gi');
    if (tagRegex.test(cleaned)) {
      violations.push(`Forbidden executable tag <${tag}> detected and sanitized.`);
      cleaned = cleaned.replace(tagRegex, '');
    }
  }

  // 5. Inspect and neutralize foreignObject
  if (/<foreignObject[\s\S]*?>/i.test(cleaned)) {
    // Only allow foreignObject if it doesn't contain HTML scripts/iframes
    if (/<(?:script|iframe|object|embed)/i.test(cleaned)) {
      violations.push('Unsafe nested HTML within <foreignObject> stripped.');
      cleaned = cleaned.replace(/<foreignObject[\s\S]*?(?:\/>|<\/foreignObject>)/gi, '');
    }
  }

  // 6. Strip all on* event handler attributes (e.g. onload="...", onclick="...")
  const eventHandlerRegex = /\s(on[a-zA-Z]+)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
  if (eventHandlerRegex.test(cleaned)) {
    violations.push('Inline JavaScript event handlers (on* attributes) detected and stripped.');
    cleaned = cleaned.replace(eventHandlerRegex, '');
  }

  // 7. Strip dangerous protocol URIs in href or xlink:href
  for (const proto of DANGEROUS_PROTOCOLS) {
    const protoRegex = new RegExp(`(?:href|xlink:href)\\s*=\\s*["']?\\s*${proto}[^"'>\\s]*["']?`, 'gi');
    if (protoRegex.test(cleaned)) {
      violations.push(`Dangerous URI protocol (${proto}) detected and sanitized.`);
      cleaned = cleaned.replace(protoRegex, 'href="#"');
    }
  }

  // 8. Verify root <svg> tag existence
  const svgOpenMatch = cleaned.match(/<svg\b([^>]*)>/i);
  if (!svgOpenMatch) {
    violations.push('Missing valid root <svg> element.');
    return {
      isValid: false,
      isClean: false,
      fileSizeBytes,
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      violations,
      sanitizedSvg: '',
    };
  }

  // 9. Extract or compute dimensions & viewBox safely
  const svgAttrs = svgOpenMatch[1];
  let width = 24;
  let height = 24;
  let viewBox = '0 0 24 24';

  const viewBoxMatch = svgAttrs.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBoxMatch) {
    viewBox = viewBoxMatch[1].trim();
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = Math.round(parts[2]);
      height = Math.round(parts[3]);
    }
  } else {
    const widthMatch = svgAttrs.match(/width\s*=\s*["'](\d+(?:\.\d+)?)(?:px)?["']/i);
    const heightMatch = svgAttrs.match(/height\s*=\s*["'](\d+(?:\.\d+)?)(?:px)?["']/i);
    if (widthMatch) width = Math.round(parseFloat(widthMatch[1]));
    if (heightMatch) height = Math.round(parseFloat(heightMatch[1]));
    viewBox = `0 0 ${width} ${height}`;
  }

  const isClean = violations.length === 0;

  return {
    isValid: true,
    isClean,
    fileSizeBytes: new TextEncoder().encode(cleaned).length,
    width,
    height,
    viewBox,
    violations,
    sanitizedSvg: cleaned.trim(),
  };
}
