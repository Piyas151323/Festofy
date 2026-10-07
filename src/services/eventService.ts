import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import {
  EventItem,
  EventCategory,
  EventStatus,
  CreateEventInput,
  UpdateEventInput
} from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const EVENTS_COLLECTION = 'events';
const CATEGORIES_COLLECTION = 'eventCategories';
const FESTS_COLLECTION = 'fests';

/**
 * Fetch publicly published events.
 * Strictly constrained by parent festival status == 'published' AND event status == 'published'.
 * Note: Historical condition where('status', 'in', ['published', 'completed']) was strengthened
 * in Phase 5.2.1 to guarantee that events under draft/archived/completed festivals are not leaked.
 */
export async function getPublishedEvents(festId?: string): Promise<EventItem[]> {
  try {
    let q;
    if (festId) {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('festId', '==', festId),
        where('festStatus', '==', 'published'),
        where('status', '==', 'published')
      );
    } else {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('festStatus', '==', 'published'),
        where('status', '==', 'published')
      );
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as EventItem));

    return items.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
    return [];
  }
}

/**
 * Fetch a single event document by its ID.
 */
export async function getEventById(id: string): Promise<EventItem | null> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    } as EventItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${EVENTS_COLLECTION}/${id}`);
    return null;
  }
}

/**
 * Fetch public taxonomy categories.
 */
export async function getEventCategories(): Promise<EventCategory[]> {
  try {
    const coll = collection(db, CATEGORIES_COLLECTION);
    const snap = await getDocs(coll);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as EventCategory)).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CATEGORIES_COLLECTION);
    return [];
  }
}

/**
 * Scoped organizer query: Fetch all events strictly belonging to an organization.
 */
export async function getOrganizationEvents(organizationId: string): Promise<EventItem[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizationId', '==', organizationId)
    );
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as EventItem));

    return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${EVENTS_COLLECTION}?org=${organizationId}`);
    return [];
  }
}

/**
 * Fetch all events under a specific festival.
 * If includeUnpublished is true, retrieves all events (requires organizer/admin permissions).
 * Otherwise, retrieves only public published or completed events.
 */
