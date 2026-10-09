import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { FOCUS_RING, NavEntry, getInitial } from './navUtils';

export interface NavUser {
  displayName?: string | null;
  email?: string | null;
}

interface AccountMenuProps {
  user: NavUser | null;
  fallbackName: string;
  roleLabel: string;
  items?: NavEntry[];
  onSignOut: () => void | Promise<void>;
}

interface AvatarProps {
  name?: string | null;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, fallback = 'U' }) => (
  <span
    aria-hidden="true"
    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#ff4f1a]/30 bg-[#ff4f1a]/10 font-heading text-xs font-bold text-[#ff6838]"
  >
    {getInitial(name, fallback)}
  </span>
);

interface DrawerAccountProps {
  user: NavUser | null;
  fallbackName: string;
  roleLabel: string;
  onSignOut: () => void | Promise<void>;
}

export const DrawerAccount: React.FC<DrawerAccountProps> = ({
  user,
  fallbackName,
  roleLabel,
  onSignOut
}) => {
  const [signingOut, setSigningOut] = useState(false);
  const name = user?.displayName || fallbackName;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-[#242730] bg-[#14161a] p-3">
        <Avatar name={user?.displayName} fallback={fallbackName[0]} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">{name}</div>
          {user?.email && <div className="truncate text-xs text-[#656c80]">{user.email}</div>}
        </div>
        <span className="shrink-0 rounded-md bg-[#1c1f26] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#9da3b4]">
          {roleLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:opacity-60 cursor-pointer ${FOCUS_RING}`}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
};

export const AccountMenu: React.FC<AccountMenuProps> = ({ user, fallbackName, roleLabel, items = [], onSignOut }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const keyboardOpen = useRef(false);
  const menuId = useId();
  const { pathname } = useLocation();
  const name = user?.displayName || fallbackName;

  const close = () => setOpen(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 130);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      keyboardOpen.current = false;
      return;
    }
    if (mounted && keyboardOpen.current) {
      rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
      keyboardOpen.current = false;
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass = `flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING}`;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    close();
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          keyboardOpen.current = event.detail === 0;
          setOpen((current: boolean) => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={mounted ? menuId : undefined}
        aria-label={`Account menu for ${name}`}
        className={`flex h-10 items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-[#2e3442] hover:bg-white/5 cursor-pointer ${FOCUS_RING} ${open ? 'border-[#2e3442] bg-white/5' : ''}`}
      >
        <Avatar name={user?.displayName} fallback={fallbackName[0]} />
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium text-[#c3c8d6] xl:block">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#656c80] transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {mounted && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          data-state={open ? 'open' : 'closed'}
          tabIndex={-1}
          className="menu-pop absolute right-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-[#2e3442] bg-[#14161a] p-1.5 shadow-lg shadow-black/40 outline-none"
        >
          <div className="flex items-center gap-2.5 px-2 pb-2.5 pt-1.5">
            <Avatar name={user?.displayName} fallback={fallbackName[0]} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight text-white">{name}</div>
              {user?.email && <div className="truncate text-xs leading-tight text-[#656c80]">{user.email}</div>}
            </div>
            <span className="shrink-0 self-start text-[11px] font-medium text-[#9da3b4]">{roleLabel}</span>
          </div>
          {items.length > 0 && (
            <div className="border-t border-[#242730] py-1">
              {items.map((item: NavEntry) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} role="menuitem" onClick={close} className={itemClass}>
                    <Icon className="h-4 w-4 text-[#656c80]" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="border-t border-[#242730] pt-1">
            <button type="button" role="menuitem" onClick={() => void handleSignOut()} disabled={signingOut} className={`${itemClass} !text-red-400 hover:!bg-red-950/40 hover:!text-red-300 disabled:opacity-60`}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
