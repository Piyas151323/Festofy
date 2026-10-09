import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';
import { INITIAL_CATEGORIES } from '../services/seedService';

/**
 * Idempotent Firestore Database Structure Rebuilder
 *
 * Recreates missing core master taxonomy and provisions platform admin roles:
 * - userRoles/{adminUid}: role === 'admin'
 * - users/{adminUid}: Administrator user profile
 * - eventCategories/{categoryId}: Platform competition taxonomy
 *
 * Invariants:
 * - Idempotent: Can safely run multiple times without overwriting or duplicating data
 * - Clean: Does not insert fake events, festivals, registrations, students, or organizations
 */
export async function initializeFirestore(): Promise<{
  success: boolean;
  adminProvisioned: boolean;
  categoriesProvisioned: number;
  details: string[];
}> {
  const details: string[] = [];
  const adminEmail = 'admin@festofy.demo';
  const adminPassword = 'FestofyAdminDemo2026!';

  console.log('Starting Firestore Initialization & Structure Rebuild...');

  // 1. Authenticate with provisioned admin credentials
  let adminUid = '';
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    adminUid = cred.user.uid;
    details.push(`Authenticated as admin: ${adminEmail} (UID: ${adminUid})`);
    console.log(`[AUTH] Authenticated as admin: ${adminEmail} (UID: ${adminUid})`);
  } catch (err: any) {
    const msg = `Failed to authenticate admin credentials: ${err?.message || err}`;
    console.error(`[ERROR] ${msg}`);
    return {
      success: false,
      adminProvisioned: false,
      categoriesProvisioned: 0,
      details: [msg]
    };
  }

  const nowIso = new Date().toISOString();

  // 2. Rebuild userRoles document for Admin
  let adminRoleProvisioned = false;
  try {
    const roleRef = doc(db, 'userRoles', adminUid);
    const roleSnap = await getDoc(roleRef);
    if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
      await setDoc(roleRef, {
        role: 'admin',
        createdAt: roleSnap.exists() ? roleSnap.data()?.createdAt : nowIso,
        updatedAt: nowIso
      }, { merge: true });
      adminRoleProvisioned = true;
      details.push(`Provisioned userRoles/${adminUid} as 'admin'`);
      console.log(`[USER_ROLES] Provisioned userRoles/${adminUid} as 'admin'`);
    } else {
      adminRoleProvisioned = true;
      details.push(`userRoles/${adminUid} already verified as 'admin'`);
      console.log(`[USER_ROLES] userRoles/${adminUid} already verified as 'admin'`);
    }
  } catch (err: any) {
    details.push(`Notice setting userRoles/${adminUid}: ${err.message}`);
    console.error(`[USER_ROLES ERROR] ${err.message}`);
  }

  // 3. Rebuild users document for Admin
  try {
    const userRef = doc(db, 'users', adminUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: 'Festofy Platform Administrator',
        email: adminEmail,
        photoURL: '',
        createdAt: nowIso,
        updatedAt: nowIso
      });
      details.push(`Provisioned users/${adminUid} profile`);
      console.log(`[USERS] Provisioned users/${adminUid} profile`);
    } else {
      details.push(`users/${adminUid} profile already exists`);
      console.log(`[USERS] users/${adminUid} profile already exists`);
    }
  } catch (err: any) {
    details.push(`Notice setting users/${adminUid}: ${err.message}`);
    console.error(`[USERS ERROR] ${err.message}`);
  }

  // 4. Rebuild Event Categories Taxonomy
  let categoriesCount = 0;
  for (const cat of INITIAL_CATEGORIES) {
    try {
      const catRef = doc(db, 'eventCategories', cat.id);
      const catSnap = await getDoc(catRef);
      if (!catSnap.exists()) {
        await setDoc(catRef, cat);
        categoriesCount++;
        details.push(`Created category: ${cat.name} (${cat.id})`);
        console.log(`[CATEGORIES] Created category: ${cat.name} (${cat.id})`);
      } else {
        categoriesCount++;
        details.push(`Category exists: ${cat.name} (${cat.id})`);
        console.log(`[CATEGORIES] Category exists: ${cat.name} (${cat.id})`);
      }
    } catch (err: any) {
      details.push(`Notice provisioning category ${cat.id}: ${err.message}`);
      console.error(`[CATEGORIES ERROR] ${err.message}`);
    }
  }

  console.log(`\nFirestore Initialization Complete. ${categoriesCount} categories and admin role provisioned.`);

  return {
    success: true,
    adminProvisioned: adminRoleProvisioned,
    categoriesProvisioned: categoriesCount,
    details
  };
}

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('initFirestore.ts')) {
  initializeFirestore()
    .then((res) => {
      console.log('\n=== Initialization Results ===');
      console.log(`Success:                ${res.success}`);
      console.log(`Admin Provisioned:      ${res.adminProvisioned}`);
      console.log(`Categories Provisioned: ${res.categoriesProvisioned}`);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal initialization error:', err);
      process.exit(1);
    });
}
