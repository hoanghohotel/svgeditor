/**
 * Utility to normalize and optimize SVGs for responsive preview containers.
 * Guarantees that SVGs scale smoothly, fit within their container boxes,
 * have valid viewBox attributes, and do not blow out or shrink to a tiny dot.
 */

import { sanitizeSvgClient } from './svgSanitizer';

export function normalizeSvgForPreview(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') return '';

  try {
    // 0. Sanitize to prevent stored XSS or injection via dangerouslySetInnerHTML
    const { cleanSvg } = sanitizeSvgClient(svgString);

    // 1. Check if viewBox exists
    const hasViewBox = /viewBox=["']([^"']+)["']/i.test(cleanSvg);

    let normalized = cleanSvg;

    if (!hasViewBox) {
      // Try to extract width and height to construct viewBox
      const widthMatch = svgString.match(/width=["'](\d+(?:\.\d+)?)(?:px)?["']/i);
      const heightMatch = svgString.match(/height=["'](\d+(?:\.\d+)?)(?:px)?["']/i);

      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        if (width > 0 && height > 0) {
          // Inject viewBox into opening <svg> tag
          normalized = normalized.replace(
            /<svg\b([^>]*)>/i,
            `<svg$1 viewBox="0 0 ${width} ${height}">`
          );
        }
      } else {
        // Fallback default viewBox if neither is found
        normalized = normalized.replace(
          /<svg\b([^>]*)>/i,
          `<svg$1 viewBox="0 0 24 24">`
        );
      }
    }

    // 2. Ensure preserveAspectRatio="xMidYMid meet" is set for clean centered scaling
    if (!/preserveAspectRatio=["']/i.test(normalized)) {
      normalized = normalized.replace(
        /<svg\b([^>]*)>/i,
        `<svg$1 preserveAspectRatio="xMidYMid meet">`
      );
    }

    // 3. Make sure the root <svg> tag has width="100%" and height="100%"
    // Safely strip root width and height without corrupting stroke-width or other hyphenated properties
    normalized = normalized.replace(
      /<svg\b([^>]*)>/i,
      (match, attributes) => {
        let cleaned = attributes
          .replace(/(?<!-)\bwidth=["'][^"']*["']/gi, '')
          .replace(/(?<!-)\bheight=["'][^"']*["']/gi, '');

        // If root SVG specifies explicit black fill, adapt to currentColor for dynamic theme support
        cleaned = cleaned.replace(/\bfill=["'](?:#000(?:000)?|black)["']/gi, 'fill="currentColor"');

        // If root SVG specifies explicit black stroke, adapt to currentColor
        cleaned = cleaned.replace(/\bstroke=["'](?:#000(?:000)?|black)["']/gi, 'stroke="currentColor"');

        // If neither fill nor stroke is declared on root <svg>, declare fill="currentColor"
        // so children without explicit fills inherit theme color instead of defaulting to browser black
        let defaultFill = '';
        if (!/\bfill=["']/i.test(cleaned) && !/\bstroke=["']/i.test(cleaned)) {
          defaultFill = ' fill="currentColor"';
        }

        return `<svg${cleaned}${defaultFill} width="100%" height="100%">`;
      }
    );

    return normalized;
  } catch {
    // If regex parsing fails, return original
    return svgString;
  }
}
