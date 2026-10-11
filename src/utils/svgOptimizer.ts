import { OptimizerOptions, OptimizerResult } from '../types/icon';

export const defaultOptimizerOptions: OptimizerOptions = {
  removeComments: true,
  removeDoctype: true,
  removeMetadata: true,
  collapseGroups: true,
  roundFloats: true,
  floatPrecision: 2,
  minifyWhitespace: true,
  removeEmptyAttrs: true,
};

export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export interface SvgValidationResult {
  isValid: boolean;
  errorMessage?: string;
  line?: number;
  column?: number;
  missingPrefix?: string;
  canAutoFix?: boolean;
}

const COMMON_NAMESPACES: Record<string, string> = {
  sodipodi: 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
  inkscape: 'http://www.inkscape.org/namespaces/inkscape',
  xlink: 'http://www.w3.org/1999/xlink',
  sketch: 'http://www.bohemiancoding.com/sketch/ns',
  serif: 'http://www.serif.com/',
  adobe: 'http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/',
};

/**
 * Strips non-standard editor tags and attributes (Sodipodi, Inkscape, Sketch, metadata)
 */
export function stripEditorArtifacts(svgString: string): string {
  let cleaned = svgString;

  // 1. Remove editor elements (sodipodi:namedview, inkscape:grid, etc.)
  cleaned = cleaned.replace(/<sodipodi:[a-zA-Z0-9_-]+[\s\S]*?(?:\/>|<\/sodipodi:[a-zA-Z0-9_-]+>)/gi, '');
  cleaned = cleaned.replace(/<inkscape:[a-zA-Z0-9_-]+[\s\S]*?(?:\/>|<\/inkscape:[a-zA-Z0-9_-]+>)/gi, '');
  cleaned = cleaned.replace(/<sketch:[a-zA-Z0-9_-]+[\s\S]*?(?:\/>|<\/sketch:[a-zA-Z0-9_-]+>)/gi, '');
  cleaned = cleaned.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  cleaned = cleaned.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, '');
  cleaned = cleaned.replace(/<desc[\s\S]*?<\/desc>/gi, '');

  // 2. Remove editor attributes and namespaces
  cleaned = cleaned.replace(/\s(?:sodipodi|inkscape|sketch|serif|adobe):[a-zA-Z0-9_-]+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\sxmlns:(?:sodipodi|inkscape|sketch|serif|adobe)="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\sdata-name="[^"]*"/gi, '');

  return cleaned;
}

/**
 * Injects missing namespace definitions into the root <svg> tag
 */
export function injectMissingNamespaces(svgString: string): string {
  let result = svgString;
  const svgTagMatch = result.match(/<svg\b([^>]*)>/i);
  if (!svgTagMatch) return svgString;

  const currentAttrs = svgTagMatch[1];
  const missingAttrs: string[] = [];

  for (const [prefix, uri] of Object.entries(COMMON_NAMESPACES)) {
    const usesPrefix = new RegExp(`\\b${prefix}:`, 'i').test(result);
    const hasDecl = new RegExp(`xmlns:${prefix}=`, 'i').test(currentAttrs);

    if (usesPrefix && !hasDecl) {
      missingAttrs.push(`xmlns:${prefix}="${uri}"`);
    }
  }

  if (missingAttrs.length > 0) {
    const newSvgTag = `<svg ${currentAttrs} ${missingAttrs.join(' ')}>`;
    result = result.replace(/<svg\b[^>]*>/i, newSvgTag);
  }

  return result;
}

