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
  Building2,
  Ticket,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  FileSpreadsheet,
  CreditCard,
  X
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getOrganizationRegistrations,
  approveRegistration,
  rejectRegistration,
  checkInParticipant,
  markRegistrationCompleted,
  getRegistrationByTicketCode,
  updateRegistrationNotes
} from '../../services/registrationService';
import { Registration, RegistrationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';

export const OrganizerParticipantsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [festFilter, setFestFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Gate Check-in Ticket Lookup state
  const [ticketSearchCode, setTicketSearchCode] = useState('');
  const [ticketLookupResult, setTicketLookupResult] = useState<Registration | null>(null);
  const [ticketLookupError, setTicketLookupError] = useState<string | null>(null);
  const [ticketLookupLoading, setTicketLookupLoading] = useState(false);

  // Modal / Confirm States
  const [rejectingReg, setRejectingReg] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingNotesReg, setEditingNotesReg] = useState<Registration | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      console.warn('Notice loading participants manifest:', err?.message || err);
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

  // Flash message timer
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // Unique festivals for filter dropdown
  const uniqueFests = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((r) => {
      if (r.festId && r.festName) {
        map.set(r.festId, r.festName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [registrations]);

  // Unique events for filter dropdown (cascading with festFilter)
  const uniqueEvents = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((r) => {
      if (festFilter !== 'all' && r.festId !== festFilter) return;
      if (r.eventId && r.eventName) {
        map.set(r.eventId, r.eventName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [registrations, festFilter]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Fest filter
      if (festFilter !== 'all' && r.festId !== festFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Event filter
      if (eventFilter !== 'all' && r.eventId !== eventFilter) {
        return false;
      }

      // Registration Type filter
      if (typeFilter !== 'all' && r.registrationType !== typeFilter) {
        return false;
      }

      // Check-In filter
      if (checkInFilter === 'checked_in' && r.status !== 'checked_in') {
        return false;
      }
      if (checkInFilter === 'not_checked_in' && r.status === 'checked_in') {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all') {
        const pStatus = r.paymentStatus || (r.appliedFee && r.appliedFee > 0 ? 'pending' : 'free');
        if (paymentFilter === 'paid' && pStatus !== 'paid') return false;
        if (paymentFilter === 'free' && pStatus !== 'free') return false;
        if (paymentFilter === 'pending' && pStatus !== 'pending') return false;
        if (paymentFilter === 'failed' && pStatus !== 'failed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const studentName = r.studentName?.toLowerCase() || '';
        const studentEmail = r.studentEmail?.toLowerCase() || '';
        const studentPhone = r.studentPhone?.toLowerCase() || '';
        const studentId = r.studentId?.toLowerCase() || '';
        const teamName = r.teamName?.toLowerCase() || '';
        const ticketCode = r.ticketCode?.toLowerCase() || '';
        const eventName = r.eventName?.toLowerCase() || '';
        const festName = r.festName?.toLowerCase() || '';
        const institution = r.institution?.toLowerCase() || '';

        const memberMatch = r.teamMembers?.some(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query) ||
            (m.studentId && m.studentId.toLowerCase().includes(query)) ||
            (m.institution && m.institution.toLowerCase().includes(query))
        );

        if (
          !studentName.includes(query) &&
          !studentEmail.includes(query) &&
          !studentPhone.includes(query) &&
          !studentId.includes(query) &&
          !teamName.includes(query) &&
          !ticketCode.includes(query) &&
          !eventName.includes(query) &&
          !festName.includes(query) &&
          !institution.includes(query) &&
          !memberMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [registrations, festFilter, statusFilter, eventFilter, typeFilter, checkInFilter, searchQuery]);

  // Key stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const checkedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;
    const waitlisted = registrations.filter((r) => r.status === 'waitlisted').length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;
    const completed = registrations.filter((r) => r.status === 'completed').length;
    const checkInRate =
      confirmed + checkedIn > 0
        ? Math.round((checkedIn / (confirmed + checkedIn)) * 100)
        : 0;

    return { total, confirmed, checkedIn, pending, waitlisted, cancelled, completed, checkInRate };
  }, [registrations]);

  const handleCopyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Safe CSV formula injection sanitizer
  const sanitizeCsvValue = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    let str = String(val).trim();
    // If first character is an executable formula trigger (=, +, -, @), prefix with a single quote '
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      'Ticket Code',
      'Event Name',
      'Festival',
      'Status',
      'Registration Type',
      'Participant Name',
      'Email',
      'Phone',
      'Institution',
      'Class/Grade',
      'Category',
      'Applied Fee (BDT)',
      'Payment Status',
      'Payment Method',
      'Payment TxID',
      'Student ID',
      'Team Name',
      'Team Members Count',
      'Registered At',
      'Checked In At',
      'Notes'
    ];

    const rows = filteredRegistrations.map((r) => [
      sanitizeCsvValue(r.ticketCode),
      sanitizeCsvValue(r.eventName),
      sanitizeCsvValue(r.festName),
      sanitizeCsvValue(r.status),
      sanitizeCsvValue(r.registrationType || 'individual'),
      sanitizeCsvValue(r.studentName),
      sanitizeCsvValue(r.studentEmail),
      sanitizeCsvValue(r.studentPhone),
      sanitizeCsvValue(r.institution),
      sanitizeCsvValue(r.classGrade || ''),
      sanitizeCsvValue(r.participantCategory || r.categoryName || ''),
      sanitizeCsvValue(r.appliedFee !== undefined ? r.appliedFee : 0),
      sanitizeCsvValue(r.paymentStatus || (r.appliedFee && r.appliedFee > 0 ? 'pending' : 'free')),
      sanitizeCsvValue(r.paymentMethod || 'none'),
      sanitizeCsvValue(r.paymentTransactionId || ''),
      sanitizeCsvValue(r.studentId),
      sanitizeCsvValue(r.teamName),
      sanitizeCsvValue(r.teamMembers?.length || 0),
      sanitizeCsvValue(r.registeredAt),
      sanitizeCsvValue(r.checkedInAt || 'Not Checked In'),
      sanitizeCsvValue(r.notes || '')
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${activeOrganization?.id || 'organizer'}-participants-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Operations
  const handleApprove = async (reg: Registration) => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await approveRegistration(reg.id);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (ticketLookupResult?.id === updated.id) {
        setTicketLookupResult(updated);
      }
      setActionSuccess(`Application for "${reg.studentName || reg.teamName}" approved successfully.`);
    } catch (err: any) {
      console.warn('Notice approve failed:', err);
      setError(err.message || 'Failed to approve registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingReg) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await rejectRegistration(rejectingReg.id, rejectReason);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (ticketLookupResult?.id === updated.id) {
        setTicketLookupResult(updated);
      }
      setActionSuccess(`Registration for "${rejectingReg.studentName || rejectingReg.teamName}" has been declined and capacity released.`);
      setRejectingReg(null);
      setRejectReason('');
    } catch (err: any) {
      console.warn('Notice reject failed:', err);
      setError(err.message || 'Failed to reject registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (reg: Registration) => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await checkInParticipant(reg.id);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (ticketLookupResult?.id === updated.id) {
        setTicketLookupResult(updated);
      }
      setActionSuccess(`Checked in "${reg.studentName || reg.teamName}" successfully!`);
    } catch (err: any) {
      console.warn('Notice check-in failed:', err);
      setError(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async (reg: Registration) => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await markRegistrationCompleted(reg.id);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (ticketLookupResult?.id === updated.id) {
        setTicketLookupResult(updated);
      }
      setActionSuccess(`Marked registration for "${reg.studentName || reg.teamName}" as completed.`);
    } catch (err: any) {
      console.warn('Notice complete failed:', err);
      setError(err.message || 'Failed to mark registration completed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesReg) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await updateRegistrationNotes(editingNotesReg.id, currentNotes);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (ticketLookupResult?.id === updated.id) {
        setTicketLookupResult(updated);
      }
      setActionSuccess('Operational note saved successfully.');
      setEditingNotesReg(null);
      setCurrentNotes('');
    } catch (err: any) {
      console.warn('Notice notes update failed:', err);
      setError(err?.message || 'Failed to update operational note.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTicketLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !ticketSearchCode.trim()) return;

    try {
      setTicketLookupLoading(true);
      setTicketLookupError(null);
      setTicketLookupResult(null);

      const found = await getRegistrationByTicketCode(ticketSearchCode.trim(), activeOrganization.id);
      if (!found) {
        setTicketLookupError(`No registration found with ticket code "${ticketSearchCode.trim()}" in this organization.`);
      } else {
        setTicketLookupResult(found);
      }
    } catch (err: any) {
      setTicketLookupError(err.message || 'Error looking up ticket code.');
    } finally {
      setTicketLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Operations
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Participant Operations & Check-in
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Real-time gate check-in, applicant approval review, roster verification, and attendee data export.
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

      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Pending Reviews Notice Banner */}
      {stats.pending > 0 && statusFilter !== 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-300">
                {stats.pending} Application{stats.pending > 1 ? 's' : ''} Awaiting Review
              </div>
              <div className="text-[11px] text-[#9da3b4]">
                Competitions with organizer approval requirements have pending participant entries.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0"
          >
            Review Pending Entries ({stats.pending})
          </button>
        </div>
      )}

      {/* Gate Check-In & Ticket Code Lookup Bar */}
      <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <QrCode className="w-4 h-4 text-[#ff4f1a]" />
          <span>Rapid Gate Check-In (Ticket Lookup)</span>
        </div>

        <form onSubmit={handleTicketLookup} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Ticket className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ticketSearchCode}
              onChange={(e) => setTicketSearchCode(e.target.value.toUpperCase())}
              placeholder="Enter or scan ticket pass code (e.g. FST-K9M2-8KJ7)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-mono text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
            />
          </div>
          <button
            type="submit"
            disabled={ticketLookupLoading || !ticketSearchCode.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            {ticketLookupLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Verify Ticket</span>
          </button>
        </form>

        {/* Ticket Lookup Result Card */}
        {ticketLookupError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{ticketLookupError}</span>
          </div>
        )}

        {ticketLookupResult && (
          <div className="p-4 rounded-xl bg-[#181a20] border border-[#2e3442] space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#282d38] pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#ff4f1a]" />
                <span className="font-mono text-xs font-bold text-white">
                  {ticketLookupResult.ticketCode}
                </span>
                <RegistrationStatusBadge status={ticketLookupResult.status} />
              </div>
              <button
                type="button"
                onClick={() => setTicketLookupResult(null)}
                className="text-xs text-[#9da3b4] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#656c80] text-[10px] uppercase font-mono block">Participant</span>
                <span className="font-semibold text-white">{ticketLookupResult.studentName}</span>
                <span className="text-[#9da3b4] block text-[11px]">{ticketLookupResult.studentEmail}</span>
                {ticketLookupResult.institution && (
                  <span className="text-[#656c80] block text-[10px]">{ticketLookupResult.institution}</span>
                )}
              </div>
              <div>
                <span className="text-[#656c80] text-[10px] uppercase font-mono block">Event & Venue</span>
                <span className="font-semibold text-white">{ticketLookupResult.eventName}</span>
                <span className="text-[#9da3b4] block text-[11px]">{ticketLookupResult.venue || 'TBA'}</span>
                {ticketLookupResult.teamName && (
                  <span className="text-purple-400 block text-[11px]">Team: {ticketLookupResult.teamName}</span>
                )}
              </div>
              <div className="sm:text-right flex flex-col sm:items-end justify-center">
                {ticketLookupResult.status === 'checked_in' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-800/60 text-xs font-semibold text-cyan-300">
                    <UserCheck className="w-4 h-4" />
                    <span>Already Checked In ({ticketLookupResult.checkedInAt ? new Date(ticketLookupResult.checkedInAt).toLocaleTimeString() : 'Verified'})</span>
                  </div>
                ) : ticketLookupResult.status === 'confirmed' ? (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(ticketLookupResult)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Check In Now</span>
                  </button>
                ) : ticketLookupResult.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(ticketLookupResult)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
                    >
                      Approve Entry
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#9da3b4] italic">Status: {ticketLookupResult.status}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-[#656c80] uppercase">Total Entries</div>
          <div className="font-heading text-xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">Confirmed</div>
          <div className="font-heading text-xl font-bold text-emerald-400">{stats.confirmed}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-cyan-400 uppercase">Checked In</div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-xl font-bold text-cyan-400">{stats.checkedIn}</span>
            <span className="text-[10px] text-cyan-400/80 font-mono">({stats.checkInRate}%)</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-amber-400 uppercase">Pending Review</div>
          <div className="font-heading text-xl font-bold text-amber-400">{stats.pending}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-purple-400 uppercase">Completed</div>
          <div className="font-heading text-xl font-bold text-purple-400">{stats.completed}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Cancelled</div>
          <div className="font-heading text-xl font-bold text-zinc-400">{stats.cancelled}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-1">
          <div className="text-[10px] font-mono text-blue-400 uppercase">Gate Progress</div>
          <div className="font-heading text-xl font-bold text-blue-400">{stats.checkInRate}%</div>
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
            placeholder="Search by student name, team, email, institution, or ticket code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Festival Select */}
          {uniqueFests.length > 0 && (
            <select
              value={festFilter}
              onChange={(e) => {
                setFestFilter(e.target.value);
                setEventFilter('all');
              }}
              className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a] max-w-[170px] truncate"
            >
              <option value="all">All Festivals</option>
              {uniqueFests.map((fest) => (
                <option key={fest.id} value={fest.id}>
                  {fest.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="pending">Pending Review</option>
            <option value="completed">Completed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Registration Type Select */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="team">Team Only</option>
          </select>

          {/* Check-In Filter */}
          <select
            value={checkInFilter}
            onChange={(e) => setCheckInFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">Check-in: All</option>
            <option value="checked_in">Checked In</option>
            <option value="not_checked_in">Not Checked In</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">Payment: All</option>
            <option value="paid">Paid (bKash/Nagad)</option>
            <option value="free">Free (৳0)</option>
            <option value="pending">Pending Payment</option>
            <option value="failed">Failed Payment</option>
          </select>

          {/* Event Select */}
          {uniqueEvents.length > 0 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a] max-w-[180px] truncate"
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

      {/* Main Table / Manifest Content */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading participant manifest records...
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">
              {searchQuery || statusFilter !== 'all' || eventFilter !== 'all' || typeFilter !== 'all' || checkInFilter !== 'all'
                ? 'No matching participants found'
                : 'No participants registered yet'}
            </h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || eventFilter !== 'all' || typeFilter !== 'all' || checkInFilter !== 'all'
                ? 'Try adjusting your search query or resetting filters.'
                : 'As students register for your club competitions, their verified entry passes will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Participant / Team</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Ticket Pass</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4 text-right">Operational Actions</th>
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
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#242730] border border-[#2e3442] text-[#ff4f1a] font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                              {reg.studentPhotoURL ? (
                                <img
                                  src={reg.studentPhotoURL}
                                  alt={reg.studentName || 'Student'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{(reg.studentName || reg.teamName || 'P')[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                <span>{reg.studentName || 'Student Participant'}</span>
                              </div>
                              <div className="text-[11px] text-[#9da3b4] truncate">
                                {reg.studentEmail}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {(reg.participantCategory || reg.categoryName) && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#1e222b] text-[#ff4f1a] border border-[#ff4f1a]/30 text-[9px] font-mono font-medium">
                                    {reg.participantCategory || reg.categoryName}
                                  </span>
                                )}
                                {reg.classGrade && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#1e222b] text-zinc-300 border border-[#2e3442] text-[9px] font-mono">
                                    {reg.classGrade}
                                  </span>
                                )}
                                {reg.institution && (
                                  <span className="text-[10px] text-[#656c80] truncate max-w-[130px]">
                                    {reg.institution}
                                  </span>
                                )}
                              </div>
                              {isTeam && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-800/40 text-[10px] font-mono text-purple-300">
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
                          <div className="space-y-1.5">
                            <RegistrationStatusBadge status={reg.status} />
                            {reg.paymentStatus === 'paid' ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-[10px] text-emerald-300 font-mono">
                                <CreditCard className="w-2.5 h-2.5" />
                                <span>৳{reg.appliedFee !== undefined ? reg.appliedFee : 0} Paid ({reg.paymentMethod?.toUpperCase() || 'DEMO'})</span>
                              </div>
                            ) : reg.appliedFee && reg.appliedFee > 0 ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-[10px] text-amber-300 font-mono">
                                <span>Pending ৳{reg.appliedFee}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#191b20] border border-[#2e3442] text-[10px] text-zinc-400 font-mono">
                                <span>Free (৳0)</span>
                              </div>
                            )}
                            {reg.status === 'checked_in' && reg.checkedInAt && (
                              <div className="text-[10px] text-cyan-400 font-mono">
                                In: {new Date(reg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                          {formatDateTime(reg.registeredAt)}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Action Buttons based on status */}
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(reg)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingReg(reg)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {reg.status === 'confirmed' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCheckIn(reg)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Check In</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingReg(reg)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 rounded-lg bg-[#191b20] hover:bg-red-950/50 text-[#9da3b4] hover:text-red-300 text-[11px] transition-colors"
                                  title="Cancel Registration"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {reg.status === 'checked_in' && (
                              <button
                                type="button"
                                onClick={() => handleMarkCompleted(reg)}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 text-purple-200 text-[11px] transition-colors cursor-pointer"
                              >
                                Mark Done
                              </button>
                            )}

                            {/* Expand toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedRegId(isExpanded ? null : reg.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#191b20] hover:bg-[#242730] border border-[#2e3442] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer ml-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-[#101114]">
                          <td colSpan={6} className="p-4 border-t border-[#242730]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Left Column: Participant Snapshot */}
                              <div className="p-3.5 rounded-xl bg-[#14161a] border border-[#242730] space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a]">
                                    Participant Dossier
                                  </h4>
                                  <span className="text-[10px] font-mono text-[#656c80]">
                                    Pass: {reg.ticketCode}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#191b20] border border-[#2e3442]">
                                  <div className="w-12 h-12 rounded-xl bg-[#242730] border border-[#2e3442] overflow-hidden flex items-center justify-center text-sm font-bold text-[#ff4f1a] shrink-0">
                                    {reg.studentPhotoURL ? (
                                      <img
                                        src={reg.studentPhotoURL}
                                        alt={reg.studentName || 'Student'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{(reg.studentName || 'S')[0]?.toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-white text-xs truncate">
                                      {reg.studentName || 'Student Participant'}
                                    </div>
                                    <div className="text-[11px] text-[#9da3b4] truncate">
                                      {reg.studentEmail}
                                    </div>
                                    <div className="text-[10px] text-[#656c80] truncate">
                                      {reg.studentPhone || 'No phone provided'}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-[#656c80] block">Participant Category:</span>
                                    <span className="text-[#ff4f1a] font-medium font-mono">
                                      {reg.participantCategory || reg.categoryName || 'Open for Everyone'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Class / Grade / Level:</span>
                                    <span className="text-zinc-300 font-mono">{reg.classGrade || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Institution / College:</span>
                                    <span className="text-zinc-300">{reg.institution || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Student ID / Roll:</span>
                                    <span className="text-zinc-300 font-mono">{reg.studentId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Registration Mode:</span>
                                    <span className="capitalize text-zinc-300">{reg.registrationType}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#656c80] block">Venue:</span>
                                    <span className="text-zinc-300">{reg.venue || 'TBA'}</span>
                                  </div>
                                </div>

                                {/* Payment Details Block */}
                                <div className="p-2.5 rounded-lg bg-[#191b20] border border-[#2e3442] space-y-1 text-[11px]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-[#656c80] uppercase">Payment Record</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                      reg.paymentStatus === 'paid'
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                                        : reg.appliedFee && reg.appliedFee > 0
                                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                                        : 'bg-[#14161a] text-zinc-400 border border-[#2e3442]'
                                    }`}>
                                      {reg.paymentStatus === 'paid' ? 'PAID' : reg.appliedFee && reg.appliedFee > 0 ? 'PENDING' : 'FREE ENTRY'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                                    <div>
                                      <span className="text-[#656c80] block">Applied Amount:</span>
                                      <span className="text-white font-mono font-bold">৳{reg.appliedFee !== undefined ? reg.appliedFee : 0} {reg.currency || 'BDT'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#656c80] block">Payment Gateway:</span>
                                      <span className="text-zinc-300 uppercase font-mono">{reg.paymentMethod || 'Demo Simulator'}</span>
                                    </div>
                                    {reg.paymentTransactionId && (
                                      <div className="col-span-2">
                                        <span className="text-[#656c80] block">Demo Transaction ID:</span>
                                        <span className="text-cyan-400 font-mono">{reg.paymentTransactionId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {reg.checkedInAt && (
                                  <div className="mt-2 pt-2 border-t border-[#242730] text-[11px]">
                                    <span className="text-cyan-400 font-semibold block">Gate Check-In Verified:</span>
                                    <span className="text-[#9da3b4] font-mono">
                                      {formatDateTime(reg.checkedInAt)} (by Operator: {reg.checkedInBy?.slice(0, 10)}...)
                                    </span>
                                  </div>
                                )}

                                {reg.cancellationReason && (
                                  <div className="mt-2 pt-2 border-t border-[#242730] text-[11px]">
                                    <span className="text-red-400 font-semibold block">Cancellation / Rejection Reason:</span>
                                    <span className="text-[#9da3b4]">{reg.cancellationReason}</span>
                                  </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-[#242730] flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="text-[#ff4f1a] font-semibold block">Organizer Notes:</span>
                                    <span className="text-zinc-300">{reg.notes || 'None'}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNotesReg(reg);
                                      setCurrentNotes(reg.notes || '');
                                    }}
                                    className="px-2 py-0.5 rounded bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[10px] text-zinc-300 hover:text-white transition-colors"
                                  >
                                    {reg.notes ? 'Edit Note' : 'Add Note'}
                                  </button>
                                </div>
                              </div>

                              {/* Right Column: Team Roster or Form Responses */}
                              <div className="p-3.5 rounded-xl bg-[#14161a] border border-[#242730] space-y-2">
                                {isTeam && reg.teamMembers && reg.teamMembers.length > 0 ? (
                                  <div>
                                    <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a] mb-2">
                                      Team Roster ({reg.teamMembers.length} members)
                                    </h4>
                                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                      {reg.teamMembers.map((m, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2 rounded-lg bg-[#191b20] border border-[#2e3442] text-[11px] space-y-0.5"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-semibold text-white">{m.name}</span>
                                            {m.role && (
                                              <span className="text-[10px] text-[#ff4f1a] font-mono">
                                                {m.role}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-[#9da3b4] font-mono">
                                            {m.email} {m.phone ? `• ${m.phone}` : ''}
                                          </div>
                                          {(m.institution || m.studentId) && (
                                            <div className="text-[10px] text-[#656c80]">
                                              {m.institution} {m.studentId ? `(${m.studentId})` : ''}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-[#ff4f1a] mb-2">
                                      Custom Form Responses
                                    </h4>
                                    {reg.registrationData && Object.keys(reg.registrationData).length > 0 ? (
                                      <div className="space-y-1 max-h-44 overflow-y-auto font-mono text-[11px]">
                                        {Object.entries(reg.registrationData).map(([k, v]) => (
                                          <div key={k} className="flex justify-between gap-2 p-1.5 rounded bg-[#191b20]">
                                            <span className="text-[#656c80]">{k}:</span>
                                            <span className="text-zinc-300 truncate max-w-[200px]">
                                              {String(v)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-[#656c80] italic">
                                        Standard participant registration entry recorded.
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

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#242730]">
            {filteredRegistrations.map((reg) => (
              <div key={reg.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#242730] border border-[#2e3442] overflow-hidden flex items-center justify-center text-xs font-bold text-[#ff4f1a] shrink-0">
                      {reg.studentPhotoURL ? (
                        <img src={reg.studentPhotoURL} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(reg.studentName || 'S')[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {reg.studentName || 'Student Participant'}
                      </div>
                      <div className="text-xs text-[#9da3b4]">{reg.studentEmail}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {(reg.participantCategory || reg.categoryName) && (
                          <span className="px-1.5 py-0.2 rounded bg-[#1e222b] text-[#ff4f1a] border border-[#ff4f1a]/30 text-[9px] font-mono">
                            {reg.participantCategory || reg.categoryName}
                          </span>
                        )}
                        {reg.classGrade && (
                          <span className="px-1.5 py-0.2 rounded bg-[#1e222b] text-zinc-300 border border-[#2e3442] text-[9px] font-mono">
                            {reg.classGrade}
                          </span>
                        )}
                      </div>
                      {reg.teamName && (
                        <div className="text-[11px] text-purple-400 mt-0.5">Team: {reg.teamName}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <RegistrationStatusBadge status={reg.status} />
                    {reg.paymentStatus === 'paid' ? (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ৳{reg.appliedFee !== undefined ? reg.appliedFee : 0} Paid ({reg.paymentMethod?.toUpperCase()})
                      </span>
                    ) : reg.appliedFee && reg.appliedFee > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono">
                        ৳{reg.appliedFee} Pending
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Free (৳0)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#656c80] font-mono">
                  <span>{reg.eventName}</span>
                  <span>{reg.ticketCode}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {reg.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(reg)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingReg(reg)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 font-semibold text-xs"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {reg.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(reg)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check In</span>
                    </button>
                  )}

                  {reg.status === 'checked_in' && (
                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(reg)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs"
                    >
                      Mark Completed
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedRegId(expandedRegId === reg.id ? null : reg.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-zinc-300"
                  >
                    {expandedRegId === reg.id ? 'Hide Dossier' : 'View Dossier'}
                  </button>
                </div>

                {expandedRegId === reg.id && (
                  <div className="p-3 rounded-xl bg-[#101114] border border-[#242730] text-xs space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div>Phone: <span className="text-zinc-300">{reg.studentPhone || 'N/A'}</span></div>
                      <div>ID: <span className="text-zinc-300">{reg.studentId || 'N/A'}</span></div>
                      <div className="col-span-2">School: <span className="text-zinc-300">{reg.institution || 'N/A'}</span></div>
                    </div>
                    {reg.teamMembers && reg.teamMembers.length > 0 && (
                      <div className="pt-2 border-t border-[#242730]">
                        <div className="text-[10px] text-[#ff4f1a] uppercase font-mono mb-1">Roster:</div>
                        {reg.teamMembers.map((m, i) => (
                          <div key={i} className="text-[11px] text-[#9da3b4]">{m.name} ({m.email})</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject / Decline Reason Modal */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Decline Registration Entry</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingReg(null)}
                className="text-[#656c80] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9da3b4]">
              Are you sure you want to decline the entry for{' '}
              <strong className="text-white">
                {rejectingReg.studentName || rejectingReg.teamName}
              </strong>
              ? This will release their allocated seat quota back to the event capacity.
            </p>

            <div>
              <label className="text-[11px] font-mono text-[#656c80] uppercase block mb-1">
                Reason for Rejection / Notes
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Ineligible student ID, duplicate submission, or prerequisite missing..."
                className="w-full p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReg(null)}
                className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#242730] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organizer Notes Modal */}
      {editingNotesReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-[#ff4f1a]" />
                <span>Operational Notes</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingNotesReg(null)}
                className="text-[#656c80] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9da3b4]">
              Internal organizer note for{' '}
              <strong className="text-white">
                {editingNotesReg.studentName || editingNotesReg.teamName}
              </strong>{' '}
              ({editingNotesReg.ticketCode}).
            </p>

            <div>
              <label className="text-[11px] font-mono text-[#656c80] uppercase block mb-1">
                Note Details (Max 1000 characters)
              </label>
              <textarea
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="e.g. VIP front-row seating assigned, parental consent verified, dietary requirement noted..."
                className="w-full p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
              <div className="text-right text-[10px] text-[#656c80] font-mono mt-1">
                {currentNotes.length}/1000
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotesReg(null)}
                className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#242730] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white shadow-md shadow-[#ff4f1a]/20"
              >
                {actionLoading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
