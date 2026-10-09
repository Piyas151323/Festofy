import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  School,
  GraduationCap,
  Layers,
  Sparkles,
  IdCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserProfile,
  updateUserProfile,
  calculateProfileCompletion,
  AVAILABLE_INTERESTS,
  STANDARD_PARTICIPANT_CATEGORIES
} from '../../services/userService';
import { uploadDirectImage } from '../../services/imageUploadService';
import { UserProfile } from '../../types';
import { Link } from 'react-router-dom';

export const StudentProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [participantCategory, setParticipantCategory] = useState('');
  const [studentId, setStudentId] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Profile picture upload states
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);

  useEffect(() => {
    async function load() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setDisplayName(profile.displayName || currentUser.displayName || '');
          setPhotoURL(profile.photoURL || currentUser.photoURL || '');
          setPhone(profile.phone || '');
          setInstitution(profile.institution || '');
          setClassGrade(profile.classGrade || '');
          setParticipantCategory(profile.participantCategory || '');
          setStudentId(profile.studentId || '');
          setInterests(profile.interests || []);
        } else {
          setDisplayName(currentUser.displayName || '');
          setPhotoURL(currentUser.photoURL || '');
        }
      } catch (err) {
        console.warn('Notice loading user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  // Live profile completion calculation
  const completion = calculateProfileCompletion({
    displayName,
    photoURL,
    phone,
    institution,
    classGrade,
    participantCategory,
    studentId,
    interests
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please upload a valid portrait image (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.');
      return;
    }

    try {
      setPhotoUploading(true);
      setPhotoProgress(15);
      const res = await uploadDirectImage(file, (p) => setPhotoProgress(p));
      setPhotoURL(res.url);
      setPhotoProgress(100);
    } catch (err: any) {
      console.warn('Profile image upload error:', err);
      setPhotoError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    if (!displayName.trim()) {
      setErrorMsg('Full name cannot be blank.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await updateUserProfile(currentUser.uid, {
        displayName: displayName.trim(),
        photoURL,
        phone: phone.trim(),
        institution: institution.trim(),
        classGrade: classGrade.trim(),
        participantCategory: participantCategory.trim(),
        studentId: studentId.trim(),
        interests
      });

      setSuccessMsg('Your profile has been saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Notice updating profile:', err);
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading profile information...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header and Progress Indicator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#ff4f1a] tracking-wider mb-1">
              Student Identity
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Student Profile & Preferences
            </h1>
            <p className="text-xs text-[#9da3b4] mt-1">
              Maintain your official participant credential, contact info, and competition interests.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#191b20] p-4 rounded-2xl border border-[#2e3442] shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center font-heading font-black text-sm text-white">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={completion.percentage >= 80 ? 'text-emerald-500' : 'text-[#ff4f1a]'}
                  strokeDasharray={`${completion.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute">{completion.percentage}%</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {completion.percentage === 100
                  ? 'Profile Complete'
                  : `${completion.completedCount}/${completion.totalCount} Fields Complete`}
              </div>
              <div className="text-[10px] text-[#9da3b4]">
                {completion.missingFields.length > 0
                  ? `Missing: ${completion.missingFields.slice(0, 2).join(', ')}...`
                  : 'Ready for instant contest registration'}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-[#191b20] h-2 rounded-full overflow-hidden border border-[#2e3442]">
          <div
            className={`h-full transition-all duration-500 ${
              completion.percentage >= 80 ? 'bg-emerald-500' : 'bg-[#ff4f1a]'
            }`}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
      </div>

      {/* Notifications / Flash messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Photo and Core Identity */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
            <User className="w-5 h-5 text-[#ff4f1a]" />
            <div>
              <h3 className="font-heading text-sm font-bold text-white">
                Personal Identification & Photo
              </h3>
              <p className="text-xs text-[#9da3b4]">
                Upload your picture and verify official name used on event badges.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar preview and uploader */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#191b20] border-2 border-[#2e3442] overflow-hidden flex items-center justify-center text-zinc-500 shadow-xl relative">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'Student Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-black text-[#ff4f1a]">
                    {displayName?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 text-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-[#ff4f1a] rounded-full animate-spin mb-1" />
                    <span className="text-[10px] text-white font-mono">{photoProgress}%</span>
                  </div>
                )}
              </div>

              {!photoUploading && (
                <label
                  htmlFor="profile-photo-input"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-3xl flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity cursor-pointer p-2 text-center"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span>{photoURL ? 'Replace Photo' : 'Upload Photo'}</span>
                </label>
              )}
              <input
                id="profile-photo-input"
                type="file"
                disabled={photoUploading}
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Profile Picture *
                </label>
                <p className="text-[11px] text-[#9da3b4]">
                  Upload a clear portrait photo. JPEG, PNG, or WebP under 2MB. This image will appear on your gate check-in passes and organizer participant rosters.
                </p>
                {photoError && (
                  <p className="text-xs text-red-400 font-medium">{photoError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                    <span>Full Name</span>
                    <span className="text-[#ff4f1a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                    <span>Email Address</span>
                    <span className="text-[10px] text-[#656c80]">(Account bound)</span>
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111317] border border-[#242730] text-xs text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Academic Standing */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
            <School className="w-5 h-5 text-[#ff4f1a]" />
            <div>
              <h3 className="font-heading text-sm font-bold text-white">
                Academic Details & Institution
              </h3>
              <p className="text-xs text-[#9da3b4]">
                Auto-fills registration forms so you never have to re-type them.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 17XXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Institution / College *</label>
              <div className="relative">
                <School className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Dhaka Residential Model College"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Class / Grade / Year *</label>
              <input
                type="text"
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                placeholder="e.g. Class 11, HSC 2026, 2nd Year CSE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Default Participant Category *</label>
              <select
                value={participantCategory}
                onChange={(e) => setParticipantCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
              >
                <option value="">Select your competitive tier...</option>
                {STANDARD_PARTICIPANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-300">Student ID / Roll Number</label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 2026-CSE-091"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interests & Personalized Event Recommendations */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#14161a] border border-[#242730] space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#242730]">
            <Sparkles className="w-5 h-5 text-[#ff4f1a]" />
            <div>
              <h3 className="font-heading text-sm font-bold text-white">
                Interests & Event Recommendation Preferences
              </h3>
              <p className="text-xs text-[#9da3b4]">
                Choose subjects you love. You will receive customized suggestions and alerts whenever new eligible fests and competitions open.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#ff4f1a] text-white shadow-md shadow-[#ff4f1a]/20'
                        : 'bg-[#191b20] text-zinc-300 border border-[#2e3442] hover:border-zinc-500'
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#656c80]">
              Selected {interests.length} topic{interests.length === 1 ? '' : 's'}. You will receive notifications when matching events are scheduled.
            </p>
          </div>
        </div>

        {/* Submit Controls */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-[#14161a] border border-[#242730]">
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
