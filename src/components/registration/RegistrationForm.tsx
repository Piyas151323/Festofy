import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  CreditCard,
  Tag,
  Edit3,
  ExternalLink
} from 'lucide-react';
import {
  EventItem,
  Fest,
  RegistrationType,
  TeamMember,
  EventFormField,
  PaymentMethod,
  UserProfile
} from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile } from '../../services/userService';
import { DynamicFormField } from './DynamicFormField';
import { TeamMembersSection } from './TeamMembersSection';
import { formatDateTime } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { submitAtomicRegistration } from '../../services/registrationService';
import { DemoPaymentModal } from './DemoPaymentModal';
import {
  isRedundantProfileField,
  getProfileValueForField,
  isClassGradeField,
  normalizeSelectOption
} from '../../utils/formValidationUtils';

interface RegistrationFormProps {
  event: EventItem;
  fest?: Fest | null;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ event, fest }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Full student profile state fetched from users collection (Single Source of Truth)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Determine initial registration type based on event configuration
  const defaultType: RegistrationType =
    event.registrationType === 'team' ? 'team' : 'individual';
  const allowsTypeChoice = event.registrationType === 'both';

  const [registrationType, setRegistrationType] = useState<RegistrationType>(defaultType);

  // Participant details populated from profile
  const [studentName, setStudentName] = useState(currentUser?.displayName || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentPhone, setStudentPhone] = useState(currentUser?.phone || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [classGrade, setClassGrade] = useState(currentUser?.classGrade || '');
  const [studentPhotoURL, setStudentPhotoURL] = useState(currentUser?.photoURL || '');

  // Fetch full student profile from users collection
  useEffect(() => {
    let mounted = true;
    async function loadFullProfile() {
      if (!currentUser?.uid) {
        setLoadingProfile(false);
        return;
      }
      try {
        setLoadingProfile(true);
        const userProf = await getUserProfile(currentUser.uid);
        if (mounted && userProf) {
          setProfile(userProf);
          if (userProf.displayName) setStudentName(userProf.displayName);
          if (userProf.email) setStudentEmail(userProf.email);
          if (userProf.phone) setStudentPhone(userProf.phone);
          if (userProf.institution) setInstitution(userProf.institution);
          if (userProf.studentId) setStudentId(userProf.studentId);
          if (userProf.classGrade) setClassGrade(userProf.classGrade);
          if (userProf.photoURL) setStudentPhotoURL(userProf.photoURL);
        }
      } catch (err) {
        console.warn('Notice loading user profile for registration form:', err);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }
    loadFullProfile();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // Participant Category selection
  const defaultCategory = useMemo(() => {
    if (event.participantCategories && event.participantCategories.length > 0) {
      const preferredCategory = profile?.participantCategory || currentUser?.participantCategory;
      if (preferredCategory) {
        const found = event.participantCategories.find(
          c => c.name.toLowerCase() === preferredCategory.toLowerCase()
        );
        if (found) return found.name;
      }
      return event.participantCategories[0].name;
    }
    return profile?.participantCategory || currentUser?.participantCategory || 'Open for Everyone';
  }, [event.participantCategories, profile?.participantCategory, currentUser?.participantCategory]);

  const [participantCategory, setParticipantCategory] = useState<string>(defaultCategory);

  // Fee calculation based on event and selected participant category
  const effectiveFee = useMemo(() => {
    if (event.participantCategories && event.participantCategories.length > 0) {
      const selected = event.participantCategories.find(c => c.name === participantCategory);
      if (selected && typeof selected.fee === 'number') {
        return selected.fee;
      }
    }
    if (event.isPaid && typeof event.baseFee === 'number') {
      return event.baseFee;
    }
    return 0;
  }, [event.participantCategories, event.isPaid, event.baseFee, participantCategory]);

  // Demo Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    completed: boolean;
    method?: PaymentMethod;
    transactionId?: string;
    reference?: string;
    paidAt?: string;
    amount?: number;
  }>({
    completed: effectiveFee === 0,
    method: effectiveFee === 0 ? 'free' : undefined
  });

  // Team details
  const minTeamSize = event.minTeamSize || 2;
  const maxTeamSize = event.maxTeamSize || 4;

  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      institution: currentUser?.institution || '',
      studentId: currentUser?.studentId || '',
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
    classGrade?: string;
    participantCategory?: string;
    teamName?: string;
    teamSize?: string;
    payment?: string;
    members?: Record<number, { name?: string; email?: string; phone?: string; studentId?: string }>;
    custom?: Record<string, string>;
  }>({});

  // Submission UI States
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize team leader details with student profile
  useEffect(() => {
    if (studentName || studentEmail) {
      setTeamMembers((prev) => [
        {
          ...prev[0],
          name: studentName,
          email: studentEmail,
          phone: studentPhone,
          institution: institution,
          studentId: studentId
        },
        ...prev.slice(1)
      ]);
    }
  }, [studentName, studentEmail, studentPhone, institution, studentId]);

  // Find if event has a specific class/grade questionnaire field configured
  const classField = useMemo(() => {
    return event.customFormFields?.find((f) => isClassGradeField(f));
  }, [event.customFormFields]);

  // Compute matched canonical tier option from saved student profile data
  const classFieldMatchedOption = useMemo(() => {
    if (!classField || !classField.options || classField.options.length === 0) return null;
    const currentVal = customResponses[classField.id];
    if (currentVal && classField.options.includes(String(currentVal))) {
      return String(currentVal);
    }
    if (classGrade) {
      return normalizeSelectOption(classGrade, classField.options, classField.label);
    }
    return null;
  }, [classField, customResponses, classGrade]);

  // Filter out redundant profile questions so they never appear twice to the student.
  // Note: Class/grade questions with options are NEVER redundant.
  const eventSpecificFields = useMemo(() => {
    if (!event.customFormFields || event.customFormFields.length === 0) return [];
    return event.customFormFields.filter((f) => !isRedundantProfileField(f));
  }, [event.customFormFields]);

  // Prepopulate redundant questionnaire fields from student profile behind the scenes
  // and smart-autofill event-specific fields (e.g. classGrade) when saved profile data matches
  useEffect(() => {
    if (event.customFormFields && event.customFormFields.length > 0) {
      setCustomResponses((prev) => {
        let changed = false;
        const updated = { ...prev };
        event.customFormFields?.forEach((f) => {
          if (isRedundantProfileField(f)) {
            const val = getProfileValueForField(f, {
              studentName,
              studentEmail,
              studentPhone,
              institution,
              classGrade,
              studentId
            });
            if (val && updated[f.id] !== val) {
              updated[f.id] = val;
              changed = true;
            }
          } else {
            // For visible event-specific fields, if currently empty, attempt smart autofill from profile
            if (isClassGradeField(f) && classGrade) {
              if (f.options && f.options.length > 0) {
                const matched = normalizeSelectOption(classGrade, f.options, f.label);
                if (matched && !updated[f.id]) {
                  updated[f.id] = matched;
                  changed = true;
                }
              } else if (!updated[f.id]) {
                updated[f.id] = classGrade;
                changed = true;
              }
            }
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [event.customFormFields, studentName, studentEmail, studentPhone, institution, classGrade, studentId]);

  // If fee changes to 0, reset payment requirements
  useEffect(() => {
    if (effectiveFee === 0) {
      setPaymentDetails({ completed: true, method: 'free' });
    } else if (paymentDetails.amount !== effectiveFee) {
      setPaymentDetails({ completed: false });
    }
  }, [effectiveFee]);

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

    // Dynamic questionnaire questions validation (Only truly event-specific questions)
    if (eventSpecificFields.length > 0) {
      eventSpecificFields.forEach((field) => {
        const val = customResponses[field.id];
        const hasVal = val !== undefined && val !== null && val !== '' && (typeof val !== 'string' || val.trim().length > 0);

        if (field.required) {
          if (!hasVal) {
            newErrors.custom![field.id] = `"${field.label}" is required. Please select or provide a response.`;
            hasError = true;
            return;
          }
          if (field.type === 'checkbox') {
            if (Array.isArray(val) && val.length === 0) {
              newErrors.custom![field.id] = `Please select at least one option for "${field.label}".`;
              hasError = true;
              return;
            }
            if (typeof val === 'boolean' && !val) {
              newErrors.custom![field.id] = `You must accept the requirement: "${field.label}".`;
              hasError = true;
              return;
            }
          }
        }

        // Validate select / radio options against allowed list
        if (hasVal && (field.type === 'select' || field.type === 'radio') && field.options && field.options.length > 0) {
          const rawVal = typeof val === 'string' ? val.trim() : String(val);
          if (!field.options.includes(rawVal)) {
            const matched = normalizeSelectOption(rawVal, field.options, field.label);
            if (matched) {
              // Automatically resolve to the canonical option in state
              setCustomResponses((prev) => ({ ...prev, [field.id]: matched }));
            } else {
              newErrors.custom![field.id] = `Please select a valid option for "${field.label}".`;
              hasError = true;
              return;
            }
          }
        }

        // Format checks if filled
        if (hasVal && typeof val === 'string' && val.trim()) {
          if (field.type === 'email' && !isValidEmail(val)) {
            newErrors.custom![field.id] = `Please enter a valid email address for "${field.label}".`;
            hasError = true;
          } else if (field.type === 'phone' && !isValidPhone(val)) {
            newErrors.custom![field.id] = `Please enter a valid phone number for "${field.label}".`;
            hasError = true;
          } else if (field.type === 'url' && !isValidUrl(val)) {
            newErrors.custom![field.id] = `Please enter a valid URL (e.g. https://...) for "${field.label}".`;
            hasError = true;
          }
        }
      });
    }

    // Registration Fee & Payment Validation
    if (effectiveFee > 0 && !paymentDetails.completed) {
      newErrors.payment = `Please complete the demo bKash or Nagad payment of ৳${effectiveFee} before submitting.`;
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      // Find first field with error and scroll to it smoothly
      if (newErrors.studentName || newErrors.studentEmail || newErrors.studentPhone) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (newErrors.teamName || newErrors.teamSize || (newErrors.members && Object.keys(newErrors.members).length > 0)) {
        const teamEl = document.getElementById('team-registration-section');
        teamEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.custom && Object.keys(newErrors.custom).length > 0) {
        const firstFieldId = Object.keys(newErrors.custom).find(k => !!newErrors.custom![k]);
        if (firstFieldId) {
          const el = document.getElementById(`custom-field-${firstFieldId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.focus();
        }
      } else if (newErrors.payment) {
        const payEl = document.getElementById('payment-section');
        payEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return !hasError;
  };

  const handleCustomResponseChange = (fieldId: string, val: any) => {
    setCustomResponses((prev) => ({
      ...prev,
      [fieldId]: val
    }));

    // If user selected or changed a class/grade field, keep classGrade state synchronized
    const field = event.customFormFields?.find((f) => f.id === fieldId);
    if (field && isClassGradeField(field) && typeof val === 'string' && val.trim()) {
      setClassGrade(val.trim());
    }

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

      // Ensure classGrade passed in registration snapshot aligns with any custom question answer
      let resolvedClassGrade = classGrade;
      if (classField) {
        const customAnswer = customResponses[classField.id];
        if (customAnswer && typeof customAnswer === 'string' && customAnswer.trim()) {
          resolvedClassGrade = customAnswer.trim();
        } else if (classField.options && classField.options.length > 0) {
          const matched = normalizeSelectOption(classGrade, classField.options, classField.label);
          if (matched) {
            resolvedClassGrade = matched;
          } else if (!classField.required) {
            // If field is optional and profile does not match, omit invalid arbitrary string
            resolvedClassGrade = '';
          }
        }
      }

      const res = await submitAtomicRegistration({
        eventId: event.id,
        registrationType,
        studentName,
        studentEmail,
        studentPhone,
        institution,
        studentId,
        studentPhotoURL: studentPhotoURL || currentUser?.photoURL || '',
        classGrade: resolvedClassGrade,
        participantCategory,
        appliedFee: effectiveFee,
        currency: 'BDT',
        paymentStatus: effectiveFee > 0 ? 'completed' : 'not_required',
        paymentMethod: paymentDetails.method || (effectiveFee > 0 ? 'bkash' : 'free'),
        paymentTransactionId: paymentDetails.transactionId || '',
        paymentReference: paymentDetails.reference || '',
        paidAt: paymentDetails.paidAt || '',
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
      const msg = err.message || 'Registration submission failed. Please review your details.';
      setSubmissionError(msg);

      // If error indicates an invalid option for a custom field, highlight that specific field inline!
      if (event.customFormFields) {
        for (const f of event.customFormFields) {
          const isTargetField =
            msg.toLowerCase().includes(f.label.toLowerCase()) ||
            msg.toLowerCase().includes(f.id.toLowerCase()) ||
            (isClassGradeField(f) && (
              msg.toLowerCase().includes('class') ||
              msg.toLowerCase().includes('grade') ||
              msg.toLowerCase().includes('academic year') ||
              msg.toLowerCase().includes('academic standing')
            ));

          if (isTargetField) {
            setErrors((prev) => ({
              ...prev,
              custom: {
                ...prev.custom,
                [f.id]: msg
              }
            }));
            const el = document.getElementById(`custom-field-${f.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.focus();
            break;
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identify any missing essential profile fields
  const missingRequiredFields: string[] = [];
  if (!studentName.trim()) missingRequiredFields.push('Full Name');
  if (!studentEmail.trim()) missingRequiredFields.push('Email Address');
  if (classField?.required && !customResponses[classField.id] && !classFieldMatchedOption) {
    missingRequiredFields.push(classField.label || 'Class / Grade / Academic Year');
  }

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

        {/* Section 1: Participant Information (Single Source of Truth from Student Profile) */}
        <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242730]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                  <span>Participant Information</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Profile Connected
                  </span>
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  Reusing saved student profile data. Only event-specific questions are required below.
                </p>
              </div>
            </div>

            {/* Clear Edit Profile link returning to registration */}
            <Link
              to={`/dashboard/profile?returnUrl=/events/${event.id}/register`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] hover:border-zinc-500 text-xs font-semibold text-[#ff4f1a] transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
              title="Edit your official student profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>

          {/* Compact Read-Only Participant Summary */}
          <div className="p-5 rounded-2xl bg-[#191b20] border border-[#2e3442] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-[#242730] border border-[#383d4c] text-[#ff4f1a] font-bold flex items-center justify-center text-lg shrink-0 overflow-hidden">
                {studentPhotoURL ? (
                  <img
                    src={studentPhotoURL}
                    alt={studentName || 'Student'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(studentName || 'S')[0]?.toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-base font-bold text-white truncate">
                    {studentName || 'Student Participant'}
                  </span>
                  {studentId && (
                    <span className="px-2 py-0.5 rounded-md bg-[#242730] text-[#9da3b4] text-[10px] font-mono border border-[#2e3442]">
                      ID: {studentId}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#9da3b4] flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-white/90">
                    <Mail className="w-3.5 h-3.5 text-[#656c80]" />
                    {studentEmail || 'No email associated'}
                  </span>
                  {studentPhone && (
                    <span className="flex items-center gap-1 text-[#9da3b4]">
                      <Phone className="w-3.5 h-3.5 text-[#656c80]" />
                      {studentPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#242730] text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#656c80] block mb-0.5">Institution / College</span>
                <span className="font-medium text-white flex items-center gap-1.5 truncate">
                  <School className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                  <span className="truncate">{institution || <span className="text-zinc-500 italic">Not specified in profile</span>}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#656c80] block mb-0.5">Class / Academic Year</span>
                <span className="font-medium text-white flex items-center gap-1.5 truncate">
                  <IdCard className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                  <span className="truncate">
                    {classField && customResponses[classField.id] ? (
                      String(customResponses[classField.id])
                    ) : classFieldMatchedOption ? (
                      classFieldMatchedOption
                    ) : classGrade ? (
                      classGrade
                    ) : (
                      <span className="text-zinc-500 italic">Not specified in profile</span>
                    )}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#656c80] block mb-0.5">Profile Status</span>
                {classField?.required && !customResponses[classField.id] && !classFieldMatchedOption ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Select Tier Below</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active & Synced</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Missing Required Profile Information Notice & Fallback */}
          {missingRequiredFields.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-100 block">
                    Missing or Actionable Profile Information for Registration
                  </span>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    This competition requires: {missingRequiredFields.join(', ')}. Please update your details below to continue.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to={`/dashboard/profile?returnUrl=/events/${event.id}/register`}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
                >
                  Edit in Student Profile →
                </Link>
              </div>

              {/* Inline inputs for missing required fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-amber-500/20">
                {!studentName.trim() && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-amber-100">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: undefined }));
                      }}
                      className="w-full bg-[#14161a] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                    {errors.studentName && <p className="text-[10px] text-red-400">{errors.studentName}</p>}
                  </div>
                )}
                {!studentEmail.trim() && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-amber-100">Email Address *</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value);
                        if (errors.studentEmail) setErrors((prev) => ({ ...prev, studentEmail: undefined }));
                      }}
                      className="w-full bg-[#14161a] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                    {errors.studentEmail && <p className="text-[10px] text-red-400">{errors.studentEmail}</p>}
                  </div>
                )}
                {classField?.required && !customResponses[classField.id] && !classFieldMatchedOption && classField.options && (
                  <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[11px] font-medium text-amber-100">{classField.label} *</label>
                    <select
                      value={customResponses[classField.id] || ''}
                      onChange={(e) => handleCustomResponseChange(classField.id, e.target.value)}
                      className="w-full bg-[#14161a] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">{classField.placeholder || '-- Select Academic Standing --'}</option>
                      {classField.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#191b20] text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.custom?.[classField.id] && (
                      <p className="text-[10px] text-red-400">{errors.custom[classField.id]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 1.5: Participant Category & Fee Bracket */}
        {event.participantCategories && event.participantCategories.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
              <Tag className="w-5 h-5 text-[#ff4f1a]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Participant Category
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  Select the eligible category you belong to. Different categories may have specific fees or division tracks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {event.participantCategories.map((cat) => {
                const isSelected = participantCategory === cat.name;
                const catFee = typeof cat.fee === 'number' ? cat.fee : (event.baseFee || 0);

                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setParticipantCategory(cat.name)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-[#1e222b] border-[#ff4f1a] text-white shadow-lg shadow-[#ff4f1a]/10'
                        : 'bg-[#191b20] border-[#2e3442] text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{cat.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ff4f1a]" />}
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-[#9da3b4] line-clamp-2">{cat.description}</p>
                    )}
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-white/5">
                      <span className="text-[#656c80]">Fee:</span>
                      <span className={catFee > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-400 font-semibold'}>
                        {catFee > 0 ? `৳${catFee}` : 'Free (৳0)'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {/* Section 3: Dynamic Event-Specific Custom Questions (Excluding redundant profile fields) */}
        {eventSpecificFields.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
              <Sparkles className="w-5 h-5 text-[#ff4f1a]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Event Specific Questionnaire
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  Please answer these supplementary questions required specifically for this event.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {eventSpecificFields.map((field) => (
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

        {/* Section 4: Registration Fee & Payment Simulator */}
        <div className="p-6 rounded-3xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#242730]">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#ff4f1a]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Payable Amount & Registration Fee
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  {effectiveFee === 0 ? 'This competition is free of charge.' : 'Sandbox payment simulator for bKash and Nagad.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#656c80] uppercase font-mono block">Payable Amount</span>
              <span className={`text-base font-bold font-mono ${effectiveFee === 0 ? 'text-zinc-300' : 'text-emerald-400'}`}>
                {effectiveFee === 0 ? 'Free (৳0)' : `৳${effectiveFee} BDT`}
              </span>
            </div>
          </div>

          {effectiveFee > 0 && (
            <div className="p-4 rounded-2xl bg-[#191b20] border border-[#2e3442] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {paymentDetails.completed ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400">
                      Demo {paymentDetails.method === 'bkash' ? 'bKash' : paymentDetails.method === 'nagad' ? 'Nagad' : ''} Payment Completed
                    </div>
                    <div className="text-[11px] text-[#9da3b4] font-mono">
                      TrxID: {paymentDetails.transactionId} • Ref: {paymentDetails.reference || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Payment Required</div>
                    <div className="text-[11px] text-[#9da3b4]">
                      Simulate fee payment of ৳{effectiveFee} via bKash or Nagad sandbox.
                    </div>
                  </div>
                </div>
              )}

              {effectiveFee > 0 && !paymentDetails.completed && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-bold transition-all shadow-md shadow-[#ff4f1a]/20 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Pay ৳{effectiveFee} (Demo Gateway)
                </button>
              )}
            </div>
          )}

          {errors.payment && (
            <p className="text-[11px] text-red-400 font-medium">{errors.payment}</p>
          )}
        </div>

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
          errors.payment ||
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

      {/* Demo Payment Modal */}
      <DemoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={effectiveFee}
        eventName={event.name}
        categoryName={participantCategory}
        onPaymentSuccess={(details) => {
          setPaymentDetails({
            completed: true,
            method: details.method,
            transactionId: details.transactionId,
            reference: details.reference,
            paidAt: details.paidAt,
            amount: details.amount
          });
          setIsPaymentModalOpen(false);
          if (errors.payment) {
            setErrors((prev) => ({ ...prev, payment: undefined }));
          }
        }}
      />
    </div>
  );
};
