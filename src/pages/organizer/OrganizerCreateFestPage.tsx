import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Building2,
  Sparkles,
  Image,
  Calendar,
  FileText
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { createFest } from '../../services/festService';

export const OrganizerCreateFestPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrganization, loading: orgLoading } = useOrganizer();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeOrganization) {
      setErrorMsg('No active organization selected. Please select a club workspace.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setErrorMsg('Festival name is required and must be at least 3 characters.');
      return;
    }
    if (trimmedName.length > 150) {
      setErrorMsg('Festival name must not exceed 150 characters.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 3) {
      setErrorMsg('Festival description is required and must be at least 3 characters.');
      return;
    }
    if (trimmedDesc.length > 3000) {
      setErrorMsg('Festival description must not exceed 3000 characters.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Please specify both a start date and an end date.');
      return;
    }

    const startT = new Date(startDate).getTime();
    const endT = new Date(endDate).getTime();
    if (isNaN(startT) || isNaN(endT)) {
      setErrorMsg('Please select valid start and end dates.');
      return;
    }
    if (startT > endT) {
      setErrorMsg('Festival start date cannot be later than end date.');
      return;
    }

    if (bannerUrl.trim()) {
      const trimmedBanner = bannerUrl.trim();
      if (!trimmedBanner.startsWith('http://') && !trimmedBanner.startsWith('https://')) {
        setErrorMsg('Banner URL must begin with http:// or https://');
        return;
      }
      if (trimmedBanner.length > 500) {
        setErrorMsg('Banner URL must not exceed 500 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const newFest = await createFest(
        {
          name: trimmedName,
          description: trimmedDesc,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          bannerUrl: bannerUrl.trim() || undefined,
          organizationName: activeOrganization.name,
          organizationLogo: activeOrganization.logoUrl
        },
        activeOrganization.id
      );

      navigate(`/organizer/fests/${newFest.id}`);
    } catch (err: any) {
      console.error('Failed to create festival:', err);
      setErrorMsg(err.message || 'Unable to create festival. Please verify inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/organizer/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Festivals</span>
        </Link>
      </div>

      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • New Festival
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Festival
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Initialize a new festival in Draft mode. Once finalized, you can publish it for student discovery.
          </p>
        </div>

        {activeOrganization && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-zinc-300 self-start sm:self-auto shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#ff4f1a]" />
            <span className="truncate max-w-[180px]">{activeOrganization.name}</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Fest Name */}
        <div className="space-y-1.5">
          <label htmlFor="fest-name" className="block text-xs font-semibold text-zinc-300">
            Festival Name <span className="text-[#ff4f1a]">*</span>
          </label>
          <input
            id="fest-name"
            type="text"
            required
            minLength={3}
            maxLength={150}
            placeholder="e.g. National Tech Carnival 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
          <div className="flex justify-between text-[11px] text-[#656c80] font-mono">
            <span>Official title displayed across the platform</span>
            <span>{name.length}/150</span>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="fest-start-date" className="block text-xs font-semibold text-zinc-300">
              Start Date & Time <span className="text-[#ff4f1a]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fest-start-date"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fest-end-date" className="block text-xs font-semibold text-zinc-300">
              End Date & Time <span className="text-[#ff4f1a]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fest-end-date"
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="fest-description" className="block text-xs font-semibold text-zinc-300">
            Festival Overview & Description <span className="text-[#ff4f1a]">*</span>
          </label>
          <textarea
            id="fest-description"
            rows={5}
            required
            minLength={3}
            maxLength={3000}
            placeholder="Detail the theme, target attendees, participating colleges, and key highlights..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl p-3.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors resize-y leading-relaxed"
          />
          <div className="flex justify-between text-[11px] text-[#656c80] font-mono">
            <span>Markdown or plain text description</span>
            <span>{description.length}/3000</span>
          </div>
        </div>

        {/* Banner URL (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="fest-banner" className="block text-xs font-semibold text-zinc-300">
            Promotional Banner Image URL <span className="text-zinc-500 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Image className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="fest-banner"
              type="url"
              maxLength={500}
              placeholder="https://example.com/fest-banner.jpg"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono"
            />
          </div>
          <span className="text-[11px] text-[#656c80]">
            Direct link to an image banner (JPG, PNG, WebP)
          </span>
        </div>

        {/* Initial Status Callout */}
        <div className="p-4 rounded-xl bg-[#191b20]/60 border border-[#2e3442] flex items-start gap-3 text-xs text-[#9da3b4]">
          <Sparkles className="w-4 h-4 text-[#ff4f1a] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200">Lifecycle Safeguard: Initial Draft Status</span>
            <p className="leading-relaxed text-[11px]">
              Festivals are created as <strong className="text-white">Drafts</strong>. You can review all details, attach competitions, and publish when your committee is ready.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            to="/organizer/fests"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2e3442] bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-zinc-300 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || orgLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#ff4f1a]/20 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Creating Draft...' : 'Create Draft Festival'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
