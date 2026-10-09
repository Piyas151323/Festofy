export const AccountMenu: React.FC<AccountMenuProps> = ({ user, fallbackName, roleLabel, items = [], onSignOut }) => {
  // `open` is the logical state; `mounted` lags behind it so the exit animation can play.
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
    const t = window.setTimeout(() => setMounted(false), 130);
    return () => window.clearTimeout(t);
  }, [open]);

  // Keyboard users land on the first action; pointer users keep focus on the trigger.
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
    const onPointer = (e: PointerEvent) => {
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
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass = `flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING}`;

  const handleSignOut = async () => {
    if (signingOut) return; // guard against repeated clicks
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
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          keyboardOpen.current = e.detail === 0;
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={mounted ? menuId : undefined}
        aria-label={`Account menu for ${name}`}
        className={`flex h-10 items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-[#2e3442] hover:bg-white/5 cursor-pointer ${FOCUS_RING} ${
          open ? 'border-[#2e3442] bg-white/5' : ''
        }`}
      >
        <Avatar name={user?.displayName} fallback={fallbackName[0]} />
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium text-[#c3c8d6] xl:block">{name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#656c80] transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
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
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={it.to} role="menuitem" onClick={close} className={itemClass}>
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
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className={`${itemClass} !text-red-400 hover:!bg-red-950/40 hover:!text-red-300 disabled:opacity-60`}
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
