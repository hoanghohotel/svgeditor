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
 * Parses any incoming URL into a structured AppRoute.
 * Supports:
 *   - Clean path URLs: /s/1002/shield-check, /editor, /portfolio, /admin
 *   - Nested parameters: /s/:id/:slug, /editor/:id, /editor?id=:id
 *   - Legacy hash URLs: #/s/1002/shield-check, #/editor?id=1001 (for seamless migration)
 */
export function parseRoute(
  rawPath: string = window.location.pathname,
  rawSearch: string = window.location.search
): AppRoute {
  let routeString = rawPath;
  let searchString = rawSearch;

  // Seamless legacy hash migration: if window.location.hash contains a route, extract it
  if (window.location.hash && window.location.hash.length > 1) {
    const hashContent = window.location.hash.replace(/^#\/?/, '/');
    const [hPath, hQuery] = hashContent.split('?');
    if (hPath && hPath !== '/') {
      routeString = hPath.startsWith('/') ? hPath : `/${hPath}`;
    }
    if (hQuery) {
      searchString = `?${hQuery}`;
    }
  }

  // Normalize path
  const cleanPath = (routeString.startsWith('/') ? routeString : `/${routeString}`)
    .replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(searchString);

  // 1. Admin / Dashboard: /admin or /dashboard
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

  // 5. Canonical Detail route: /s/:id/:slug or /s/:id
  // Examples: /s/1002/shield-check, /s/1002
  const detailMatch = cleanPath.match(/^\/s\/([^/]+)(?:\/([^/]+))?/);
  if (detailMatch) {
    return {
      type: 'detail',
      id: decodeURIComponent(detailMatch[1]),
      slug: detailMatch[2] ? decodeURIComponent(detailMatch[2]) : '',
    };
  }

  // 6. Editor with route param: /editor/:id or /editor/:id/:slug
  const editorParamMatch = cleanPath.match(/^\/editor\/([^/]+)(?:\/([^/]+))?/);
  if (editorParamMatch) {
    return {
      type: 'editor',
      iconId: decodeURIComponent(editorParamMatch[1]),
    };
  }

  // 7. Editor view: /editor or /editor?id=...
  if (cleanPath === '/editor') {
    const iconId = searchParams.get('id') || undefined;
    return {
      type: 'editor',
      iconId,
    };
  }

  // 8. Collection: /directory/collection/:slug or /directory/collection/:slug/:page
  const colMatch = cleanPath.match(/^\/directory\/collection\/([^/]+)(?:\/(\d+))?/);
  if (colMatch) {
    const slug = decodeURIComponent(colMatch[1]);
    const page = colMatch[2] ? parseInt(colMatch[2], 10) : 1;
    return {
      type: 'collection',
      slug,
      page: Math.max(1, page),
    };
  }

  // 9. Category directory: /directory/category/:slug or /directory/category/:slug/:page
  const catMatch = cleanPath.match(/^\/directory\/category\/([^/]+)(?:\/(\d+))?/);
  if (catMatch) {
    const cat = decodeURIComponent(catMatch[1]) as IconCategory;
    const page = catMatch[2] ? parseInt(catMatch[2], 10) : 1;
    const validCategories: IconCategory[] = [
      'all',
      'ui-actions',
      'tech-logos',
      'system-devices',
      'media-controls',
      'science-molecules',
    ];
    return {
      type: 'directory',
      category: validCategories.includes(cat) ? cat : 'all',
      page: Math.max(1, page),
    };
  }

  // 10. Directory all: /directory/all/:page or /directory/all
  const allMatch = cleanPath.match(/^\/directory\/all(?:\/(\d+))?/);
  if (allMatch) {
    const page = allMatch[1] ? parseInt(allMatch[1], 10) : 1;
    return {
      type: 'directory',
      category: 'all',
      page: Math.max(1, page),
    };
  }

  // Default homepage fallback: /
  return {
    type: 'directory',
    category: 'all',
    page: 1,
  };
}

/**
 * Returns clean, canonical URL path for any AppRoute (NO hash `#`).
 * Example outputs:
 *   /s/1002/shield-check
 *   /editor?id=1002
 *   /portfolio
 *   /admin
 *   /
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
      return `/s/${encodeURIComponent(route.id)}${route.slug ? `/${encodeURIComponent(route.slug)}` : ''}`;
    case 'editor':
      return route.iconId ? `/editor?id=${encodeURIComponent(route.iconId)}` : '/editor';
    case 'collection':
      return `/directory/collection/${encodeURIComponent(route.slug)}${route.page > 1 ? `/${route.page}` : ''}`;
    case 'directory':
      if (route.category === 'all') {
        return route.page > 1 ? `/directory/all/${route.page}` : '/';
      }
      return `/directory/category/${encodeURIComponent(route.category)}${route.page > 1 ? `/${route.page}` : ''}`;
  }
}

/**
 * Returns full shareable URL with origin (e.g. https://svgeditor-self.vercel.app/s/1002/shield-check)
 */
export function getShareableUrl(route?: AppRoute): string {
  const path = route ? formatRouteUrl(route) : window.location.pathname + window.location.search;
  return `${window.location.origin}${path}`;
}

/**
 * Internal route subscriber registry for reactive client-side navigation.
 */
type RouteListener = (route: AppRoute) => void;
const routeListeners = new Set<RouteListener>();

function notifyListeners(route: AppRoute) {
  routeListeners.forEach((listener) => {
    try {
      listener(route);
    } catch (err) {
      console.error('Route listener error:', err);
    }
  });
}

/**
 * Imperative navigation via HTML5 History API.
 * Uses clean path-based routing (pushState/replaceState).
 */
export function navigateTo(route: AppRoute, options?: { replace?: boolean }): void {
  const targetUrl = formatRouteUrl(route);
  const currentUrl = window.location.pathname + window.location.search;

  if (options?.replace) {
    window.history.replaceState({ route }, '', targetUrl);
  } else if (currentUrl !== targetUrl || window.location.hash) {
    window.history.pushState({ route }, '', targetUrl);
  }

  notifyListeners(route);
}

interface RouterContextType {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

/**
 * BrowserRouter Component:
 * Clean, standard HTML5 History API router.
 * Features:
 *   - Clean URLs without '#' (e.g. /s/1002/shield-check)
 *   - F5 page refresh support on static deployments & dev server
 *   - Automatic legacy hash migration: transforms #/s/1002/shield-check to /s/1002/shield-check
 *   - Browser Back and Forward button support
 *   - Restores document state seamlessly on reload
 */
export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    // If user arrived with a legacy hash (e.g. #/s/1002/shield-check), parse and upgrade to clean URL
    if (window.location.hash && window.location.hash.length > 1) {
      const parsed = parseRoute();
      const cleanUrl = formatRouteUrl(parsed);
      window.history.replaceState({ route: parsed }, '', cleanUrl);
      return parsed;
    }
    return parseRoute();
  });

  const [, startTransition] = useTransition();

  useEffect(() => {
    // If there is still a legacy hash after mount, clean it up
    if (window.location.hash && window.location.hash.length > 1) {
      const parsed = parseRoute();
      const cleanUrl = formatRouteUrl(parsed);
      window.history.replaceState({ route: parsed }, '', cleanUrl);
    }

    const handleRouteChange = (newRoute: AppRoute) => {
      startTransition(() => {
        setCurrentRoute(newRoute);
      });
    };

    const handlePopState = () => {
      const parsed = parseRoute();
      startTransition(() => {
        setCurrentRoute(parsed);
      });
    };

    routeListeners.add(handleRouteChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      routeListeners.delete(handleRouteChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, navigateTo }}>
      {children}
    </RouterContext.Provider>
  );
};

/**
 * Backwards compatibility alias so any legacy imports of HashRouter continue to function seamlessly.
 */
export const HashRouter = BrowserRouter;

/**
 * Custom hook to consume the current AppRoute and navigate function.
 */
export function useAppRouter(): [AppRoute, (route: AppRoute, options?: { replace?: boolean }) => void] {
  const context = useContext(RouterContext);
  if (context) {
    return [context.currentRoute, context.navigateTo];
  }

  // Fallback if rendered outside of <BrowserRouter>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());
    routeListeners.add(setRoute);
    window.addEventListener('popstate', handlePopState);
    return () => {
      routeListeners.delete(setRoute);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return [route, navigateTo];
}
