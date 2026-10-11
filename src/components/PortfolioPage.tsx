import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Crown,
  Copy,
  Check,
  Code2,
  Download,
  ArrowRight,
  Palette,
  ShieldCheck,
  Maximize2,
  Atom,
  Cpu,
  Layout,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../lib/theme';
import { iconDataset } from '../data/iconDataset';
import { normalizeSvgForPreview } from '../utils/svgNormalizer';
import { copyToClipboard, downloadSvgFile } from '../utils/svgExporter';
import { navigateTo } from '../utils/router';

export const PortfolioPage: React.FC = () => {
  const { t } = useI18n();
  const { accent, setAccent, isDark } = useTheme();

  const [activeVectorId, setActiveVectorId] = useState<string>('1001'); // Trophy
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const activeIcon = iconDataset.find((i) => i.id === activeVectorId) || iconDataset[0];

  const handleCopy = async (icon: typeof activeIcon) => {
    await copyToClipboard(icon.svgContent);
    setCopiedId(icon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (icon: typeof activeIcon) => {
    downloadSvgFile(icon.svgContent, `${icon.slug}.svg`);
  };

  const handleOpenEditor = (icon: typeof activeIcon) => {
    navigateTo({ type: 'editor', iconId: icon.id });
  };

  // 3 Featured Showcase Collections
  const collections = [
    {
      id: 'saas-ui',
      icon: Layout,
      title: t.portfolioCollection1Title,
      description: t.portfolioCollection1Desc,
      tag: '50+ Icons · MIT Open Core',
      sampleIds: ['1001', '1002', '1003', '3001', '3002'],
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    },
    {
      id: 'fa-pro',
      icon: Crown,
      title: t.portfolioCollection2Title,
      description: t.portfolioCollection2Desc,
      tag: 'Local Disk · Enterprise Licensed',
      sampleIds: ['2012', '2013', '2014', '3003', '4001'],
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      isPro: true,
    },
    {
      id: 'science',
      icon: Atom,
      title: t.portfolioCollection3Title,
      description: t.portfolioCollection3Desc,
      tag: 'PubChem / DeepMind Science Skill',
      sampleIds: ['5001', '5002', '5003', '5004'],
      gradient: 'from-indigo-500/20 via-violet-500/10 to-transparent',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      {/* 1. Header Hero with 3D Liquid Glass Backing */}
      <div className="relative text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold glass-card text-neutral-800 dark:text-neutral-200 border border-slate-200/90 dark:border-white/10 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{t.portfolioBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
          {t.portfolioHeadline}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {t.portfolioSubheadline}
        </p>

        {/* Accent Color Swatch Bar (Step 4: 6 Accent Colors) */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-1">
            {t.accentColor}:
          </span>
          {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((key) => {
            const pal = ACCENT_PALETTES[key];
            const isSelected = accent === key;
            return (
              <button
                key={key}
                onClick={() => setAccent(key)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'glass-btn bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-md ring-2 ring-emerald-500/50 scale-105'
                    : 'glass-btn hover:scale-102 text-neutral-600 dark:text-neutral-400'
                }`}
                title={pal.label}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: pal.hex }}
                />
                <span className="capitalize">{pal.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive 3D Showcase & Live Vector Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive 3D Pedestal Stage */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative glass-panel liquid-sheen rounded-3xl p-8 sm:p-12 overflow-hidden shadow-xl border border-slate-200/90 dark:border-white/10 group">
            {/* Ambient Background Glow matching current Accent */}
            <div
              className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
              style={{ backgroundColor: ACCENT_PALETTES[accent].hex }}
            />

            {/* Stage Controls */}
            <div className="flex items-center justify-between gap-3 pb-6 border-b border-slate-200/80 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {activeIcon.name}
                </span>
                {activeIcon.is_pro && (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeIcon)}
                  className="p-2 glass-btn rounded-xl text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
                  title={t.copySvg}
                >
                  {copiedId === activeIcon.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDownload(activeIcon)}
                  className="p-2 glass-btn rounded-xl text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
                  title={t.downloadSvg}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEditor(activeIcon)}
                  className="px-3 py-1.5 text-xs font-semibold glass-btn-primary rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.openInStudio}</span>
                </button>
              </div>
            </div>

            {/* 3D Glass Pedestal Viewport */}
            <div className="py-12 flex items-center justify-center min-h-[320px] sm:min-h-[380px]" data-stage-theme="auto">
              <div
                style={{
                  transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
                className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center transition-transform duration-200 svg-auto-fit text-neutral-900 dark:text-white drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(activeIcon.svgContent) }}
              />
            </div>

            {/* Live Interactive Sliders (Scale & Rotate) */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/80 dark:border-white/10 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>{t.zoomLevel}</span>
                  <span className="font-mono tabular-nums">{scale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>{t.controlRotate}</span>
                  <span className="font-mono tabular-nums">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spec Sheet & Design System Core Values */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t.glassDesignHighlight}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t.glassDesignDesc}
            </p>
          </div>

          {/* Core Feature Pillars */}
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Auto-Fit ViewBox Geometry
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Every icon dynamically scales to 100% of any preview container while preserving strict aspect ratios.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  0KB Runtime SVG Dependency
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Native browser SVG rendering with zero bloat, high frame rates, and instantaneous DOM injection.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Palette className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Universal Light & Dark Mode
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  High-contrast WCAG 2.2 AA compliant palette with 6 selectable jewel-tone accent colors.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold glass-btn-primary rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <span>{t.heroExploreBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Flagship Showcase Collections */}
      <div className="space-y-8 pt-6 border-t border-slate-200/80 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t.portfolioBadge}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Curated vector suites organized by functional domains and design disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => {
            const IconCmp = col.icon;
            const sampleIcons = col.sampleIds
              .map((id) => iconDataset.find((i) => i.id === id))
              .filter(Boolean) as typeof iconDataset;

            return (
              <div
                key={col.id}
                className="group relative flex flex-col justify-between glass-card rounded-3xl p-6 overflow-hidden shadow-lg border border-slate-200/90 dark:border-white/10 transition-all hover:-translate-y-1"
              >
                {/* Accent Top Gradient */}
                <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${col.gradient}`} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-neutral-900 dark:text-white shadow-xs">
                      <IconCmp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-card text-neutral-500 dark:text-neutral-400">
                      {col.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {col.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                      {col.description}
                    </p>
                  </div>

                  {/* Sample Icon Strip */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {sampleIcons.map((sIcon) => (
                      <button
                        key={sIcon.id}
                        onClick={() => setActiveVectorId(sIcon.id)}
                        className={`aspect-square rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer ${
                          activeVectorId === sIcon.id
                            ? 'glass-btn ring-2 ring-emerald-500 scale-105'
                            : 'bg-white/40 dark:bg-neutral-900/40 hover:bg-white/70 dark:hover:bg-neutral-800'
                        }`}
                        title={sIcon.name}
                      >
                        <div
                          className="w-full h-full svg-auto-fit text-neutral-800 dark:text-neutral-200"
                          dangerouslySetInnerHTML={{
                            __html: normalizeSvgForPreview(sIcon.svgContent),
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (col.id === 'saas-ui') {
                        navigateTo({ type: 'directory', category: 'ui-actions', page: 1 });
                      } else if (col.id === 'science') {
                        navigateTo({ type: 'directory', category: 'science-molecules', page: 1 });
                      } else {
                        navigateTo({ type: 'directory', category: 'all', page: 1 });
                      }
                    }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.exploreCollection}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-mono text-neutral-400">
                    {sampleIcons.length} showcased
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
