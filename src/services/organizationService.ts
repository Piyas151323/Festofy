import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, where, runTransaction } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { Organization, OrganizationMember, OrganizationStatus, CreateOrganizationRequestInput, UpdateOrganizationInput } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const COLLECTION_NAME = 'organizations';
const MEMBERS_COLLECTION = 'organizationMembers';

export async function getOrganizations(): Promise<Organization[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Organization));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    } as Organization;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Access individual membership using deterministic document key: {organizationId}_{userId}.
 * Conforms to hardened rules prohibiting unconstrained enumeration of organization members.
 */
export async function getUserOrgMembership(organizationId: string, userId: string): Promise<OrganizationMember | null> {
  const membershipDocId = `${organizationId}_${userId}`;
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, membershipDocId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data()
    } as OrganizationMember;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${MEMBERS_COLLECTION}/${membershipDocId}`);
  }
}

/**
 * Authoritatively retrieves organizations the authenticated user belongs to.
 * Queries organizationMembers collection where userId == userId.
 * System administrators fallback to all registered organizations.
 */
export async function getUserOrganizations(
  userId: string,
  isAdmin: boolean = false
): Promise<Organization[]> {
  try {
    // Platform administrators have superuser oversight across all registered organizations
    if (isAdmin) {
      const allOrgs = await getOrganizations();
      return allOrgs || [];
    }

    const membersQuery = query(
      collection(db, MEMBERS_COLLECTION),
      where('userId', '==', userId)
    );
    const memberSnap = await getDocs(membersQuery);
    const orgIds = Array.from(new Set(memberSnap.docs.map((d) => d.data().organizationId as string)));

    if (orgIds.length > 0) {
      const orgDocs = await Promise.all(
        orgIds.map((id) => getOrganizationById(id))
      );
      return orgDocs.filter((o): o is Organization => o !== null);
    }

    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MEMBERS_COLLECTION);
    return [];
  }
}

/**
 * Phase 4.2: Student Organization Application Submission
 *
 * Security & Lifecycle Invariants:
 * 1. Authenticated user UID MUST match requestedBy (derived strictly from auth.currentUser).
 * 2. Organization status is strictly initialized as 'pending'.
 * 3. Normal student account REMAINS a student; NO 'organizer' role or 'owner' membership is granted.
 * 4. Deterministic document ID ({slug}_{userId}) protects against duplicate / concurrent submissions.
 * 5. Input validation enforces clean name (2-120 chars), optional description and logo URL.
 */
export async function createOrganizationRequest(
  input: CreateOrganizationRequestInput,
  userId: string
): Promise<Organization> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Authentication verification failed. Please sign in again.');
  }

  // 1. Strict Input Validation
  const trimmedName = input.name?.trim() || '';
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Organization name must be at least 2 characters.');
  }
  if (trimmedName.length > 120) {
    throw new Error('Organization name must not exceed 120 characters.');
  }

  const trimmedDesc = input.description?.trim() || '';
  if (trimmedDesc.length > 2000) {
    throw new Error('Description must not exceed 2000 characters.');
  }

  const trimmedInstitution = input.institution?.trim() || '';
  if (trimmedInstitution.length > 150) {
    throw new Error('Institution name must not exceed 150 characters.');
  }

  let validLogoUrl: string | undefined = undefined;
  if (input.logoUrl && input.logoUrl.trim()) {
    const rawUrl = input.logoUrl.trim();
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      throw new Error('Logo URL must be a valid http or https web address.');
    }
    if (rawUrl.length > 500) {
      throw new Error('Logo URL must not exceed 500 characters.');
    }
    validLogoUrl = rawUrl;
  }

  // 2. Deterministic Identifier & Slug Generation
  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'club';

  // Deterministic Key per user and slug: guarantees deduplication for this student
  const docId = `org_${slug}_${userId}`;
  const now = new Date().toISOString();

  // 3. Duplicate Application Verification (Student Scope)
  try {
    const existingRequests = await getMyOrganizationRequests(userId);
    const hasDuplicatePending = existingRequests.some(
      (req) => req.status === 'pending' && req.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (hasDuplicatePending) {
      throw new Error('You already have a pending application for this club name awaiting review.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already have a pending application')) {
      throw err;
    }
    // Non-blocking if first-time query
  }

  // 4. Atomic Document Creation
  const orgPayload: Organization = {
    id: docId,
    name: trimmedName,
    description: trimmedDesc,
    ...(validLogoUrl ? { logoUrl: validLogoUrl } : {}),
    ...(trimmedInstitution ? { institution: trimmedInstitution } : {}),
    status: 'pending',
    requestedBy: userId,
    requestedAt: now,
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, orgPayload);
    return orgPayload;
  } catch (error: any) {
    if (error.message && (error.message.includes('already have') || error.message.includes('already registered'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${docId}`);
    throw error;
  }
}

