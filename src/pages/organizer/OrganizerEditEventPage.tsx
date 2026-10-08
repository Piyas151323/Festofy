import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck2,
  Clock,
  Building2,
  Users,
  AlertCircle,
  Save,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getEventById, updateEvent, getEventCategories } from '../../services/eventService';
import { EventItem, EventCategory, EventFormField, FormFieldType } from '../../types';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';

export const OrganizerEditEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { organizations, loading: orgLoading } = useOrganizer();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [bannerUrl, setBannerUrl] = useState('');
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [minTeamSize, setMinTeamSize] = useState('2');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);

  // Custom Form Fields
  const [customFields, setCustomFields] = useState<EventFormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        const [evtData, catList] = await Promise.all([
          getEventById(eventId),
          getEventCategories()
        ]);

        if (!evtData) {
          setErrorMsg('Event not found.');
          return;
        }

        // Verify organization membership
        const isMember = organizations.some(o => o.id === evtData.organizationId);
        if (!isMember) {
          setErrorMsg('You do not have permission to edit events for this organization.');
          return;
        }

        if (evtData.status !== 'draft' && evtData.status !== 'published') {
          setErrorMsg(`Events with status "${evtData.status}" cannot be edited.`);
          return;
        }

        setEvent(evtData);
        setCategories(catList || []);

        setName(evtData.name || '');
        setDescription(evtData.description || '');
        setCategoryId(evtData.categoryId || '');
        setVenue(evtData.venue || '');
        setCapacity(String(evtData.capacity || 100));
        setBannerUrl(evtData.bannerUrl || '');
        setRegistrationType((evtData.registrationType as any) || 'individual');
        setMinTeamSize(String(evtData.minTeamSize || 2));
        setMaxTeamSize(String(evtData.maxTeamSize || 4));
        setRequiresApproval(Boolean(evtData.requiresApproval));
        setIsRegistrationClosed(Boolean(evtData.isRegistrationClosed));
        setCustomFields(evtData.customFormFields || []);

        // Format dates for datetime-local
        if (evtData.startTime) {
          setStartTime(new Date(evtData.startTime).toISOString().slice(0, 16));
        }
        if (evtData.endTime) {
          setEndTime(new Date(evtData.endTime).toISOString().slice(0, 16));
        }
        if (evtData.registrationDeadline) {
          setRegistrationDeadline(new Date(evtData.registrationDeadline).toISOString().slice(0, 16));
        }
      } catch (err: any) {
        console.warn('Notice loading event for edit:', err?.message || err);
        setErrorMsg(err.message || 'Unable to retrieve event record.');
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading) {
      loadData();
    }
  }, [eventId, organizations, orgLoading]);

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
    if (!eventId || !event) return;

    setErrorMsg(null);
    setSuccessMsg(null);

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
      setErrorMsg('Capacity must be a positive integer between 1 and 100,000.');
      return;
    }

    if (event.currentRegistrations && capNum < event.currentRegistrations) {
      setErrorMsg(`Capacity cannot be reduced below current registered attendees (${event.currentRegistrations}).`);
      return;
    }

    const sMs = new Date(startTime).getTime();
    const eMs = new Date(endTime).getTime();
    if (isNaN(sMs) || isNaN(eMs)) {
      setErrorMsg('Invalid start or end date format.');
      return;
    }
    if (sMs > eMs) {
      setErrorMsg('Start time cannot be after end time.');
      return;
    }

    const dMs = registrationDeadline ? new Date(registrationDeadline).getTime() : sMs;
    if (isNaN(dMs)) {
      setErrorMsg('Invalid registration deadline date format.');
      return;
    }
    if (dMs > sMs) {
      setErrorMsg('Registration deadline cannot be after event start time.');
      return;
    }

    if (bannerUrl.trim()) {
      const raw = bannerUrl.trim();
      if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
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
      setSaving(true);
      await updateEvent(eventId, {
        name: trimmedName,
        description: trimmedDesc,
        categoryId,
        venue: trimmedVenue,
        startTime: new Date(sMs).toISOString(),
        endTime: new Date(eMs).toISOString(),
        registrationDeadline: new Date(dMs).toISOString(),
        capacity: capNum,
        bannerUrl: bannerUrl.trim(),
        registrationType,
        minTeamSize: registrationType === 'team' ? minTeam : undefined,
        maxTeamSize: registrationType === 'team' ? maxTeam : undefined,
        requiresApproval,
        isRegistrationClosed,
        customFormFields: customFields
      });

      setSuccessMsg('Event changes saved successfully!');
      setTimeout(() => {
        navigate(`/organizer/events/${eventId}`);
      }, 1000);
    } catch (err: any) {
      console.warn('Notice updating event:', err?.message || err);
      setErrorMsg(err.message || 'Failed to update event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading event configuration...
      </div>
    );
  }

  if (errorMsg && !event) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-[#14161a] border border-[#242730] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">Event Unavailable</h2>
          <p className="text-xs text-[#9da3b4]">{errorMsg}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/organizer/events"
            className="px-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-zinc-300"
          >
            Return to Events
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
            to={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Event Details</span>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Edit Event: {event?.name}
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Status: <span className="font-mono text-zinc-300 capitalize">{event?.status}</span> • Parent Festival: {event?.festName}
          </p>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{successMsg}</div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CORE INFORMATION */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>1. Core Details</span>
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <DirectImageUpload
                value={bannerUrl}
                onChange={setBannerUrl}
                label="Event Promotional Poster / Banner"
                helperText="Upload event poster directly (JPG, PNG, WebP) or pick a curated student event theme"
                aspectRatio="banner"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEDULE & CAPACITY */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>2. Schedule & Seat Quota</span>
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
                Seat Capacity <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="number"
                min={event?.currentRegistrations || 1}
                max="100000"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Current enrolled participants: <strong>{event?.currentRegistrations || 0}</strong>.
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
                  Individual
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

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0"
              />
              <span>Require manual organizer approval for submitted registrations</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isRegistrationClosed}
                onChange={(e) => setIsRegistrationClosed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0"
              />
              <span>Manually lock registration gate (no new registrations allowed)</span>
            </label>
          </div>
        </div>

        {/* SECTION 3: CUSTOM APPLICATION QUESTIONS */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>3. Custom Registration Questions ({customFields.length})</span>
          </div>

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

          <div className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Question label (e.g., Portfolio link, dietary requirements)"
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
            to={`/organizer/events/${eventId}`}
            className="px-5 py-2.5 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
