import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Code2,
  Layers,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Compass,
} from 'lucide-react';
import { AppRoute, navigateTo } from '../utils/router';
import { IconCategory } from '../types/icon';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';

interface HeaderProps {
  currentRoute: AppRoute;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleTheme,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  const handleNavAdmin = () => {
    navigateTo({ type: 'admin' });
    setMobileMenuOpen(false);
  };

  const isCategoryActive = (category: IconCategory) => {
    return currentRoute.type === 'directory' && currentRoute.category === category;
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel liquid-sheen border-b border-white/60 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigateTo({ type: 'directory', category: 'all', page: 1 })}
            className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm border border-white/20 dark:border-white/40 transition-transform group-hover:scale-105 active:scale-95">
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
                Studio
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Desktop/Tablet Segmented Controls) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 p-1 rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-white/50 dark:border-white/10 backdrop-blur-md shadow-xs">
          <button
            onClick={() => handleNavCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('all')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            All Icons
          </button>
          <button
            onClick={() => handleNavCategory('ui-actions')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('ui-actions')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            UI Actions
          </button>
          <button
            onClick={() => handleNavCategory('tech-logos')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('tech-logos')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            Tech Logos
          </button>
          <button
            onClick={() => handleNavCategory('system-devices')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('system-devices')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            Devices
          </button>
          <button
            onClick={() => handleNavCategory('media-controls')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('media-controls')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            Media
          </button>
          <button
            onClick={() => handleNavCategory('science-molecules')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isCategoryActive('science-molecules')
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            Science
          </button>
          <button
            onClick={handleNavEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'editor'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Studio</span>
          </button>
          <button
            onClick={handleNavAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentRoute.type === 'admin'
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-xs border border-white/80 dark:border-white/10'
                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: Search, Theme Toggle, Primary Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Desktop Search Bar */}
          <div className="relative hidden md:block w-44 lg:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search 50+ SVGs..."
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
            className="md:hidden p-2 glass-btn text-neutral-600 dark:text-neutral-300 rounded-xl cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher (Liquid Glass Button) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 glass-btn text-neutral-700 dark:text-neutral-300 rounded-xl hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer focus:outline-none"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Auth State: Google Sign-In or User Chip (hidden on small mobile to save space) */}
          {!authLoading && (
            currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs glass-panel rounded-xl text-neutral-800 dark:text-neutral-200 border border-white/50 dark:border-white/10 shadow-xs">
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
                  title="Sign out"
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
                <span>Sign In</span>
              </button>
            )
          )}

          {/* Primary Action Button (Open Studio) */}
          <button
            onClick={handleNavEditor}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium glass-btn-primary rounded-xl cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-500" />
            <span>Studio</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 glass-btn text-neutral-700 dark:text-neutral-200 rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Dropdown Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/40 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search icons by name, style, category..."
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

      {/* Mobile & Tablet Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 py-4 border-t border-white/50 dark:border-white/10 bg-white/95 dark:bg-[#0d111c]/95 backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-2 block">
              Categories &amp; Libraries
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => handleNavCategory('all')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('all')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                All Icons
              </button>
              <button
                onClick={() => handleNavCategory('ui-actions')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('ui-actions')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                UI Actions
              </button>
              <button
                onClick={() => handleNavCategory('tech-logos')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('tech-logos')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                Tech Logos
              </button>
              <button
                onClick={() => handleNavCategory('system-devices')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('system-devices')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                Devices
              </button>
              <button
                onClick={() => handleNavCategory('media-controls')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('media-controls')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => handleNavCategory('science-molecules')}
                className={`p-2.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                  isCategoryActive('science-molecules')
                    ? 'glass-btn-primary font-bold shadow-xs'
                    : 'glass-btn text-neutral-800 dark:text-neutral-200'
                }`}
              >
                Science &amp; Molecules
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/30 dark:border-white/10 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-2 block">
              Core Applications
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleNavEditor}
                className="flex items-center justify-center gap-2 p-2.5 text-xs font-semibold glass-btn-primary rounded-xl cursor-pointer shadow-sm"
              >
                <Code2 className="w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                <span>SVG Studio</span>
              </button>
              <button
                onClick={handleNavAdmin}
                className="flex items-center justify-center gap-2 p-2.5 text-xs font-medium glass-btn rounded-xl text-neutral-900 dark:text-white cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Admin Studio</span>
              </button>
            </div>
          </div>

          {/* User authentication in mobile drawer */}
          <div className="pt-2 border-t border-white/30 dark:border-white/10 flex items-center justify-between px-2">
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
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium glass-btn rounded-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-500" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
