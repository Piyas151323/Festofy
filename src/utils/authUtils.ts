import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';
import { UserRoleType } from '../types';

/**
 * Validates that an internal redirect path is safe and prevents open redirects or auth loops.
 */
export function sanitizeInternalRedirect(
  rawRedirect: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!rawRedirect) return fallback;
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (
    trimmed === '/auth' ||
    trimmed.startsWith('/auth?') ||
    trimmed === '/organizer/login' ||
    trimmed.startsWith('/organizer/login?') ||
    trimmed === '/admin/login' ||
    trimmed.startsWith('/admin/login?')
  ) {
    return fallback;
  }
  return trimmed;
}

/**
 * Authoritatively determines the post-login destination URL for an authenticated, email-verified user.
 *
 * Order of precedence:
 * 1. Unverified user -> '/auth'
 * 2. Admin role -> '/admin'
 * 3. Approved organizer (via userRoles, organizationMembers, or approved organization doc) -> '/organizer'
 * 4. Organizer applicant with pending organization request -> '/organizer/status'
 * 5. Regular student participant -> '/dashboard'
 */
export async function getPostAuthDestination(
  userId: string,
  hintRole?: UserRoleType
): Promise<string> {
  if (auth.currentUser && auth.currentUser.uid === userId && !auth.currentUser.emailVerified) {
    return '/auth';
  }

  try {
    // 1. Direct admin check
    if (hintRole === 'admin') return '/admin';
    const roleRef = doc(db, 'userRoles', userId);
    const roleSnap = await getDoc(roleRef).catch(() => null);

    if (roleSnap && roleSnap.exists()) {
      const r = roleSnap.data()?.role;
      if (r === 'admin') return '/admin';
      if (r === 'organizer') return '/organizer';
    }

    // 2. Check organization membership
    const memberQuery = query(
      collection(db, 'organizationMembers'),
      where('userId', '==', userId)
    );
    const memberSnap = await getDocs(memberQuery).catch(() => null);
    if (memberSnap && !memberSnap.empty) {
      return '/organizer';
    }

    // 3. Check organization applications submitted by this user
    const orgQuery = query(
      collection(db, 'organizations'),
      where('requestedBy', '==', userId)
    );
    const orgSnap = await getDocs(orgQuery).catch(() => null);
    if (orgSnap && !orgSnap.empty) {
      const anyApproved = orgSnap.docs.some((d) => d.data().status === 'approved');
      if (anyApproved) return '/organizer';

      const anyPending = orgSnap.docs.some((d) => d.data().status === 'pending');
      if (anyPending) return '/organizer/status';
    }

    // 4. Default for normal students
    return '/dashboard';
  } catch (err) {
    console.warn('Notice resolving post-auth destination:', err);
    return hintRole === 'organizer' ? '/organizer' : '/dashboard';
  }
}
