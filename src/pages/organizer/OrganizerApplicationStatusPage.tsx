import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CalendarDays,
  FileCheck2,
  Sparkles,
  HelpCircle,
  Layers,
  Users2,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMyOrganizationRequests } from '../../services/organizationService';
import { Organization, OrganizationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const OrganizerApplicationStatusPage: React.FC = () => {
  const { currentUser, role, refreshUserRole } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMyOrganizationRequests(currentUser.uid);
      setRequests(data);
      await refreshUserRole().catch(() => {});
    } catch (err) {
      console.warn('Notice checking application status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = 'Application Status & Onboarding · Festofy Organizer';
    fetchStatus();
  }, [currentUser]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
  };

  const activeRequest = requests[0] || null;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2e3442] bg-[#14161a] text-xs font-semibold text-[#ff4f1a] uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> Organizer Onboarding Hub
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Application Status & Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-[#9da3b4] mt-1">
            Track your organization review progress and explore festival operations features.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2e3442] bg-[#14161a] hover:bg-[#1e222b] text-xs font-semibold text-white transition-colors cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#ff4f1a] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Checking Firestore...' : 'Refresh Status'}</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 rounded-3xl border border-[#242730] bg-[#14161a] flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
          <p className="text-xs text-[#9da3b4] font-mono">Retrieving your organization charter status...</p>
        </div>
      ) : !activeRequest ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-[#242730] bg-[#14161a] text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-white">No Application Found</h2>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              We did not detect a pending or approved organization application linked to your account.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/organizer/apply"
              className="px-6 py-3 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-bold transition-colors shadow-lg shadow-[#ff4f1a]/20"
            >
              Join Festofy as Organizer &rarr;
            </Link>
            <Link
              to="/events"
              className="px-6 py-3 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-white text-xs font-semibold border border-[#2e3442] transition-colors"
            >
              Explore Public Directory
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status Display Card */}
          <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Status Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
              <div className="flex items-center gap-3.5">
                {activeRequest.logoUrl ? (
                  <img
                    src={activeRequest.logoUrl}
                    alt={activeRequest.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#2e3442] bg-[#090a0b]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#ff4f1a]/10 border border-[#ff4f1a]/20 text-[#ff4f1a] flex items-center justify-center font-bold text-xl">
                    {activeRequest.name[0]?.toUpperCase() || 'O'}
                  </div>
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {activeRequest.name}
                  </h2>
                  <p className="text-xs text-[#9da3b4]">
                    {activeRequest.institution || 'Academic Club / Organization'}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div>
                {activeRequest.status === 'approved' ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Approved & Activated</span>
                  </span>
                ) : activeRequest.status === 'pending' ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold animate-pulse">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Under Administrator Review</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Application Not Approved</span>
                  </span>
                )}
              </div>
            </div>

            {/* Contextual Status Banner */}
            {activeRequest.status === 'approved' ? (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      Your Organization is Approved!
                    </h3>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Congratulations! Platform administrators have approved your club charter. You now have full organizer privileges to publish festivals, launch programming contests, and manage participants.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to="/organizer"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Organizer Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/organizer/fests/new"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-white text-xs font-semibold border border-[#2e3442] transition-colors text-center"
                  >
                    Create Your First Festival
                  </Link>
                </div>
              </div>
            ) : activeRequest.status === 'pending' ? (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      Application Submitted & Under Review
                    </h3>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Our platform team verifies institutional affiliation and club charters within 24 to 48 hours. Once verified, your account is automatically elevated to Organizer without any additional steps required.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-amber-300/80 font-mono bg-black/20 p-2.5 rounded-xl border border-amber-500/20">
                  Tip: Keep this page bookmarked or sign in with your organizer email to check status anytime. You will be redirected directly to your Organizer Dashboard upon approval.
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      Application Not Approved
                    </h3>
                    <p className="text-xs text-red-200/90 leading-relaxed">
                      {activeRequest.rejectionReason || 'The application was not approved by platform administrators.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/organizer/apply"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                  >
                    Submit Revised Application &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Application Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#0e1013] space-y-1">
                <span className="text-[#656c80] font-mono uppercase text-[10px] font-semibold">
                  Submitted On
                </span>
                <p className="text-white font-medium">
                  {formatDateTime(activeRequest.requestedAt || activeRequest.createdAt)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#0e1013] space-y-1">
                <span className="text-[#656c80] font-mono uppercase text-[10px] font-semibold">
                  Lead Requester
                </span>
                <p className="text-white font-medium truncate">
                  {currentUser?.email || 'Organizer Account'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#242730] bg-[#0e1013] space-y-1">
                <span className="text-[#656c80] font-mono uppercase text-[10px] font-semibold">
                  Application ID
                </span>
                <p className="text-[#9da3b4] font-mono truncate" title={activeRequest.id}>
                  {activeRequest.id}
                </p>
              </div>
            </div>
          </div>

          {/* Organizer Onboarding & Preparation Guide */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ff4f1a]" />
              Organizer Onboarding Features & Preparation
            </h2>
            <p className="text-xs text-[#9da3b4]">
              While your charter is being processed, prepare your competition structure and review event management capabilities:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#ff4f1a]/10 text-[#ff4f1a] flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Festival & Event Architecture</h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  Festofy uses a hierarchical Festival &gt; Events model. Publish your overarching carnival or summit dates, then add individual programming contests, hackathons, robotics challenges, or olympiads underneath.
                </p>
                <div className="text-[11px] font-mono text-[#ff4f1a] font-semibold">
                  Supports Multi-day Schedules &amp; Venue Deadlines
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Participant Eligibility & Pricing</h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  Configure custom categories (School, College, University) with independent fee structures, registration caps, team size limits, and instant digital pass allocation.
                </p>
                <div className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Individual &amp; Team Form Templates
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Event-Day QR Code Check-ins</h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  Every confirmed registrant receives a tamper-proof digital pass with an encrypted QR code. Volunteers scan passes in real time to verify check-ins and eliminate gate bottlenecks.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Instant Attendance Badging
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Institutional Support & Fast-Track</h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  Need fast-track verification for an imminent campus competition? Reach out directly to platform administrators with official club authorization letters.
                </p>
                <div className="text-[11px] font-mono text-amber-400 font-semibold">
                  Administrator Contact: admin@festofy.demo
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
