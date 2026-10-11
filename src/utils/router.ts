import { useEffect, useState } from 'react';
import { IconCategory } from '../types/icon';

export type AppRoute =
  | { type: 'directory'; category: IconCategory; page: number }
  | { type: 'collection'; slug: string; page: number }
  | { type: 'detail'; id: string; slug: string }
  | { type: 'editor'; iconId?: string }
  | { type: 'search'; query: string; page: number }
  | { type: 'admin' }
  | { type: 'login' };

export function parseRoute(path: string = window.location.pathname, search: string = window.location.search): AppRoute {
  const cleanPath = path.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search);

  // 1. Admin or Dashboard: /admin or /dashboard
  if (cleanPath === '/admin' || cleanPath === '/dashboard') {
    return { type: 'admin' };
  }

  // 2. Login: /login
  if (cleanPath === '/login') {
    return { type: 'login' };
  }

  // 3. Search: /search?q=...
  if (cleanPath === '/search') {
    return {
      type: 'search',
      query: searchParams.get('q') || '',
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
    };
  }

  // 4. Detail view: /s/:id/:slug or /s/:id
  const detailMatch = cleanPath.match(/^\/s\/([^/]+)(?:\/([^/]+))?/);
  if (detailMatch) {
    return {
      type: 'detail',
      id: detailMatch[1],
      slug: detailMatch[2] || '',
    };
  }

  // 5. Editor view: /editor
  if (cleanPath === '/editor' || cleanPath.startsWith('/editor/')) {
    const iconId = searchParams.get('id') || undefined;
    return {
      type: 'editor',
      iconId,
    };
  }

  // 6. Collection: /directory/collection/:slug
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

  // 7. Category directory: /directory/category/:slug/:page
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

  // 8. Directory all: /directory/all/:page
  const allMatch = cleanPath.match(/^\/directory\/all(?:\/(\d+))?/);
  if (allMatch) {
    const page = allMatch[1] ? parseInt(allMatch[1], 10) : 1;
    return {
      type: 'directory',
      category: 'all',
      page: Math.max(1, page),
    };
  }

  // Default to directory all page 1
  return {
    type: 'directory',
    category: 'all',
    page: 1,
  };
}

export function formatRouteUrl(route: AppRoute): string {
  switch (route.type) {
    case 'admin':
      return '/admin';
    case 'login':
      return '/login';
    case 'search':
      return `/search?q=${encodeURIComponent(route.query)}${route.page > 1 ? `&page=${route.page}` : ''}`;
    case 'detail':
      return `/s/${route.id}/${route.slug}`;
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

export function navigateTo(route: AppRoute): void {
  const url = formatRouteUrl(route);
  if (window.location.pathname + window.location.search !== url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  }
}

export function useAppRouter(): [AppRoute, (route: AppRoute) => void] {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parseRoute());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(parseRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return [currentRoute, navigateTo];
}
