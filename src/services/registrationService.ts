import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import {
  Registration,
  RegistrationStatus,
  RegistrationType,
  TeamMember,
  EventItem
} from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const COLLECTION_NAME = 'registrations';

export type RegistrationErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'EVENT_NOT_FOUND'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_COMPLETED'
  | 'EVENT_CANCELLED'
  | 'EVENT_FULL'
  | 'ALREADY_REGISTERED'
  | 'PREVIOUS_REGISTRATION_CANCELLED'
  | 'INVALID_REGISTRATION_TYPE'
  | 'INVALID_TEAM_SIZE'
  | 'INVALID_FORM_DATA'
  | 'REGISTRATION_FAILED';

export class RegistrationError extends Error {
  code: RegistrationErrorCode;

  constructor(code: RegistrationErrorCode, message: string) {
    super(message);
    this.name = 'RegistrationError';
    this.code = code;
  }
}

export type CancellationErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'REGISTRATION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'ALREADY_CANCELLED'
  | 'INVALID_STATUS'
  | 'CANCELLATION_DEADLINE_PASSED'
  | 'EVENT_NOT_FOUND'
  | 'CAPACITY_INTEGRITY_ERROR'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN_ERROR';

export class CancellationError extends Error {
  code: CancellationErrorCode;

  constructor(code: CancellationErrorCode, message: string) {
    super(message);
    this.name = 'CancellationError';
    this.code = code;
  }
}

export interface CancelRegistrationResult {
  success: boolean;
  registration: Registration;
  message: string;
}

/**
 * Generate a standardized, collision-resistant human-readable ticket pass identifier.
 * Structure: "FST-{4-char}-{4-char}" (32^8 = 1.1 trillion combination space)
 * Example: "FST-K9M2-8KJ7"
 */