export async function getFestEvents(festId: string, includeUnpublished = false): Promise<EventItem[]> {
  try {
    let q;
    if (includeUnpublished) {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('festId', '==', festId)
      );
    } else {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('festId', '==', festId),
        where('festStatus', '==', 'published'),
        where('status', '==', 'published')
      );
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as EventItem));

    return items.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${EVENTS_COLLECTION}?festId=${festId}`);
    return [];
  }
}

/**
 * Create a new event under an organization's festival.
 * 
 * Invariants:
 * 1. Initial status is strictly "draft".
 * 2. currentRegistrations is initialized to 0.
 * 3. Atomically increments fest eventCount inside a Firestore transaction.
 * 4. Checks that the user is an authorized member of the organization or admin.
 */
export async function createEvent(input: CreateEventInput, organizationId: string): Promise<EventItem> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to create an event.');
  }

  if (!organizationId || !organizationId.trim()) {
    throw new Error('An active organization must be selected to create an event.');
  }

  if (!input.festId || !input.festId.trim()) {
    throw new Error('A valid parent festival must be selected.');
  }

  const trimmedName = input.name?.trim() || '';
  if (trimmedName.length < 3 || trimmedName.length > 150) {
    throw new Error('Event name must be between 3 and 150 characters.');
  }

  const trimmedDesc = input.description?.trim() || '';
  if (trimmedDesc.length < 3 || trimmedDesc.length > 3000) {
    throw new Error('Event description must be between 3 and 3000 characters.');
  }

  const trimmedVenue = input.venue?.trim() || '';
  if (trimmedVenue.length < 2 || trimmedVenue.length > 100) {
    throw new Error('Event venue must be between 2 and 100 characters.');
  }

  if (!input.categoryId || !input.categoryId.trim()) {
    throw new Error('Event category is required.');
  }

  const capacity = Number(input.capacity);
  if (isNaN(capacity) || capacity < 1 || capacity > 100000) {
    throw new Error('Event capacity must be a positive integer between 1 and 100,000.');
  }

  if (!input.startTime || !input.endTime) {
    throw new Error('Both start time and end time are required.');
  }

  const startMs = new Date(input.startTime).getTime();
  const endMs = new Date(input.endTime).getTime();
  if (isNaN(startMs) || isNaN(endMs)) {
    throw new Error('Invalid start or end date format.');
  }
  if (startMs > endMs) {
    throw new Error('Event start time cannot be after end time.');
  }

  const deadlineMs = input.registrationDeadline ? new Date(input.registrationDeadline).getTime() : startMs;
  if (isNaN(deadlineMs)) {
    throw new Error('Invalid registration deadline date format.');
  }
  if (deadlineMs > startMs) {
    throw new Error('Registration deadline cannot be after event start time.');
  }
  if (deadlineMs > endMs) {
    throw new Error('Registration deadline cannot be after event end time.');
  }

  let validBanner: string | undefined = undefined;
  if (input.bannerUrl && input.bannerUrl.trim()) {
    const raw = input.bannerUrl.trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      throw new Error('Banner URL must start with http:// or https://');
    }
    if (raw.length > 500) {
      throw new Error('Banner URL must not exceed 500 characters.');
    }
    validBanner = raw;
  }

  const regType = input.registrationType || 'individual';
  const minTeamSize = regType === 'team' ? (input.minTeamSize || 2) : undefined;
  const maxTeamSize = regType === 'team' ? (input.maxTeamSize || 4) : undefined;

  if (regType === 'team') {
    if (!minTeamSize || minTeamSize < 1) {
      throw new Error('Minimum team size must be at least 1.');
    }
    if (!maxTeamSize || maxTeamSize < minTeamSize) {
      throw new Error('Maximum team size must be greater than or equal to minimum team size.');
    }
  }

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'event';
  const eventId = `event_${slug}_${Date.now()}`;
  const now = new Date().toISOString();

  const festRef = doc(db, FESTS_COLLECTION, input.festId.trim());
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);

  try {
    const createdEvent = await runTransaction(db, async (transaction) => {
      // 1. Read parent festival
      const festDoc = await transaction.get(festRef);
      if (!festDoc.exists()) {
        throw new Error('Selected parent festival does not exist.');
      }
      const festData = festDoc.data();
      if (festData.organizationId !== organizationId.trim()) {
        throw new Error('The selected festival belongs to a different organization.');
      }

      // 2. Verify caller authorization (admin or org member)
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${organizationId.trim()}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to create events for this organization.');
        }
      }

      const eventPayload: EventItem = {
        id: eventId,
        festId: input.festId.trim(),
        organizationId: organizationId.trim(),
        categoryId: input.categoryId.trim(),
        name: trimmedName,
        description: trimmedDesc,
        venue: trimmedVenue,
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
        registrationDeadline: new Date(deadlineMs).toISOString(),
        capacity,
        status: 'draft',
        festStatus: (festData.status as any) || 'draft',
        currentRegistrations: 0,
        registrationType: regType,
        requiresApproval: Boolean(input.requiresApproval),
        isRegistrationClosed: false,
        createdAt: now,
        updatedAt: now,
        ...(validBanner ? { bannerUrl: validBanner } : {}),
        ...(minTeamSize ? { minTeamSize } : {}),
        ...(maxTeamSize ? { maxTeamSize } : {}),
        ...(input.customFormFields && input.customFormFields.length > 0 ? { customFormFields: input.customFormFields } : {}),
        festName: festData.name || undefined,
        organizationName: festData.organizationName || undefined
      };

      // 3. Set event doc in draft status
      transaction.set(eventRef, eventPayload);

      // 4. Atomically increment eventCount on parent festival
      const currentCount = typeof festData.eventCount === 'number' ? festData.eventCount : 0;
      transaction.update(festRef, {
        eventCount: currentCount + 1,
        updatedAt: now
      });

      return eventPayload;
    });

    return createdEvent;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${EVENTS_COLLECTION}/${eventId}`);
    throw error;
  }
}

