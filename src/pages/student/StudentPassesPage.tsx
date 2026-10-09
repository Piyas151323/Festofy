import React, { useEffect, useState, useMemo } from 'react';
import {
  Ticket,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Printer,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';
import { QRCodeSVG } from '../../components/common/QRCodeSVG';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const StudentPassesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPasses = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentRegistrations(currentUser.uid);
      // Filter out cancelled registrations from active passes
      const active = data.filter((r) => r.status !== 'cancelled');
      setRegistrations(active);
    } catch (err: any) {
      console.warn('Notice loading passes:', err?.message || err);
      setError('Unable to load digital event passes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPasses();
    }
  }, [currentUser?.uid, authLoading]);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrintCard = (reg: Registration, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPass(reg);
    // Give state a tick to update before print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#ff4f1a] flex items-center gap-2 mb-1">
            <Ticket className="w-3.5 h-3.5" />
            <span>Fast-Track Festival Gate Credentials</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Digital Event Passes
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1 max-w-xl">
            Official QR passes and verification codes for your confirmed registrations. Present these at campus registration desks for instant check-in.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPasses}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14161a] hover:bg-[#1e2128] border border-[#242730] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <CardSkeleton count={2} />
      ) : registrations.length === 0 ? (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6 text-[#ff4f1a]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-bold text-white">
              No active event passes found
            </h2>
            <p className="text-xs text-[#9da3b4] max-w-md mx-auto">
              Once you register for a festival competition or hackathon, your verified digital gate pass will automatically appear here.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/events"
              className="px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-[#ff4f1a]/20"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Competitions</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                onClick={() => setSelectedPass(reg)}
                className="group relative rounded-3xl border border-[#242730] bg-[#14161a] hover:border-[#ff4f1a]/50 p-6 space-y-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-black/60 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#242730]">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-[#ff4f1a] uppercase font-bold tracking-wider block truncate">
                        {reg.festName || 'Campus Festival'}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-white group-hover:text-[#ff4f1a] transition-colors truncate">
                        {reg.eventName}
                      </h3>
                    </div>
                    <RegistrationStatusBadge status={reg.status} />
                  </div>

                  {/* Pass Body with QR Thumbnail */}
                  <div className="pt-3 flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 shrink-0 shadow-sm">
                      <QRCodeSVG
                        value={`${reg.ticketCode}::${reg.id}`}
                        size={84}
                        className="mx-auto"
                      />
                    </div>

                    <div className="space-y-2 text-xs min-w-0 flex-1">
                      <div>
                        <span className="text-[#656c80] block text-[10px] uppercase font-mono">
                          Ticket Code
                        </span>
                        <div className="font-mono text-base font-black tracking-wider text-white flex items-center gap-2">
                          <span>{reg.ticketCode}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(reg.ticketCode, e)}
                            className="p-1 rounded bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white transition-colors"
                            title="Copy ticket code"
                          >
                            {copiedCode === reg.ticketCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-[#9da3b4] text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                          <span className="truncate">{formatDateTime(reg.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-[#656c80] shrink-0" />
                          <span className="truncate">{reg.venue || 'Campus Grounds'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-3 border-t border-[#242730] flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-[#656c80] truncate">
                    {reg.registrationType === 'team'
                      ? `Team: ${reg.teamName || 'Squad'}`
                      : 'Individual Participant'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handlePrintCard(reg, e)}
                      className="p-2 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white transition-colors"
                      title="Print pass"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ff4f1a] group-hover:translate-x-0.5 transition-transform">
                      View Pass <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] text-center text-xs text-[#656c80] max-w-xl mx-auto">
            <span className="font-medium text-[#9da3b4]">Need to print your pass? </span>
            Click on any event pass above and select <strong className="text-white">Print / Save PDF</strong> to generate an official hardcopy or PDF credential for check-in.
          </div>
        </div>
      )}

      {/* Interactive Pass Modal with Full Print/Save Support */}
      <DigitalPassModal
        registration={selectedPass}
        isOpen={selectedPass !== null}
        onClose={() => setSelectedPass(null)}
      />
    </div>
  );
};