export function generateTicketCode(prefix: string = 'FST'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${p1}-${p2}`;
}

/**
 * Deterministic registration document identifier: {eventId}_{userId}.
 * Guarantees single-registration constraint per user per event at the document ID level.
 */
export function getDeterministicRegistrationId(eventId: string, userId: string): string {
  return `${eventId}_${userId}`;
}

export interface SubmitRegistrationInput {
  eventId: string;
  registrationType: RegistrationType;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  institution?: string;
  studentId?: string;
  teamName?: string;
  teamMembers?: TeamMember[];
  registrationData?: Record<string, unknown>;
}

export interface SubmitRegistrationResult {
  success: boolean;
  registration: Registration;
  message: string;
}

/**
 * Phase 2.2 Core: Atomic Registration Submission Engine.
 * 
 * Atomically validates:
 * 1. Authenticated user presence
 * 2. Event existence and published state
 * 3. Registration deadline compliance
 * 4. Duplicate registration presence
 * 5. Event capacity limits
 * 6. Registration mode (individual vs. team) and team size limits
 * 7. Dynamic form field requirements
 * 
 * In a single Firestore transaction:
 * - Writes the registration document with deterministic key {eventId}_{userId}
 * - Increments event.currentRegistrations by exactly 1
 * 
 * If any check fails, the transaction aborts with zero modifications persisted.
 */
export async function submitAtomicRegistration(
  input: SubmitRegistrationInput
): Promise<SubmitRegistrationResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new RegistrationError(
      'NOT_AUTHENTICATED',
      'You must be authenticated as a student to register for this event.'
    );
  }

  const userId = currentUser.uid;
  const userEmail = currentUser.email || input.studentEmail;
  const registrationId = getDeterministicRegistrationId(input.eventId, userId);

  const regDocRef = doc(db, COLLECTION_NAME, registrationId);
  const eventDocRef = doc(db, 'events', input.eventId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Transactional Reads First
      const eventSnap = await transaction.get(eventDocRef);
      const regSnap = await transaction.get(regDocRef);

      // 2. Validate Event Existence
      if (!eventSnap.exists()) {
        throw new RegistrationError('EVENT_NOT_FOUND', 'The target event does not exist.');
      }

      const eventData = eventSnap.data() as EventItem;

      // 3. Validate Event Publication Lifecycle Status
      if (eventData.status === 'completed') {
        throw new RegistrationError(
          'EVENT_COMPLETED',
          'This competition has concluded. New registrations are no longer accepted.'
        );
      }
      if (eventData.status === 'cancelled') {
        throw new RegistrationError(
          'EVENT_CANCELLED',
          'This event has been cancelled by the host student organization.'
        );
      }
      if (eventData.status !== 'published') {
        throw new RegistrationError(
          'REGISTRATION_CLOSED',
          'This event is currently in draft or inactive status.'
        );
      }
      if (eventData.festStatus && eventData.festStatus !== 'published') {
        throw new RegistrationError(
          'REGISTRATION_CLOSED',
          'The host festival for this event is not active or published.'
        );
      }
      if (eventData.isRegistrationClosed) {
        throw new RegistrationError(
          'REGISTRATION_CLOSED',
          'Registration has been closed by the event organizers.'
        );
      }

      // 4. Validate Registration Deadline & Start Time
      const nowTime = Date.now();
      const deadlineTime = new Date(eventData.registrationDeadline).getTime();
      if (!isNaN(deadlineTime) && nowTime >= deadlineTime) {
        throw new RegistrationError(
          'REGISTRATION_CLOSED',
          `The registration deadline passed on ${new Date(eventData.registrationDeadline).toLocaleString()}.`
        );
      }

      const startTime = new Date(eventData.startTime).getTime();
      if (!isNaN(startTime) && nowTime >= startTime) {
        throw new RegistrationError(
          'REGISTRATION_CLOSED',
          'This event has already started. New registrations are no longer accepted.'
        );
      }

      // 5. Duplicate Registration Check
      if (regSnap.exists()) {
        const existingReg = regSnap.data() as Registration;
        if (existingReg.status === 'cancelled') {
          throw new RegistrationError(
            'PREVIOUS_REGISTRATION_CANCELLED',
            'A previously cancelled registration was found for this event. Re-registration is not supported in this phase.'
          );
        }
        throw new RegistrationError(
          'ALREADY_REGISTERED',
          'You are already registered for this event.'
        );
      }

      // 6. Capacity Check
      const currentCount =
        typeof eventData.currentRegistrations === 'number'
          ? eventData.currentRegistrations
          : 0;
      const hasLimitedCapacity =
        typeof eventData.capacity === 'number' && eventData.capacity > 0;

      if (hasLimitedCapacity && currentCount >= eventData.capacity) {
        throw new RegistrationError(
          'EVENT_FULL',
          `This event is at full capacity (${eventData.capacity}/${eventData.capacity} spots filled).`
        );
      }

      // 7. Registration Type Validation
      const allowedType = eventData.registrationType || 'individual';
      if (allowedType === 'individual' && input.registrationType !== 'individual') {
        throw new RegistrationError(
          'INVALID_REGISTRATION_TYPE',
          'This competition only permits individual registrations.'
        );
      }
      if (allowedType === 'team' && input.registrationType !== 'team') {
        throw new RegistrationError(
          'INVALID_REGISTRATION_TYPE',
          'This competition requires team registration.'
        );
      }

      // 8. Team Size & Member Structure Validation
      if (input.registrationType === 'team') {
        if (!input.teamName || input.teamName.trim().length < 2) {
          throw new RegistrationError(
            'INVALID_TEAM_SIZE',
            'Team name must be at least 2 characters.'
          );
        }

        const minTeam = eventData.minTeamSize || 2;
        const maxTeam = eventData.maxTeamSize || 4;
        const members = input.teamMembers || [];

        if (members.length < minTeam) {
          throw new RegistrationError(
            'INVALID_TEAM_SIZE',
            `Team must have at least ${minTeam} members (provided ${members.length}).`
          );
        }
        if (members.length > maxTeam) {
          throw new RegistrationError(
            'INVALID_TEAM_SIZE',
            `Team cannot exceed ${maxTeam} members (provided ${members.length}).`
          );
        }

        for (let i = 0; i < members.length; i++) {
          const m = members[i];
          if (!m.name || !m.name.trim()) {
            throw new RegistrationError(
              'INVALID_TEAM_SIZE',
              `Member #${i + 1} must have a valid full name.`
            );
          }
          if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
            throw new RegistrationError(
              'INVALID_TEAM_SIZE',
              `Member #${i + 1} (${m.name}) requires a valid email address.`
            );
          }
        }
      }

      // 9. Dynamic Form Responses Validation
      if (eventData.customFormFields && eventData.customFormFields.length > 0) {
        const answers = input.registrationData || {};
        for (const field of eventData.customFormFields) {
          const val = answers[field.id];
          if (field.required) {
            if (val === undefined || val === null || val === '') {
              throw new RegistrationError(
                'INVALID_FORM_DATA',
                `"${field.label}" is required.`
              );
            }
            if (field.type === 'checkbox') {
              if (Array.isArray(val) && val.length === 0) {
                throw new RegistrationError(
                  'INVALID_FORM_DATA',
                  `Please select at least one option for "${field.label}".`
                );
              }
              if (typeof val === 'boolean' && !val) {
                throw new RegistrationError(
                  'INVALID_FORM_DATA',
                  `You must accept the requirement: "${field.label}".`
                );
              }
            }
          }

          if (val && field.type === 'select' && field.options) {
            if (!field.options.includes(val as string)) {
              throw new RegistrationError(
                'INVALID_FORM_DATA',
                `Invalid option selected for "${field.label}".`
              );
            }
          }
          if (val && field.type === 'radio' && field.options) {
            if (!field.options.includes(val as string)) {
              throw new RegistrationError(
                'INVALID_FORM_DATA',
                `Invalid selection for "${field.label}".`
              );
            }
          }
        }
      }

      // 10. Compute Lifecycle Status
      const status: RegistrationStatus = eventData.requiresApproval ? 'pending' : 'confirmed';

      // 11. Provision Unique Digital Pass Ticket Code
      const ticketCode = generateTicketCode();
      const nowIso = new Date().toISOString();

      // 12. Build Authoritative Registration Snapshot
      const newRegistration: Registration = {
        id: registrationId,
        eventId: eventData.id,
        festId: eventData.festId,
        organizationId: eventData.organizationId,
        userId: userId,
        ticketCode: ticketCode,
        status: status,
        registrationType: input.registrationType,
        studentName: input.studentName.trim() || currentUser.displayName || 'Student',
        studentEmail: userEmail,
        studentPhone: input.studentPhone?.trim() || '',
        institution: input.institution?.trim() || '',
        studentId: input.studentId?.trim() || '',
        teamName: input.registrationType === 'team' ? input.teamName?.trim() || '' : '',
        teamMembers: input.registrationType === 'team' ? input.teamMembers || [] : [],
        eventName: eventData.name,
        festName: eventData.festName || '',
        categoryName: eventData.categoryName || '',
        venue: eventData.venue,
        startTime: eventData.startTime,
        endTime: eventData.endTime || '',
        organizationName: eventData.organizationName || '',
        registrationData: input.registrationData || {},
        registeredAt: nowIso,
        updatedAt: nowIso
      };

      // 13. Atomic Writes Execution
      transaction.set(regDocRef, newRegistration);

      // Increment capacity counter on the authoritative event document
      const newCurrentRegistrations = currentCount + 1;
      transaction.update(eventDocRef, {
        currentRegistrations: newCurrentRegistrations
      });

      return newRegistration;
    });

    return {
      success: true,
      registration: result,
      message:
        result.status === 'pending'
          ? 'Registration submitted successfully and is pending organizer review.'
          : 'Registration confirmed successfully!'
    };
  } catch (error: any) {
    if (error instanceof RegistrationError) {
      throw error;
    }
    // Handle Firestore permission or transient issues
    const msg = error?.message || 'Transaction failed during registration submission.';
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      throw new RegistrationError(
        'REGISTRATION_FAILED',
        'Authorization failure: Unable to complete registration under current security policy.'
      );
    }
    throw new RegistrationError('REGISTRATION_FAILED', msg);
  }
}

