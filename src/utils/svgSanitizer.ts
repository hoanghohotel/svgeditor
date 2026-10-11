/**
 * Client-Side SVG Security & Sanitization Engine
 * Neutralizes Stored XSS, script injection, on* event handlers,
 * dangerous protocols (javascript:, data:text/html), foreignObject exploits,
 * and malicious entity expansion in imported or edited SVG markup.
 */

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

const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/javascript',
  'data:application/ecmascript',
];

export interface ClientSanitizeResult {
  cleanSvg: string;
  isClean: boolean;
  sanitizedItems: string[];
}

export function sanitizeSvgClient(svgString: string): ClientSanitizeResult {
  if (!svgString || typeof svgString !== 'string') {
    return { cleanSvg: '', isClean: true, sanitizedItems: [] };
  }

  const sanitizedItems: string[] = [];
  let cleaned = svgString;

  // 1. Strip XML declarations & DOCTYPE/ENTITY expansions (XXE prevention)
  if (/<!ENTITY/i.test(cleaned) || /SYSTEM\s+["']/i.test(cleaned)) {
    sanitizedItems.push('Stripped XXE entity declarations');
    cleaned = cleaned.replace(/<!ENTITY[\s\S]*?>/gi, '');
  }
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  // 2. Strip banned executable tags
  for (const tag of BANNED_TAGS) {
    const tagRegex = new RegExp(`<${tag}\\b[\\s\\S]*?(?:\\/>|<\\/${tag}>)`, 'gi');
    if (tagRegex.test(cleaned)) {
      sanitizedItems.push(`Removed <${tag}> tag`);
      cleaned = cleaned.replace(tagRegex, '');
    }
  }

  // 3. Neutralize foreignObject with executable content
  if (/<foreignObject[\s\S]*?>/i.test(cleaned)) {
    if (/<(?:script|iframe|object|embed)/i.test(cleaned)) {
      sanitizedItems.push('Neutralized nested executable tags in <foreignObject>');
      cleaned = cleaned.replace(/<foreignObject[\s\S]*?(?:\/>|<\/foreignObject>)/gi, '');
    }
  }

  // 4. Strip inline event handlers (on* attributes like onload, onerror, onclick)
  const onEventRegex = /\s(on[a-zA-Z]+)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
  if (onEventRegex.test(cleaned)) {
    sanitizedItems.push('Removed inline on* event handler attributes');
    cleaned = cleaned.replace(onEventRegex, '');
  }

  // 5. Strip dangerous protocols in href / xlink:href
  for (const proto of DANGEROUS_PROTOCOLS) {
    const protoRegex = new RegExp(`(?:href|xlink:href)\\s*=\\s*["']?\\s*${proto}[^"'>\\s]*["']?`, 'gi');
    if (protoRegex.test(cleaned)) {
      sanitizedItems.push(`Sanitized dangerous protocol ${proto}`);
      cleaned = cleaned.replace(protoRegex, 'href="#"');
    }
  }

  return {
    cleanSvg: cleaned,
    isClean: sanitizedItems.length === 0,
    sanitizedItems,
  };
}
