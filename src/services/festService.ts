import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { Fest, CreateFestInput, UpdateFestInput, FestStatus } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';
import { sanitizeForFirestore } from '../utils/firestoreUtils';

const COLLECTION_NAME = 'fests';

/**
 * Fetch publicly published or completed festivals.
 * Strictly constrained by `where('status', 'in', ['published', 'completed'])`
 * to align with Firestore Security Rules.
 */
export async function getPublishedFests(): Promise<Fest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', 'in', ['published', 'completed'])
    );
    const snapshot = await getDocs(q);
    const fests = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Fest));

    return fests.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

/**
 * Retrieve single festival by ID.
 */
export async function getFestById(id: string): Promise<Fest | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    } as Fest;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
    return null;
  }
}

/**
 * Scoped organizer query: Fetch fests strictly belonging to an organization.
 */
export async function getOrganizationFests(organizationId: string): Promise<Fest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    const snapshot = await getDocs(q);
    const fests = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Fest));

    // Sort newest updated or upcoming start date
    return fests.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?organizationId=${organizationId}`);
    return [];
  }
}

/**
 * Safe count of events belonging to a festival.
 */
export async function getFestEventCount(festId: string, organizationId?: string): Promise<number> {
  try {
    let targetOrgId = organizationId;
    if (!targetOrgId) {
      try {
        const festDoc = await getDoc(doc(db, COLLECTION_NAME, festId));
        if (festDoc.exists()) {
          targetOrgId = festDoc.data()?.organizationId;
        }
      } catch {
        // Fallback
      }
    }

    let q;
    if (targetOrgId) {
      q = query(
        collection(db, 'events'),
        where('festId', '==', festId),
        where('organizationId', '==', targetOrgId)
      );
    } else {
      q = query(
        collection(db, 'events'),
        where('festId', '==', festId)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.length;
  } catch {
    return 0;
  }
}

/**
 * Create a new festival in initial "draft" status.
 * Strictly bound to the authorized organizer's active organizationId.
 */
export async function createFest(input: CreateFestInput, organizationId: string): Promise<Fest> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to create a festival.');
  }

  if (!organizationId || !organizationId.trim()) {
    throw new Error('An active organization must be selected to create a festival.');
  }

  const trimmedName = input.name?.trim() || '';
  if (trimmedName.length < 3) {
    throw new Error('Festival name must be at least 3 characters.');
  }
  if (trimmedName.length > 150) {
    throw new Error('Festival name must not exceed 150 characters.');
  }

  const trimmedDesc = input.description?.trim() || '';
  if (trimmedDesc.length < 3) {
    throw new Error('Festival description must be at least 3 characters.');
  }
  if (trimmedDesc.length > 3000) {
    throw new Error('Festival description must not exceed 3000 characters.');
  }

  if (!input.startDate || !input.endDate) {
    throw new Error('Both start date and end date are required.');
  }

  const startTime = new Date(input.startDate).getTime();
  const endTime = new Date(input.endDate).getTime();
  if (isNaN(startTime) || isNaN(endTime)) {
    throw new Error('Invalid start or end date format.');
  }
  if (startTime > endTime) {
    throw new Error('Festival start date cannot be after end date.');
  }

  let validBanner: string | undefined = undefined;
  if (input.bannerUrl && input.bannerUrl.trim()) {
    const rawBanner = input.bannerUrl.trim();
    if (!rawBanner.startsWith('http://') && !rawBanner.startsWith('https://')) {
      throw new Error('Banner URL must begin with http:// or https://');
    }
    if (rawBanner.length > 500) {
      throw new Error('Banner URL must not exceed 500 characters.');
    }
    validBanner = rawBanner;
  }

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'fest';
  const docId = `fest_${slug}_${Date.now()}`;
  const now = new Date().toISOString();

  const payload: Fest = {
    id: docId,
    organizationId: organizationId.trim(),
    name: trimmedName,
    description: trimmedDesc,
    startDate: new Date(startTime).toISOString(),
    endDate: new Date(endTime).toISOString(),
    status: 'draft',
    eventCount: 0,
    visitorAccess: input.visitorAccess || 'allowed',
    ...(input.participantCategories ? { participantCategories: input.participantCategories } : {}),
    ...(validBanner ? { bannerUrl: validBanner } : {}),
    ...(input.organizationName ? { organizationName: input.organizationName.trim() } : {}),
    ...(input.organizationLogo ? { organizationLogo: input.organizationLogo.trim() } : {}),
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, sanitizeForFirestore(payload));
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${docId}`);
    throw error;
  }
}