/**
 * Edit event metadata.
 * Invariant: Preserves immutable id, festId, organizationId, createdAt, and currentRegistrations.
 */
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<EventItem> {
  const existing = await getEventById(eventId);
  if (!existing) {
    throw new Error('Event not found.');
  }

  if (existing.status !== 'draft' && existing.status !== 'published') {
    throw new Error(`Cannot edit event with status "${existing.status}". Only draft or published events can be modified.`);
  }

  const updates: Partial<EventItem> = {
    updatedAt: new Date().toISOString()
  };

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 3 || trimmed.length > 150) {
      throw new Error('Event name must be between 3 and 150 characters.');
    }
    updates.name = trimmed;
  }

  if (input.description !== undefined) {
    const trimmed = input.description.trim();
    if (trimmed.length < 3 || trimmed.length > 3000) {
      throw new Error('Event description must be between 3 and 3000 characters.');
    }
    updates.description = trimmed;
  }

  if (input.venue !== undefined) {
    const trimmed = input.venue.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new Error('Event venue must be between 2 and 100 characters.');
    }
    updates.venue = trimmed;
  }

  if (input.categoryId !== undefined) {
    const cat = input.categoryId.trim();
    if (!cat) throw new Error('Category cannot be empty.');
    updates.categoryId = cat;
  }

  if (input.capacity !== undefined) {
    const cap = Number(input.capacity);
    if (isNaN(cap) || cap < 1 || cap > 100000) {
      throw new Error('Event capacity must be a positive integer between 1 and 100,000.');
    }
    if (existing.currentRegistrations && cap < existing.currentRegistrations) {
      throw new Error(`Capacity cannot be reduced below current registered count (${existing.currentRegistrations}).`);
    }
    updates.capacity = cap;
  }

  const newStart = input.startTime !== undefined ? input.startTime : existing.startTime;
  const newEnd = input.endTime !== undefined ? input.endTime : existing.endTime;
  const newDeadline = input.registrationDeadline !== undefined ? input.registrationDeadline : existing.registrationDeadline;

  const sTime = new Date(newStart).getTime();
  const eTime = new Date(newEnd).getTime();
  if (isNaN(sTime) || isNaN(eTime)) {
    throw new Error('Invalid start or end date format.');
  }
  if (sTime > eTime) {
    throw new Error('Start time cannot be after end time.');
  }

  if (newDeadline) {
    const dTime = new Date(newDeadline).getTime();
    if (isNaN(dTime)) {
      throw new Error('Invalid registration deadline date format.');
    }
    if (dTime > sTime) {
      throw new Error('Registration deadline cannot be after event start time.');
    }
    if (dTime > eTime) {
      throw new Error('Registration deadline cannot be after event end time.');
    }
    if (input.registrationDeadline !== undefined) {
      updates.registrationDeadline = new Date(dTime).toISOString();
    }
  }

  if (input.startTime !== undefined) {
    updates.startTime = new Date(sTime).toISOString();
  }
  if (input.endTime !== undefined) {
    updates.endTime = new Date(eTime).toISOString();
  }

  if (input.bannerUrl !== undefined) {
    const raw = input.bannerUrl.trim();
    if (raw) {
      if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        throw new Error('Banner URL must begin with http:// or https://');
      }
      if (raw.length > 500) {
        throw new Error('Banner URL must not exceed 500 characters.');
      }
      updates.bannerUrl = raw;
    } else {
      updates.bannerUrl = '';
    }
  }

  // Part H: Safeguards when registrations already exist
  if (existing.currentRegistrations && existing.currentRegistrations > 0) {
    if (input.registrationType !== undefined && input.registrationType !== existing.registrationType) {
      throw new Error('Cannot change registration type once participants have registered.');
    }
    if (existing.registrationType === 'team') {
      if (input.minTeamSize !== undefined && existing.minTeamSize !== undefined && input.minTeamSize > existing.minTeamSize) {
        throw new Error('Cannot increase minimum team size after teams have registered.');
      }
      if (input.maxTeamSize !== undefined && existing.maxTeamSize !== undefined && input.maxTeamSize < existing.maxTeamSize) {
        throw new Error('Cannot decrease maximum team size after teams have registered.');
      }
    }
  }

  if (input.registrationType !== undefined) {
    updates.registrationType = input.registrationType;
  }
  if (input.minTeamSize !== undefined) {
    updates.minTeamSize = input.minTeamSize;
  }
  if (input.maxTeamSize !== undefined) {
    updates.maxTeamSize = input.maxTeamSize;
  }
  if (input.requiresApproval !== undefined) {
    updates.requiresApproval = input.requiresApproval;
  }
  if (input.customFormFields !== undefined) {
    updates.customFormFields = input.customFormFields;
  }
  if (input.isRegistrationClosed !== undefined) {
    updates.isRegistrationClosed = input.isRegistrationClosed;
  }

  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, updates);
    return {
      ...existing,
      ...updates
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COLLECTION}/${eventId}`);
    throw error;
  }
}

/**
 * Execute event lifecycle transitions strictly through a Firestore Transaction.
 * 
 * Invariants:
 * 1. Reads current event inside transaction.
 * 2. Verifies current status matches expectedPreviousStatus.
 * 3. Verifies authorization (admin or org member).
 * 4. Applies only intended next status.
 * 5. Updates updatedAt.
 * 6. Never executes blind updates.
 */
export async function executeEventLifecycleTransition(
  eventId: string,
  expectedPreviousStatus: EventStatus | EventStatus[],
  nextStatus: EventStatus
): Promise<EventItem> {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('Event not found.');
      }
      const eventData = { id: eventDoc.id, ...eventDoc.data() } as EventItem;

      const validPrev = Array.isArray(expectedPreviousStatus)
        ? expectedPreviousStatus
        : [expectedPreviousStatus];

      if (!validPrev.includes(eventData.status)) {
        throw new Error(
          `Invalid lifecycle transition. Event current status is "${eventData.status}", but expected "${validPrev.join(' or ')}".`
        );
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be signed in to perform event lifecycle actions.');
      }

      // Check admin status
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${eventData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to manage events for this organization.');
        }
      }

      // If transition is to published, validate required fields and enforce parent festival is published
      if (nextStatus === 'published') {
        const festRef = doc(db, FESTS_COLLECTION, eventData.festId);
        const festDoc = await transaction.get(festRef);
        if (!festDoc.exists()) {
          throw new Error('Parent festival does not exist.');
        }
        const festData = festDoc.data();
        if (festData.status !== 'published') {
          throw new Error(
            `Cannot publish event while parent festival has status "${festData.status}". The festival must be published before its events can be published.`
          );
        }

        const trimmedName = eventData.name?.trim() || '';
        const trimmedDesc = eventData.description?.trim() || '';
        const trimmedVenue = eventData.venue?.trim() || '';
        if (trimmedName.length < 3 || trimmedName.length > 150) {
          throw new Error('Event name must be between 3 and 150 characters to publish.');
        }
        if (trimmedDesc.length < 3 || trimmedDesc.length > 3000) {
          throw new Error('Event description must be between 3 and 3000 characters to publish.');
        }
        if (trimmedVenue.length < 2) {
          throw new Error('Event venue is required to publish.');
        }
        if (!eventData.categoryId) {
          throw new Error('Event category is required to publish.');
        }
        if (!eventData.capacity || eventData.capacity < 1) {
          throw new Error('Event must have valid capacity to publish.');
        }
        if (!eventData.startTime || !eventData.endTime) {
          throw new Error('Event must have valid start and end times to publish.');
        }
        const sTime = new Date(eventData.startTime).getTime();
        const eTime = new Date(eventData.endTime).getTime();
        if (isNaN(sTime) || isNaN(eTime)) {
          throw new Error('Event must have valid start and end times to publish.');
        }
        if (sTime > eTime) {
          throw new Error('Event start time cannot be after end time.');
        }
        if (eventData.registrationDeadline) {
          const dTime = new Date(eventData.registrationDeadline).getTime();
          if (isNaN(dTime)) {
            throw new Error('Invalid registration deadline date format.');
          }
          if (dTime > sTime) {
            throw new Error('Registration deadline cannot be after event start time.');
          }
          if (dTime > eTime) {
            throw new Error('Registration deadline cannot be after event end time.');
          }
        }
      }

      const now = new Date().toISOString();
      const updates: any = {
        status: nextStatus,
        updatedAt: now
      };

      if (nextStatus === 'published') {
        updates.festStatus = 'published';
      }

      if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        updates.isRegistrationClosed = true;
      }

      transaction.update(eventRef, updates);

      return {
        ...eventData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COLLECTION}/${eventId}`);
    throw error;
  }
}

