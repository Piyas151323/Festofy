import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

export interface PlatformDataCounts {
  fests: number;
  events: number;
  registrations: number;
  organizations: number;
  organizationMembers: number;
  registrationFormTemplates: number;
  notifications: number;
  nonAdminUsers: number;
  totalDocuments: number;
}

export interface ClearNonAdminUsersResult {
  deletedUsers: number;
  deletedRoles: number;
  preservedAdmins: number;
}

export interface ClearPlatformDataResult {
  deletedCounts: PlatformDataCounts;
  demotedOrganizers: number;
  deletedUsers: number;
  deletedRoles: number;
}

const TARGET_COLLECTIONS = [
  'registrations',
  'events',
  'fests',
  'notifications',
  'registrationFormTemplates',
  'organizationMembers',
  'organizations'
] as const;

const MAX_BATCH_SIZE = 400;

async function verifyAdminCaller(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required. Please sign in as a platform administrator.');
  }

  try {
    const roleSnap = await getDoc(doc(db, 'userRoles', currentUser.uid));
    if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
      throw new Error('Administrator privileges are required to perform a platform reset.');
    }
    return currentUser.uid;
  } catch (error: any) {
    if (error?.message?.includes('Administrator privileges')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, `userRoles/${currentUser.uid}`);
  }
}

async function deleteRefsInBatches(refs: DocumentReference[], collectionLabel: string): Promise<number> {
  if (refs.length === 0) return 0;

  for (let i = 0; i < refs.length; i += MAX_BATCH_SIZE) {
    const chunk = refs.slice(i, i + MAX_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionLabel);
    }
  }

  return refs.length;
}

async function deleteCollectionInBatches(collectionName: string): Promise<number> {
  let refs: DocumentReference[] = [];
  try {
    const snap = await getDocs(collection(db, collectionName));
    refs = snap.docs.map((d) => d.ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }

  return deleteRefsInBatches(refs, collectionName);
}

async function deleteFestsSafely(): Promise<number> {
  let docsSnap;
  try {
    docsSnap = await getDocs(collection(db, 'fests'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'fests');
  }

  if (docsSnap.empty) return 0;

  const docs = docsSnap.docs;
  const now = new Date().toISOString();

  // Transition any published/completed/archived fests or non-zero eventCount to draft/0
  // so deletion succeeds under both strict draft-only rules and admin-override rules.
  const needingPrep = docs.filter((d) => {
    const data = d.data();
    return data.status !== 'draft' || (typeof data.eventCount === 'number' && data.eventCount !== 0);
  });

  for (let i = 0; i < needingPrep.length; i += MAX_BATCH_SIZE) {
    const chunk = needingPrep.slice(i, i + MAX_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const d of chunk) {
      batch.update(d.ref, { status: 'draft', eventCount: 0, updatedAt: now });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'fests');
    }
  }

  return deleteRefsInBatches(
    docs.map((d) => d.ref),
    'fests'
  );
}

async function deleteEventsSafely(): Promise<number> {
  let docsSnap;
  try {
    docsSnap = await getDocs(collection(db, 'events'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
  }

  if (docsSnap.empty) return 0;

  const docs = docsSnap.docs;
  const now = new Date().toISOString();

  // Reset status to draft and currentRegistrations to 0 before deleting
  // (parent fests are deleted first so fest eventCount coupling is satisfied).
  const needingPrep = docs.filter((d) => {
    const data = d.data();
    return data.status !== 'draft' || (typeof data.currentRegistrations === 'number' && data.currentRegistrations !== 0);
  });

  for (let i = 0; i < needingPrep.length; i += MAX_BATCH_SIZE) {
    const chunk = needingPrep.slice(i, i + MAX_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const d of chunk) {
      batch.update(d.ref, { status: 'draft', currentRegistrations: 0, updatedAt: now });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  }

  return deleteRefsInBatches(
    docs.map((d) => d.ref),
    'events'
  );
}

/**
 * Deletes all non-admin user profiles (`users`) and role documents (`userRoles`)
 * while preserving every account whose `userRoles/{uid}.role === 'admin'` (plus caller).
 */
export async function clearAllNonAdminUsers(): Promise<ClearNonAdminUsersResult> {
  const callerUid = await verifyAdminCaller();

  let rolesSnap;
  try {
    rolesSnap = await getDocs(collection(db, 'userRoles'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'userRoles');
  }

  const adminUids = new Set<string>([callerUid]);
  const nonAdminRoleRefs: DocumentReference[] = [];

  for (const d of rolesSnap.docs) {
    if (d.data()?.role === 'admin') {
      adminUids.add(d.id);
    } else {
      nonAdminRoleRefs.push(d.ref);
    }
  }

  let usersSnap;
  try {
    usersSnap = await getDocs(collection(db, 'users'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }

  const nonAdminUserRefs = usersSnap.docs
    .filter((d) => !adminUids.has(d.id))
    .map((d) => d.ref);

  const deletedUsers = await deleteRefsInBatches(nonAdminUserRefs, 'users');
  const deletedRoles = await deleteRefsInBatches(nonAdminRoleRefs, 'userRoles');

  return {
    deletedUsers,
    deletedRoles,
    preservedAdmins: adminUids.size
  };
}

/**
 * Retrieve live counts of festival, event, registration, organization, user, and operational records.
 */
export async function getPlatformDataCounts(): Promise<PlatformDataCounts> {
  const callerUid = await verifyAdminCaller();

  const counts: Record<string, number> = {};
  for (const name of TARGET_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, name));
      counts[name] = snap.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, name);
    }
  }

  let nonAdminUsers = 0;
  try {
    const [rolesSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'userRoles')),
      getDocs(collection(db, 'users'))
    ]);
    const adminUids = new Set<string>([callerUid]);
    const nonAdminIds = new Set<string>();
    for (const d of rolesSnap.docs) {
      if (d.data()?.role === 'admin') {
        adminUids.add(d.id);
      } else {
        nonAdminIds.add(d.id);
      }
    }
    for (const d of usersSnap.docs) {
      if (!adminUids.has(d.id)) {
        nonAdminIds.add(d.id);
      }
    }
    nonAdminUsers = nonAdminIds.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }

  const totalDocuments =
    Object.values(counts).reduce((sum, val) => sum + val, 0) + nonAdminUsers;

  return {
    fests: counts.fests || 0,
    events: counts.events || 0,
    registrations: counts.registrations || 0,
    organizations: counts.organizations || 0,
    organizationMembers: counts.organizationMembers || 0,
    registrationFormTemplates: counts.registrationFormTemplates || 0,
    notifications: counts.notifications || 0,
    nonAdminUsers,
    totalDocuments
  };
}