/**
 * Edit festival metadata (permitted in draft or published states).
 * Preserves immutable organizationId, createdAt, and id.
 */
export async function updateFest(festId: string, input: UpdateFestInput): Promise<Fest> {
  const existing = await getFestById(festId);
  if (!existing) {
    throw new Error('Festival not found.');
  }

  if (existing.status !== 'draft' && existing.status !== 'published') {
    throw new Error(`Cannot edit festival with status "${existing.status}". Only draft or published festivals can be modified.`);
  }

  const updates: Partial<Fest> = {
    updatedAt: new Date().toISOString()
  };

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 3 || trimmed.length > 150) {
      throw new Error('Festival name must be between 3 and 150 characters.');
    }
    updates.name = trimmed;
  }

  if (input.description !== undefined) {
    const trimmed = input.description.trim();
    if (trimmed.length < 3 || trimmed.length > 3000) {
      throw new Error('Festival description must be between 3 and 3000 characters.');
    }
    updates.description = trimmed;
  }

  const newStartDate = input.startDate !== undefined ? input.startDate : existing.startDate;
  const newEndDate = input.endDate !== undefined ? input.endDate : existing.endDate;

  if (input.startDate !== undefined || input.endDate !== undefined) {
    const startT = new Date(newStartDate).getTime();
    const endT = new Date(newEndDate).getTime();
    if (isNaN(startT) || isNaN(endT)) {
      throw new Error('Invalid start or end date format.');
    }
    if (startT > endT) {
      throw new Error('Start date cannot be after end date.');
    }
    updates.startDate = new Date(startT).toISOString();
    updates.endDate = new Date(endT).toISOString();
  }

  if (input.bannerUrl !== undefined) {
    const trimmedBanner = input.bannerUrl.trim();
    if (trimmedBanner) {
      if (!trimmedBanner.startsWith('http://') && !trimmedBanner.startsWith('https://')) {
        throw new Error('Banner URL must begin with http:// or https://');
      }
      if (trimmedBanner.length > 500) {
        throw new Error('Banner URL must not exceed 500 characters.');
      }
      updates.bannerUrl = trimmedBanner;
    } else {
      updates.bannerUrl = '';
    }
  }

  if (input.organizationName !== undefined) {
    updates.organizationName = input.organizationName.trim();
  }
  if (input.organizationLogo !== undefined) {
    updates.organizationLogo = input.organizationLogo.trim();
  }
  if (input.visitorAccess !== undefined) {
    updates.visitorAccess = input.visitorAccess;
  }
  if (input.participantCategories !== undefined) {
    updates.participantCategories = input.participantCategories;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, festId);
    const sanitizedUpdates = sanitizeForFirestore(updates);
    await updateDoc(docRef, sanitizedUpdates);
    return {
      ...existing,
      ...sanitizedUpdates
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${festId}`);
    throw error;
  }
}

/**
 * Execute festival lifecycle state transitions strictly through a Firestore Transaction.
 * 
 * Invariants enforced by the transaction:
 * 1. Reads the current fest document inside the transaction.
 * 2. Verifies current status matches exactly the expected previous status.
 * 3. Verifies the authenticated user is authorized for that organization (admin or member).
 * 4. Applies only the single intended next status.
 * 5. Updates updatedAt using timestamp.
 * 6. Aborts if the status or documents changed between read and write (optimistic concurrency).
 * Never executes blind updateDoc() mutations.
 */
export async function executeFestLifecycleTransition(
  festId: string,
  expectedPreviousStatus: FestStatus | FestStatus[],
  nextStatus: FestStatus
): Promise<Fest> {
  const festRef = doc(db, COLLECTION_NAME, festId);

  try {
    const updatedFest = await runTransaction(db, async (transaction) => {
      // 1. Read current fest document inside transaction
      const festDoc = await transaction.get(festRef);
      if (!festDoc.exists()) {
        throw new Error('Festival not found.');
      }
      const festData = { id: festDoc.id, ...festDoc.data() } as Fest;

      // 2. Verify current status is exactly the expected previous status
      const validPrevious = Array.isArray(expectedPreviousStatus)
        ? expectedPreviousStatus
        : [expectedPreviousStatus];

      if (!validPrevious.includes(festData.status)) {
        throw new Error(
          `Invalid lifecycle transition. Festival current status is "${festData.status}", but expected "${validPrevious.join(' or ')}".`
        );
      }

      // 3. Verify the authenticated user is authorized for that organization
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be signed in to perform festival lifecycle actions.');
      }

      // Check admin status
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${festData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not an authorized member of the festival host organization.');
        }
      }

      // If transition is to published, enforce complete validation
      if (nextStatus === 'published') {
        const trimmedName = festData.name?.trim() || '';
        const trimmedDesc = festData.description?.trim() || '';
        if (trimmedName.length < 3 || trimmedName.length > 150) {
          throw new Error('Festival name must be between 3 and 150 characters to publish.');
        }
        if (trimmedDesc.length < 3 || trimmedDesc.length > 3000) {
          throw new Error('Festival description must be between 3 and 3000 characters to publish.');
        }
        if (!festData.startDate || !festData.endDate) {
          throw new Error('Festival must have valid start and end dates to publish.');
        }
        if (new Date(festData.startDate).getTime() > new Date(festData.endDate).getTime()) {
          throw new Error('Start date cannot be after end date.');
        }
      }

      const now = new Date().toISOString();

      // 4. Apply only the single intended next status
      // 5. Update updatedAt using timestamp
      transaction.update(festRef, {
        status: nextStatus,
        updatedAt: now
      });

      return {
        ...festData,
        status: nextStatus,
        updatedAt: now
      };
    });

    // Synchronize festStatus on child events
    try {
      const eventsQ = query(
        collection(db, 'events'),
        where('festId', '==', festId),
        where('organizationId', '==', updatedFest.organizationId)
      );
      const eventsSnap = await getDocs(eventsQ);
      if (!eventsSnap.empty) {
        const batch = writeBatch(db);
        const syncNow = new Date().toISOString();
        eventsSnap.docs.forEach((d) => {
          batch.update(d.ref, {
            festStatus: nextStatus,
            updatedAt: syncNow
          });
        });
        await batch.commit();
      }
    } catch (syncErr) {
      console.warn('Child events sync warning:', syncErr);
    }

    return updatedFest;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${festId}`);
    throw error;
  }
}

