import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { FOCUS_RING, NavEntry, getInitial } from './navUtils';

export interface NavUser {
  displayName?: string | null;
  email?: string | null;
}

export const Avatar: React.FC<{ name?: string | null; fallback?: string; size?: 'sm' | 'md' }> = ({
  name,
  fallback = 'U',
  size = 'md'
}) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center rounded-full border border-[#ff4f1a]/30 bg-[#ff4f1a]/15 font-bold text-[#ff4f1a] ${
      size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'
    }`}
  >
    {getInitial(name, fallback)}
  </span>
);

interface AccountMenuProps {
  user: NavUser | null;
  fallbackName: string;
  roleLabel: string;
  /** Extra destinations (portal switching etc.), shown above Sign out. */
  items?: Pick<NavEntry, 'label' | 'to' | 'icon'>[];
  onSignOut: () => void | Promise<void>;
}

/** Desktop account dropdown: avatar trigger, identity header, links, sign out. */
export const AccountMenu: React.FC<AccountMenuProps> = ({ user, fallbackName, roleLabel, items = [], onSignOut }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();
  const name = user?.displayName || fallbackName;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        if (!els.length) return;
        e.preventDefault();
        const i = els.indexOf(document.activeElement as HTMLElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
        els[next].focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass = `flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${name}`}
        className={`flex h-10 items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-[#2e3442] hover:bg-white/5 cursor-pointer ${FOCUS_RING} ${
          open ? 'border-[#2e3442] bg-white/5' : ''
        }`}
      >
        <Avatar name={user?.displayName} fallback={fallbackName[0]} />
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium text-[#c3c8d6] xl:block">{name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#656c80] transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#2e3442] bg-[#14161a] p-1.5 shadow-lg shadow-black/40"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <div className="truncate text-sm font-semibold text-white">{name}</div>
            {user?.email && <div className="truncate text-xs text-[#656c80]">{user.email}</div>}
            <div className="mt-1.5 inline-block rounded border border-[#2e3442] bg-[#1c1f26] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#9da3b4]">
              {roleLabel}
            </div>
          </div>
          {items.length > 0 && (
            <div className="border-t border-[#242730] py-1">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={it.to} role="menuitem" className={itemClass}>
                    <Icon className="h-4 w-4 text-[#656c80]" aria-hidden="true" />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="border-t border-[#242730] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              className={`${itemClass} !text-red-400 hover:!bg-red-950/40 hover:!text-red-300`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface DrawerAccountProps {
  user: NavUser | null;
  fallbackName: string;
  roleLabel: string;
  onSignOut: () => void | Promise<void>;
}

/** Account block pinned to the bottom of every authenticated mobile drawer. */
export const DrawerAccount: React.FC<DrawerAccountProps> = ({ user, fallbackName, roleLabel, onSignOut }) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-3 px-1">
      <Avatar name={user?.displayName} fallback={fallbackName[0]} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{user?.displayName || fallbackName}</div>
        <div className="truncate text-xs text-[#656c80]">{user?.email || roleLabel}</div>
      </div>
      <span className="shrink-0 rounded border border-[#2e3442] bg-[#1c1f26] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#9da3b4]">
        {roleLabel}
      </span>
    </div>
    <button
      type="button"
      onClick={() => void onSignOut()}
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#2e3442] text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 cursor-pointer ${FOCUS_RING}`}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </button>
  </div>
);
