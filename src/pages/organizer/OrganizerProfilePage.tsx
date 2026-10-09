import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Building2,
  Mail,
  Phone,
  School,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  ExternalLink,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizer } from '../../context/OrganizerContext';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { updateOrganization } from '../../services/organizationService';
import { uploadDirectImage } from '../../services/imageUploadService';
import { validatePhoneNumber } from '../../utils/phoneUtils';
import { UserProfile, Organization } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';

export const OrganizerProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeOrganization, setActiveOrganization, refetchOrganizations } = useOrganizer();

  const [loading, setLoading] = useState(true);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);

  const [personalSuccess, setPersonalSuccess] = useState<string | null>(null);
  const [personalError, setPersonalError] = useState<string | null>(null);

  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Personal profile fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [institution, setInstitution] = useState('');
  const [personalPhotoUploading, setPersonalPhotoUploading] = useState(false);
  const [personalPhotoProgress, setPersonalPhotoProgress] = useState(0);

  // Organization fields
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgInstitution, setOrgInstitution] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgLogoUploading, setOrgLogoUploading] = useState(false);
  const [orgLogoProgress, setOrgLogoProgress] = useState(0);

  useEffect(() => {
    async function load() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setDisplayName(profile.displayName || currentUser.displayName || '');
          setPhone(profile.phone || '');
          setPhotoURL(profile.photoURL || currentUser.photoURL || '');
          setInstitution(profile.institution || '');
        } else {
          setDisplayName(currentUser.displayName || '');
          setPhotoURL(currentUser.photoURL || '');
        }

        if (activeOrganization) {
          setOrgName(activeOrganization.name || '');
          setOrgDescription(activeOrganization.description || '');
          setOrgInstitution(activeOrganization.institution || '');
          setOrgLogoUrl(activeOrganization.logoUrl || '');
        }
      } catch (err: any) {
        console.warn('Notice loading organizer profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, activeOrganization]);

  // Upload personal avatar
  const handlePersonalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPersonalError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPersonalError('Image file size must be less than 2MB.');
      return;
    }

    try {
      setPersonalPhotoUploading(true);
      setPersonalPhotoProgress(15);
      const res = await uploadDirectImage(file, (progress) => {
        setPersonalPhotoProgress(progress);
      });
      setPhotoURL(res.url);
    } catch (err: any) {
      setPersonalError(err.message || 'Failed to upload photo.');
    } finally {
      setPersonalPhotoUploading(false);
      setPersonalPhotoProgress(0);
    }
  };

  // Upload organization logo
  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setOrgError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setOrgError('Logo image file size must be less than 2MB.');
      return;
    }

    try {
      setOrgLogoUploading(true);
      setOrgLogoProgress(15);
      const res = await uploadDirectImage(file, (progress) => {
        setOrgLogoProgress(progress);
      });
      setOrgLogoUrl(res.url);
    } catch (err: any) {
      setOrgError(err.message || 'Failed to upload organization logo.');
    } finally {
      setOrgLogoUploading(false);
      setOrgLogoProgress(0);
    }
  };

  // Save personal profile
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setPersonalError(null);
    setPersonalSuccess(null);

    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setPersonalError('Full name must be at least 2 characters.');
      return;
    }

    if (phone.trim()) {
      const phoneCheck = validatePhoneNumber(phone.trim());
      if (!phoneCheck.isValid) {
        setPersonalError(phoneCheck.error || 'Please enter a valid phone number.');
        return;
      }
    }

    try {
      setPersonalSaving(true);
      await updateUserProfile(currentUser.uid, {
        displayName: cleanName,
        phone: phone.trim(),
        institution: institution.trim(),
        photoURL: photoURL.trim()
      });
      setPersonalSuccess('Personal profile successfully updated!');
      setTimeout(() => setPersonalSuccess(null), 4000);
    } catch (err: any) {
      setPersonalError(err.message || 'Failed to save personal profile.');
    } finally {
      setPersonalSaving(false);
    }
  };

  // Save organization profile
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) {
      setOrgError('No active organization selected.');
      return;
    }

    setOrgError(null);
    setOrgSuccess(null);

    const cleanName = orgName.trim();
    if (cleanName.length < 2 || cleanName.length > 120) {
      setOrgError('Organization name must be between 2 and 120 characters.');
      return;
    }

    try {
      setOrgSaving(true);
      const updated = await updateOrganization(activeOrganization.id, {
        name: cleanName,
        description: orgDescription.trim(),
        institution: orgInstitution.trim(),
        logoUrl: orgLogoUrl.trim()
      });
      setActiveOrganization(updated);
      await refetchOrganizations();
      setOrgSuccess('Organization details successfully updated!');
      setTimeout(() => setOrgSuccess(null), 4000);
    } catch (err: any) {
      setOrgError(err.message || 'Failed to update organization information.');
    } finally {
      setOrgSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
        <p className="text-xs text-[#9da3b4] font-mono">Loading organizer profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Organizer & Workspace Settings"
        documentTitle="Organizer Profile"
        description="Manage your personal organizer profile and official club workspace details."
        backTo="/organizer"
        backLabel="Back to Organizer Console"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* SECTION 1: Personal Organizer Profile */}
        <section
          aria-labelledby="personal-profile-heading"
          className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-[#242730]">
            <div className="w-10 h-10 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] border border-[#ff4f1a]/30 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="personal-profile-heading" className="font-heading text-base font-bold text-white">
                Personal Organizer Profile
              </h2>
              <p className="text-[11px] text-[#9da3b4]">
                Your personal account details, avatar, and contact information.
              </p>
            </div>
          </div>

          {personalSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{personalSuccess}</span>
            </div>
          )}

          {personalError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{personalError}</span>
            </div>
          )}

          <form onSubmit={handleSavePersonal} className="space-y-4">
            {/* Avatar & Photo Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl bg-[#191b20] border border-[#2e3442] overflow-hidden flex items-center justify-center shrink-0">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading font-black text-xl text-[#656c80]">
                      {displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                  {personalPhotoUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Change Avatar</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePersonalPhotoUpload}
                      disabled={personalPhotoUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-[#656c80]">JPEG, PNG, or WebP up to 2MB.</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Full Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            {/* Email (Read-only / Protected) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#9da3b4]">Email Address</label>
                <span className="text-[10px] font-mono text-[#656c80] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Protected (Read-Only)
                </span>
              </div>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101114] border border-[#242730] text-xs text-zinc-400 cursor-not-allowed font-mono"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1712-345678"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
              <p className="text-[10px] text-[#656c80]">Used for critical organizers communication.</p>
            </div>

            {/* Institution / College */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Institution / Affiliation</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Dhaka University"
                maxLength={150}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={personalSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{personalSaving ? 'Saving Changes...' : 'Save Personal Profile'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: Organization / Workspace Profile */}
        <section
          aria-labelledby="org-profile-heading"
          className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-[#242730]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="org-profile-heading" className="font-heading text-base font-bold text-white">
                Organization Information
              </h2>
              <p className="text-[11px] text-[#9da3b4]">
                Public club branding, institution affiliation, and description.
              </p>
            </div>
          </div>

          {!activeOrganization ? (
            <div className="p-6 rounded-2xl bg-[#191b20] border border-[#2e3442] text-center space-y-2">
              <Building2 className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-xs font-bold text-white">No Active Workspace</h3>
              <p className="text-[11px] text-[#9da3b4]">
                You are not currently managing an authorized organization.
              </p>
            </div>
          ) : (
            <>
              {orgSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{orgSuccess}</span>
                </div>
              )}

              {orgError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{orgError}</span>
                </div>
              )}

              <form onSubmit={handleSaveOrg} className="space-y-4">
                {/* Logo & Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white">Organization Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl bg-[#191b20] border border-[#2e3442] overflow-hidden flex items-center justify-center shrink-0">
                      {orgLogoUrl ? (
                        <img src={orgLogoUrl} alt={orgName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading font-black text-xl text-purple-400">
                          {orgName?.[0]?.toUpperCase() || 'O'}
                        </span>
                      )}
                      {orgLogoUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleOrgLogoUpload}
                          disabled={orgLogoUploading}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-[#656c80]">Square logo image recommended (max 2MB).</p>
                    </div>
                  </div>
                </div>

                {/* Organization Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white">Organization Name *</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="e.g. BUET Robotic Society"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Institution */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white">Host Institution</label>
                  <input
                    type="text"
                    value={orgInstitution}
                    onChange={(e) => setOrgInstitution(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Bangladesh University of Engineering and Technology"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white">Organization Description</label>
                  <textarea
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Brief overview of your club's mission, activities, and background..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <div className="text-right text-[10px] text-[#656c80]">
                    {orgDescription.length} / 2000 characters
                  </div>
                </div>

                {/* Read-Only Status & Ownership Badges */}
                <div className="p-3.5 rounded-xl bg-[#101114] border border-[#242730] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#656c80] font-mono text-[11px]">Approval Status</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeOrganization.status || 'approved'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#656c80] font-mono text-[11px]">Organization ID</span>
                    <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[200px]">
                      {activeOrganization.id}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={orgSaving}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{orgSaving ? 'Updating Organization...' : 'Save Organization Details'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
