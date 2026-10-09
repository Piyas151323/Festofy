import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import {
  Ticket,
  Printer,
  Copy,
  Check,
  X,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Registration } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../registration/RegistrationStatusBadge';
import { QRCodeSVG } from './QRCodeSVG';

interface DigitalPassModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  registration,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const containerRef = useDialogFocus<HTMLDivElement>({
    isOpen,
    onClose,
    closeOnEscape: true,
    lockScroll: true,
  });

  if (!isOpen || !registration || typeof document === 'undefined') return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isCancelled = registration.status === 'cancelled';
  const isPending = registration.status === 'pending';
  const isCheckedIn = registration.status === 'checked_in';
  const isConfirmed = registration.status === 'confirmed';
  const isValidPass = isConfirmed || isCheckedIn;
  const isTeam = registration.registrationType === 'team';

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm print:p-0 print:bg-white animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-modal-title"
      tabIndex={-1}
    >
      <div className="relative w-full max-w-xl mx-auto my-auto py-4 print:my-0 print:py-0">
        {/* Floating Actions outside the pass (hidden during printing) */}
        <div className="flex items-center justify-between mb-3 text-xs no-print">
          <div className="flex items-center gap-2 text-zinc-300">
            {isValidPass ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-emerald-300">Official Entry Credential</span>
              </>
            ) : isCancelled ? (
              <>
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="font-semibold text-red-400">Cancelled / Void Pass</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-amber-300">Pending Application (Not Valid for Entry)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              title="Print pass or save to PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close pass modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Pass Container */}
        <div className="printable-pass-credential rounded-3xl bg-gradient-to-b from-[#14161a] to-[#0d0e11] border-2 border-[#2e3442] text-white shadow-2xl overflow-hidden print:border-black print:text-black">
          {/* Header Banner - Status Adaptive */}
          <div
            className={`p-4 sm:p-5 flex items-center justify-between print:bg-none print:border-b-2 print:border-black ${
              isValidPass
                ? 'bg-gradient-to-r from-[#ff4f1a] to-[#ff6838]'
                : isCancelled
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-red-900/50'
                : 'bg-gradient-to-r from-amber-600 to-amber-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/25 backdrop-blur-md flex items-center justify-center text-white print:text-black shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-black/80 block truncate print:text-black">
                  {isValidPass
                    ? 'FESTOFY VERIFIED ENTRY PASS'
                    : isCancelled
                    ? 'VOID / CANCELLED PASS'
                    : 'APPLICATION UNDER REVIEW'}
                </span>
                <h3
                  id="pass-modal-title"
                  className="font-heading text-base sm:text-lg font-black text-white tracking-tight truncate print:text-black"
                >
                  {registration.festName || 'Campus Festival'}
                </h3>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white border print:border-black print:text-black ${
                  isValidPass
                    ? 'bg-black/30 border-white/20'
                    : isCancelled
                    ? 'bg-red-950/70 text-red-200 border-red-700'
                    : 'bg-amber-950/70 text-amber-200 border-amber-700'
                }`}
              >
                {isValidPass ? 'GATE PASS' : isCancelled ? 'VOID' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Ineligible Warning Callout if Cancelled or Pending */}
          {!isValidPass && (
            <div
              className={`p-3 text-xs flex items-center gap-2 border-b print:border-black ${
                isCancelled
                  ? 'bg-red-950/40 text-red-300 border-red-900/50 print:bg-gray-100 print:text-black'
                  : 'bg-amber-950/40 text-amber-300 border-amber-900/50 print:bg-gray-100 print:text-black'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-current" />
              <span>
                {isCancelled
                  ? 'This registration was cancelled and cannot be presented for gate admission.'
                  : 'This application is pending organizer approval and does not yet authorize event entry.'}
              </span>
            </div>
          )}

          {/* Event & Schedule Details */}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="border-b border-[#242730] pb-4 space-y-1.5 print:border-gray-400">
              <div className="text-[10px] font-mono uppercase text-[#ff4f1a] font-bold tracking-wider print:text-black">
                Competition / Event
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white print:text-black">
                {registration.eventName}
              </h2>
              {registration.organizationName && (
                <div className="flex items-center gap-1.5 text-xs text-[#9da3b4] print:text-gray-700">
                  <Building2 className="w-3.5 h-3.5 text-[#656c80] shrink-0 print:text-black" />
                  <span>Hosted by {registration.organizationName}</span>
                </div>
              )}
            </div>

            {/* Middle Section: Details + QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              {/* Left Column: Participant & Venue Metadata */}
              <div className="sm:col-span-2 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Participant
                    </span>
                    <span className="font-bold text-white text-sm block truncate print:text-black">
                      {registration.studentName}
                    </span>
                    <span className="text-[#9da3b4] text-[11px] block truncate font-mono print:text-gray-700">
                      {registration.studentEmail}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Entry Mode
                    </span>
                    <span className="font-semibold text-white capitalize block print:text-black">
                      {isTeam ? `Team (${registration.teamName || 'Entry'})` : 'Individual Entry'}
                    </span>
                    {(registration.participantCategory || registration.categoryName) && (
                      <span className="text-[#ff4f1a] text-[11px] font-medium block print:text-black">
                        {registration.participantCategory || registration.categoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#242730] print:border-gray-300">
                  <div>
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Date & Schedule
                    </span>
                    <div className="flex items-center gap-1 text-white font-medium pt-0.5 print:text-black">
                      <Clock className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0 print:text-black" />
                      <span className="text-[11px]">{formatDateTime(registration.startTime)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Venue
                    </span>
                    <div className="flex items-center gap-1 text-white font-medium pt-0.5 print:text-black">
                      <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0 print:text-black" />
                      <span className="text-[11px] truncate">{registration.venue || 'Festival Grounds'}</span>
                    </div>
                  </div>
                </div>

                {(registration.institution || registration.studentId) && (
                  <div className="pt-2 border-t border-[#242730] flex flex-wrap gap-x-4 gap-y-1 text-[11px] print:border-gray-300">
                    {registration.institution && (
                      <div>
                        <span className="text-[#656c80] print:text-gray-600">Institution: </span>
                        <span className="text-[#d1d5db] font-medium print:text-black">{registration.institution}</span>
                      </div>
                    )}
                    {registration.studentId && (
                      <div>
                        <span className="text-[#656c80] print:text-gray-600">ID / Roll: </span>
                        <span className="text-white font-mono font-medium print:text-black">{registration.studentId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: QR Code Box with Scannable Standard Payload */}
              <div
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-black border shadow-md ${
                  isCancelled ? 'opacity-60 border-red-300' : 'border-zinc-200'
                }`}
              >
                <QRCodeSVG
                  value={`${registration.ticketCode}::${registration.id}`}
                  size={135}
                  className="mx-auto"
                />
                <span className="text-[9px] font-mono tracking-wider uppercase text-zinc-600 mt-1 font-bold">
                  {isValidPass ? 'SCAN AT GATE' : isCancelled ? 'PASS CANCELLED' : 'PENDING APPROVAL'}
                </span>
                {isCancelled && (
                  <div className="absolute inset-0 bg-red-950/20 rounded-2xl flex items-center justify-center">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase rotate-[-12deg]">
                      VOID
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar: Prominent Ticket Code */}
            <div className="pt-4 border-t-2 border-dashed border-[#282d38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:border-black">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#656c80] tracking-wider block print:text-gray-600">
                  Official Verification Code
                </span>
                <div
                  className={`print-ticket-code font-mono text-2xl sm:text-3xl font-black tracking-widest flex items-center gap-2 print:text-black ${
                    isCancelled ? 'text-zinc-500 line-through' : 'text-[#ff4f1a]'
                  }`}
                >
                  <span>{registration.ticketCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs text-[#9da3b4] hover:text-white transition-colors cursor-pointer no-print"
                    title="Copy ticket code"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-[10px] font-mono uppercase text-[#656c80] tracking-wider block print:text-gray-600">
                  Verification Status
                </span>
                <RegistrationStatusBadge status={registration.status} />
                {isCheckedIn && registration.checkedInAt && (
                  <span className="text-[10px] text-cyan-400 font-mono print:text-black">
                    Verified at gate desk
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Micro Footer Notice & Security Disclaimer */}
          <div className="bg-[#101114] px-6 py-2.5 border-t border-[#242730] text-[10px] text-[#656c80] flex flex-col sm:flex-row sm:items-center justify-between gap-1 print:bg-white print:text-gray-600 print:border-gray-400">
            <span>Fast-Track Gate Lookup • Admittance subject to live organizer database check</span>
            <span className="font-mono">Ref: {registration.id.slice(0, 16)}</span>
          </div>
        </div>

        {/* Modal Action Buttons Footer (hidden during printing) */}
        <div className="mt-4 flex items-center justify-end gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-[#ff4f1a]/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass / Save PDF</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
