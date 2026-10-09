import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Building2,
  Calendar,
  Image,
  Lock,
  CheckCircle2,
  Eye,
  Tag,
  Plus,
  Trash2
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getFestById, updateFest } from '../../services/festService';
import { Fest, ParticipantCategoryConfig, VisitorAccessType } from '../../types';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';

const DEFAULT_PRESET_CATEGORIES = [
  'Junior',
  'Secondary',
  'Higher Secondary',
  'College',
  'University',
  'Open for Everyone'
];

export const OrganizerEditFestPage: React.FC = () => {
  const { festId } = useParams<{ festId: string }>();
  const navigate = useNavigate();
  const { activeOrganization, organizations } = useOrganizer();

  const [fest, setFest] = useState<Fest | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Visitor Policy
  const [visitorAccess, setVisitorAccess] = useState<VisitorAccessType>('allowed');

  // Custom Participant Categories
  const [categories, setCategories] = useState<ParticipantCategoryConfig[]>([
    { id: 'cat_open', name: 'Open for Everyone' }
  ]);
  const [newCatName, setNewCatName] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setCategories(prev => [
      ...prev,
      { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: trimmed }
    ]);
    setNewCatName('');
  };

  const handleQuickAddCategory = (catName: string) => {
    if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) return;
    setCategories(prev => [
      ...prev,
      { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: catName }
    ]);
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Helper to convert ISO to local datetime-local format
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    async function fetchFest() {
      if (!festId) return;
      try {
        setInitialLoading(true);
        setErrorMsg(null);
        const data = await getFestById(festId);
        if (!data) {
          setErrorMsg('Festival not found.');
          return;
        }

        // Scope check: User must belong to the organization
        const isMemberOfOrg = organizations.some(o => o.id === data.organizationId);
        if (!isMemberOfOrg) {
          setErrorMsg('You do not have permission to edit festivals for this organization.');
          return;
        }

        setFest(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setStartDate(formatForInput(data.startDate));
        setEndDate(formatForInput(data.endDate));
        setBannerUrl(data.bannerUrl || '');
        setVisitorAccess(data.visitorAccess || 'allowed');
        if (data.participantCategories && data.participantCategories.length > 0) {
          setCategories(data.participantCategories);
        }
      } catch (err: any) {
        console.warn('Notice loading festival for editing:', err?.message || err);
        setErrorMsg(err.message || 'Unable to retrieve festival details.');
      } finally {
        setInitialLoading(false);
      }
    }

    fetchFest();
  }, [festId, organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!festId || !fest) return;
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setErrorMsg('Festival name must be at least 3 characters.');
      return;
    }
    if (trimmedName.length > 150) {
      setErrorMsg('Festival name must not exceed 150 characters.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 3) {
      setErrorMsg('Festival description must be at least 3 characters.');
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
      await updateFest(festId, {
        name: trimmedName,
        description: trimmedDesc,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        visitorAccess,
        participantCategories: categories,
        bannerUrl: bannerUrl.trim() || undefined
      });

      navigate(`/organizer/fests/${festId}`);
    } catch (err: any) {
      console.warn('Notice updating festival:', err?.message || err);
      setErrorMsg(err.message || 'Unable to save festival modifications.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading festival configuration...
      </div>
    );
  }

  if (errorMsg && !fest) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          to="/organizer/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Festivals
        </Link>
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs">
          {errorMsg}
        </div>
      </div>
    );
  }

  const isLocked = fest?.status === 'completed' || fest?.status === 'archived';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/organizer/fests/${festId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Festival Overview</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {fest?.name} • Edit Mode
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Edit Festival Details
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Update festival naming, descriptions, operational dates, and hero promotional imagery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono bg-[#191b20] border border-[#2e3442] text-zinc-300">
            Status: {fest?.status}
          </span>
        </div>
      </div>

      {/* Status Warning if Completed or Archived */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Editing Locked for {fest?.status} Festival</span>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              This festival is marked as <strong>{fest?.status}</strong>. In accordance with platform governance, historical festivals cannot undergo metadata modifications.
            </p>
          </div>
        </div>
      )}

      {/* Error Notice */}
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

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Fest Name */}
        <div className="space-y-1.5">
          <label htmlFor="edit-fest-name" className="block text-xs font-semibold text-zinc-300">
            Festival Name <span className="text-[#ff4f1a]">*</span>
          </label>
          <input
            id="edit-fest-name"
            type="text"
            required
            disabled={isLocked}
            minLength={3}
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] text-[#656c80] font-mono">
            <span>Official festival title</span>
            <span>{name.length}/150</span>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-start-date" className="block text-xs font-semibold text-zinc-300">
              Start Date & Time <span className="text-[#ff4f1a]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="edit-start-date"
                type="datetime-local"
                required
                disabled={isLocked}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-end-date" className="block text-xs font-semibold text-zinc-300">
              End Date & Time <span className="text-[#ff4f1a]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="edit-end-date"
                type="datetime-local"
                required
                disabled={isLocked}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="edit-description" className="block text-xs font-semibold text-zinc-300">
            Overview & Description <span className="text-[#ff4f1a]">*</span>
          </label>
          <textarea
            id="edit-description"
            rows={5}
            required
            disabled={isLocked}
            minLength={3}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl p-3.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors resize-y leading-relaxed disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] text-[#656c80] font-mono">
            <span>Markdown or plain text</span>
            <span>{description.length}/3000</span>
          </div>
        </div>

        {/* Festival Banner (Direct Upload, Presets, or Link) */}
        <DirectImageUpload
          value={bannerUrl}
          onChange={setBannerUrl}
          label="Promotional Banner Image"
          helperText="Direct image upload (JPG, PNG, WebP) or curated festival poster preset for student discovery"
          aspectRatio="banner"
        />

        {/* Visitor Access Policy */}
        <div className="p-4 rounded-2xl bg-[#14161a] border border-[#242730] space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#ff4f1a]" />
            <span className="font-heading font-semibold text-sm text-white">
              Festival Visitor & Spectator Policy
            </span>
          </div>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Clearly indicate whether outside visitors, guests, friends, and family are welcome to attend and watch festivities, or if access is strictly restricted to registered participants.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                visitorAccess === 'allowed'
                  ? 'border-[#ff4f1a] bg-[#ff4f1a]/10 text-white'
                  : 'border-[#2e3442] bg-[#191b20] text-[#9da3b4] hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="visitorAccess"
                value="allowed"
                disabled={isLocked}
                checked={visitorAccess === 'allowed'}
                onChange={() => setVisitorAccess('allowed')}
                className="mt-0.5 text-[#ff4f1a] focus:ring-0"
              />
              <div>
                <span className="block font-semibold text-xs text-white">
                  Visitors Allowed (Open Campus)
                </span>
                <span className="text-[11px] text-[#9da3b4] block mt-0.5">
                  Audiences, parents, and casual visitors may enter festival grounds and attend stage performances.
                </span>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                visitorAccess === 'not_allowed' || visitorAccess === 'restricted'
                  ? 'border-[#ff4f1a] bg-[#ff4f1a]/10 text-white'
                  : 'border-[#2e3442] bg-[#191b20] text-[#9da3b4] hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="visitorAccess"
                value="not_allowed"
                disabled={isLocked}
                checked={visitorAccess === 'not_allowed' || visitorAccess === 'restricted'}
                onChange={() => setVisitorAccess('not_allowed')}
                className="mt-0.5 text-[#ff4f1a] focus:ring-0"
              />
              <div>
                <span className="block font-semibold text-xs text-white">
                  Visitors Not Allowed
                </span>
                <span className="text-[11px] text-[#9da3b4] block mt-0.5">
                  Strict venue gate admission. Only students with a confirmed ticket pass are permitted onto grounds.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Participant Categories */}
        <div className="p-4 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#ff4f1a]" />
              <span className="font-heading font-semibold text-sm text-white">
                Festival Participant Categories
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#656c80]">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} configured
            </span>
          </div>

          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Define the academic divisions or participant levels accepted across events in this festival (e.g. Junior, College, University). You can further adjust fees and eligibility per competition.
          </p>

          {/* Quick Add Presets */}
          {!isLocked && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[#656c80] block">
                Quick Add Common Categories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_PRESET_CATEGORIES.map((preset) => {
                  const alreadyAdded = categories.some(c => c.name.toLowerCase() === preset.toLowerCase());
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickAddCategory(preset)}
                      disabled={alreadyAdded}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-[#191b20] text-[#656c80] border border-[#242730] cursor-not-allowed'
                          : 'bg-[#1e222b] hover:bg-[#282d38] text-zinc-300 border border-[#2e3442] hover:text-white'
                      }`}
                    >
                      + {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white"
                >
                  <span className="font-medium">{cat.name}</span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-[#656c80] hover:text-red-400 cursor-pointer transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Category Add Input */}
            {!isLocked && (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add custom category (e.g. Masters, Professionals, Secondary Boys)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 bg-[#191b20] border border-[#2e3442] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-xl bg-[#1e222b] hover:bg-[#282d38] border border-[#2e3442] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            to={`/organizer/fests/${festId}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2e3442] bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-zinc-300 transition-colors text-center"
          >
            Cancel
          </Link>
          {!isLocked && (
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#ff4f1a]/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
