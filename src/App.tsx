/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DirectoryPage } from './components/DirectoryPage';
import { IconDetailPage } from './components/IconDetailPage';
import { EditorPage } from './components/EditorPage';
import { AdminDashboard } from './components/AdminDashboard';
import { useAppRouter, navigateTo } from './utils/router';
import { getIconById } from './data/iconDataset';
import { IconCategory } from './types/icon';

export default function App() {
  const [currentRoute, setRoute] = useAppRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dark mode management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vh_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vh_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Synchronize document title and canonical tags per route
  useEffect(() => {
    switch (currentRoute.type) {
      case 'admin': {
        document.title = 'Operations & Admin Studio — VectorHub';
        break;
      }
      case 'detail': {
        const icon = getIconById(currentRoute.id);
        if (icon) {
          document.title = `${icon.name} — VectorHub SVG Library`;
        } else {
          document.title = 'Icon Details — VectorHub';
        }
        break;
      }
      case 'editor': {
        document.title = 'SVG Editor & Optimizer Studio — VectorHub';
        break;
      }
      case 'directory': {
        const catName =
          currentRoute.category === 'all'
            ? 'All Icons'
            : currentRoute.category === 'ui-actions'
            ? 'UI Actions'
            : currentRoute.category === 'tech-logos'
            ? 'Tech Logos'
            : currentRoute.category === 'system-devices'
            ? 'System & Devices'
            : currentRoute.category === 'media-controls'
            ? 'Media & Controls'
            : 'Science & Molecules';
        document.title = `${catName} (Page ${currentRoute.page}) — VectorHub`;
        break;
      }
    }
  }, [currentRoute]);

  const handleFooterCategoryClick = (category: IconCategory) => {
    setSearchQuery('');
    navigateTo({ type: 'directory', category, page: 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100/60 dark:bg-[#0b0e17] text-neutral-900 dark:text-neutral-100 transition-colors relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Apple Liquid Glass Ambient Light Canvas */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden liquid-mesh-bg" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-2/3 left-1/3 w-[30rem] h-[30rem] rounded-full bg-sky-500/8 dark:bg-sky-500/12 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-amber-500/8 dark:bg-amber-500/10 blur-3xl" />
      </div>

      {/* Top Bar Header */}
      <Header
        currentRoute={currentRoute}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {currentRoute.type === 'directory' && (
          <DirectoryPage
            activeCategory={currentRoute.category}
            currentPage={currentRoute.page}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentRoute.type === 'detail' && (
          <IconDetailPage
            iconId={currentRoute.id}
            iconSlug={currentRoute.slug}
          />
        )}

        {currentRoute.type === 'editor' && (
          <EditorPage initialIconId={currentRoute.iconId} />
        )}

        {currentRoute.type === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer (Apple Liquid Glass frosted container) */}
      <footer className="relative z-10 glass-panel liquid-sheen border-t border-white/50 dark:border-white/10 py-10 transition-colors mt-16 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-[11px] shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                  VectorHub
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Liquid Glass Studio
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Open vector library, developer asset inspector, and client-side optimization studio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <button
                onClick={() => handleFooterCategoryClick('all')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                All Icons
              </button>
              <button
                onClick={() => handleFooterCategoryClick('ui-actions')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                UI Actions
              </button>
              <button
                onClick={() => handleFooterCategoryClick('tech-logos')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Tech Logos
              </button>
              <button
                onClick={() => handleFooterCategoryClick('system-devices')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Devices
              </button>
              <button
                onClick={() => handleFooterCategoryClick('media-controls')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Media
              </button>
              <button
                onClick={() => navigateTo({ type: 'editor' })}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Studio
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200/60 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <p>Crafted with Apple Liquid Glass aesthetic &amp; shadcn primitives. MIT License.</p>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Client-Side Raster Engine</span>
              <span aria-hidden="true">·</span>
              <span>Font Awesome Pro Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
