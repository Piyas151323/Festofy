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
  Info,
  ArrowUp,
  ArrowDown,
  Eye,
  Tag,
  CreditCard,
  FileText,
  BookmarkPlus
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { createEvent, getEventCategories } from '../../services/eventService';
import { getOrganizationFests } from '../../services/festService';
import { AVAILABLE_INTERESTS } from '../../services/userService';
import { Fest, EventCategory, EventFormField, FormFieldType, ParticipantCategoryConfig, VisitorAccessType } from '../../types';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';
import { TemplateSelectorModal } from '../../components/registration/TemplateSelectorModal';

const DEFAULT_PRESET_CATEGORIES = [
  'Junior',
  'Secondary',
  'Higher Secondary',
  'College',
  'University',
  'Open for Everyone'
];

export const OrganizerCreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFestId = searchParams.get('festId');

  const { activeOrganization, loading: orgLoading } = useOrganizer();

  const [fests, setFests] = useState<Fest[]>([]);
  const [categoriesTaxonomy, setCategoriesTaxonomy] = useState<EventCategory[]>([]);
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

  // Visitor Policy
  const [visitorAccess, setVisitorAccess] = useState<VisitorAccessType>('allowed');

  // Topics & Disciplines for Recommendation Engine
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');

  // Fees
  const [isPaid, setIsPaid] = useState(false);
  const [baseFee, setBaseFee] = useState('0');

  // Custom Participant Categories
  const [categories, setCategories] = useState<ParticipantCategoryConfig[]>([
    { id: 'cat_open', name: 'Open for Everyone', eligible: true }
  ]);
  const [newCatName, setNewCatName] = useState('');

  // Team settings
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [minTeamSize, setMinTeamSize] = useState('2');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Custom Form Fields & Templates
  const [customFields, setCustomFields] = useState<EventFormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
        setCategoriesTaxonomy(catList || []);

        if (catList && catList.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }

        const effectiveFestId = preselectedFestId || (festList && festList.length > 0 ? festList[0].id : '');
        if (effectiveFestId) {
          setFestId(effectiveFestId);
          const parentFest = festList.find(f => f.id === effectiveFestId);
          if (parentFest?.participantCategories && parentFest.participantCategories.length > 0) {
            setCategories(parentFest.participantCategories.map(c => ({ ...c, eligible: true })));
          }
          if (parentFest?.visitorAccess) {
            setVisitorAccess(parentFest.visitorAccess);
          }
        }
      } catch (err) {
        console.warn('Notice loading event creation metadata:', err);
        setErrorMsg('Unable to load festivals or categories. Please reload the page.');
      } finally {
        setLoadingMeta(false);
      }
    }

    if (!orgLoading) {
      fetchMetadata();
    }
  }, [activeOrganization, orgLoading, preselectedFestId]);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    setCategories(prev => [
      ...prev,
      { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: trimmed, eligible: true }
    ]);
    setNewCatName('');
  };

  const handleQuickAddCategory = (catName: string) => {
    if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) return;
    setCategories(prev => [
      ...prev,
      { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: catName, eligible: true }
    ]);
  };

  const handleToggleCategoryEligible = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, eligible: !c.eligible } : c));
  };

  const handleUpdateCategoryFee = (id: string, feeStr: string) => {
    const val = feeStr === '' ? undefined : Math.max(0, Number(feeStr) || 0);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, fee: val } : c));
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleTopic = (topic: string) => {
    setTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleAddCustomTopic = () => {
    const trimmed = customTopicInput.trim();
    if (!trimmed) return;
    if (!topics.includes(trimmed)) {
      setTopics(prev => [...prev, trimmed]);
    }
    setCustomTopicInput('');
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(prev => prev.filter(t => t !== topic));
  };

  const handleMoveFieldUp = (index: number) => {
    if (index <= 0) return;
    setCustomFields(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveFieldDown = (index: number) => {
    if (index >= customFields.length - 1) return;
    setCustomFields(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

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
      const parsedBaseFee = isPaid ? Math.max(0, Number(baseFee) || 0) : 0;
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
          ...(bannerUrl.trim() ? { bannerUrl: bannerUrl.trim() } : {}),
          registrationType,
          ...(registrationType === 'team' ? { minTeamSize: minTeam, maxTeamSize: maxTeam } : {}),
          requiresApproval,
          visitorAccess,
          isPaid,
          baseFee: parsedBaseFee,
          topics,
          participantCategories: categories
            .filter(c => c.eligible !== false)
            .map(c => {
              const cleanC: ParticipantCategoryConfig = {
                id: c.id,
                name: c.name,
                eligible: true
              };
              if (typeof c.fee === 'number') cleanC.fee = c.fee;
              if (c.description) cleanC.description = c.description;
              return cleanC;
            }),
          customFormFields: customFields.map(f => {
            const cleanF: EventFormField = {
              id: f.id,
              label: f.label,
              type: f.type,
              required: Boolean(f.required)
            };
            if (f.placeholder) cleanF.placeholder = f.placeholder;
            if (f.helpText) cleanF.helpText = f.helpText;
            if (f.validationRule) cleanF.validationRule = f.validationRule;
            if (f.options && f.options.length > 0) cleanF.options = [...f.options];
            return cleanF;
          })
        },
        activeOrganization.id
      );

      navigate(`/organizer/events/${created.id}`);
    } catch (err: any) {
      console.warn('Notice creating event:', err?.message || err);
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
                onChange={(e) => {
                  const newFid = e.target.value;
                  setFestId(newFid);
                  const foundFest = fests.find(f => f.id === newFid);
                  if (foundFest?.participantCategories && foundFest.participantCategories.length > 0) {
                    setCategories(foundFest.participantCategories.map(c => ({ ...c, eligible: true })));
                  }
                  if (foundFest?.visitorAccess) {
                    setVisitorAccess(foundFest.visitorAccess);
                  }
                }}
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
                {categoriesTaxonomy.map((c) => (
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

        {/* SECTION 2.5: TOPICS & ACADEMIC DISCIPLINES (For Personalized Recommendations) */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>2.5 Event Topics & Recommendation Tags</span>
          </div>

          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Assign relevant academic disciplines and subject topics. Eligible students who selected matching interests in their profiles will be automatically notified when this competition is published.
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = topics.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleTopic(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#ff4f1a] text-white shadow-sm shadow-[#ff4f1a]/30'
                        : 'bg-[#191b20] border border-[#2e3442] text-[#9da3b4] hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Topics input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTopic();
                  }
                }}
                placeholder="Add custom topic (e.g. Web Development, Blockchain, MUN)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
              <button
                type="button"
                onClick={handleAddCustomTopic}
                className="px-4 py-2 rounded-xl bg-[#1e222b] hover:bg-[#252b36] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Add Tag
              </button>
            </div>

            {topics.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#9da3b4]">
                <span className="font-mono text-zinc-400">Assigned Tags ({topics.length}):</span>
                {topics.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ff4f1a]/10 border border-[#ff4f1a]/30 text-[#ff4f1a] font-mono text-[11px]"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(t)}
                      className="hover:text-white cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

        {/* SECTION 4: VISITOR & SPECTATOR POLICY */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>4. Event Visitor & Spectator Policy</span>
          </div>

          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Clarify whether outside audience members and guests may watch this competition, or if access is restricted only to confirmed contestants.
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
                checked={visitorAccess === 'allowed'}
                onChange={() => setVisitorAccess('allowed')}
                className="mt-0.5 text-[#ff4f1a] focus:ring-0"
              />
              <div>
                <span className="block font-semibold text-xs text-white">
                  Visitors Allowed (Audience Welcome)
                </span>
                <span className="text-[11px] text-[#9da3b4] block mt-0.5">
                  Spectators, friends, and parents are welcome into the hall/arena to watch.
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
                checked={visitorAccess === 'not_allowed' || visitorAccess === 'restricted'}
                onChange={() => setVisitorAccess('not_allowed')}
                className="mt-0.5 text-[#ff4f1a] focus:ring-0"
              />
              <div>
                <span className="block font-semibold text-xs text-white">
                  Visitors Not Allowed
                </span>
                <span className="text-[11px] text-[#9da3b4] block mt-0.5">
                  Restricted to registered participants only. Closed door room/lab. Strictly ticketed participants with verified entry passes admitted.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 5: REGISTRATION FEES & PARTICIPANT CATEGORIES */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>5. Participant Categories & Registration Fees</span>
            </div>
            <span className="text-[11px] font-mono text-[#656c80]">
              {isPaid ? `Paid Event (Base ৳${baseFee})` : 'Free Event (৳0)'}
            </span>
          </div>

          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Configure registration pricing and select eligible participant groups. You can set a general fee or specify individual fees per category.
          </p>

          {/* Pricing Model Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#191b20] border border-[#2e3442]">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Pricing Structure
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaid(false);
                    setBaseFee('0');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    !isPaid
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#14161a] text-zinc-400 border border-[#242730]'
                  }`}
                >
                  Free (৳0)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isPaid
                      ? 'bg-[#ff4f1a] text-white'
                      : 'bg-[#14161a] text-zinc-400 border border-[#242730]'
                  }`}
                >
                  Paid Event
                </button>
              </div>
            </div>

            {isPaid && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Standard Base Fee (BDT ৳) <span className="text-[#ff4f1a]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={baseFee}
                    onChange={(e) => setBaseFee(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#14161a] border border-[#242730] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Participant Categories Configuration */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#ff4f1a]" />
                Eligible Categories & Category-Specific Fees
              </span>
              <span className="text-[10px] text-[#656c80] font-mono">
                Leave fee blank to inherit default base fee
              </span>
            </div>

            {/* Quick add presets */}
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PRESET_CATEGORIES.map((preset) => {
                const alreadyAdded = categories.some(c => c.name.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQuickAddCategory(preset)}
                    disabled={alreadyAdded}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
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

            {/* Category list items */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-[#191b20] border border-[#2e3442] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`eligible_${cat.id}`}
                      checked={cat.eligible !== false}
                      onChange={() => handleToggleCategoryEligible(cat.id)}
                      className="w-4 h-4 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor={`eligible_${cat.id}`} className="font-semibold text-white cursor-pointer">
                      {cat.name}
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    {isPaid && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#656c80] font-mono">Fee: ৳</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          placeholder={baseFee || '0'}
                          value={cat.fee !== undefined ? cat.fee : ''}
                          onChange={(e) => handleUpdateCategoryFee(cat.id, e.target.value)}
                          className="w-20 px-2.5 py-1 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white font-mono focus:outline-none focus:border-[#ff4f1a]"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Category Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom category (e.g. Master's, Open Division, Grade 11-12)..."
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
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 6: CUSTOM REGISTRATION FORM QUESTIONS & TEMPLATES */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>6. Registration Info Questions ({customFields.length})</span>
            </div>

            {/* Template Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-500 text-xs font-semibold text-[#ff4f1a] transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Form Templates</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Configure questions for students to answer upon registering. You can select a reusable template, customize the questions for this event without affecting the template, and reorder questions as needed.
          </p>

          {/* List existing custom fields with Reordering */}
          {customFields.length > 0 ? (
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3.5 rounded-xl bg-[#191b20] border border-[#2e3442] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveFieldUp(idx)}
                        disabled={idx === 0}
                        title="Move question up"
                        className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFieldDown(idx)}
                        disabled={idx === customFields.length - 1}
                        title="Move question down"
                        className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

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
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#191b20]/60 border border-[#242730] text-center space-y-2">
              <FileText className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-[#9da3b4]">
                Standard participant profile details (Full name, Email, Phone, Institution, Class/Grade) are collected automatically.
              </p>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs text-[#ff4f1a] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Load questions from a template
              </button>
            </div>
          )}

          {/* Add custom field inputs */}
          <div className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-3">
            <span className="text-[10px] uppercase font-mono text-[#656c80] block">
              Add New Question Specifically for this Event:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Question label (e.g., GitHub Profile URL, T-shirt size, Track choice)"
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

      {/* Reusable Registration Form Template Selector Modal */}
      {activeOrganization && (
        <TemplateSelectorModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          organizationId={activeOrganization.id}
          onSelectTemplate={(fields) => {
            setCustomFields(fields);
          }}
          currentFieldsToSave={customFields}
        />
      )}
    </div>
  );
};
