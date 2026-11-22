import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth, db } from '../lib/firebase/config';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';
import { UserRoleType } from '../types';

export interface AdminAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  role: UserRoleType;
  photoURL?: string;
  updatedAt?: string;
}

async function verifyAdminCaller(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required. Please sign in as a platform administrator.');
  }

  try {
    const roleSnap = await getDoc(doc(db, 'userRoles', currentUser.uid));
    if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
      throw new Error('Administrator privileges are required to manage admin accounts.');
    }
    return currentUser.uid;
  } catch (error: any) {
    if (error?.message?.includes('Administrator privileges')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, `userRoles/${currentUser.uid}`);
  }
}

/**
 * Retrieve all accounts currently assigned the 'admin' role in userRoles.
 */
export async function getPlatformAdmins(): Promise<AdminAccountRecord[]> {
  await verifyAdminCaller();

  let rolesSnap;
  try {
    rolesSnap = await getDocs(
      query(collection(db, 'userRoles'), where('role', '==', 'admin'))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'userRoles');
  }

  const admins = await Promise.all(
    rolesSnap.docs.map(async (roleDoc) => {
      const uid = roleDoc.id;
      const roleData = roleDoc.data();
      let email = '';
      let displayName = 'Administrator';
      let photoURL = '';

      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const u = userSnap.data();
          email = u.email || '';
          displayName = u.displayName || (email ? email.split('@')[0] : 'Administrator');
          photoURL = u.photoURL || '';
        }
      } catch (err) {
        console.warn(`Could not load user profile for admin ${uid}:`, err);
      }

      return {
        uid,
        email,
        displayName,
        role: 'admin' as UserRoleType,
        photoURL,
        updatedAt: roleData.updatedAt || roleData.createdAt
      };
    })
  );

  return admins.sort((a, b) => (a.email || a.uid).localeCompare(b.email || b.uid));
}

/**
 * Retrieve registered users who do not yet have the 'admin' role.
 * Allows platform administrators to promote newly signed-up users with 1 click.
 */