/**
 * Permanently removes all fests, events, registrations, organizations, memberships,
 * form templates, and notifications from Firestore. Optionally deletes non-admin user
 * profiles/roles or resets non-admin organizer roles back to 'student'.
 * Preserves administrator accounts and eventCategories taxonomy.
 */
export async function clearAllFestData(options?: {
  includeNonAdminUsers?: boolean;
}): Promise<ClearPlatformDataResult> {
  await verifyAdminCaller();

  const deletedRegistrations = await deleteCollectionInBatches('registrations');
  const deletedNotifications = await deleteCollectionInBatches('notifications');
  const deletedTemplates = await deleteCollectionInBatches('registrationFormTemplates');
  // Delete fests before events so parent fest eventCount coupling does not block event deletion
  const deletedFests = await deleteFestsSafely();
  const deletedEvents = await deleteEventsSafely();
  const deletedMembers = await deleteCollectionInBatches('organizationMembers');
  const deletedOrganizations = await deleteCollectionInBatches('organizations');

  let demotedOrganizers = 0;
  let deletedUsers = 0;
  let deletedRoles = 0;

  if (options?.includeNonAdminUsers) {
    const userRes = await clearAllNonAdminUsers();
    deletedUsers = userRes.deletedUsers;
    deletedRoles = userRes.deletedRoles;
  } else {
    try {
      const orgRolesSnap = await getDocs(
        query(collection(db, 'userRoles'), where('role', '==', 'organizer'))
      );
      const refs = orgRolesSnap.docs.map((d) => d.ref);
      const now = new Date().toISOString();

      for (let i = 0; i < refs.length; i += MAX_BATCH_SIZE) {
        const chunk = refs.slice(i, i + MAX_BATCH_SIZE);
        const batch = writeBatch(db);
        for (const ref of chunk) {
          batch.update(ref, { role: 'student', updatedAt: now });
        }
        await batch.commit();
      }
      demotedOrganizers = refs.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'userRoles');
    }
  }

  const deletedCounts: PlatformDataCounts = {
    fests: deletedFests,
    events: deletedEvents,
    registrations: deletedRegistrations,
    organizations: deletedOrganizations,
    organizationMembers: deletedMembers,
    registrationFormTemplates: deletedTemplates,
    notifications: deletedNotifications,
    nonAdminUsers: deletedUsers,
    totalDocuments:
      deletedFests +
      deletedEvents +
      deletedRegistrations +
      deletedOrganizations +
      deletedMembers +
      deletedTemplates +
      deletedNotifications +
      deletedUsers
  };

  return {
    deletedCounts,
    demotedOrganizers,
    deletedUsers,
    deletedRoles
  };
}
