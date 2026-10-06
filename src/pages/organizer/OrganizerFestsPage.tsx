import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, ExternalLink, ShieldCheck, CalendarDays } from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getOrganizationFests } from '../../services/festService';
import { Fest } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const OrganizerFestsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFests() {
      if (!activeOrganization) {
        setFests([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOrganizationFests(activeOrganization.id);
        setFests(data || []);
      } catch (err) {
        console.error('Failed to load organization fests:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading) {
      loadFests();
    }
  }, [activeOrganization, orgLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Festivals
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Festival Operations
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Manage festival publication statuses, dates, and club competitions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-mono text-zinc-400 self-start sm:self-auto">
          <span>Fest Management: Phase 4.2</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading organization festivals...
        </div>
      ) : fests.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">No festivals recorded</h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              No festival tournaments have been created for {activeOrganization?.name || 'this organization'} yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Festival Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4 text-right">Public Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {fests.map((fest) => (
                  <tr key={fest.id} className="hover:bg-[#1a1d24] transition-colors">
                    <td className="p-4 font-semibold text-white">{fest.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ff4f1a]/15 text-[#ff4f1a] border border-[#ff4f1a]/30 font-mono">
                        {fest.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                      {formatDateTime(fest.startDate)}
                    </td>
                    <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                      {formatDateTime(fest.endDate)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/fests/${fest.id}`}
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
