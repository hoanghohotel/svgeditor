import { optimize, Config } from 'svgo';

export interface SvgoOptimizationResult {
  success: boolean;
  optimizedSvg: string;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  percentageSaved: number;
  durationMs: number;
  error?: string;
}

export function runSvgoOptimization(
  svgString: string,
  options: { multipass?: boolean; precision?: number } = {}
): SvgoOptimizationResult {
  const startTime = performance.now();
  const originalBytes = new TextEncoder().encode(svgString).length;

  try {
    const svgoConfig: Config = {
      multipass: options.multipass ?? true,
      plugins: [
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupAttrs',
        'mergeStyles',
        'inlineStyles',
        'minifyStyles',
        'removeUselessDefs',
        'cleanupNumericValues',
        'convertColors',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'removeEmptyText',
        'collapseGroups',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'mergePaths',
        'removeUnusedNS',
        {
          name: 'cleanupNumericValues',
          params: {
            floatPrecision: options.precision ?? 2,
          },
        },
      ],
    };

    const result = optimize(svgString, svgoConfig);
    const optimizedSvg = result.data;
    const optimizedBytes = new TextEncoder().encode(optimizedSvg).length;
    const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
    const percentageSaved =
      originalBytes > 0 ? Math.round((bytesSaved / originalBytes) * 1000) / 10 : 0;
    const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

    return {
      success: true,
      optimizedSvg,
      originalBytes,
      optimizedBytes,
      bytesSaved,
      percentageSaved,
      durationMs,
    };
  } catch (err) {
    return {
      success: false,
      optimizedSvg: svgString,
      originalBytes,
      optimizedBytes: originalBytes,
      bytesSaved: 0,
      percentageSaved: 0,
      durationMs: Math.round((performance.now() - startTime) * 10) / 10,
      error: err instanceof Error ? err.message : 'SVGO optimization failed',
    };
  }
}
