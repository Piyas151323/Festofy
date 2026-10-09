import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  CalendarDays,
  CalendarCheck2,
  Users2,
  BarChart3,
  Compass,
  UserCog,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { OrganizerProvider, useOrganizer } from '../context/OrganizerContext';
import { ConsoleShell } from '../components/navigation/ConsoleShell';
import { FOCUS_RING, NavGroup } from '../components/navigation/navUtils';

/** Workspace (organization) switcher. Same behaviour as before, now a real button. */
const WorkspaceSwitcher: React.FC<{ onSwitched?: () => void }> = ({ onSwitched }) => {
  const { organizations, activeOrganization, setActiveOrganization, loading } = useOrganizer();
  const [open, setOpen] = useState(false);
  const multi = organizations.length > 1;

  return (
    <div className="rounded-xl border border-[#2e3442] bg-[#15171b] p-2.5">
      <div className="mb-1.5 flex items-center justify-between px-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#656c80]">
        <span>Active workspace</span>
        {multi && <span className="text-[#ff4f1a]">{organizations.length} clubs</span>}
      </div>

      {loading ? (
        <div className="flex animate-pulse items-center gap-2 py-1">
          <div className="h-6 w-6 rounded-md bg-[#242730]" />
          <div className="h-3 w-28 rounded bg-[#242730]" />
        </div>
      ) : activeOrganization ? (
        <>
          <button
            type="button"
            disabled={!multi}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={multi ? open : undefined}
            aria-haspopup={multi ? 'listbox' : undefined}
            className={`flex min-h-11 lg:min-h-9 w-full items-center justify-between gap-2 rounded-lg px-0.5 text-left ${FOCUS_RING} ${
              multi ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#ff4f1a]/30 bg-[#ff4f1a]/15 text-xs font-bold text-[#ff4f1a]">
                {activeOrganization.name?.[0]?.toUpperCase() || 'O'}
              </span>
              <span className="truncate text-[13px] font-semibold text-white" title={activeOrganization.name}>
                {activeOrganization.name}
              </span>
            </span>
            {multi && (
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[#656c80] transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            )}
          </button>

          {multi && open && (
            <ul role="listbox" aria-label="Switch workspace" className="mt-2 space-y-0.5 border-t border-[#2e3442] pt-2">
              {organizations.map((org) => {
                const selected = org.id === activeOrganization.id;
                return (
                  <li key={org.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrganization(org);
                        setOpen(false);
                        onSwitched?.();
                      }}
                      className={`flex min-h-11 lg:min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-[13px] transition-colors cursor-pointer ${FOCUS_RING} ${
                        selected ? 'bg-[#ff4f1a]/12 font-semibold text-[#ff4f1a]' : 'text-[#9da3b4] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="py-0.5 text-xs font-medium text-amber-400">No organization linked</div>
      )}
    </div>
  );
};

const OrganizerLayoutInner: React.FC = () => {
  const { currentUser, signOutUser, role } = useAuth();
  const { activeOrganization } = useOrganizer();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  const groups: NavGroup[] = [
    { label: 'Overview', items: [{ label: 'Dashboard', to: '/organizer', icon: Terminal, exact: true }] },
    {
      label: 'Festivals & events',
      items: [
        { label: 'Fests', to: '/organizer/fests', icon: CalendarDays },
        { label: 'Events', to: '/organizer/events', icon: CalendarCheck2 }
      ]
    },
    {
      label: 'Registrations & insights',
      items: [
        { label: 'Participants', to: '/organizer/participants', icon: Users2 },
        { label: 'Analytics', to: '/organizer/analytics', icon: BarChart3 }
      ]
    },
    {
      label: 'Account & Links',
      items: [
        { label: 'Edit Profile', to: '/organizer/profile', icon: UserCog },
        { label: 'Public Events', to: '/events', icon: Compass },
        ...(role === 'admin' ? [{ label: 'Admin Console', to: '/admin', icon: ShieldCheck }] : [])
      ]
    }
  ];

  return (
    <ConsoleShell
      id="organizer"
      brandTo="/organizer"
      areaLabel="Organizer Console"
      mobileLabel={activeOrganization?.name || 'Organizer Console'}
      groups={groups}
      sidebarTop={<WorkspaceSwitcher />}
      drawerTop={(close) => <WorkspaceSwitcher onSwitched={close} />}
      user={currentUser}
      fallbackName="Organizer"
      roleLabel={role}
      onSignOut={handleSignOut}
      pageBg="bg-[#0c0d0e]"
      sidebarBg="bg-[#101114]"
    />
  );
};

export const OrganizerLayout: React.FC = () => (
  <OrganizerProvider>
    <OrganizerLayoutInner />
  </OrganizerProvider>
);
