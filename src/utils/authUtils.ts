import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { UserRoleType } from '../types';

/**
 * Authoritatively determines the post-login destination URL for an authenticated user.
 * 
 * Order of precedence:
 * 1. Admin role -> '/admin'
 * 2. Approved organizer (via userRoles, organizationMembers, or approved organization doc) -> '/organizer'
 * 3. Organizer applicant with pending organization request -> '/organizer/status'
 * 4. Regular student participant -> '/dashboard'
 */
export async function getPostAuthDestination(
  userId: string,
  hintRole?: UserRoleType
): Promise<string> {
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