/**
 * Publish a draft event via Firestore transaction.
 */
export async function publishEvent(eventId: string): Promise<EventItem> {
  return executeEventLifecycleTransition(eventId, 'draft', 'published');
}

/**
 * Mark a published event as completed via Firestore transaction.
 */
export async function completeEvent(eventId: string): Promise<EventItem> {
  return executeEventLifecycleTransition(eventId, 'published', 'completed');
}

/**
 * Cancel an event via Firestore transaction.
 */
export async function cancelEvent(eventId: string): Promise<EventItem> {
  return executeEventLifecycleTransition(eventId, ['draft', 'published'], 'cancelled');
}

/**
 * Safely delete a draft event via Firestore transaction.
 * Invariants:
 * 1. Only draft events with 0 registrations can be deleted.
 * 2. Atomically decrements the parent festival's eventCount.
 */
export async function deleteDraftEvent(eventId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to delete an event.');
  }

  const eventRef = doc(db, EVENTS_COLLECTION, eventId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('Event not found.');
      }
      const eventData = eventDoc.data() as EventItem;

      if (eventData.status !== 'draft') {
        throw new Error('Only draft events can be deleted. Published or historical events must be cancelled.');
      }

      if (eventData.currentRegistrations && eventData.currentRegistrations > 0) {
        throw new Error(`Cannot delete event because it has ${eventData.currentRegistrations} participant registration(s).`);
      }

      // Check authorization
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${eventData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You do not have permission to delete events for this organization.');
        }
      }

      // Read parent festival to decrement eventCount
      const festRef = doc(db, FESTS_COLLECTION, eventData.festId);
      const festDoc = await transaction.get(festRef);

      // Delete event
      transaction.delete(eventRef);

      // Decrement eventCount if parent fest exists
      if (festDoc.exists()) {
        const festData = festDoc.data();
        const currentCount = typeof festData.eventCount === 'number' ? festData.eventCount : 1;
        const newCount = Math.max(0, currentCount - 1);
        transaction.update(festRef, {
          eventCount: newCount,
          updatedAt: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COLLECTION}/${eventId}`);
    throw error;
  }
}
