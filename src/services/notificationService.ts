import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { EventItem, StudentNotification, UserProfile } from '../types';

const COLLECTION_NAME = 'notifications';

/**
 * Check if a student is eligible for an event based on category or class/grade.
 * Enforces that notifications are NEVER sent to ineligible participants.
 */
export function isStudentEligibleForEvent(student: Partial<UserProfile>, event: EventItem): boolean {
  if (!event.participantCategories || event.participantCategories.length === 0) {
    return true; // No category constraints, open to all
  }

  // If event has an "Open for Everyone" category that is marked eligible, student is eligible
  const hasOpenCategory = event.participantCategories.some(
    c => c.eligible !== false && (c.name.toLowerCase().includes('open') || c.name.toLowerCase().includes('everyone'))
  );
  if (hasOpenCategory) return true;

  const studentCat = student.participantCategory?.toLowerCase().trim() || '';
  const studentGrade = student.classGrade?.toLowerCase().trim() || '';

  if (!studentCat && !studentGrade) {
    // If student has not set category or grade yet, do not block open discovery
    return true;
  }

  return event.participantCategories.some(c => {
    if (c.eligible === false) return false;
    const catName = c.name.toLowerCase();
    return (
      (studentCat && catName.includes(studentCat)) ||
      (studentCat && studentCat.includes(catName)) ||
      (studentGrade && catName.includes(studentGrade)) ||
      (studentGrade && studentGrade.includes(catName))
    );
  });
}

/**
 * Check if an event matches a student's interests using configurable topics, categories, and keywords.
 */
export function doesEventMatchInterests(
  event: EventItem,
  interests: string[]
): { matches: boolean; matchedInterests: string[] } {
  if (!interests || interests.length === 0) {
    return { matches: false, matchedInterests: [] };
  }

  const topicWords = (event.topics || []).map(t => t.toLowerCase());
  const searchableText = `${event.name} ${event.categoryName || ''} ${event.description} ${(event.topics || []).join(' ')}`.toLowerCase();

  const matched = interests.filter(interest => {
    const term = interest.toLowerCase().trim();

    // 1. Direct topic match
    if (topicWords.some(t => t === term || t.includes(term) || term.includes(t))) {
      return true;
    }

    // 2. Direct string containment
    if (searchableText.includes(term)) return true;

    // 3. Synonym and domain mappings
    if (term === 'programming' && (searchableText.includes('coding') || searchableText.includes('hackathon') || searchableText.includes('developer') || searchableText.includes('software'))) return true;
    if (term === 'robotics' && (searchableText.includes('robot') || searchableText.includes('iot') || searchableText.includes('drone') || searchableText.includes('automation') || searchableText.includes('line follow'))) return true;
    if (term === 'science fair' && (searchableText.includes('science') || searchableText.includes('project') || searchableText.includes('exhibition') || searchableText.includes('research'))) return true;
    if (term === 'gaming / esports' && (searchableText.includes('game') || searchableText.includes('esports') || searchableText.includes('gaming') || searchableText.includes('valorant') || searchableText.includes('fifa'))) return true;
    if (term === 'debate' && (searchableText.includes('parliamentary') || searchableText.includes('public speaking') || searchableText.includes('mun') || searchableText.includes('adjudication'))) return true;
    if (term === 'quiz' && (searchableText.includes('trivia') || searchableText.includes('olympiad') || searchableText.includes('knowledge') || searchableText.includes('general knowledge'))) return true;
    if (term === 'mathematics' && (searchableText.includes('math') || searchableText.includes('algebra') || searchableText.includes('calculus') || searchableText.includes('olympiad'))) return true;
    if (term === 'physics' && (searchableText.includes('mechanics') || searchableText.includes('astronomy') || searchableText.includes('quantum') || searchableText.includes('optics'))) return true;
    if (term === 'chemistry' && (searchableText.includes('chemical') || searchableText.includes('organic') || searchableText.includes('lab'))) return true;
    if (term === 'biology' && (searchableText.includes('biotech') || searchableText.includes('genetics') || searchableText.includes('medicine') || searchableText.includes('bio'))) return true;
    if (term === 'art' && (searchableText.includes('drawing') || searchableText.includes('design') || searchableText.includes('painting') || searchableText.includes('graphics'))) return true;
    if (term === 'business' && (searchableText.includes('case competition') || searchableText.includes('startup') || searchableText.includes('marketing') || searchableText.includes('finance') || searchableText.includes('pitch'))) return true;

    return false;
  });

  return {
    matches: matched.length > 0,
    matchedInterests: matched
  };
}

/**
 * Filter published events into personalized suggestions for the student.
 * Guarantees that only active, published, and strictly eligible events are recommended.
 */
export function getPersonalizedEventSuggestions(
  events: EventItem[],
  student: Partial<UserProfile>,
  registeredEventIds: Set<string>
): { event: EventItem; matchedInterests: string[] }[] {
  const studentInterests = student.interests || [];
  if (studentInterests.length === 0) return [];

  const now = Date.now();

  const activeEvents = events.filter(e => {
    // Only published events
    if (e.status !== 'published') return false;
    if (e.festStatus && e.festStatus !== 'published') return false;
    if (e.isRegistrationClosed) return false;

    // Check registration deadline
    const deadline = new Date(e.registrationDeadline).getTime();
    if (!isNaN(deadline) && deadline < now) return false;

    // Exclude events already registered
    if (registeredEventIds.has(e.id)) return false;

    // Enforce participant category & grade eligibility
    return isStudentEligibleForEvent(student, e);
  });

  const matching: { event: EventItem; matchedInterests: string[] }[] = [];

  for (const event of activeEvents) {
    const { matches, matchedInterests } = doesEventMatchInterests(event, studentInterests);
    if (matches) {
      matching.push({ event, matchedInterests });
    }
  }

  return matching;
}

