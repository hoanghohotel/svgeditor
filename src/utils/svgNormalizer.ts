/**
 * Utility to normalize and optimize SVGs for responsive preview containers.
 * Guarantees that SVGs scale smoothly, fit within their container boxes,
 * have valid viewBox attributes, and do not blow out or shrink to a tiny dot.
 */

export function normalizeSvgForPreview(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') return '';

  try {
    // 1. Check if viewBox exists
    const hasViewBox = /viewBox=["']([^"']+)["']/i.test(svgString);

    let normalized = svgString;

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
    // Replace existing width/height on the root <svg ...> tag
    normalized = normalized.replace(
      /<svg\b([^>]*)>/i,
      (match, attributes) => {
        let cleaned = attributes
          .replace(/\bwidth=["'][^"']*["']/gi, '')
          .replace(/\bheight=["'][^"']*["']/gi, '');
        return `<svg${cleaned} width="100%" height="100%">`;
      }
    );

    return normalized;
  } catch {
    // If regex parsing fails, return original
    return svgString;
  }
}