/**
 * Fetch registrations belonging strictly to the current authenticated student.
 */
export async function getStudentRegistrations(userId: string): Promise<Registration[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Registration));

    return list.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

/**
 * Fetch single registration document by ID.
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    } as Registration;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Check if a student is actively registered for an event.
 */
export async function checkUserRegistrationStatus(
  userId: string,
  eventId: string
): Promise<Registration | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return null;
  }

  try {
    const directId = getDeterministicRegistrationId(eventId, userId);
    const directSnap = await getDoc(doc(db, COLLECTION_NAME, directId));
    if (directSnap.exists()) {
      const reg = { id: directSnap.id, ...directSnap.data() } as Registration;
      if (reg.status !== 'cancelled') {
        return reg;
      }
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('eventId', '==', eventId)
    );
    const snap = await getDocs(q);
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Registration))
      .find((r) => r.status !== 'cancelled');

    return active || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${eventId}_${userId}`);
  }
}

/**
 * Phase 2.4 Core: Atomic Registration Cancellation Engine.
 * 
 * Atomically validates:
 * 1. Authenticated user presence and ownership (registration.userId === auth.currentUser.uid)
 * 2. Registration existence in Firestore
 * 3. Associated event existence
 * 4. Cancellation eligibility: status must be 'pending' or 'confirmed'
 *    (rejects 'cancelled', 'completed', 'checked_in', 'waitlisted')
 * 5. Event registrationDeadline compliance (cannot cancel if deadline passed)
 * 6. Capacity integrity: event.currentRegistrations must be > 0
 * 
 * In a single Firestore transaction:
 * - Updates registration: status = 'cancelled', cancelledAt = ISO timestamp, updatedAt = ISO timestamp, cancellationReason = optional reason
 * - Decrements event.currentRegistrations by exactly 1
 * 
 * Commits atomically or aborts with zero side effects.
 */
export async function cancelRegistrationAtomic(
  registrationId: string,
  userId?: string,
  reason?: string
): Promise<CancelRegistrationResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new CancellationError(
      'NOT_AUTHENTICATED',
      'You must be authenticated as a student to cancel this registration.'
    );
  }

  const effectiveUserId = currentUser.uid;
  if (userId && userId !== effectiveUserId) {
    throw new CancellationError(
      'UNAUTHORIZED',
      'You do not have permission to cancel another student\'s registration.'
    );
  }

  const regDocRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updatedRegistration = await runTransaction(db, async (transaction) => {
      // 1. Transactional Reads First
      const regSnap = await transaction.get(regDocRef);
      if (!regSnap.exists()) {
        throw new CancellationError(
          'REGISTRATION_NOT_FOUND',
          'Registration record could not be found.'
        );
      }

      const regData = regSnap.data() as Registration;

      // 2. Verify Ownership
      if (regData.userId !== effectiveUserId) {
        throw new CancellationError(
          'UNAUTHORIZED',
          'You are not authorized to cancel this registration.'
        );
      }

      // 3. Read Associated Event Document
      const eventDocRef = doc(db, 'events', regData.eventId);
      const eventSnap = await transaction.get(eventDocRef);
      if (!eventSnap.exists()) {
        throw new CancellationError(
          'EVENT_NOT_FOUND',
          'The event associated with this registration could not be found.'
        );
      }

      const eventData = eventSnap.data() as EventItem;

      // 4. Verify Event Reference Integrity
      if (regData.eventId !== eventSnap.id) {
        throw new CancellationError(
          'EVENT_NOT_FOUND',
          'Registration does not match the referenced event record.'
        );
      }

      // 5. Check Cancellation Eligibility (Status check)
      if (regData.status === 'cancelled') {
        throw new CancellationError(
          'ALREADY_CANCELLED',
          'This registration has already been cancelled.'
        );
      }

      if (regData.status !== 'pending' && regData.status !== 'confirmed') {
        throw new CancellationError(
          'INVALID_STATUS',
          `Registrations with status "${regData.status}" cannot be cancelled.`
        );
      }

      // 6. Verify Cancellation Deadline
      const nowTime = Date.now();
      const deadlineTime = new Date(eventData.registrationDeadline).getTime();
      if (!isNaN(deadlineTime) && deadlineTime < nowTime) {
        throw new CancellationError(
          'CANCELLATION_DEADLINE_PASSED',
          `Your registration could not be cancelled because the cancellation deadline passed on ${new Date(eventData.registrationDeadline).toLocaleString()}.`
        );
      }

      // 7. Verify Active Counted Capacity & Integrity
      const currentCount =
        typeof eventData.currentRegistrations === 'number'
          ? eventData.currentRegistrations
          : 0;

      if (currentCount <= 0) {
        throw new CancellationError(
          'CAPACITY_INTEGRITY_ERROR',
          'Event registration count cannot be decremented below zero.'
        );
      }

      const newCurrentRegistrations = currentCount - 1;
      const nowIso = new Date().toISOString();
      const trimmedReason = reason?.trim() || '';

      const updatedRecord: Registration = {
        ...regData,
        status: 'cancelled',
        cancelledAt: nowIso,
        updatedAt: nowIso,
        ...(trimmedReason ? { cancellationReason: trimmedReason } : {})
      };

      // 8. Atomic Writes Execution
      transaction.update(regDocRef, {
        status: 'cancelled',
        cancelledAt: nowIso,
        updatedAt: nowIso,
        cancellationReason: trimmedReason
      });

      transaction.update(eventDocRef, {
        currentRegistrations: newCurrentRegistrations
      });

      return updatedRecord;
    });

    return {
      success: true,
      registration: updatedRegistration,
      message: 'Registration cancelled successfully. Your seat has been released.'
    };
  } catch (error: any) {
    if (error instanceof CancellationError) {
      throw error;
    }
    const msg = error?.message || 'Transaction failed during cancellation.';
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      throw new CancellationError(
        'PERMISSION_DENIED',
        'Authorization failure: Unable to cancel registration under current security policy.'
      );
    }
    throw new CancellationError('UNKNOWN_ERROR', msg);
  }
}

/**
 * Cancel an existing registration on behalf of the student (backward-compatible wrapper).
 */
export async function cancelRegistration(
  registrationId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await cancelRegistrationAtomic(registrationId, userId, reason);
}

/**
 * Organizer query: Fetch registrations for a specific event within an organization.
 */
export async function getEventRegistrations(
  eventId: string,
  organizationId: string
): Promise<Registration[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('eventId', '==', eventId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Registration));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?event=${eventId}`);
  }
}