export function validateSvg(svgString: string): SvgValidationResult {
  if (!svgString || !svgString.trim()) {
    return { isValid: false, errorMessage: 'SVG markup is empty.' };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');

    if (parserError) {
      const errorText = parserError.textContent || 'XML Parsing Error';
      const lineMatch = errorText.match(/line\s+(\d+)/i);
      const colMatch = errorText.match(/column\s+(\d+)/i);
      const prefixMatch = errorText.match(/Namespace prefix\s+([a-zA-Z0-9_-]+)\s+on/i);
      const missingPrefix = prefixMatch ? prefixMatch[1] : undefined;

      const cleanMessage = errorText.replace(/Below is a rendering.*$/s, '').trim();

      // Check if auto-fixing namespaces or stripping editor tags can resolve it
      let canAutoFix = false;
      if (missingPrefix) {
        const testFixed = stripEditorArtifacts(svgString);
        const testDoc = parser.parseFromString(testFixed, 'image/svg+xml');
        canAutoFix = !testDoc.querySelector('parsererror');
      }

      return {
        isValid: false,
        errorMessage: cleanMessage,
        line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
        column: colMatch ? parseInt(colMatch[1], 10) : undefined,
        missingPrefix,
        canAutoFix,
      };
    }

    if (doc.documentElement.tagName.toLowerCase() !== 'svg') {
      return { isValid: false, errorMessage: 'Root element must be an <svg> tag.' };
    }

    return { isValid: true };
  } catch (err) {
    return {
      isValid: false,
      errorMessage: err instanceof Error ? err.message : 'Unknown XML error',
    };
  }
}

/**
 * Prettifies an SVG/XML string with clean indentation and spacing
 */
export function prettifySvg(svgString: string): string {
  try {
    let sourceToParse = svgString;
    const validation = validateSvg(sourceToParse);
    if (!validation.isValid) {
      if (validation.missingPrefix) {
        sourceToParse = injectMissingNamespaces(sourceToParse);
      } else {
        return svgString;
      }
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(sourceToParse, 'image/svg+xml');

    function formatNode(node: Node, indentLevel: number): string {
      const indent = '  '.repeat(indentLevel);

      if (node.nodeType === Node.COMMENT_NODE) {
        return `${indent}<!--${node.nodeValue?.trim()}-->\n`;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue?.trim();
        return text ? `${indent}${text}\n` : '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName;
        const attrs: string[] = [];

        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs.push(`${attr.name}="${attr.value}"`);
        }

        const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        const children = Array.from(el.childNodes);

        if (children.length === 0) {
          return `${indent}<${tagName}${attrString} />\n`;
        }

        // Check if only a single text child
        if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
          const text = children[0].nodeValue?.trim();
          if (text) {
            return `${indent}<${tagName}${attrString}>${text}</${tagName}>\n`;
          }
          return `${indent}<${tagName}${attrString} />\n`;
        }

        let childContent = '';
        for (const child of children) {
          childContent += formatNode(child, indentLevel + 1);
        }

        if (!childContent.trim()) {
          return `${indent}<${tagName}${attrString} />\n`;
        }

        return `${indent}<${tagName}${attrString}>\n${childContent}${indent}</${tagName}>\n`;
      }

      return '';
    }

    return formatNode(doc.documentElement, 0).trim();
  } catch {
    return svgString;
  }
}

/**
 * Multi-pass client-side SVG optimizer
 */
