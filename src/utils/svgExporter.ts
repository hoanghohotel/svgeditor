/**
 * Comprehensive SVG Exporter, Converter & Manipulation Engine
 * Inspired by https://www.svgviewer.dev
 * Supports SVG, PNG, WEBP, JPEG, React, React Native, Vue, Svelte, Data URIs, and Color mapping
 */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

export function downloadSvgFile(svgContent: string, filename: string): void {
  const cleanFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export function getSvgDataUri(svgContent: string, format: 'utf8' | 'base64' = 'utf8'): string {
  if (format === 'base64') {
    const encoded = btoa(
      encodeURIComponent(svgContent).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    return `data:image/svg+xml;base64,${encoded}`;
  }

  const cleanSvg = svgContent
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26');
  return `data:image/svg+xml;utf8,${cleanSvg}`;
}

export function exportRasterBlob(
  svgContent: string,
  mimeType: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/png',
  targetSize: number = 512,
  quality: number = 1.0,
  backgroundColor: string = 'transparent'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = doc.documentElement;

    let width = 24;
    let height = 24;

    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = parts[2];
        height = parts[3];
      }
    } else {
      const wAttr = parseFloat(svgEl.getAttribute('width') || '24');
      const hAttr = parseFloat(svgEl.getAttribute('height') || '24');
      if (!isNaN(wAttr)) width = wAttr;
      if (!isNaN(hAttr)) height = hAttr;
    }

    const aspectRatio = width / height;
    let outWidth = targetSize;
    let outHeight = targetSize;

    if (aspectRatio > 1) {
      outHeight = Math.round(targetSize / aspectRatio);
    } else if (aspectRatio < 1) {
      outWidth = Math.round(targetSize * aspectRatio);
    }

    svgEl.setAttribute('width', String(outWidth));
    svgEl.setAttribute('height', String(outHeight));
    if (!svgEl.hasAttribute('viewBox')) {
      svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    const serializer = new XMLSerializer();
    const serializedSvg = serializer.serializeToString(svgEl);
    const blob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // If JPEG, transparent is not supported so force white background if transparent
      const isJpeg = mimeType === 'image/jpeg';
      const effectiveBg = isJpeg && (backgroundColor === 'transparent' || !backgroundColor) ? '#ffffff' : backgroundColor;

      if (effectiveBg && effectiveBg !== 'transparent') {
        ctx.fillStyle = effectiveBg;
        ctx.fillRect(0, 0, outWidth, outHeight);
      } else {
        ctx.clearRect(0, 0, outWidth, outHeight);
      }

      ctx.drawImage(img, 0, 0, outWidth, outHeight);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (rasterBlob) => {
          if (rasterBlob) {
            resolve(rasterBlob);
          } else {
            reject(new Error(`Failed to convert canvas to ${mimeType}`));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG onto offscreen Image'));
    };

    img.src = url;
  });
}