/**
 * Organizer query: Fetch all registrations across a festival for an organization.
 */
export async function getFestRegistrations(
  festId: string,
  organizationId: string
): Promise<Registration[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('festId', '==', festId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Registration));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?fest=${festId}`);
  }
}

/**
 * Organizer query: Fetch recent registrations across an organization.
 * Constrained strictly by organizationId matching Firestore security rules.
 */
export async function getOrganizationRegistrations(
  organizationId: string
): Promise<Registration[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Registration));

    return list.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
  } catch (error) {
    console.warn('Could not fetch organization registrations:', error);
    return [];
  }
}

/**
 * Phase 6.1 Core: Approve a pending registration.
 * Transitions strictly: pending -> confirmed.
 * Capacity note: 'pending' registrations already consumed quota on creation,
 * so approval does NOT double-increment event.currentRegistrations.
 */
export async function approveRegistration(
  registrationId: string,
  notes?: string
): Promise<Registration> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to approve registrations.');
  }

  const regRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(regRef);
      if (!regDoc.exists()) {
        throw new Error('Registration record not found.');
      }
      const regData = regDoc.data() as Registration;

      if (regData.status !== 'pending') {
        throw new Error(
          `Cannot approve registration with status "${regData.status}". Only pending registrations can be approved.`
        );
      }

      // Verify caller is admin or org member
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${regData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to manage registrations for this organization.');
        }
      }

      const nowIso = new Date().toISOString();
      const updates: any = {
        status: 'confirmed',
        updatedAt: nowIso
      };
      if (notes && notes.trim()) {
        updates.notes = notes.trim();
      }

      transaction.update(regRef, updates);

      return {
        ...regData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${registrationId}`);
    throw error;
  }
}

