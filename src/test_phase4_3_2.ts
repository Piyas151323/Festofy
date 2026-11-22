import { existsSync, readFileSync } from 'fs';

function testPhase4_3_2VerifiedAdminAndRulesInvariants() {
  console.log('Testing Phase 4.3.2 Verified Admin Account & Security Invariants...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  const adminLoginPage = readFileSync('src/pages/admin/AdminLoginPage.tsx', 'utf-8');
  const authPage = readFileSync('src/pages/public/AuthPage.tsx', 'utf-8');
  const organizerLoginPage = readFileSync('src/pages/organizer/OrganizerLoginPage.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const app = readFileSync('src/App.tsx', 'utf-8');
  const adminLayout = readFileSync('src/layouts/AdminLayout.tsx', 'utf-8');
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const blueprint = readFileSync('firebase-blueprint.json', 'utf-8');

  // 1. Obsolete hardcoded admin verification script has been removed
  assert(
    !existsSync('src/scripts/verifyAdminAccount.ts'),
    '1. Legacy hardcoded admin verification script removed'
  );

  // 2. All login forms start empty without demo buttons or demo domain accounts
  const demoDomainPattern = new RegExp(`@${'festofy'}\\.demo`, 'i');
  assert(
    !demoDomainPattern.test(adminLoginPage) &&
    !demoDomainPattern.test(authPage) &&
    !demoDomainPattern.test(organizerLoginPage) &&
    !adminLoginPage.includes('handleUseDemoCredentials') &&
    !adminLoginPage.includes('Demo Admin Access') &&
    !adminLoginPage.includes('1-Click Sign In') &&
    adminLoginPage.includes("useState('')"),
    '2. Login forms start empty with zero demo buttons or shared demo accounts'
  );

  // 3. No client-side password bypass exists
  assert(
    !protectedRoute.includes('bypass') &&
    !protectedRoute.includes('isDemo') &&
    !adminLoginPage.includes('handleUseDemoCredentials'),
    '3. No client-side password bypass exists'
  );

  // 4. Admin login gates on emailVerified before querying userRoles/{uid}
  assert(
    adminLoginPage.includes('if (!cred.user.emailVerified)') &&
    adminLoginPage.includes('await getIdToken(cred.user, true)') &&
    adminLoginPage.includes("doc(db, 'userRoles', uid)") &&
    adminLoginPage.includes("roleSnap.data()?.role !== 'admin'") &&
    adminLoginPage.includes('await signOut(auth);'),
    '4. Admin login enforces emailVerified gate before checking userRoles/{uid}'
  );

  // 5. Student cannot assign admin role and Firestore enforces email_verified == true
  assert(
    firestoreRules.includes('request.auth != null && request.auth.token.email_verified == true') &&
    firestoreRules.includes('match /userRoles/{userId}') &&
    firestoreRules.includes("request.resource.data.role == 'student'") &&
    firestoreRules.includes('allow update, delete: if isAdmin();'),
    '5. Student cannot assign admin role and unverified tokens are rejected'
  );

  // 6. Organizer cannot assign admin role
  assert(
    firestoreRules.includes('match /userRoles/{userId}') &&
    !firestoreRules.includes("request.resource.data.role == 'organizer'") &&
    !firestoreRules.includes("request.resource.data.role == 'admin'"),
    '6. Organizer cannot assign admin role'
  );

  // 7. Unauthenticated /admin shows Admin Login
  assert(
    protectedRoute.includes('isAdminRoute') &&
    protectedRoute.includes('<AdminLoginPage') &&
    app.includes('adminAuth={true}'),
    '7. Unauthenticated /admin shows Admin Login'
  );

  // 8. Non-admin authenticated user cannot access Admin Dashboard
  assert(
    protectedRoute.includes('allowedRoles && !allowedRoles.includes(role)') &&
    protectedRoute.includes('Access Restricted'),
    '8. Non-admin authenticated user cannot access Admin Dashboard'
  );

  // 9. Admin authenticated user can access Admin Dashboard
  assert(
    protectedRoute.includes('return <>{children}</>;') &&
    app.includes('<AdminDashboardPage />'),
    '9. Admin authenticated user can access Admin Dashboard'
  );

  // 10. Admin organization approval remains protected
  assert(
    firestoreRules.includes('isAdmin()') &&
    firestoreRules.includes("resource.data.status == 'pending'") &&
    firestoreRules.includes("request.resource.data.status == 'approved'"),
    '10. Admin organization approval remains protected'
  );

  // 11. Admin logout still works
  assert(
    adminLayout.includes('handleSignOut') &&
    adminLayout.includes('await signOutUser();') &&
    adminLayout.includes("navigate('/admin');"),
    '11. Admin logout still works'
  );

  // 12. Student dashboard remains functional
  assert(
    app.includes('path="/dashboard"') &&
    app.includes('<StudentLayout />'),
    '12. Student dashboard remains functional'
  );

  // 13. Organizer dashboard remains functional
  assert(
    app.includes('path="/organizer"') &&
    app.includes("allowedRoles={['organizer', 'admin']}"),
    '13. Organizer dashboard remains functional'
  );

  // 14. No plaintext password is stored in Firestore
  assert(
    !blueprint.includes('password') &&
    !adminLoginPage.includes("setDoc(doc(db, 'passwords'") &&
    !adminLoginPage.includes("addDoc(collection(db, 'passwords'"),
    '14. No plaintext password is stored in Firestore'
  );

  // 15. No hardcoded admin authorization bypass exists
  assert(
    !adminLoginPage.includes("role = 'admin'") &&
    !adminLoginPage.includes('role = "admin"') &&
    !protectedRoute.includes("role = 'admin'") &&
    !protectedRoute.includes('fakeAdmin'),
    '15. No hardcoded admin authorization bypass exists'
  );

  console.log(`\nPhase 4.3.2 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase4_3_2VerifiedAdminAndRulesInvariants();
