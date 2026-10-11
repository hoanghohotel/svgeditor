import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Code2,
  Layers,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Palette,
  Globe,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { AppRoute, navigateTo } from '../utils/router';
import { IconCategory } from '../types/icon';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { useI18n } from '../i18n';
import { Language } from '../i18n/translations';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../lib/theme';

interface HeaderProps {
  currentRoute: AppRoute;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  searchQuery,
  onSearchChange,
}) => {
  const { language, setLanguage, t } = useI18n();
  const { mode, isDark, setMode, toggleTheme, accent, setAccent } = useTheme();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accentPickerOpen, setAccentPickerOpen] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccentPickerOpen(false);
    setLangPickerOpen(false);
  }, [currentRoute]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleNavCategory = (category: IconCategory) => {
    navigateTo({ type: 'directory', category, page: 1 });
    setMobileMenuOpen(false);
  };

  const handleNavEditor = () => {
    navigateTo({ type: 'editor' });
    setMobileMenuOpen(false);
  };

  const handleNavPortfolio = () => {
    navigateTo({ type: 'portfolio' });
    setMobileMenuOpen(false);
  };

  const handleNavAdmin = () => {
    navigateTo({ type: 'admin' });
    setMobileMenuOpen(false);
  };

  const isCategoryActive = (category: IconCategory) => {
    return currentRoute.type === 'directory' && currentRoute.category === category;
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel liquid-sheen border-b border-slate-200/90 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
            className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm border border-white/20 dark:border-white/40 transition-transform group-hover:scale-105 active:scale-95"
              style={{ backgroundColor: ACCENT_PALETTES[accent].hex }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                VectorHub
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {t.studioTag}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Desktop/Tablet Segmented Controls) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 p-1 rounded-2xl bg-white/60 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
          <button
            onClick={() => handleNavCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'directory'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            {t.navDirectory}
          </button>

          <button
            onClick={handleNavPortfolio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'portfolio'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.navPortfolio}</span>
          </button>

          <button
            onClick={handleNavEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'editor'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.navStudio}</span>
          </button>

          <button
            onClick={handleNavAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'admin'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.navAdmin}</span>
          </button>
        </nav>

        {/* Zone 3: Search, Language, Accent Color, Theme Toggle, Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Desktop Search Bar */}
          <div className="relative hidden xl:block w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 text-xs glass-input rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Toggle mobile search"
            className="xl:hidden p-2 glass-btn text-neutral-600 dark:text-neutral-300 rounded-xl cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language Switcher (Việt / English / 中文) */}
          <div className="relative">
            <button
              onClick={() => {
                setLangPickerOpen(!langPickerOpen);
                setAccentPickerOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold glass-btn rounded-xl text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white cursor-pointer uppercase"
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {langPickerOpen && (
              <div className="absolute right-0 mt-2 w-36 glass-panel rounded-2xl p-1.5 shadow-xl border border-slate-200/90 dark:border-white/10 z-50 space-y-1">
                <button
                  onClick={() => {
                    setLanguage('vi');
                    setLangPickerOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                    language === 'vi'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span>Tiếng Việt</span>
                  <span className="text-[10px] opacity-70">VI</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('en');
                    setLangPickerOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span>English</span>
                  <span className="text-[10px] opacity-70">EN</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('zh');
                    setLangPickerOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                    language === 'zh'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span>中文</span>
                  <span className="text-[10px] opacity-70">ZH</span>
                </button>
              </div>
            )}
          </div>

          {/* 6 Accent Colors Quick Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setAccentPickerOpen(!accentPickerOpen);
                setLangPickerOpen(false);
              }}
              className="p-2 glass-btn rounded-xl text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center gap-1"
              title={t.accentColor}
            >
              <span
                className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: ACCENT_PALETTES[accent].hex }}
              />
            </button>

            {accentPickerOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl p-2.5 shadow-xl border border-slate-200/90 dark:border-white/10 z-50 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block px-1">
                  {t.accentColor}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((col) => {
                    const pal = ACCENT_PALETTES[col];
                    const isSelected = accent === col;
                    return (
                      <button
                        key={col}
                        onClick={() => {
                          setAccent(col);
                          setAccentPickerOpen(false);
                        }}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all cursor-pointer ${
                          isSelected ? 'glass-btn ring-2 ring-emerald-500 scale-105' : 'hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                        title={pal.label}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-2xs"
                          style={{ backgroundColor: pal.hex }}
                        />
                        <span className="text-[9px] font-medium text-neutral-600 dark:text-neutral-400 truncate w-full text-center">
                          {pal.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 glass-btn text-neutral-700 dark:text-neutral-300 rounded-xl hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer focus:outline-none"
            title={mode === 'light' ? t.themeLight : mode === 'dark' ? t.themeDark : t.themeSystem}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Google Auth or User Chip */}
          {!authLoading && (
            currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs glass-panel rounded-xl text-neutral-800 dark:text-neutral-200 border border-slate-200/80 dark:border-white/10 shadow-xs">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-4 h-4 rounded-full ring-1 ring-white/40" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span className="font-medium max-w-[80px] truncate text-[11px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title={t.signOut}
                  className="p-1.5 glass-btn text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 glass-btn rounded-xl transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.signIn}</span>
              </button>
            )
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 glass-btn text-neutral-700 dark:text-neutral-200 rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Dropdown Bar */}
      {mobileSearchOpen && (
        <div className="xl:hidden px-4 pb-3 pt-1 border-t border-slate-200/80 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-7 py-2 text-xs glass-input rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-4 border-t border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0d111c]/95 backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-2 block">
              {t.navDirectory}
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => handleNavCategory('all')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  currentRoute.type === 'directory'
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {t.allCategories}
              </button>
              <button
                onClick={handleNavPortfolio}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  currentRoute.type === 'portfolio'
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {t.navPortfolio}
              </button>
              <button
                onClick={handleNavEditor}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  currentRoute.type === 'editor'
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {t.navStudio}
              </button>
              <button
                onClick={handleNavAdmin}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  currentRoute.type === 'admin'
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {t.navAdmin}
              </button>
            </div>
          </div>

          {/* User authentication in mobile drawer */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between px-2">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-xs">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-6 h-6 rounded-full" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-xs glass-btn text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium glass-btn rounded-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-500" />
                <span>{t.signIn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