/**
 * Publish a draft festival via Firestore transaction.
 * Strictly transitions: draft -> published.
 */
export async function publishFest(festId: string): Promise<Fest> {
  return executeFestLifecycleTransition(festId, 'draft', 'published');
}

/**
 * Mark a published festival as completed via Firestore transaction.
 * Strictly transitions: published -> completed.
 */
export async function completeFest(festId: string): Promise<Fest> {
  return executeFestLifecycleTransition(festId, 'published', 'completed');
}

/**
 * Archive a completed or draft festival via Firestore transaction.
 * Strictly transitions: completed/draft -> archived.
 */
export async function archiveFest(festId: string): Promise<Fest> {
  // nextStatus: 'archived'
  return executeFestLifecycleTransition(festId, ['completed', 'draft'], 'archived');
}

/**
 * Safely delete a draft festival.
 * Prevents destructive deletion if dependent events exist.
 */
export async function deleteDraftFest(festId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to delete a draft festival.');
  }

  const fest = await getFestById(festId);
  if (!fest) {
    throw new Error('Festival not found.');
  }

  if (fest.status !== 'draft') {
    throw new Error('Only draft festivals can be deleted. Published or historical festivals must be archived.');
  }

  // Admin consistency: Platform admin or authorized organization member
  const roleRef = doc(db, 'userRoles', currentUser.uid);
  const roleDoc = await getDoc(roleRef);
  const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

  if (!isAdmin) {
    const memberDocId = `${fest.organizationId}_${currentUser.uid}`;
    const memberRef = doc(db, 'organizationMembers', memberDocId);
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      throw new Error('You do not have permission to delete festivals for this organization.');
    }
  }

  // Invariant A1: Fest eventCount must be 0
  if (typeof fest.eventCount === 'number' && fest.eventCount > 0) {
    throw new Error(`Cannot delete festival because it has ${fest.eventCount} associated event(s). Please remove or archive the events first, or archive the festival instead.`);
  }

  // Safety check: verify no dependent events exist in database
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      where('festId', '==', festId),
      where('organizationId', '==', fest.organizationId)
    );
    const eventsSnap = await getDocs(eventsQuery);
    if (!eventsSnap.empty) {
      throw new Error(`Cannot delete festival because it has ${eventsSnap.size} associated event(s). Please remove or archive the events first, or archive the festival instead.`);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Cannot delete festival')) {
      throw err;
    }
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, festId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${festId}`);
    throw error;
  }
}