/**
 * Phase 4.2: Retrieve Organization Requests for Authenticated Student
 *
 * Scoped query: requestedBy == userId.
 * Follows security rules ensuring students can ONLY enumerate their own requests.
 */
export async function getMyOrganizationRequests(userId: string): Promise<Organization[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('requestedBy', '==', userId)
    );
    const snap = await getDocs(q);
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Organization));

    // Sort client-side by requestedAt / createdAt descending
    return requests.sort((a, b) => {
      const timeA = new Date(a.requestedAt || a.createdAt).getTime();
      const timeB = new Date(b.requestedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?requestedBy=${userId}`);
    return [];
  }
}

/**
 * Phase 4.2: Retrieve Single Organization Request with Ownership Verification
 */
export async function getOrganizationRequestById(
  id: string,
  userId: string
): Promise<Organization | null> {
  try {
    const org = await getOrganizationById(id);
    if (!org) return null;

    // Student can only view if requestedBy == userId
    if (org.requestedBy && org.requestedBy !== userId) {
      return null;
    }

    return org;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
    return null;
  }
}

/**
 * Phase 4.3: Admin - Retrieve all organization requests across the platform
 */
export async function getAdminOrganizationRequests(
  statusFilter?: OrganizationStatus | 'all'
): Promise<Organization[]> {
  try {
    let q;
    if (statusFilter && statusFilter !== 'all') {
      q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', statusFilter)
      );
    } else {
      q = query(collection(db, COLLECTION_NAME));
    }

    const snap = await getDocs(q);
    const orgs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    } as Organization));

    // Sort newest first
    return orgs.sort((a, b) => {
      const timeA = new Date(a.requestedAt || a.createdAt).getTime();
      const timeB = new Date(b.requestedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

/**
 * Phase 4.3: Admin - Retrieve request detail with secure requester profile lookup
 */
export async function getAdminOrganizationRequestById(
  organizationId: string
): Promise<{
  organization: Organization;
  requesterProfile?: { displayName: string; email: string };
} | null> {
  try {
    const orgDoc = await getOrganizationById(organizationId);
    if (!orgDoc) return null;

    let requesterProfile: { displayName: string; email: string } | undefined = undefined;
    if (orgDoc.requestedBy) {
      try {
        const userRef = doc(db, 'users', orgDoc.requestedBy);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          requesterProfile = {
            displayName: uData.displayName || 'Applicant',
            email: uData.email || ''
          };
        }
      } catch (err) {
        console.warn('Could not securely fetch requester profile:', err);
      }
    }

    return {
      organization: orgDoc,
      requesterProfile
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${organizationId}`);
    return null;
  }
}

/**
 * Phase 4.3: Admin - Retrieve aggregated counts across organization statuses
 */
export async function getAdminOrganizationStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  total: number;
}> {
  try {
    const allOrgs = await getAdminOrganizationRequests('all');
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let suspended = 0;

    for (const org of allOrgs) {
      if (org.status === 'pending') pending++;
      else if (org.status === 'approved' || !org.status) approved++;
      else if (org.status === 'rejected') rejected++;
      else if (org.status === 'suspended') suspended++;
    }

    return {
      pending,
      approved,
      rejected,
      suspended,
      total: allOrgs.length
    };
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    return { pending: 0, approved: 0, rejected: 0, suspended: 0, total: 0 };
  }
}

/**
 * Phase 3 / Phase 6: Organizer & Admin Organization Profile Update
 *
 * Allows authorized members/owners of an approved organization (or platform admins)
 * to update editable organization metadata: name, description, logoUrl, institution.
 * Protected fields (id, status, requestedBy, requestedAt, createdAt) remain strictly immutable.
 */
