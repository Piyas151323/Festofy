import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Users, Calendar, CalendarCheck2 } from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getOrganizationEvents } from '../../services/eventService';
import { EventItem } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const OrganizerEventsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!activeOrganization) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOrganizationEvents(activeOrganization.id);
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to load organization events:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading) {
      loadEvents();
    }
  }, [activeOrganization, orgLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Events
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Managed Events & Competitions
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Supervise contest schedules, capacities, venues, and registration deadlines.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-mono text-zinc-400 self-start sm:self-auto">
          <span>Event Management: Phase 4.3</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading organization events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">No events recorded</h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              No contests or events have been created for {activeOrganization?.name || 'this organization'} yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Festival</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4 text-right">Public Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#1a1d24] transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>{evt.name}</div>
                      {evt.categoryName && (
                        <span className="text-[10px] text-[#656c80] font-mono">
                          {evt.categoryName}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-[#9da3b4]">{evt.festName || 'Festival'}</td>
                    <td className="p-4 text-[#9da3b4]">{evt.venue}</td>
                    <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                      {formatDateTime(evt.startTime)}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-zinc-300">
                        {evt.currentRegistrations ?? 0} / {evt.capacity}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/events/${evt.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#ff4f1a] hover:underline font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
