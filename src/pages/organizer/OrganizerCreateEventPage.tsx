import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck2,
  Calendar,
  Clock,
  Building2,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { createEvent, getEventCategories } from '../../services/eventService';
import { getOrganizationFests } from '../../services/festService';
import { Fest, EventCategory, EventFormField, FormFieldType } from '../../types';

export const OrganizerCreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFestId = searchParams.get('festId');

  const { activeOrganization, loading: orgLoading } = useOrganizer();

  const [fests, setFests] = useState<Fest[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [festId, setFestId] = useState(preselectedFestId || '');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [bannerUrl, setBannerUrl] = useState('');

  // Team settings
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [minTeamSize, setMinTeamSize] = useState('2');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Custom Form Fields
  const [customFields, setCustomFields] = useState<EventFormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  useEffect(() => {
    async function fetchMetadata() {
      if (!activeOrganization) {
        setLoadingMeta(false);
        return;
      }

      try {
        setLoadingMeta(true);
        const [festList, catList] = await Promise.all([
          getOrganizationFests(activeOrganization.id),
          getEventCategories()
        ]);
        setFests(festList || []);
        setCategories(catList || []);

        if (catList && catList.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }

        if (preselectedFestId && festList.some(f => f.id === preselectedFestId)) {
          setFestId(preselectedFestId);
        } else if (festList && festList.length > 0 && !festId) {
          setFestId(festList[0].id);
        }
      } catch (err) {
        console.error('Failed to load event creation metadata:', err);
        setErrorMsg('Unable to load festivals or categories. Please reload the page.');
      } finally {
        setLoadingMeta(false);
      }
    }

    if (!orgLoading) {
      fetchMetadata();
    }
  }, [activeOrganization, orgLoading, preselectedFestId]);

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const field: EventFormField = {
      id: `field_${Date.now()}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired
    };
    setCustomFields(prev => [...prev, field]);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) {
      setErrorMsg('No active organization selected.');
      return;
    }

    setErrorMsg(null);

    // Validation
    if (!festId) {
      setErrorMsg('Please select a parent festival for this event.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category for this event.');
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 150) {
      setErrorMsg('Event name must be between 3 and 150 characters.');
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 3 || trimmedDesc.length > 3000) {
      setErrorMsg('Event description must be between 3 and 3000 characters.');
      return;
    }

    const trimmedVenue = venue.trim();
    if (trimmedVenue.length < 2 || trimmedVenue.length > 100) {
      setErrorMsg('Event venue must be between 2 and 100 characters.');
      return;
    }

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum < 1 || capNum > 100000) {
      setErrorMsg('Capacity must be a positive number up to 100,000.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMsg('Both start time and end time are required.');
      return;
    }

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      setErrorMsg('Invalid dates specified.');
      return;
    }

    if (startMs > endMs) {
      setErrorMsg('Event start time cannot be after end time.');
      return;
    }

    const deadlineMs = registrationDeadline ? new Date(registrationDeadline).getTime() : startMs;
    if (isNaN(deadlineMs)) {
      setErrorMsg('Invalid registration deadline specified.');
      return;
    }

    if (deadlineMs > startMs) {
      setErrorMsg('Registration deadline cannot be after event start time.');
      return;
    }

    if (bannerUrl.trim()) {
      const rawBanner = bannerUrl.trim();
      if (!rawBanner.startsWith('http://') && !rawBanner.startsWith('https://')) {
        setErrorMsg('Banner URL must start with http:// or https://');
        return;
      }
    }

    const minTeam = parseInt(minTeamSize, 10);
    const maxTeam = parseInt(maxTeamSize, 10);
    if (registrationType === 'team') {
      if (isNaN(minTeam) || minTeam < 1) {
        setErrorMsg('Minimum team size must be at least 1.');
        return;
      }
      if (isNaN(maxTeam) || maxTeam < minTeam) {
        setErrorMsg('Maximum team size must be greater than or equal to minimum team size.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const created = await createEvent(
        {
          festId,
          categoryId,
          name: trimmedName,
          description: trimmedDesc,
          venue: trimmedVenue,
          startTime: new Date(startMs).toISOString(),
          endTime: new Date(endMs).toISOString(),
          registrationDeadline: new Date(deadlineMs).toISOString(),
          capacity: capNum,
          bannerUrl: bannerUrl.trim() || undefined,
          registrationType,
          minTeamSize: registrationType === 'team' ? minTeam : undefined,
          maxTeamSize: registrationType === 'team' ? maxTeam : undefined,
          requiresApproval,
          customFormFields: customFields
        },
        activeOrganization.id
      );

      navigate(`/organizer/events/${created.id}`);
    } catch (err: any) {
      console.error('Event creation error:', err);
      setErrorMsg(err.message || 'Failed to create event document.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading organization festivals and event taxonomy...
      </div>
    );
  }

  if (fests.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-[#14161a] border border-[#242730] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">
            Festival Required Before Creating Events
          </h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Every contest, symposium, or workshop must belong to a parent festival hosted by your organization. Please create a festival first.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/organizer/fests/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white shadow-lg shadow-[#ff4f1a]/20 cursor-pointer"
          >
            <span>Create a Festival First</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 border-b border-[#242730]">
        <div>
          <Link
            to="/organizer/events"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Managed Events</span>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Create Competition / Event
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Configure schedule, venue, seat quota, and participant requirements. Events are initially saved in <strong>Draft</strong> status.
          </p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CORE IDENTIFICATION */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>1. Organization & Parent Festival</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Host Organization
              </label>
              <input
                type="text"
                disabled
                value={activeOrganization?.name || 'Active Workspace'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-zinc-400 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Parent Festival <span className="text-[#ff4f1a]">*</span>
              </label>
              <select
                value={festId}
                onChange={(e) => setFestId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              >
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: EVENT DETAILS */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <CalendarCheck2 className="w-4 h-4" />
            <span>2. Event Details & Categorization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Event Name <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CodeSprint Hackathon 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Category <span className="text-[#ff4f1a]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Description <span className="text-[#ff4f1a]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the rules, criteria, prize pool, and eligibility requirements..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Venue / Platform <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Auditorium B or Discord / Zoom"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Banner URL (Optional)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SCHEDULE & CAPACITY */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>3. Schedule & Registration Quota</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Start Time <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                End Time <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Registration Deadline <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Participant Capacity <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Enforced by Firestore transactions to prevent overbooking.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Registration Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegistrationType('individual')}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    registrationType === 'individual'
                      ? 'bg-[#ff4f1a] text-white'
                      : 'bg-[#191b20] text-zinc-400 border border-[#2e3442]'
                  }`}
                >
                  Solo / Individual
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType('team')}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    registrationType === 'team'
                      ? 'bg-[#ff4f1a] text-white'
                      : 'bg-[#191b20] text-zinc-400 border border-[#2e3442]'
                  }`}
                >
                  Team Contest
                </button>
              </div>
            </div>
          </div>

          {registrationType === 'team' && (
            <div className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Max Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0 focus:outline-none cursor-pointer"
            />
            <label htmlFor="requiresApproval" className="text-xs text-zinc-300 font-medium cursor-pointer">
              Require manual organizer approval for submitted registrations (waitlist mode)
            </label>
          </div>
        </div>

        {/* SECTION 4: CUSTOM APPLICATION QUESTIONS */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>4. Custom Registration Questions ({customFields.length})</span>
            </div>
          </div>

          <p className="text-xs text-[#9da3b4]">
            Gather specialized information from students during registration (e.g. GitHub handles, food preferences, T-shirt sizes).
          </p>

          {/* List existing custom fields */}
          {customFields.length > 0 && (
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 rounded-xl bg-[#191b20] border border-[#2e3442] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-500 text-[11px]">#{idx + 1}</span>
                    <span className="font-semibold text-white">{field.label}</span>
                    <span className="px-2 py-0.5 rounded bg-[#14161a] text-zinc-400 font-mono text-[10px]">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] text-[#ff4f1a] font-bold">Required</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(field.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom field inputs */}
          <div className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Question label (e.g., GitHub Profile URL)"
                  className="w-full px-3 py-2 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
              <div>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FormFieldType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Paragraph</option>
                  <option value="url">URL</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone Number</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0"
                />
                <span>Mandatory response</span>
              </label>

              <button
                type="button"
                onClick={handleAddCustomField}
                disabled={!newFieldLabel.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUBMIT ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242730]">
          <Link
            to="/organizer/events"
            className="px-5 py-2.5 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Creating Event...' : 'Save Draft Event'}
          </button>
        </div>
      </form>
    </div>
  );
};
