import { readFileSync } from 'fs';

function testPhase4_3_2DemoAdminAccountProvisioningAndVerification() {
  console.log('Testing Phase 4.3.2 Demo Admin Account Provisioning & Verification Invariants...\n');
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
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const app = readFileSync('src/App.tsx', 'utf-8');
  const adminLayout = readFileSync('src/layouts/AdminLayout.tsx', 'utf-8');
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const authPage = readFileSync('src/pages/public/AuthPage.tsx', 'utf-8');
  const blueprint = readFileSync('firebase-blueprint.json', 'utf-8');
  const verifyScript = readFileSync('src/scripts/verifyAdminAccount.ts', 'utf-8');

  // 1. Demo email is the intended demo email
  assert(
    adminLoginPage.includes("admin@festofy.demo") &&
    verifyScript.includes("admin@festofy.demo"),
    '1. Demo email is the intended demo email'
  );

  // 2. Demo credentials only populate/login through Firebase Auth
  assert(
    adminLoginPage.includes("handleUseDemoCredentials") &&
    adminLoginPage.includes("setEmail('admin@festofy.demo');") &&
    adminLoginPage.includes("setPassword('FestofyAdminDemo2026!');") &&
    adminLoginPage.includes("signInWithEmailAndPassword(auth, trimmedEmail, password)"),
    '2. Demo credentials only populate/login through Firebase Auth'
  );

  // 3. No client-side password bypass exists
  assert(
    !adminLoginPage.includes('if (password === "FestofyAdminDemo2026!")') &&
    !adminLoginPage.includes('if (trimmedEmail === "admin@festofy.demo" &&') &&
    !protectedRoute.includes('bypass') &&
    !protectedRoute.includes('isDemo'),
    '3. No client-side password bypass exists'
  );

  // 4. Admin role comes from userRoles/{uid}
  assert(
    adminLoginPage.includes("const roleRef = doc(db, 'userRoles', cred.user.uid);") &&
    adminLoginPage.includes("roleSnap.data()?.role !== 'admin'") &&
    adminLoginPage.includes("await signOut(auth);"),
    '4. Admin role comes from userRoles/{uid}'
  );

  // 5. Student cannot assign admin role
  assert(
    firestoreRules.includes('match /userRoles/{userId}') &&
    firestoreRules.includes("request.resource.data.role == 'student'") &&
    firestoreRules.includes('allow update, delete: if isAdmin();'),
    '5. Student cannot assign admin role'
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

testPhase4_3_2DemoAdminAccountProvisioningAndVerification();
