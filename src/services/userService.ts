import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

export const AVAILABLE_INTERESTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Programming',
  'Robotics',
  'Debate',
  'Quiz',
  'Art',
  'Business',
  'Science Fair',
  'Astronomy',
  'Literature',
  'Gaming / Esports',
  'Photography'
];

export const STANDARD_PARTICIPANT_CATEGORIES = [
  'Junior',
  'Secondary',
  'Higher Secondary',
  'College',
  'University',
  'Open for Everyone'
];

export function calculateProfileCompletion(profile: Partial<UserProfile> | null | undefined): {
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
} {
  if (!profile) {
    return { percentage: 0, completedCount: 0, totalCount: 8, missingFields: ['Name', 'Photo', 'Phone', 'Institution', 'Class/Grade', 'Category', 'Student ID', 'Interests'] };
  }

  const checks: { label: string; ok: boolean }[] = [
    { label: 'Full Name', ok: Boolean(profile.displayName && profile.displayName.trim().length >= 2) },
    { label: 'Profile Picture', ok: Boolean(profile.photoURL && profile.photoURL.trim().length > 0) },
    { label: 'Phone Number', ok: Boolean(profile.phone && profile.phone.trim().length >= 7) },
    { label: 'Institution / College', ok: Boolean(profile.institution && profile.institution.trim().length >= 2) },
    { label: 'Class / Grade', ok: Boolean(profile.classGrade && profile.classGrade.trim().length > 0) },
    { label: 'Participant Category', ok: Boolean(profile.participantCategory && profile.participantCategory.trim().length > 0) },
    { label: 'Student ID / Roll', ok: Boolean(profile.studentId && profile.studentId.trim().length > 0) },
    { label: 'Interests & Skills', ok: Boolean(profile.interests && profile.interests.length > 0) }
  ];

  const completed = checks.filter(c => c.ok).length;
  const missing = checks.filter(c => !c.ok).map(c => c.label);
  const percentage = Math.round((completed / checks.length) * 100);

  return {
    percentage,
    completedCount: completed,
    totalCount: checks.length,
    missingFields: missing
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return null;
    return {
      uid: userSnap.id,
      ...userSnap.data()
    } as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>
): Promise<UserProfile> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('You are not authorized to update this profile.');
  }

  const now = new Date().toISOString();
  const cleaned: Record<string, any> = {
    updatedAt: now
  };

  if (updates.displayName !== undefined) cleaned.displayName = updates.displayName.trim().slice(0, 100);
  if (updates.photoURL !== undefined) cleaned.photoURL = updates.photoURL.trim();
  if (updates.phone !== undefined) cleaned.phone = updates.phone.trim().slice(0, 30);
  if (updates.institution !== undefined) cleaned.institution = updates.institution.trim().slice(0, 150);
  if (updates.classGrade !== undefined) cleaned.classGrade = updates.classGrade.trim().slice(0, 80);
  if (updates.participantCategory !== undefined) cleaned.participantCategory = updates.participantCategory.trim().slice(0, 80);
  if (updates.studentId !== undefined) cleaned.studentId = updates.studentId.trim().slice(0, 50);
  if (updates.interests !== undefined) cleaned.interests = updates.interests.slice(0, 20);

  const completion = calculateProfileCompletion({ ...updates });
  cleaned.isProfileComplete = completion.percentage >= 80;

  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, cleaned);

    const existing = await getUserProfile(uid);
    return {
      ...existing,
      ...cleaned,
      uid
    } as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    throw err;
  }
}