/**
 * Phase 6.1 Core: Reject or decline a registration application.
 * Transitions strictly: pending -> cancelled (or confirmed -> cancelled by organizer).
 * Atomically decrements the associated event's currentRegistrations counter to release capacity.
 */
export async function rejectRegistration(
  registrationId: string,
  reason?: string
): Promise<Registration> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to reject registrations.');
  }

  const regRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(regRef);
      if (!regDoc.exists()) {
        throw new Error('Registration record not found.');
      }
      const regData = regDoc.data() as Registration;

      if (regData.status !== 'pending' && regData.status !== 'confirmed') {
        throw new Error(
          `Cannot reject registration with status "${regData.status}". Only pending or confirmed registrations can be declined.`
        );
      }

      // Verify caller is admin or org member
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${regData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to manage registrations for this organization.');
        }
      }

      // Read event to decrement capacity counter
      const eventRef = doc(db, 'events', regData.eventId);
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('Associated event not found.');
      }
      const eventData = eventDoc.data() as EventItem;

      const currentCount = typeof eventData.currentRegistrations === 'number' ? eventData.currentRegistrations : 0;
      const newCount = Math.max(0, currentCount - 1);

      const nowIso = new Date().toISOString();
      const trimmedReason = reason?.trim() || 'Application declined by event organizers.';

      const updates: any = {
        status: 'cancelled',
        cancelledAt: nowIso,
        cancellationReason: trimmedReason,
        updatedAt: nowIso
      };

      transaction.update(regRef, updates);
      transaction.update(eventRef, {
        currentRegistrations: newCount
      });

      return {
        ...regData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${registrationId}`);
    throw error;
  }
}

/**
 * Phase 6.2 Core: Check-in a confirmed participant at the venue gate.
 * Transitions strictly: confirmed -> checked_in (or pending -> checked_in where allowed).
 * Prevents double check-in and records checkedInBy and checkedInAt atomically.
 * Does NOT alter event capacity.
 */
export async function checkInParticipant(
  registrationId: string,
  notes?: string
): Promise<Registration> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to check in participants.');
  }

  const regRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(regRef);
      if (!regDoc.exists()) {
        throw new Error('Registration record not found.');
      }
      const regData = regDoc.data() as Registration;

      if (regData.status === 'checked_in') {
        const time = regData.checkedInAt ? new Date(regData.checkedInAt).toLocaleTimeString() : 'earlier';
        throw new Error(`Participant has already been checked in (${time}).`);
      }

      if (regData.status === 'cancelled') {
        throw new Error('Cannot check in a cancelled registration.');
      }

      if (regData.status !== 'confirmed' && regData.status !== 'pending') {
        throw new Error(`Cannot check in a registration with status "${regData.status}".`);
      }

      // Verify caller is admin or org member
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${regData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to check in participants for this organization.');
        }
      }

      const nowIso = new Date().toISOString();
      const updates: any = {
        status: 'checked_in',
        checkedInAt: nowIso,
        checkedInBy: currentUser.uid,
        updatedAt: nowIso
      };
      if (notes && notes.trim()) {
        updates.notes = notes.trim();
      }

      transaction.update(regRef, updates);

      return {
        ...regData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${registrationId}`);
    throw error;
  }
}

