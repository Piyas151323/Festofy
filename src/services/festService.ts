import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Fest } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

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
  }
}

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

    return fests.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?org=${organizationId}`);
    return [];
  }
}
