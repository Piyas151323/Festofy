import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  School,
  IdCard,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { EventItem, Fest, RegistrationType, TeamMember, EventFormField } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DynamicFormField } from './DynamicFormField';
import { TeamMembersSection } from './TeamMembersSection';
import { formatDateTime } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { submitAtomicRegistration } from '../../services/registrationService';

interface RegistrationFormProps {
  event: EventItem;
  fest?: Fest | null;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ event, fest }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Determine initial registration type based on event configuration
  const defaultType: RegistrationType =
    event.registrationType === 'team' ? 'team' : 'individual';
  const allowsTypeChoice = event.registrationType === 'both';

  const [registrationType, setRegistrationType] = useState<RegistrationType>(defaultType);

  // Participant details
  const [studentName, setStudentName] = useState(currentUser?.displayName || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentPhone, setStudentPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentId, setStudentId] = useState('');

  // Team details
  const minTeamSize = event.minTeamSize || 2;
  const maxTeamSize = event.maxTeamSize || 4;

  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: '',
      institution: '',
      studentId: '',
      role: 'Team Leader'
    },
    {
      name: '',
      email: '',
      phone: '',
      institution: '',
      studentId: '',
      role: 'Member 2'
    }
  ]);

  // Dynamic custom questions responses
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

  // Validation errors
  const [errors, setErrors] = useState<{
    studentName?: string;
    studentEmail?: string;
    studentPhone?: string;
    institution?: string;
    studentId?: string;
    teamName?: string;
    teamSize?: string;
    members?: Record<number, { name?: string; email?: string; phone?: string; studentId?: string }>;
    custom?: Record<string, string>;
  }>({});

  // Submission UI States
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize initial prefill if currentUser loads later
  useEffect(() => {
    if (currentUser?.displayName && !studentName) {
      setStudentName(currentUser.displayName);
    }
    if (currentUser?.email && !studentEmail) {
      setStudentEmail(currentUser.email);
    }
    if (currentUser && teamMembers[0] && !teamMembers[0].name) {
      setTeamMembers((prev) => [
        {
          ...prev[0],
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        },
        ...prev.slice(1)
      ]);
    }
  }, [currentUser]);

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone: string) => /^[+]?[\d\s-]{7,20}$/.test(phone.trim());
  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {
      members: {},
      custom: {}
    };
    let hasError = false;

    // Participant verification
    if (!studentName.trim()) {
      newErrors.studentName = 'Full name is required.';
      hasError = true;
    } else if (studentName.trim().length < 2) {
      newErrors.studentName = 'Name must be at least 2 characters.';
      hasError = true;
    }

    if (!studentEmail.trim()) {
      newErrors.studentEmail = 'Email address is required.';
      hasError = true;
    } else if (!isValidEmail(studentEmail)) {
      newErrors.studentEmail = 'Please provide a valid email address.';
      hasError = true;
    }

    if (studentPhone.trim() && !isValidPhone(studentPhone)) {
      newErrors.studentPhone = 'Please provide a valid phone number (e.g. +880 1700-000000).';
      hasError = true;
    }

    // Team validation
    if (registrationType === 'team') {
      if (!teamName.trim()) {
        newErrors.teamName = 'Team name is required.';
        hasError = true;
      } else if (teamName.trim().length < 2) {
        newErrors.teamName = 'Team name must be at least 2 characters.';
        hasError = true;
      }

      if (teamMembers.length < minTeamSize) {
        newErrors.teamSize = `Team must have at least ${minTeamSize} members (currently ${teamMembers.length}).`;
        hasError = true;
      } else if (teamMembers.length > maxTeamSize) {
        newErrors.teamSize = `Team cannot exceed ${maxTeamSize} members (currently ${teamMembers.length}).`;
        hasError = true;
      }

      // Validate each member
      teamMembers.forEach((member, idx) => {
        const memberErr: { name?: string; email?: string; phone?: string } = {};
        if (!member.name.trim()) {
          memberErr.name = 'Member name is required.';
          hasError = true;
        }
        if (!member.email.trim()) {
          memberErr.email = 'Member email is required.';
          hasError = true;
        } else if (!isValidEmail(member.email)) {
          memberErr.email = 'Valid email is required.';
          hasError = true;
        }
        if (member.phone?.trim() && !isValidPhone(member.phone)) {
          memberErr.phone = 'Valid phone format required.';
          hasError = true;
        }

        if (Object.keys(memberErr).length > 0 && newErrors.members) {
          newErrors.members[idx] = memberErr;
        }
      });
    }

    // Dynamic custom questions validation
    if (event.customFormFields && event.customFormFields.length > 0) {
      event.customFormFields.forEach((field) => {
        const val = customResponses[field.id];

        if (field.required) {
          if (val === undefined || val === null || val === '') {
            newErrors.custom![field.id] = `${field.label} is required.`;
            hasError = true;
            return;
          }
          if (field.type === 'checkbox' && Array.isArray(val) && val.length === 0) {
            newErrors.custom![field.id] = `Please select at least one option for ${field.label}.`;
            hasError = true;
            return;
          }
          if (field.type === 'checkbox' && typeof val === 'boolean' && !val) {
            newErrors.custom![field.id] = 'You must accept/check this requirement.';
            hasError = true;
            return;
          }
        }

        // Format checks if filled
        if (val && typeof val === 'string' && val.trim()) {
          if (field.type === 'email' && !isValidEmail(val)) {
            newErrors.custom![field.id] = 'Please enter a valid email address.';
            hasError = true;
          } else if (field.type === 'phone' && !isValidPhone(val)) {
            newErrors.custom![field.id] = 'Please enter a valid phone number.';
            hasError = true;
          } else if (field.type === 'url' && !isValidUrl(val)) {
            newErrors.custom![field.id] = 'Please enter a valid URL (e.g. https://github.com/...).';
            hasError = true;
          }
        }
      });
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleCustomResponseChange = (fieldId: string, val: any) => {
    setCustomResponses((prev) => ({
      ...prev,
      [fieldId]: val
    }));
    // Clear field-level error
    if (errors.custom?.[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          [fieldId]: ''
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    const valid = validateForm();
    if (!valid) return;

    try {
      setIsSubmitting(true);
      const res = await submitAtomicRegistration({
        eventId: event.id,
        registrationType,
        studentName,
        studentEmail,
        studentPhone,
        institution,
        studentId,
        teamName: registrationType === 'team' ? teamName : undefined,
        teamMembers: registrationType === 'team' ? teamMembers : undefined,
        registrationData: customResponses
      });
      // Navigate to dedicated registration detail and confirmation page
      navigate(`/dashboard/registrations/${res.registration.id}`, {
        state: { justRegistered: true }
      });
    } catch (err: any) {
      console.warn('Registration submission notice:', err?.message || err);
      setSubmissionError(err.message || 'Registration submission failed. Please review your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Registration Form View
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Event Header Banner */}
        <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242730]">
            <div>
              <div className="text-xs text-[#9da3b4] mb-1">
                {fest?.name || event.festName || 'Festival Competition'}
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {event.name}
              </h1>
            </div>

            {/* Capacity context indicator */}
            <div className="flex items-center gap-3 bg-[#191b20] px-4 py-2 rounded-xl border border-[#2e3442] self-start sm:self-center">
              <Users className="w-4 h-4 text-[#ff4f1a]" />
              <div className="text-xs">
                <span className="text-[#9da3b4] block text-[10px] uppercase font-mono">Available Capacity</span>
                <span className="text-white font-semibold">
                  {event.currentRegistrations ?? 0} / {event.capacity} Filled
                  {event.capacity && (
                    <span className="text-emerald-400 ml-1 font-mono text-[11px]">
                      ({Math.max(0, event.capacity - (event.currentRegistrations ?? 0))} remaining)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick timing and venue details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#9da3b4]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>{formatDateTime(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Reg. Deadline: {formatDateTime(event.registrationDeadline)}</span>
            </div>
          </div>

          {/* Organizer Approval Notice if required */}
          {event.requiresApproval && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                <strong>Organizer Review Required:</strong> Submissions for this event will be placed in pending review before confirmation.
              </span>
            </div>
          )}
        </div>

        {/* Registration Type Selector (if 'both' is allowed) */}
        {allowsTypeChoice && (
          <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Select Registration Type
              </label>
              <p className="text-xs text-[#9da3b4]">
                This competition accommodates both solo contestants and multi-person squads.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRegistrationType('individual')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  registrationType === 'individual'
                    ? 'bg-[#1e222b] border-[#ff4f1a] shadow-lg shadow-[#ff4f1a]/10'
                    : 'bg-[#191b20] border-[#2e3442] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-semibold text-white text-xs">Individual Participant</span>
                  <User className={`w-4 h-4 ${registrationType === 'individual' ? 'text-[#ff4f1a]' : 'text-[#656c80]'}`} />
                </div>
                <p className="text-[11px] text-[#9da3b4]">
                  Compete individually under your own student profile.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRegistrationType('team')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  registrationType === 'team'
                    ? 'bg-[#1e222b] border-[#ff4f1a] shadow-lg shadow-[#ff4f1a]/10'
                    : 'bg-[#191b20] border-[#2e3442] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-semibold text-white text-xs">Team Registration</span>
                  <Users className={`w-4 h-4 ${registrationType === 'team' ? 'text-[#ff4f1a]' : 'text-[#656c80]'}`} />
                </div>
                <p className="text-[11px] text-[#9da3b4]">
                  Register as a team squad ({minTeamSize} to {maxTeamSize} members).
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Participant Information */}
        <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
            <User className="w-5 h-5 text-[#ff4f1a]" />
            <div>
              <h3 className="font-heading text-sm font-bold text-white">
                Participant Information
              </h3>
              <p className="text-xs text-[#9da3b4]">
                Your personal registration profile snapshot for credentials and pass issuance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="student-name-input" className="text-xs font-medium text-[#d1d5db] flex items-center gap-1">
                <span>Full Name</span>
                <span className="text-[#ff4f1a] font-bold">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-name-input"
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: undefined }));
                  }}
                  className={`w-full bg-[#191b20] border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                    errors.studentName
                      ? 'border-red-500/80 focus:border-red-500'
                      : 'border-[#2e3442] focus:border-[#ff4f1a]'
                  }`}
                />
              </div>
              {errors.studentName && (
                <p className="text-[11px] text-red-400 font-medium">{errors.studentName}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="student-email-input" className="text-xs font-medium text-[#d1d5db] flex items-center gap-1">
                <span>Email Address</span>
                <span className="text-[#ff4f1a] font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-email-input"
                  type="email"
                  placeholder="student@drmc.edu.bd"
                  value={studentEmail}
                  onChange={(e) => {
                    setStudentEmail(e.target.value);
                    if (errors.studentEmail) setErrors((prev) => ({ ...prev, studentEmail: undefined }));
                  }}
                  className={`w-full bg-[#191b20] border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                    errors.studentEmail
                      ? 'border-red-500/80 focus:border-red-500'
                      : 'border-[#2e3442] focus:border-[#ff4f1a]'
                  }`}
                />
              </div>
              {errors.studentEmail && (
                <p className="text-[11px] text-red-400 font-medium">{errors.studentEmail}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="student-phone-input" className="text-xs font-medium text-[#d1d5db] flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-[#656c80]">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-phone-input"
                  type="tel"
                  placeholder="+880 1700-000000"
                  value={studentPhone}
                  onChange={(e) => {
                    setStudentPhone(e.target.value);
                    if (errors.studentPhone) setErrors((prev) => ({ ...prev, studentPhone: undefined }));
                  }}
                  className={`w-full bg-[#191b20] border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                    errors.studentPhone
                      ? 'border-red-500/80 focus:border-red-500'
                      : 'border-[#2e3442] focus:border-[#ff4f1a]'
                  }`}
                />
              </div>
              {errors.studentPhone && (
                <p className="text-[11px] text-red-400 font-medium">{errors.studentPhone}</p>
              )}
            </div>

            {/* Institution / College */}
            <div className="space-y-1.5">
              <label htmlFor="student-institution-input" className="text-xs font-medium text-[#d1d5db] flex items-center justify-between">
                <span>Institution / College</span>
                <span className="text-[10px] text-[#656c80]">(Optional)</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-institution-input"
                  type="text"
                  placeholder="e.g. Dhaka Residential Model College"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
                />
              </div>
            </div>

            {/* Student ID / Roll Number */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="student-id-input" className="text-xs font-medium text-[#d1d5db] flex items-center justify-between">
                <span>Student ID / Roll Number</span>
                <span className="text-[10px] text-[#656c80]">(Optional)</span>
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-id-input"
                  type="text"
                  placeholder="e.g. 2026-CS-892"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Team Members (if team registration) */}
        {registrationType === 'team' && (
          <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730]">
            <TeamMembersSection
              teamName={teamName}
              teamMembers={teamMembers}
              minTeamSize={minTeamSize}
              maxTeamSize={maxTeamSize}
              errors={{
                teamName: errors.teamName,
                teamSize: errors.teamSize,
                members: errors.members
              }}
              onTeamNameChange={(name) => {
                setTeamName(name);
                if (errors.teamName) setErrors((prev) => ({ ...prev, teamName: undefined }));
              }}
              onMembersChange={(members) => {
                setTeamMembers(members);
                if (errors.teamSize) setErrors((prev) => ({ ...prev, teamSize: undefined }));
              }}
            />
          </div>
        )}

        {/* Section 3: Dynamic Event-Specific Custom Questions */}
        {event.customFormFields && event.customFormFields.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
              <Sparkles className="w-5 h-5 text-[#ff4f1a]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Event Specific Questionnaire
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  Please answer these supplementary questions provided by the event organizers.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {event.customFormFields.map((field) => (
                <DynamicFormField
                  key={field.id}
                  field={field}
                  value={customResponses[field.id]}
                  error={errors.custom?.[field.id]}
                  onChange={(val) => handleCustomResponseChange(field.id, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Structured Submission Error Banner */}
        {submissionError && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/50 border border-red-900/60 text-red-200 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-red-100">Registration Submission Blocked</span>
              <p className="text-[11px] text-red-200/90 leading-relaxed">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Global form validation errors banner if any */}
        {(errors.studentName ||
          errors.studentEmail ||
          errors.teamName ||
          errors.teamSize ||
          (errors.members && Object.keys(errors.members).length > 0) ||
          (errors.custom && Object.keys(errors.custom).some((k) => !!errors.custom![k]))) && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Please correct the highlighted errors above before submitting the form.</span>
          </div>
        )}

        {/* Form Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-[#14161a] border border-[#242730]">
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel & Return
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Committing Registration...</span>
              </>
            ) : (
              <span>Confirm & Submit Registration</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