/**
 * Phase 6.2 Core: Mark an event registration as completed after participation.
 * Transitions strictly: confirmed/checked_in -> completed.
 */
export async function markRegistrationCompleted(
  registrationId: string,
  notes?: string
): Promise<Registration> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to mark registrations completed.');
  }

  const regRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(regRef);
      if (!regDoc.exists()) {
        throw new Error('Registration record not found.');
      }
      const regData = regDoc.data() as Registration;

      if (regData.status !== 'confirmed' && regData.status !== 'checked_in') {
        throw new Error(
          `Cannot mark registration as completed from status "${regData.status}". Expected confirmed or checked_in.`
        );
      }

      // Verify caller is admin or org member
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${regData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to manage registrations for this organization.');
        }
      }

      const nowIso = new Date().toISOString();
      const updates: any = {
        status: 'completed',
        updatedAt: nowIso
      };
      if (notes && notes.trim()) {
        updates.notes = notes.trim();
      }

      transaction.update(regRef, updates);

      return {
        ...regData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${registrationId}`);
    throw error;
  }
}

/**
 * Phase 6.2 Core: Query registration by Ticket Code within an organization.
 * Used for ticket scanner lookups and fast gate check-in.
 */
export async function getRegistrationByTicketCode(
  ticketCode: string,
  organizationId: string
): Promise<Registration | null> {
  try {
    const normalizedCode = ticketCode.trim().toUpperCase();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('ticketCode', '==', normalizedCode)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Registration;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}?code=${ticketCode}`);
    return null;
  }
}

/**
 * Phase 6.1 / 6.2 Core: Update operational notes on an existing registration.
 * Scoped strictly to authorized organizers of the hosting organization or admins.
 * Preserves registration status, capacity, and all immutable identifiers.
 */
export async function updateRegistrationNotes(
  registrationId: string,
  notes: string
): Promise<Registration> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to manage operational notes.');
  }

  const regRef = doc(db, COLLECTION_NAME, registrationId);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(regRef);
      if (!regDoc.exists()) {
        throw new Error('Registration record not found.');
      }
      const regData = regDoc.data() as Registration;

      // Verify caller is admin or org member
      const roleRef = doc(db, 'userRoles', currentUser.uid);
      const roleDoc = await transaction.get(roleRef);
      const isAdmin = roleDoc.exists() && roleDoc.data()?.role === 'admin';

      if (!isAdmin) {
        const memberDocId = `${regData.organizationId}_${currentUser.uid}`;
        const memberRef = doc(db, 'organizationMembers', memberDocId);
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('You are not authorized to update notes for this organization.');
        }
      }

      const nowIso = new Date().toISOString();
      const sanitizedNotes = notes.trim().slice(0, 1000);

      const updates: any = {
        notes: sanitizedNotes,
        updatedAt: nowIso
      };

      transaction.update(regRef, updates);

      return {
        ...regData,
        ...updates
      };
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${registrationId}`);
    throw error;
  }
}
