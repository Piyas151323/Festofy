import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll while the pass is open so the modal is the only thing that scrolls.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !registration) return null;

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

  const modal = (
    <div
      className="pass-print-root fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-modal-title"
    >
      {/* min-h-full + items-start on phones: tall passes scroll from the top instead of being cropped */}
      <div className="flex min-h-full items-start justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6 print:block print:p-0">
      <div className="relative w-full min-w-0 max-w-xl print:max-w-none">
        {/* Status + close, outside the pass (hidden during printing) */}
        <div className="mb-2 flex items-center justify-between gap-3 text-xs no-print">
          <div className="flex min-w-0 items-center gap-2 text-zinc-300">
            {isValidPass ? (
              <>
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="min-w-0 font-semibold text-emerald-300">Official Entry Credential</span>
              </>
            ) : isCancelled ? (
              <>
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span className="min-w-0 font-semibold text-red-400">Cancelled / Void Pass</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="min-w-0 font-semibold text-amber-300">Pending Application (Not Valid for Entry)</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* On phones Print lives in the bottom action area; keep the shortcut for larger screens */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden items-center gap-1.5 rounded-xl border border-[#2e3442] bg-[#191b20] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-zinc-700 hover:bg-[#252830] cursor-pointer sm:inline-flex"
              title="Print pass or save to PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#ff4f1a]" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2e3442] bg-[#191b20] text-[#9da3b4] transition-colors hover:bg-[#252830] hover:text-white cursor-pointer sm:h-8 sm:w-8"
              aria-label="Close pass modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Pass Container */}
        <div className="printable-pass-credential rounded-3xl bg-gradient-to-b from-[#14161a] to-[#0d0e11] border-2 border-[#2e3442] text-white shadow-2xl overflow-hidden print:border-black print:text-black">
          {/* Header Banner - Status Adaptive */}
          <div
            className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5 print:bg-none print:border-b-2 print:border-black ${
              isValidPass
                ? 'bg-gradient-to-r from-[#ff4f1a] to-[#ff6838]'
                : isCancelled
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-red-900/50'
                : 'bg-gradient-to-r from-amber-600 to-amber-700'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-white backdrop-blur-md print:text-black">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block break-words font-mono text-[10px] font-bold uppercase leading-tight tracking-widest text-black/80 print:text-black">
                {isValidPass
                  ? 'FESTOFY VERIFIED ENTRY PASS'
                  : isCancelled
                  ? 'VOID / CANCELLED PASS'
                  : 'APPLICATION UNDER REVIEW'}
              </span>
              <h3
                id="pass-modal-title"
                className="mt-1 break-words font-heading text-base font-black leading-snug tracking-tight text-white sm:text-lg print:text-black"
              >
                {registration.festName || 'Campus Festival'}
              </h3>
            </div>

            {/* Status chip: under the title on phones, at the right on wider screens */}
            <span
              className={`col-start-2 justify-self-start rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md sm:col-start-3 sm:row-start-1 sm:justify-self-end print:border-black print:text-black ${
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
          <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            <div className="border-b border-[#242730] pb-4 space-y-1.5 print:border-gray-400">
              <div className="text-[10px] font-mono uppercase text-[#ff4f1a] font-bold tracking-wider print:text-black">
                Competition / Event
              </div>
              <h2 className="break-words font-heading text-xl font-extrabold leading-tight text-white sm:text-2xl print:text-black">
                {registration.eventName}
              </h2>
              {registration.organizationName && (
                <div className="flex items-start gap-1.5 text-xs text-[#9da3b4] print:text-gray-700">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#656c80] print:text-black" />
                  <span className="min-w-0 break-words">Hosted by {registration.organizationName}</span>
                </div>
              )}
            </div>

            {/* Middle Section: Details + QR Code */}
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3 sm:gap-5">
              {/* Left Column: Participant & Venue Metadata */}
              <div className="min-w-0 space-y-3 text-xs sm:col-span-2 sm:space-y-3.5">
                <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2">
                  <div className="min-w-0">
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Participant
                    </span>
                    <span className="block break-words text-sm font-bold text-white print:text-black">
                      {registration.studentName}
                    </span>
                    <span className="block break-all font-mono text-[11px] text-[#9da3b4] print:text-gray-700">
                      {registration.studentEmail}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Entry Mode
                    </span>
                    <span className="block break-words font-semibold capitalize text-white print:text-black">
                      {isTeam ? `Team (${registration.teamName || 'Entry'})` : 'Individual Entry'}
                    </span>
                    {(registration.participantCategory || registration.categoryName) && (
                      <span className="block break-words text-[11px] font-medium text-[#ff4f1a] print:text-black">
                        {registration.participantCategory || registration.categoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-[#242730] pt-3 min-[340px]:grid-cols-2 print:border-gray-300">
                  <div className="min-w-0">
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Date & Schedule
                    </span>
                    <div className="flex items-start gap-1.5 pt-0.5 font-medium text-white print:text-black">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff4f1a] print:text-black" />
                      <span className="min-w-0 break-words text-[11px]">{formatDateTime(registration.startTime)}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[#656c80] block text-[10px] uppercase font-mono print:text-gray-600">
                      Venue
                    </span>
                    <div className="flex items-start gap-1.5 pt-0.5 font-medium text-white print:text-black">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff4f1a] print:text-black" />
                      <span className="min-w-0 break-words text-[11px]">{registration.venue || 'Festival Grounds'}</span>
                    </div>
                  </div>
                </div>

                {(registration.institution || registration.studentId) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#242730] pt-3 text-[11px] [overflow-wrap:anywhere] print:border-gray-300">
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
                className={`qr-box relative mx-auto flex w-full max-w-[13rem] flex-col items-center justify-center rounded-2xl border bg-white p-3 text-black shadow-md sm:mx-0 sm:max-w-none ${
                  isCancelled ? 'opacity-60 border-red-300' : 'border-zinc-200'
                }`}
              >
                <QRCodeSVG
                  value={`${registration.ticketCode}::${registration.id}`}
                  size={160}
                  className="mx-auto h-auto w-full max-w-[11rem]"
                />
                <span className="mt-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
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
            <div className="flex flex-col items-start justify-between gap-3 border-t-2 border-dashed border-[#282d38] pt-4 sm:flex-row sm:items-center print:border-black">
              <div className="min-w-0 max-w-full">
                <span className="text-[10px] font-mono uppercase text-[#656c80] tracking-wider block print:text-gray-600">
                  Official Verification Code
                </span>
                <div
                  className={`print-ticket-code mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[clamp(1.25rem,6.4vw,1.75rem)] font-black tracking-wider sm:text-3xl sm:tracking-widest print:text-black ${
                    isCancelled ? 'text-zinc-500 line-through' : 'text-[#ff4f1a]'
                  }`}
                >
                  <span className="min-w-0 break-all">{registration.ticketCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2e3442] bg-[#191b20] text-xs text-[#9da3b4] transition-colors hover:bg-[#252830] hover:text-white cursor-pointer no-print sm:h-8 sm:w-8"
                    title="Copy ticket code"
                    aria-label="Copy ticket code"
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
          <div className="bg-[#101114] px-4 py-2.5 sm:px-6 border-t border-[#242730] text-[10px] text-[#656c80] flex flex-col sm:flex-row sm:items-center justify-between gap-1 print:bg-white print:text-gray-600 print:border-gray-400">
            <span>Fast-Track Gate Lookup • Admittance subject to live organizer database check</span>
            <span className="break-all font-mono">Ref: {registration.id.slice(0, 16)}</span>
          </div>
        </div>

        {/* Modal Action Buttons Footer (hidden during printing). Stacked, full-width on phones. */}
        <div className="mt-3 flex flex-col-reverse gap-2 no-print sm:mt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e3442] bg-[#191b20] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-[#252830] hover:text-white cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#ff4f1a] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#ff4f1a]/20 transition-colors hover:bg-[#ff6838] cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Pass / Save PDF</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};