export async function downloadRasterFile(
  svgContent: string,
  filename: string,
  format: 'png' | 'webp' | 'jpeg',
  targetSize: number = 512,
  quality: number = 1.0,
  backgroundColor: string = 'transparent'
): Promise<void> {
  const mimeType =
    format === 'webp' ? 'image/webp' : format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await exportRasterBlob(svgContent, mimeType, targetSize, quality, backgroundColor);
  const cleanFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPngFile(
  svgContent: string,
  filename: string,
  targetSize: number = 512,
  backgroundColor: string = 'transparent'
): Promise<void> {
  return downloadRasterFile(svgContent, filename, 'png', targetSize, 1.0, backgroundColor);
}

// ----------------------------------------------------
// Framework Component & Code Generators
// ----------------------------------------------------

export function generateReactComponent(
  svgContent: string,
  componentName: string = 'SvgIcon',
  typescript: boolean = true
): string {
  const cleanSvg = svgContent
    .replace('<svg', '<svg {...props}')
    .replace(/class=/g, 'className=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/viewbox=/gi, 'viewBox=');

  if (typescript) {
    return `import React from 'react';

export const ${componentName}: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  ${cleanSvg}
);

export default ${componentName};`;
  }

  return `import React from 'react';

export const ${componentName} = (props) => (
  ${cleanSvg}
);

export default ${componentName};`;
}

export function generateReactNativeComponent(
  svgContent: string,
  componentName: string = 'SvgIcon'
): string {
  // Convert standard SVG tags to react-native-svg primitives
  const converted = svgContent
    .replace(/<svg/g, '<Svg')
    .replace(/<\/svg>/g, '</Svg>')
    .replace(/<path/g, '<Path')
    .replace(/<\/path>/g, '</Path>')
    .replace(/<circle/g, '<Circle')
    .replace(/<\/circle>/g, '</Circle>')
    .replace(/<rect/g, '<Rect')
    .replace(/<\/rect>/g, '</Rect>')
    .replace(/<g/g, '<G')
    .replace(/<\/g>/g, '</G>')
    .replace(/<line/g, '<Line')
    .replace(/<\/line>/g, '</Line>')
    .replace(/<polyline/g, '<Polyline')
    .replace(/<\/polyline>/g, '</Polyline>')
    .replace(/<polygon/g, '<Polygon')
    .replace(/<\/polygon>/g, '</Polygon>');

  return `import React from 'react';
import Svg, { Path, Circle, Rect, G, Line, Polyline, Polygon, SvgProps } from 'react-native-svg';

export const ${componentName}: React.FC<SvgProps> = (props) => (
  ${converted.replace('<Svg', '<Svg {...props}')}
);

export default ${componentName};`;
}

export function generateVueComponent(svgContent: string): string {
  return `<template>
  ${svgContent}
</template>

<script setup lang="ts">
// Props can be bound via v-bind="$attrs"
</script>`;
}

export function generateSvelteComponent(svgContent: string): string {
  return `<script lang="ts">
  // Export custom props if needed
  let { ...restProps } = $props();
</script>

${svgContent.replace('<svg', '<svg {...restProps}')}`;
}

export function generateCssBackground(svgContent: string): string {
  const uri = getSvgDataUri(svgContent, 'utf8');
  return `.icon {
  width: 24px;
  height: 24px;
  background-image: url("${uri}");
  background-repeat: no-repeat;
  background-size: contain;
}`;
}

export function generateHtmlImg(svgContent: string): string {
  const uri = getSvgDataUri(svgContent, 'base64');
  return `<img src="${uri}" alt="Vector Asset" width="24" height="24" />`;
}

// ----------------------------------------------------
// SVG Inspection & Extraction Utilities
// ----------------------------------------------------

export interface SvgMetrics {
  width: number;
  height: number;
  viewBox: string;
  elementCount: number;
  pathCount: number;
  extractedColors: string[];
  rawBytes: number;
}

export function getSvgMetrics(svgContent: string): SvgMetrics {
  const rawBytes = new Blob([svgContent]).size;
  let width = 24;
  let height = 24;
  let viewBox = '0 0 24 24';
  let elementCount = 0;
  let pathCount = 0;
  const colorsSet = new Set<string>();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = doc.documentElement;

    const vb = svgEl.getAttribute('viewBox');
    if (vb) viewBox = vb;

    const wAttr = parseFloat(svgEl.getAttribute('width') || '');
    const hAttr = parseFloat(svgEl.getAttribute('height') || '');
    if (!isNaN(wAttr)) width = wAttr;
    if (!isNaN(hAttr)) height = hAttr;

    const allElements = doc.querySelectorAll('*');
    elementCount = allElements.length;

    const paths = doc.querySelectorAll('path');
    pathCount = paths.length;

    // Detect colors in fills and strokes
    allElements.forEach((el) => {
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      const style = el.getAttribute('style') || '';

      [fill, stroke].forEach((c) => {
        if (c && c !== 'none' && c !== 'currentColor' && c !== 'transparent' && !c.startsWith('url(')) {
          colorsSet.add(c.toLowerCase());
        }
      });

      // Simple regex for style color definitions
      const styleMatches = style.match(/(?:fill|stroke):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)/g);
      if (styleMatches) {
        styleMatches.forEach((m) => {
          const val = m.split(':')[1]?.trim();
          if (val && val !== 'none' && val !== 'currentColor' && val !== 'transparent') {
            colorsSet.add(val.toLowerCase());
          }
        });
      }
    });
  } catch (e) {
    console.warn('Could not fully parse SVG metrics:', e);
  }

  return {
    width,
    height,
    viewBox,
    elementCount,
    pathCount,
    extractedColors: Array.from(colorsSet),
    rawBytes,
  };
}

