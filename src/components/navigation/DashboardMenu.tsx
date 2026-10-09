import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FOCUS_RING, NavEntry, isEntryActive } from './navUtils';

interface DashboardMenuProps {
  pathname: string;
  items: NavEntry[];
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({ pathname, items }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeItem = items.find((item) => isEntryActive(pathname, item));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition-all duration-200 ${FOCUS_RING} ${
          activeItem || open ? 'bg-[#1c1f26] text-white shadow-sm' : 'text-[#c3c8d6] hover:bg-white/5 hover:text-white'
        }`}
      >
        <LayoutDashboard className="h-4 w-4 text-[#ff4f1a]" aria-hidden="true" />
        <span>Dashboard</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#656c80] transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" aria-label="Dashboard navigation" className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#2e3442] bg-[#14161a] p-1.5 shadow-lg shadow-black/40 motion-safe:animate-menu-in">
          <div className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#656c80]">
            Your activity
          </div>
          {items.map((item, idx) => {
            const Icon = item.icon;
            const active = isEntryActive(pathname, item);
            return (
              <Link
                key={`${item.to}-${item.label}-${idx}`}
                to={item.to}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
                  active ? 'bg-[#1c1f26] text-white' : 'text-[#c3c8d6] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#ff4f1a]' : 'text-[#656c80]'}`} aria-hidden="true" />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff4f1a]" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
