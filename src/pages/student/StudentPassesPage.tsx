import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  Clock,
  Search,
  Compass,
  Printer,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';
import { PageHeader } from '../../components/common/PageHeader';
import { QRCodeSVG } from '../../components/common/QRCodeSVG';

export const StudentPassesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    document.title = 'Event Passes · Festofy';
  }, []);

  const loadRegistrations = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentRegistrations(currentUser.uid);
      setRegistrations(data || []);
    } catch (err: any) {
      console.warn('Notice loading passes:', err?.message || err);
      setError("Couldn't load your passes. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!authLoading) {
      loadRegistrations();
    }
  }, [authLoading, loadRegistrations]);

  // Exclude cancelled registrations from valid event passes
  const validPasses = useMemo(() => {
    return registrations.filter((r) => r.status !== 'cancelled');
  }, [registrations]);

  const filteredPasses = useMemo(() => {
    if (!searchQuery.trim()) return validPasses;
    const q = searchQuery.toLowerCase().trim();
    return validPasses.filter(
      (r) =>
        r.eventName.toLowerCase().includes(q) ||
        r.festName.toLowerCase().includes(q) ||
        r.ticketCode.toLowerCase().includes(q) ||
        r.venue.toLowerCase().includes(q)
    );
  }, [validPasses, searchQuery]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      <PageHeader
        title="Digital Event Passes"
        documentTitle="Event Passes · Festofy"
        description="Official QR admission credentials and entry passes for your upcoming competitions and summits."
        actions={
          <button
            type="button"
            onClick={loadRegistrations}
            disabled={loading}
            aria-label="Refresh passes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14161a] hover:bg-[#191b20] border border-[#242730] text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Search Input */}
      {validPasses.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passes by event, festival, or ticket code..."
            className="w-full bg-[#14161a] border border-[#242730] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-xs text-red-200">{error}</p>
            <button
              type="button"
              onClick={loadRegistrations}
              className="text-xs font-semibold text-red-300 hover:text-white underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      ) : validPasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a]/50 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#242730] text-[#656c80] flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading text-base font-bold text-white">No active event passes</h3>
            <p className="text-xs text-[#9da3b4]">
              Once you register for an event, your official digital entry ticket pass with QR code will appear here.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Competitions</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPasses.map((reg) => (
            <div
              key={reg.id}
              onClick={() => setSelectedPass(reg)}
              className="group rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#ff4f1a]/50 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-[#ff4f1a]/5"
            >
              {/* Pass Header */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff4f1a] block truncate">
                      {reg.festName || 'Summit / Fest'}
                    </span>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-white group-hover:text-[#ff4f1a] transition-colors truncate">
                      {reg.eventName}
                    </h3>
                  </div>
                  <RegistrationStatusBadge status={reg.status} />
                </div>

                {/* QR and Ticket Pass Badge */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#191b20] border border-[#242730]">
                  <div className="p-2 rounded-lg bg-white shrink-0 shadow-sm">
                    <QRCodeSVG value={reg.ticketCode} size={64} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] text-[#656c80] block font-mono uppercase">Ticket Pass Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-white tracking-wider select-all">
                        {reg.ticketCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(reg.ticketCode, e)}
                        className="text-[#656c80] hover:text-white transition-colors p-1"
                        aria-label="Copy ticket code"
                      >
                        {copiedCode === reg.ticketCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-[#9da3b4] block">Click to view & print pass</span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="space-y-1.5 text-xs text-[#9da3b4]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
                    <span className="truncate">{formatDateTime(reg.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
                    <span className="truncate">{reg.venue || 'Campus Venue'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-[#242730] bg-[#17191e]/50 flex items-center justify-between text-xs">
                <span className="text-[#656c80] text-[11px] font-mono">
                  {reg.registrationType === 'team' ? `Team: ${reg.teamName || 'Squad'}` : 'Solo Admission'}
                </span>
                <span className="text-[#ff4f1a] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Pass</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital Pass Modal */}
      {selectedPass && (
        <DigitalPassModal
          registration={selectedPass}
          isOpen={Boolean(selectedPass)}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
};
