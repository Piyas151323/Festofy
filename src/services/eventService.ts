import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { EventItem, EventCategory } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const EVENTS_COLLECTION = 'events';
const CATEGORIES_COLLECTION = 'eventCategories';

/**
 * Fetch publicly published or completed events.
 * Strictly constrained by `where('status', 'in', ['published', 'completed'])`
 * to align with Firestore Security Rules.
 */
export async function getPublishedEvents(festId?: string): Promise<EventItem[]> {
  try {
    let q;
    if (festId) {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('festId', '==', festId),
        where('status', 'in', ['published', 'completed'])
      );
    } else {
      q = query(
        collection(db, EVENTS_COLLECTION),
        where('status', 'in', ['published', 'completed'])
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
  }
}

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
  }
}

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
