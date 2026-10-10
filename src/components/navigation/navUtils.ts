import type { LucideIcon } from 'lucide-react';

export interface NavEntry {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match the path exactly (e.g. dashboard roots). */
  exact?: boolean;
  /** Custom matcher; overrides `exact`. */
  isActive?: (pathname: string) => boolean;
  /** Not available yet: rendered dimmed and non-interactive. */
  soon?: boolean;
  /** Drawer only: open this listing inside the open drawer instead of navigating. */
  drawerView?: 'fests' | 'events';
}

export interface NavGroup {
  label?: string;
  items: NavEntry[];
}

/** Segment-aware path matching: "/a/b" matches "/a/b" and "/a/b/c" but not "/a/bc". */
export const isPathActive = (pathname: string, path: string, exact?: boolean): boolean => {
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path.endsWith('/') ? path : `${path}/`);
};

export const isEntryActive = (pathname: string, item: NavEntry): boolean => {
  if (item.soon) return false;
  if (item.isActive) return item.isActive(pathname);
  return isPathActive(pathname, item.to, item.exact);
};

export const getInitial = (name?: string | null, fallback = 'U') =>
  name?.trim()?.[0]?.toUpperCase() || fallback;

export type NavAccent = 'orange' | 'red';

export const ACCENT: Record<NavAccent, { bar: string; icon: string; text: string; chip: string }> = {
  orange: {
    bar: 'before:bg-[#ff4f1a]',
    icon: 'text-[#ff4f1a]',
    text: 'text-[#ff4f1a]',
    chip: 'bg-[#ff4f1a]/12 text-[#ff4f1a] border-[#ff4f1a]/25'
  },
  red: {
    bar: 'before:bg-red-500',
    icon: 'text-red-400',
    text: 'text-red-400',
    chip: 'bg-red-500/10 text-red-400 border-red-500/25'
  }
};

/** Shared keyboard focus ring for every interactive nav element. */
export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4f1a]';
