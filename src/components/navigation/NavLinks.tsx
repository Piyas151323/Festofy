import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT, FOCUS_RING, NavAccent, NavEntry, NavGroup, isEntryActive } from './navUtils';

interface NavLinkItemProps {
  item: NavEntry;
  pathname: string;
  accent?: NavAccent;
  /** md = sidebar (40px rows), lg = mobile drawer (44px rows). */
  size?: 'md' | 'lg';
  onNavigate?: () => void;
}

/** Vertical nav row used by console sidebars and every mobile drawer. */
export const NavLinkItem: React.FC<NavLinkItemProps> = ({
  item,
  pathname,
  accent = 'orange',
  size = 'md',
  onNavigate
}) => {
  const Icon = item.icon;
  const a = ACCENT[accent];
  const height = size === 'lg' ? 'min-h-11' : 'min-h-10';
  const base = `relative flex ${height} items-center gap-3 rounded-lg px-3 text-[13px] font-medium`;

  if (item.soon) {
    return (
      <div
        aria-disabled="true"
        title="Upcoming feature"
        className={`${base} cursor-not-allowed select-none justify-between text-zinc-600`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </span>
        <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-500">
          Soon
        </span>
      </div>
    );
  }

  const active = isEntryActive(pathname, item);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`${base} transition-colors ${FOCUS_RING} ${
        active
          ? `bg-[#1c1f26] text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full ${a.bar}`
          : 'text-[#9da3b4] hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? a.icon : 'text-[#656c80]'}`} aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

interface NavGroupListProps {
  groups: NavGroup[];
  pathname: string;
  accent?: NavAccent;
  size?: 'md' | 'lg';
  onNavigate?: () => void;
}

/** Renders labelled groups of nav rows. Group labels are real headings for assistive tech. */
export const NavGroupList: React.FC<NavGroupListProps> = ({ groups, pathname, accent, size, onNavigate }) => (
  <div className="space-y-5">
    {groups.map((group, i) => (
      <div key={group.label ?? i} role="group" aria-label={group.label}>
        {group.label && (
          <div className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#656c80]">
            {group.label}
          </div>
        )}
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              pathname={pathname}
              accent={accent}
              size={size}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface TopLinkProps {
  item: Pick<NavEntry, 'label' | 'to' | 'icon'> & Partial<NavEntry>;
  pathname: string;
  /** Show the icon (used only when there is room). */
  showIcon?: boolean;
}

/** Horizontal link for top navigation bars. */
export const TopNavLink: React.FC<TopLinkProps> = ({ item, pathname, showIcon = false }) => {
  const active = isEntryActive(pathname, item as NavEntry);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
        active ? 'bg-white/[0.07] text-white' : 'text-[#9da3b4] hover:bg-white/5 hover:text-white'
      }`}
    >
      {showIcon && (
        <Icon className={`hidden h-4 w-4 xl:block ${active ? 'text-[#ff4f1a]' : 'text-[#656c80]'}`} aria-hidden="true" />
      )}
      {item.label}
    </Link>
  );
};
