import React, { useEffect, useState, useMemo } from 'react';
import {
  Users2,
  Search,
  Download,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Ticket
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getOrganizationRegistrations } from '../../services/registrationService';
import { Registration, RegistrationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';

export const OrganizerParticipantsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    if (!activeOrganization) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getOrganizationRegistrations(activeOrganization.id);
      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Failed to load participants:', err);
      setError('Unable to fetch participants manifest. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgLoading) {
      fetchRegistrations();
    }
  }, [activeOrganization, orgLoading]);

  // Unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((r) => {
      if (r.eventId && r.eventName) {
        map.set(r.eventId, r.eventName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Event filter
      if (eventFilter !== 'all' && r.eventId !== eventFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const studentName = r.studentName?.toLowerCase() || '';
        const studentEmail = r.studentEmail?.toLowerCase() || '';
        const teamName = r.teamName?.toLowerCase() || '';
        const ticketCode = r.ticketCode?.toLowerCase() || '';
        const eventName = r.eventName?.toLowerCase() || '';
        const institution = r.institution?.toLowerCase() || '';

        const memberMatch = r.teamMembers?.some(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        );

        if (
          !studentName.includes(query) &&
          !studentEmail.includes(query) &&
          !teamName.includes(query) &&
          !ticketCode.includes(query) &&
          !eventName.includes(query) &&
          !institution.includes(query) &&
          !memberMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [registrations, statusFilter, eventFilter, searchQuery]);

  // Key stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const checkedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const waitlisted = registrations.filter((r) => r.status === 'waitlisted').length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;

    return { total, confirmed, checkedIn, waitlisted, cancelled };
  }, [registrations]);

  const handleCopyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      'Ticket Code',
      'Event Name',
      'Festival',
      'Status',
      'Type',
      'Student/Leader Name',
      'Email',
      'Phone',
      'Institution',
      'Student ID',
      'Team Name',
      'Team Members Count',
      'Registered At'
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.ticketCode || ''}"`,
      `"${(r.eventName || '').replace(/"/g, '""')}"`,
      `"${(r.festName || '').replace(/"/g, '""')}"`,
      `"${r.status || ''}"`,
      `"${r.registrationType || 'individual'}"`,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      `"${(r.studentEmail || '').replace(/"/g, '""')}"`,
      `"${(r.studentPhone || '').replace(/"/g, '""')}"`,
      `"${(r.institution || '').replace(/"/g, '""')}"`,
      `"${(r.studentId || '').replace(/"/g, '""')}"`,
      `"${(r.teamName || '').replace(/"/g, '""')}"`,
      `"${(r.teamMembers?.length || 0)}"`,
      `"${r.registeredAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeOrganization?.id || 'organizer'}-participants-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Manifest
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Participant Manifest & Roster
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Real-time participant registry, ticket verification, and team roster records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchRegistrations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRegistrations.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-[#ff4f1a]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[11px] font-mono text-[#656c80] uppercase">Total Registrations</div>
          <div className="font-heading text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Confirmed</div>
          <div className="font-heading text-2xl font-bold text-emerald-400">{stats.confirmed}</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 uppercase">Checked In</div>
          <div className="font-heading text-2xl font-bold text-cyan-400">{stats.checkedIn}</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[11px] font-mono text-amber-400 uppercase">Waitlisted</div>
          <div className="font-heading text-2xl font-bold text-amber-400">{stats.waitlisted}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, team, email, or ticket code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Event Select */}
          {uniqueEvents.length > 0 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a] max-w-[200px] truncate"
            >
              <option value="all">All Events</option>
              {uniqueEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading participant manifest...
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">
              {searchQuery || statusFilter !== 'all' || eventFilter !== 'all'
                ? 'No matching participants found'
                : 'No participants registered yet'}
            </h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || eventFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'As students register for your club events, their verified entry passes will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Participant / Team</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Ticket Code</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {filteredRegistrations.map((reg) => {
                  const isExpanded = expandedRegId === reg.id;
                  const isTeam = reg.registrationType === 'team';

                  return (
                    <React.Fragment key={reg.id}>
                      <tr className="hover:bg-[#1a1d24] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#242730] text-[#ff4f1a] font-bold flex items-center justify-center text-xs shrink-0">
                              {(reg.studentName || reg.teamName || 'P')[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">
                                {reg.studentName || 'Student Participant'}
                              </div>
                              <div className="text-[11px] text-[#9da3b4] truncate">
                                {reg.studentEmail}
                              </div>
                              {reg.institution && (
                                <div className="text-[10px] text-[#656c80] truncate">
                                  {reg.institution}
                                </div>
                              )}
                              {isTeam && (
                                <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-800/40 text-[10px] font-mono text-purple-300">
                                  <span>Team: {reg.teamName || 'Roster'}</span>
                                  <span>({reg.teamMembers?.length || 1} members)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-white">{reg.eventName}</div>
                          {reg.festName && (
                            <div className="text-[11px] text-[#9da3b4]">{reg.festName}</div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#191b20] border border-[#2e3442] font-mono text-[11px] text-zinc-300">
                            <span>{reg.ticketCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTicket(reg.ticketCode)}
                              title="Copy ticket code"
                              className="text-[#656c80] hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedCode === reg.ticketCode ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <RegistrationStatusBadge status={reg.status} />
                        </td>

                        <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                          {formatDateTime(reg.registeredAt)}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedRegId(isExpanded ? null : reg.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#191b20] hover:bg-[#242730] border border-[#2e3442] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'View'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-[#101114]">
                          <td colSpan={6} className="p-4 border-t border-[#242730]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Left Column: Participant Snapshot */}
                              <div className="p-3.5 rounded-xl bg-[#14161a] border border-[#242730] space-y-2">
                                <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a]">
                                  Participant Dossier
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-[#656c80] block">Phone:</span>
                                    <span className="text-zinc-300">{reg.studentPhone || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Student ID:</span>
                                    <span className="text-zinc-300">{reg.studentId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Venue:</span>
                                    <span className="text-zinc-300">{reg.venue || 'TBA'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Type:</span>
                                    <span className="capitalize text-zinc-300">{reg.registrationType}</span>
                                  </div>
                                </div>

                                {reg.cancellationReason && (
                                  <div className="mt-2 pt-2 border-t border-[#242730] text-[11px]">
                                    <span className="text-red-400 font-semibold block">Cancellation Reason:</span>
                                    <span className="text-[#9da3b4]">{reg.cancellationReason}</span>
                                  </div>
                                )}
                              </div>

                              {/* Right Column: Team Roster or Form Responses */}
                              <div className="p-3.5 rounded-xl bg-[#14161a] border border-[#242730] space-y-2">
                                {isTeam && reg.teamMembers && reg.teamMembers.length > 0 ? (
                                  <div>
                                    <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a] mb-2">
                                      Team Roster ({reg.teamMembers.length} members)
                                    </h4>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                      {reg.teamMembers.map((m, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2 rounded-lg bg-[#191b20] border border-[#2e3442] flex items-center justify-between text-[11px]"
                                        >
                                          <div>
                                            <span className="font-semibold text-white">{m.name}</span>
                                            <span className="text-[#656c80] ml-2 font-mono">{m.email}</span>
                                          </div>
                                          {m.role && (
                                            <span className="text-[10px] text-[#ff4f1a] font-mono">
                                              {m.role}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a] mb-2">
                                      Registration Payload
                                    </h4>
                                    {reg.registrationData && Object.keys(reg.registrationData).length > 0 ? (
                                      <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                                        {Object.entries(reg.registrationData).map(([k, v]) => (
                                          <div key={k} className="flex justify-between gap-2">
                                            <span className="text-[#656c80]">{k}:</span>
                                            <span className="text-zinc-300 truncate max-w-[200px]">
                                              {String(v)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-[#656c80]">
                                        Standard entry form responses recorded.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