/**
 * Fetch stored notifications for the current student.
 */
export async function getStudentNotifications(userId: string): Promise<StudentNotification[]> {
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
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as StudentNotification));

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Notice fetching student notifications:', err);
    return [];
  }
}

/**
 * Generate a deterministic interest suggestion notification if one doesn't exist yet for this event and student.
 * Guarantees single notification identity per student per event to prevent duplicate alerts.
 */
export async function ensureEventRecommendationNotification(
  userId: string,
  event: EventItem,
  matchedInterest: string
): Promise<void> {
  // Deterministic notification document identifier
  const notifId = `notif_${userId}_${event.id}`;
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Never notify about unpublished or cancelled events
  if (event.status !== 'published' || (event.festStatus && event.festStatus !== 'published')) {
    return;
  }

  // Never notify about closed or expired events
  if (event.isRegistrationClosed) return;
  if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() < Date.now()) return;

  try {
    const docRef = doc(db, COLLECTION_NAME, notifId);
    // Deduplication check: if notification already exists, do not overwrite or reset read status
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      return;
    }

    const now = new Date().toISOString();
    const payload: StudentNotification = {
      id: notifId,
      userId,
      title: `A new ${matchedInterest} competition is available`,
      message: `A new ${matchedInterest} competition "${event.name}" is available that matches your interests.`,
      eventId: event.id,
      festId: event.festId,
      actionUrl: `/events/${event.id}`,
      category: matchedInterest,
      read: false,
      createdAt: now
    };

    await setDoc(docRef, payload);
  } catch (err) {
    console.warn('Notice ensuring recommendation notification:', err);
  }
}

/**
 * Synchronize personalized event recommendations into the student's notification inbox.
 */
export async function syncStudentEventRecommendations(
  userId: string,
  userProfile?: Partial<UserProfile> | null,
  publishedEvents?: EventItem[]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) return;

  try {
    let profile = userProfile;
    if (!profile) {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
      if (!userDoc.empty) {
        profile = userDoc.docs[0].data() as UserProfile;
      }
    }

    if (!profile || !profile.interests || profile.interests.length === 0) {
      return;
    }

    let events = publishedEvents;
    if (!events) {
      const q = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        where('festStatus', '==', 'published')
      );
      const snap = await getDocs(q);
      events = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem));
    }

    const regSnap = await getDocs(query(collection(db, 'registrations'), where('userId', '==', userId)));
    const registeredIds = new Set(regSnap.docs.map(d => (d.data() as any).eventId));

    const recs = getPersonalizedEventSuggestions(events, profile, registeredIds);

    // Write deterministic notifications for up to top 3 matching competitions
    await Promise.all(
      recs.slice(0, 3).map(rec =>
        ensureEventRecommendationNotification(userId, rec.event, rec.matchedInterests[0] || 'Interest')
      )
    );
  } catch (err) {
    console.warn('Notice synchronizing student event recommendations:', err);
  }
}

/**
 * Dispatch recommendation alerts to eligible students when an organizer publishes a new event.
 */
export async function dispatchRecommendationsForPublishedEvent(event: EventItem): Promise<number> {
  if (event.status !== 'published') return 0;
  if (event.festStatus && event.festStatus !== 'published') return 0;
  if (event.isRegistrationClosed) return 0;
  if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() < Date.now()) return 0;

  try {
    // Listing the private users collection is strictly restricted to platform administrators
    const currentUser = auth.currentUser;
    if (!currentUser) return 0;

    const roleRef = doc(db, 'userRoles', currentUser.uid);
    const roleSnap = await getDoc(roleRef).catch(() => null);
    if (!roleSnap || roleSnap.data()?.role !== 'admin') {
      // Non-admin organizers cannot enumerate private student profiles
      return 0;
    }

    // Query registered students with profile data
    const usersSnap = await getDocs(collection(db, 'users'));
    let notifiedCount = 0;

    for (const userDoc of usersSnap.docs) {
      const student = userDoc.data() as UserProfile;
      if (!student.uid || !student.interests || student.interests.length === 0) continue;

      // 1. Eligibility check (category & grade)
      if (!isStudentEligibleForEvent(student, event)) continue;

      // 2. Interest match check
      const { matches, matchedInterests } = doesEventMatchInterests(event, student.interests);
      if (!matches) continue;

      // 3. Write deterministic notification
      const notifId = `notif_${student.uid}_${event.id}`;
      const docRef = doc(db, COLLECTION_NAME, notifId);
      const primaryMatch = matchedInterests[0] || 'Interest';

      const payload = {
        id: notifId,
        userId: student.uid,
        organizationId: event.organizationId,
        title: `A new ${primaryMatch} competition is available`,
        message: `A new ${primaryMatch} competition "${event.name}" is available that matches your interests.`,
        eventId: event.id,
        festId: event.festId,
        actionUrl: `/events/${event.id}`,
        category: primaryMatch,
        read: false,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      notifiedCount++;
    }

    return notifiedCount;
  } catch (err) {
    console.warn('Notice dispatching recommendations for published event:', err);
    return 0;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.warn('Notice marking notification as read:', err);
  }
}

/**
 * Mark all notifications as read for current student.
 */
export async function markAllNotificationsAsRead(notifications: StudentNotification[]): Promise<void> {
  const unread = notifications.filter(n => !n.read);
  await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
}

/**
 * Dismiss / delete a notification.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Notice deleting notification:', err);
  }
}