export async function getNonAdminUsers(): Promise<AdminAccountRecord[]> {
  await verifyAdminCaller();

  let usersSnap;
  try {
    usersSnap = await getDocs(collection(db, 'users'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }

  let rolesSnap;
  try {
    rolesSnap = await getDocs(collection(db, 'userRoles'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'userRoles');
  }

  const roleMap = new Map<string, { role: UserRoleType; updatedAt?: string }>();
  rolesSnap.docs.forEach((d) => {
    const data = d.data();
    const r = data?.role;
    const normalized: UserRoleType =
      r === 'admin' || r === 'organizer' || r === 'student' ? r : 'student';
    roleMap.set(d.id, {
      role: normalized,
      updatedAt: data?.updatedAt || data?.createdAt
    });
  });

  const nonAdmins: AdminAccountRecord[] = [];
  usersSnap.docs.forEach((userDoc) => {
    const uid = userDoc.id;
    const roleEntry = roleMap.get(uid);
    const assignedRole: UserRoleType = roleEntry?.role || 'student';
    if (assignedRole === 'admin') return;

    const u = userDoc.data();
    const email = typeof u.email === 'string' ? u.email : '';
    nonAdmins.push({
      uid,
      email,
      displayName: u.displayName || (email ? email.split('@')[0] : 'User'),
      role: assignedRole,
      photoURL: u.photoURL || '',
      updatedAt: roleEntry?.updatedAt || u.updatedAt || u.createdAt
    });
  });

  return nonAdmins.sort((a, b) => (a.email || a.uid).localeCompare(b.email || b.uid));
}

/**
 * Promote an existing registered user to 'admin' by email address.
 * Looks up the user in the `users` collection and updates `userRoles/{uid}.role = 'admin'`.
 */
export async function promoteUserToAdminByEmail(
  rawEmail: string
): Promise<AdminAccountRecord> {
  await verifyAdminCaller();

  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  let usersSnap;
  try {
    usersSnap = await getDocs(collection(db, 'users'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }

  const matchedUser = usersSnap.docs.find((d) => {
    const emailVal = d.data()?.email;
    return typeof emailVal === 'string' && emailVal.trim().toLowerCase() === normalizedEmail;
  });

  if (!matchedUser) {
    throw new Error(
      `No registered user found with email "${rawEmail.trim()}". Ask the user to sign up at /admin/login or sign in at /auth first so their account exists in Firestore.`
    );
  }

  const targetUid = matchedUser.id;
  const userData = matchedUser.data();
  const roleRef = doc(db, 'userRoles', targetUid);

  let existingCreatedAt: string | undefined;
  try {
    const roleSnap = await getDoc(roleRef);
    if (roleSnap.exists()) {
      const rData = roleSnap.data();
      if (rData?.role === 'admin') {
        throw new Error(`${userData.email || rawEmail.trim()} is already a platform administrator.`);
      }
      existingCreatedAt = rData?.createdAt;
    }
  } catch (error: any) {
    if (error?.message?.includes('already a platform administrator')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, `userRoles/${targetUid}`);
  }

  const now = new Date().toISOString();
  try {
    await setDoc(
      roleRef,
      {
        role: 'admin',
        createdAt: existingCreatedAt || now,
        updatedAt: now
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userRoles/${targetUid}`);
  }

  return {
    uid: targetUid,
    email: userData.email || rawEmail.trim(),
    displayName: userData.displayName || normalizedEmail.split('@')[0],
    role: 'admin',
    photoURL: userData.photoURL || '',
    updatedAt: now
  };
}

/**
 * Demote another administrator back to 'student'.
 * Prevents self-demotion and guarantees at least one admin remains.
 */
export async function revokeAdminRole(targetUid: string): Promise<void> {
  const callerUid = await verifyAdminCaller();

  if (targetUid === callerUid) {
    throw new Error('You cannot remove your own administrator access.');
  }

  let rolesSnap;
  try {
    rolesSnap = await getDocs(
      query(collection(db, 'userRoles'), where('role', '==', 'admin'))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'userRoles');
  }

  if (rolesSnap.size <= 1) {
    throw new Error('At least one platform administrator must remain active.');
  }

  const now = new Date().toISOString();
  const roleRef = doc(db, 'userRoles', targetUid);

  try {
    await setDoc(
      roleRef,
      {
        role: 'student',
        updatedAt: now
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `userRoles/${targetUid}`);
  }
}

/**
 * Create a brand-new Email/Password administrator account directly from the Admin Console
 * without signing out the active administrator or requiring a separate approval step.
 */
export async function createAdminAccountDirect(params: {
  displayName: string;
  email: string;
  password: string;
}): Promise<AdminAccountRecord> {
  await verifyAdminCaller();

  const trimmedName = params.displayName.trim().slice(0, 120);
  const normalizedEmail = params.email.trim().toLowerCase().slice(0, 150);
  const password = params.password;

  if (trimmedName.length < 2) {
    throw new Error('Please enter a full name (at least 2 characters).');
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const secondaryApp = initializeApp(
    firebaseConfig,
    `admin-provisioner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = (() => {
    try {
      return initializeFirestore(
        secondaryApp,
        { experimentalForceLongPolling: true },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      return getFirestore(secondaryApp, firebaseConfig.firestoreDatabaseId);
    }
  })();

  try {
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error(
          `An account for "${normalizedEmail}" already exists. Use Promote User by Email or click Promote in the list below to grant admin access immediately.`
        );
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose at least 6 characters.');
      }
      if (err?.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password provider is currently disabled in Firebase Console → Authentication → Sign-in method.'
        );
      }
      throw new Error(err?.message || 'Unable to create Firebase Auth user.');
    }

    await updateProfile(cred.user, { displayName: trimmedName }).catch(() => {});

    const newUid = cred.user.uid;
    const now = new Date().toISOString();

    // Write users/{uid} via the newly created user's own session (satisfies isOwner(userId))
    try {
      await setDoc(doc(secondaryDb, 'users', newUid), {
        displayName: trimmedName,
        email: normalizedEmail,
        photoURL: '',
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${newUid}`);
    }

    // Grant 'admin' role directly via the caller's verified admin session (satisfies isAdmin())
    try {
      await setDoc(doc(db, 'userRoles', newUid), {
        role: 'admin',
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `userRoles/${newUid}`);
    }

    return {
      uid: newUid,
      email: normalizedEmail,
      displayName: trimmedName,
      role: 'admin',
      photoURL: '',
      updatedAt: now
    };
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}