// ----------------------------------------------------
// SVG Customization Transformer
// ----------------------------------------------------

export interface SvgCustomizationOptions {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  padding?: number;
  colorReplacements?: Record<string, string>;
}

export function applySvgCustomizations(
  svgContent: string,
  options: SvgCustomizationOptions
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = doc.documentElement;

    // Apply color replacements
    if (options.colorReplacements && Object.keys(options.colorReplacements).length > 0) {
      const allEls = doc.querySelectorAll('*');
      allEls.forEach((el) => {
        const fill = el.getAttribute('fill');
        if (fill && options.colorReplacements![fill.toLowerCase()]) {
          el.setAttribute('fill', options.colorReplacements![fill.toLowerCase()]);
        }
        const stroke = el.getAttribute('stroke');
        if (stroke && options.colorReplacements![stroke.toLowerCase()]) {
          el.setAttribute('stroke', options.colorReplacements![stroke.toLowerCase()]);
        }
      });
    }

    // Global fill override if specified
    if (options.fillColor && options.fillColor !== 'original') {
      const shapeEls = doc.querySelectorAll('path, rect, circle, polygon, polyline');
      shapeEls.forEach((el) => {
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none') {
          el.setAttribute('fill', options.fillColor!);
        }
      });
      if (svgEl.hasAttribute('fill') && svgEl.getAttribute('fill') !== 'none') {
        svgEl.setAttribute('fill', options.fillColor);
      }
    }

    // Global stroke override if specified
    if (options.strokeColor && options.strokeColor !== 'original') {
      const shapeEls = doc.querySelectorAll('path, rect, circle, line, polyline');
      shapeEls.forEach((el) => {
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'none') {
          el.setAttribute('stroke', options.strokeColor!);
        }
      });
      if (svgEl.hasAttribute('stroke') && svgEl.getAttribute('stroke') !== 'none') {
        svgEl.setAttribute('stroke', options.strokeColor);
      }
    }

    // Stroke width override
    if (typeof options.strokeWidth === 'number' && options.strokeWidth > 0) {
      const shapeEls = doc.querySelectorAll('path, rect, circle, line, polyline');
      shapeEls.forEach((el) => {
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          el.setAttribute('stroke-width', String(options.strokeWidth));
        }
      });
    }

    // Transformation: Rotation and Flip
    const transforms: string[] = [];
    if (options.rotation && options.rotation !== 0) {
      transforms.push(`rotate(${options.rotation})`);
    }
    if (options.flipX) {
      transforms.push('scale(-1, 1)');
    }
    if (options.flipY) {
      transforms.push('scale(1, -1)');
    }

    if (transforms.length > 0) {
      // Wrap inner content in a <g> with transformOrigin center
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', transforms.join(' '));
      g.setAttribute('transform-origin', 'center');

      while (svgEl.firstChild) {
        g.appendChild(svgEl.firstChild);
      }
      svgEl.appendChild(g);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgEl);
  } catch (err) {
    console.warn('Failed to apply SVG customizations:', err);
    return svgContent;
  }
}