export function optimizeSvg(
  svgContent: string,
  options: Partial<OptimizerOptions> = {}
): OptimizerResult {
  const startTime = performance.now();
  const opts = { ...defaultOptimizerOptions, ...options };
  const originalBytes = getByteLength(svgContent);

  let output = svgContent;

  // Pass 1: Remove Comments and CDATA
  if (opts.removeComments) {
    output = output.replace(/<!--[\s\S]*?-->/g, '');
    output = output.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  }

  // Pass 2: Remove XML declaration, DOCTYPE, and DTD
  if (opts.removeDoctype) {
    output = output.replace(/<\?xml[\s\S]*?\?>/gi, '');
    output = output.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  }

  // Pass 3: Remove Metadata elements and editor artifacts
  if (opts.removeMetadata) {
    output = stripEditorArtifacts(output);
    output = output.replace(/<title\s*>\s*<\/title>/gi, '');
  } else {
    // If user kept metadata, ensure missing namespaces are declared so DOMParser does not break
    output = injectMissingNamespaces(output);
  }

  // Pass 4: DOM-based cleanup for groups & empty attributes
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(output, 'image/svg+xml');

    if (!doc.querySelector('parsererror')) {
      // 4a. Collapse redundant empty/single-attribute groups
      if (opts.collapseGroups) {
        const groups = Array.from(doc.querySelectorAll('g'));
        for (const g of groups) {
          // If <g> has no attributes or only an id
          const attrCount = g.attributes.length;
          const isRemovable =
            attrCount === 0 ||
            (attrCount === 1 && (g.hasAttribute('id') || g.getAttribute('id') === ''));

          if (isRemovable && g.parentNode) {
            while (g.firstChild) {
              g.parentNode.insertBefore(g.firstChild, g);
            }
            g.remove();
          }
        }
      }

      // 4b. Remove empty attributes
      if (opts.removeEmptyAttrs) {
        const allElements = Array.from(doc.querySelectorAll('*'));
        for (const el of allElements) {
          const attrsToRemove: string[] = [];
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (attr.value === '' && attr.name !== 'xmlns') {
              attrsToRemove.push(attr.name);
            }
          }
          for (const attrName of attrsToRemove) {
            el.removeAttribute(attrName);
          }
        }
      }

      const serializer = new XMLSerializer();
      output = serializer.serializeToString(doc.documentElement);
    }
  } catch {
    // Fall back to regex-based passes if DOM parsing encounters unexpected issues
  }

  // Pass 5: Round float numbers in coordinates and attributes
  if (opts.roundFloats && opts.floatPrecision !== undefined) {
    const prec = Math.max(0, Math.min(5, opts.floatPrecision));
    const factor = Math.pow(10, prec);

    const roundNumber = (numStr: string): string => {
      const n = parseFloat(numStr);
      if (isNaN(n)) return numStr;
      const rounded = Math.round(n * factor) / factor;
      return rounded.toString();
    };

    // Round coordinates in path d="..."
    output = output.replace(/d="([^"]+)"/g, (_, pathData) => {
      const roundedPath = pathData.replace(/-?\d+\.\d+/g, (match: string) => roundNumber(match));
      return `d="${roundedPath}"`;
    });

    // Round coordinates in points="..."
    output = output.replace(/points="([^"]+)"/g, (_, pointsData) => {
      const roundedPoints = pointsData.replace(/-?\d+\.\d+/g, (match: string) => roundNumber(match));
      return `points="${roundedPoints}"`;
    });

    // Round geometric numeric attributes
    const numAttrs = ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'stroke-width'];
    for (const attr of numAttrs) {
      const regex = new RegExp(`(${attr}=")(-?\\d+\\.\\d+)(")`, 'g');
      output = output.replace(regex, (_, prefix, num, suffix) => `${prefix}${roundNumber(num)}${suffix}`);
    }
  }

  // Pass 6: Minify Whitespace
  if (opts.minifyWhitespace) {
    // Collapse multi whitespace
    output = output.replace(/\s+/g, ' ');
    // Remove space between tag brackets
    output = output.replace(/>\s+</g, '><');
    // Remove space before closing />
    output = output.replace(/\s+\/>/g, '/>');
    // Remove space inside tags right after opening or before closing
    output = output.replace(/<\s+/g, '<');
    output = output.replace(/\s+>/g, '>');
    output = output.trim();
  }

  const optimizedBytes = getByteLength(output);
  const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
  const percentageSaved = originalBytes > 0 ? Math.round((bytesSaved / originalBytes) * 1000) / 10 : 0;
  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    originalCode: svgContent,
    optimizedCode: output,
    originalBytes,
    optimizedBytes,
    bytesSaved,
    percentageSaved,
    durationMs,
  };
}
