import React from 'react';
import { Ticket, QrCode, Shield, ArrowRight } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
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

      <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-6">
        {/* Pass Preview Mockup */}
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-[#191b20] to-[#121316] border border-[#2e3442] shadow-xl relative overflow-hidden space-y-4">
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
              <span>Security Tier:</span>
              <span className="text-white font-medium">Verified Student</span>
            </div>
            <div className="flex justify-between text-[#9da3b4]">
              <span>Phase Status:</span>
              <span className="text-emerald-400 font-mono">Phase 1 Foundation Ready</span>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-[#242730] flex flex-col items-center justify-center py-4 bg-black/30 rounded-xl space-y-2">
            <QrCode className="w-20 h-20 text-[#656c80]" />
            <span className="text-[10px] font-mono text-[#656c80]">
              Dynamic QR generation activates in Phase 2
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-[#656c80]">
          Passes are dynamically issued when you register for festivals and verified during on-site check-in.
        </p>
      </div>
    </div>
  );
};
