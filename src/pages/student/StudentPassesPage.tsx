import React from 'react';
import { Ticket, QrCode, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const StudentPassesPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          Digital Event Passes
        </h1>
        <p className="text-xs text-[#9da3b4]">
          Fast-track festival credentials, gate check-in passes, and badge verification.
        </p>
      </div>

      <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6">
        {/* Pass Preview Card */}
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-[#191b20] to-[#121316] border border-[#2e3442] shadow-xl relative overflow-hidden space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#242730]">
            <div>
              <span className="text-[10px] font-mono text-[#ff4f1a] uppercase font-bold tracking-wider">
                FESTOFY DIGITAL PASS
              </span>
              <h3 className="text-sm font-bold text-white">Student Entry Credential</h3>
            </div>
            <Ticket className="w-5 h-5 text-[#ff4f1a]" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#9da3b4]">
              <span>Participant:</span>
              <span className="text-white font-medium">{currentUser?.displayName || 'Student User'}</span>
            </div>
            <div className="flex justify-between text-[#9da3b4]">
              <span>Email:</span>
              <span className="text-white font-medium truncate max-w-[200px]">{currentUser?.email || ''}</span>
            </div>
            <div className="flex justify-between text-[#9da3b4]">
              <span>Security Tier:</span>
              <span className="text-white font-medium">Verified Campus Student</span>
            </div>
            <div className="flex justify-between text-[#9da3b4]">
              <span>Credential Status:</span>
              <span className="text-emerald-400 font-mono font-medium">Active & Valid</span>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-[#242730] flex flex-col items-center justify-center py-4 bg-black/30 rounded-xl space-y-2">
            <QrCode className="w-16 h-16 text-[#9da3b4]" />
            <span className="text-[11px] text-[#9da3b4] text-center max-w-xs">
              Present your event ticket code at the campus registration desk for instant check-in.
            </span>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard/registrations"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#ff4f1a]/20"
            >
              <span>View Registered Event Tickets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#656c80] max-w-md mx-auto">
          Individual ticket codes are uniquely generated upon registration and verified by organizers at on-site check-in desks.
        </p>
      </div>
    </div>
  );
};