export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required. Please sign in.');
  }

  const existingOrg = await getOrganizationById(organizationId);
  if (!existingOrg) {
    throw new Error('Organization not found.');
  }

  // Check user authorization: must be org member or admin
  const membership = await getUserOrgMembership(organizationId, currentUser.uid);
  let isPlatformAdmin = false;
  try {
    const roleSnap = await getDoc(doc(db, 'userRoles', currentUser.uid));
    if (roleSnap.exists() && roleSnap.data()?.role === 'admin') {
      isPlatformAdmin = true;
    }
  } catch (err) {
    // ignore
  }

  if (!membership && !isPlatformAdmin) {
    throw new Error('You do not have permission to manage this organization.');
  }

  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString()
  };

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      throw new Error('Organization name must be between 2 and 120 characters.');
    }
    updates.name = trimmedName;
  }

  if (input.description !== undefined) {
    const trimmedDesc = input.description.trim();
    if (trimmedDesc.length > 2000) {
      throw new Error('Organization description cannot exceed 2000 characters.');
    }
    updates.description = trimmedDesc;
  }

  if (input.institution !== undefined) {
    const trimmedInst = input.institution.trim();
    if (trimmedInst.length > 150) {
      throw new Error('Institution name cannot exceed 150 characters.');
    }
    updates.institution = trimmedInst;
  }

  if (input.logoUrl !== undefined) {
    const trimmedLogo = input.logoUrl.trim();
    if (trimmedLogo) {
      if (!trimmedLogo.startsWith('http://') && !trimmedLogo.startsWith('https://')) {
        throw new Error('Logo URL must be a valid http or https web address.');
      }
      if (trimmedLogo.length > 500) {
        throw new Error('Logo URL cannot exceed 500 characters.');
      }
      updates.logoUrl = trimmedLogo;
    } else {
      updates.logoUrl = '';
    }
  }

  try {
    const orgRef = doc(db, COLLECTION_NAME, organizationId);
    await updateDoc(orgRef, updates);

    return {
      ...existingOrg,
      ...updates
    } as Organization;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${organizationId}`);
    throw error;
  }
}

/**
 * Phase 4.3: Admin Organization Approval
 *
 * ATOMIC WORKFLOW:
 * 1. organizations/{orgId}.status = 'approved'
 * 2. userRoles/{requestedBy}.role = 'organizer'
 * 3. organizationMembers/{orgId}_{requestedBy}: role = 'owner'
 *
 * Guarantees zero partial states via single Firestore transaction.
 */
export async function approveOrganization(
  organizationId: string,
  adminUserId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== adminUserId) {
    throw new Error('Administrative authorization verification failed.');
  }

  const now = new Date().toISOString();
  const orgRef = doc(db, COLLECTION_NAME, organizationId);

  try {
    await runTransaction(db, async (tx) => {
      const orgSnap = await tx.get(orgRef);
      if (!orgSnap.exists()) {
        throw new Error('Organization request not found.');
      }

      const orgData = orgSnap.data() as Organization;
      if (orgData.status === 'approved') {
        throw new Error('This organization is already approved.');
      }
      if (orgData.status === 'rejected') {
        throw new Error('Cannot approve an already rejected application.');
      }
      if (orgData.status !== 'pending') {
        throw new Error(`Cannot approve organization with status: ${orgData.status}`);
      }

      const requestedBy = orgData.requestedBy;
      if (!requestedBy) {
        throw new Error('Cannot approve organization without a verified requester identity.');
      }

      const roleRef = doc(db, 'userRoles', requestedBy);
      const membershipDocId = `${organizationId}_${requestedBy}`;
      const memberRef = doc(db, MEMBERS_COLLECTION, membershipDocId);

      // 1. Update organization to approved
      tx.update(orgRef, {
        status: 'approved',
        updatedAt: now
      });

      // 2. Promote requester to organizer
      tx.set(
        roleRef,
        {
          role: 'organizer',
          updatedAt: now
        },
        { merge: true }
      );

      // 3. Create owner membership in organizationMembers
      tx.set(memberRef, {
        id: membershipDocId,
        organizationId,
        userId: requestedBy,
        role: 'owner',
        createdAt: now
      });
    });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('already approved') ||
        error.message.includes('already rejected') ||
        error.message.includes('not found') ||
        error.message.includes('authorization'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${organizationId}`);
    throw error;
  }
}

/**
 * Phase 4.3: Admin Organization Rejection
 *
 * Sets status to 'rejected' without promoting requester or creating memberships.
 */
export async function rejectOrganization(
  organizationId: string,
  adminUserId: string,
  reason?: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== adminUserId) {
    throw new Error('Administrative authorization verification failed.');
  }

  const now = new Date().toISOString();
  const orgRef = doc(db, COLLECTION_NAME, organizationId);

  try {
    await runTransaction(db, async (tx) => {
      const orgSnap = await tx.get(orgRef);
      if (!orgSnap.exists()) {
        throw new Error('Organization request not found.');
      }

      const orgData = orgSnap.data() as Organization;
      if (orgData.status === 'approved') {
        throw new Error('Cannot reject an already approved organization.');
      }
      if (orgData.status !== 'pending') {
        throw new Error(`Only pending applications can be rejected (current: ${orgData.status}).`);
      }

      const cleanReason = reason?.trim();
      tx.update(orgRef, {
        status: 'rejected',
        ...(cleanReason ? { rejectionReason: cleanReason } : {}),
        updatedAt: now
      });
    });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('already approved') ||
        error.message.includes('not found') ||
        error.message.includes('authorization'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${organizationId}`);
    throw error;
  }
}

