import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet' | 'cyan';

export interface AccentConfig {
  id: AccentColor;
  label: string;
  hex: string;
  glow: string;
  subtle: string;
  ring: string;
  gradient: string;
}

export const ACCENT_PALETTES: Record<AccentColor, AccentConfig> = {
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    subtle: 'rgba(16, 185, 129, 0.12)',
    ring: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-500 to-teal-600',
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo Sapphire',
    hex: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.35)',
    subtle: 'rgba(99, 102, 241, 0.12)',
    ring: 'rgba(99, 102, 241, 0.5)',
    gradient: 'from-indigo-500 to-blue-600',
  },
  rose: {
    id: 'rose',
    label: 'Rose Ruby',
    hex: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.35)',
    subtle: 'rgba(244, 63, 94, 0.12)',
    ring: 'rgba(244, 63, 94, 0.5)',
    gradient: 'from-rose-500 to-pink-600',
  },
  amber: {
    id: 'amber',
    label: 'Amber Gold',
    hex: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    subtle: 'rgba(245, 158, 11, 0.12)',
    ring: 'rgba(245, 158, 11, 0.5)',
    gradient: 'from-amber-500 to-orange-600',
  },
  violet: {
    id: 'violet',
    label: 'Violet Amethyst',
    hex: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.35)',
    subtle: 'rgba(139, 92, 246, 0.12)',
    ring: 'rgba(139, 92, 246, 0.5)',
    gradient: 'from-violet-500 to-purple-600',
  },
  cyan: {
    id: 'cyan',
    label: 'Cyan Ocean',
    hex: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.35)',
    subtle: 'rgba(6, 182, 212, 0.12)',
    ring: 'rgba(6, 182, 212, 0.5)',
    gradient: 'from-cyan-500 to-teal-600',
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  accent: AccentColor;
  accentConfig: AccentConfig;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vh_theme_mode') as ThemeMode | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    }
    return 'system';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vh_accent') as AccentColor | null;
      if (saved && ACCENT_PALETTES[saved]) {
        return saved;
      }
    }
    return 'emerald';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system dark preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = mode === 'system' ? systemIsDark : mode === 'dark';

  // Apply dark class and CSS accent variables to root
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const palette = ACCENT_PALETTES[accent];
    root.setAttribute('data-accent', accent);
    root.style.setProperty('--accent-primary', palette.hex);
    root.style.setProperty('--accent-glow', palette.glow);
    root.style.setProperty('--accent-subtle', palette.subtle);
    root.style.setProperty('--accent-ring', palette.ring);

    localStorage.setItem('vh_theme_mode', mode);
    localStorage.setItem('vh_accent', accent);
  }, [isDark, mode, accent]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleTheme = () => {
    setModeState((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
  };

  const value: ThemeContextType = {
    mode,
    isDark,
    accent,
    accentConfig: ACCENT_PALETTES[accent],
    setMode,
    toggleTheme,
    setAccent,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
