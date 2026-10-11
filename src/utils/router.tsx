import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { IconCategory } from '../types/icon';

export type AppRoute =
  | { type: 'directory'; category: IconCategory; page: number }
  | { type: 'collection'; slug: string; page: number }
  | { type: 'detail'; id: string; slug: string }
  | { type: 'editor'; iconId?: string }
  | { type: 'search'; query: string; page: number }
  | { type: 'portfolio' }
  | { type: 'admin' }
  | { type: 'login' };

/**
 * Parses the current hash route or pathname fallback.
 * Examples:
 *   #/editor?id=1001
 *   #/directory/all/1
 *   #/directory/category/tech-logos/1
 *   #/portfolio
 *   #/admin
 *   #/s/1001/trophy
 */
export function parseRoute(
  rawPath: string = window.location.hash || window.location.pathname,
  rawSearch: string = window.location.search
): AppRoute {
  // Normalize hash-based route: strip leading '#' or '#/'
  let routeString = rawPath;
  let searchString = rawSearch;

  if (window.location.hash) {
    const hashContent = window.location.hash.replace(/^#\/?/, '/');
    const [hPath, hQuery] = hashContent.split('?');
    routeString = hPath || '/';
    if (hQuery) {
      searchString = `?${hQuery}`;
    }
  }

  const cleanPath = (routeString.startsWith('/') ? routeString : `/${routeString}`).replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(searchString);

  // 1. Admin or Dashboard: /admin or /dashboard
  if (cleanPath === '/admin' || cleanPath === '/dashboard') {
    return { type: 'admin' };
  }

  // 2. Portfolio Showcase: /portfolio
  if (cleanPath === '/portfolio') {
    return { type: 'portfolio' };
  }

  // 3. Login: /login
  if (cleanPath === '/login') {
    return { type: 'login' };
  }

  // 4. Search: /search?q=...
  if (cleanPath === '/search') {
    return {
      type: 'search',
      query: searchParams.get('q') || '',
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
    };
  }

  // 5. Detail view: /s/:id/:slug or /s/:id
  const detailMatch = cleanPath.match(/^\/s\/([^/]+)(?:\/([^/]+))?/);
  if (detailMatch) {
    return {
      type: 'detail',
      id: detailMatch[1],
      slug: detailMatch[2] || '',
    };
  }

  // 6. Editor view: /editor
  if (cleanPath === '/editor' || cleanPath.startsWith('/editor/')) {
    const iconId = searchParams.get('id') || undefined;
    return {
      type: 'editor',
      iconId,
    };
  }

  // 7. Collection: /directory/collection/:slug
  const colMatch = cleanPath.match(/^\/directory\/collection\/([^/]+)(?:\/(\d+))?/);
  if (colMatch) {
    const slug = colMatch[1];
    const page = colMatch[2] ? parseInt(colMatch[2], 10) : 1;
    return {
      type: 'collection',
      slug,
      page: Math.max(1, page),
    };
  }

  // 8. Category directory: /directory/category/:slug/:page
  const catMatch = cleanPath.match(/^\/directory\/category\/([^/]+)(?:\/(\d+))?/);
  if (catMatch) {
    const cat = catMatch[1] as IconCategory;
    const page = catMatch[2] ? parseInt(catMatch[2], 10) : 1;
    return {
      type: 'directory',
      category: ['all', 'ui-actions', 'tech-logos', 'system-devices', 'media-controls', 'science-molecules'].includes(cat)
        ? cat
        : 'all',
      page: Math.max(1, page),
    };
  }

  // 9. Directory all: /directory/all/:page
  const allMatch = cleanPath.match(/^\/directory\/all(?:\/(\d+))?/);
  if (allMatch) {
    const page = allMatch[1] ? parseInt(allMatch[1], 10) : 1;
    return {
      type: 'directory',
      category: 'all',
      page: Math.max(1, page),
    };
  }

  // Default fallback
  return {
    type: 'directory',
    category: 'all',
    page: 1,
  };
}

/**
 * Returns the path part for a route (without hash symbol)
 */
export function formatRouteUrl(route: AppRoute): string {
  switch (route.type) {
    case 'admin':
      return '/admin';
    case 'portfolio':
      return '/portfolio';
    case 'login':
      return '/login';
    case 'search':
      return `/search?q=${encodeURIComponent(route.query)}${route.page > 1 ? `&page=${route.page}` : ''}`;
    case 'detail':
      return `/s/${route.id}${route.slug ? `/${route.slug}` : ''}`;
    case 'editor':
      return route.iconId ? `/editor?id=${route.iconId}` : '/editor';
    case 'collection':
      return `/directory/collection/${route.slug}${route.page > 1 ? `/${route.page}` : ''}`;
    case 'directory':
      if (route.category === 'all') {
        return `/directory/all/${route.page}`;
      }
      return `/directory/category/${route.category}/${route.page}`;
  }
}

/**
 * Returns the formatted hash string (e.g. #/editor?id=1001)
 */
export function formatHashUrl(route: AppRoute): string {
  return `#${formatRouteUrl(route)}`;
}

/**
 * Imperative navigation via HashRouter. Updates window.location.hash smoothly.
 */
export function navigateTo(route: AppRoute): void {
  const targetHash = formatHashUrl(route);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

interface RouterContextType {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

/**
 * HashRouter Component:
 * Wraps the application to provide reliable hash-based routing.
 * Ensures state is preserved and F5 refresh in any static deployment (Vercel, GitHub Pages, Firebase Hosting)
 * works immediately without requiring server-side URL rewrite configuration.
 */
export const HashRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    // If user arrived with a pathname but no hash (e.g. /editor on initial load),
    // migrate smoothly to hash format.
    if (!window.location.hash && window.location.pathname && window.location.pathname !== '/') {
      const parsed = parseRoute(window.location.pathname, window.location.search);
      // Migrate to hash without reloading
      const targetHash = formatHashUrl(parsed);
      window.history.replaceState(null, '', `${window.location.pathname}${targetHash}`);
      return parsed;
    }
    return parseRoute();
  });

  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleHashChange = () => {
      startTransition(() => {
        setCurrentRoute(parseRoute());
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, navigateTo }}>
      {children}
    </RouterContext.Provider>
  );
};

/**
 * Custom hook to consume the current AppRoute and navigate function.
 */
export function useAppRouter(): [AppRoute, (route: AppRoute) => void] {
  const context = useContext(RouterContext);
  if (context) {
    return [context.currentRoute, context.navigateTo];
  }

  // Fallback if rendered outside of <HashRouter>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  return [route, navigateTo];
}
