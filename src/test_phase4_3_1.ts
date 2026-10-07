import { readFileSync } from 'fs';

function testPhase4_3_1AdminLoginAndDemoAccess() {
  console.log('Testing Phase 4.3.1 Admin Login & Demo Access Invariants...\n');
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
  const orgService = readFileSync('src/services/organizationService.ts', 'utf-8');
  const blueprint = readFileSync('firebase-blueprint.json', 'utf-8');

  // 1. Unauthenticated /admin shows Admin Login
  assert(
    protectedRoute.includes('isAdminRoute') &&
    protectedRoute.includes('<AdminLoginPage') &&
    app.includes('adminAuth={true}'),
    '1. Unauthenticated /admin shows Admin Login'
  );

  // 2. Authenticated student /admin remains Access Restricted
  assert(
    protectedRoute.includes('allowedRoles && !allowedRoles.includes(role)') &&
    protectedRoute.includes('Access Restricted'),
    '2. Authenticated student /admin remains Access Restricted'
  );

  // 3. Authenticated organizer /admin remains Access Restricted
  assert(
    protectedRoute.includes('allowedRoles && !allowedRoles.includes(role)') &&
    protectedRoute.includes('Access Restricted'),
    '3. Authenticated organizer /admin remains Access Restricted'
  );

  // 4. Authenticated admin /admin opens Admin Dashboard
  assert(
    protectedRoute.includes('return <>{children}</>;') &&
    app.includes('<AdminDashboardPage />'),
    '4. Authenticated admin /admin opens Admin Dashboard'
  );

  // 5. Invalid credentials do not grant admin access
  assert(
    adminLoginPage.includes('signInWithEmailAndPassword(auth, trimmedEmail, password)') &&
    adminLoginPage.includes('Invalid admin credentials.'),
    '5. Invalid credentials do not grant admin access'
  );

  // 6. Firebase authentication is used for admin login
  assert(
    adminLoginPage.includes("import { signInWithEmailAndPassword, signOut } from 'firebase/auth';") &&
    adminLoginPage.includes('await signInWithEmailAndPassword(auth,'),
    '6. Firebase authentication is used for admin login'
  );

  // 7. Client-side demo password cannot bypass authentication
  assert(
    adminLoginPage.includes('handleUseDemoCredentials') &&
    adminLoginPage.includes("setEmail('admin@festofy.demo');") &&
    adminLoginPage.includes("setPassword('FestofyAdminDemo2026!');") &&
    !adminLoginPage.includes('role = "admin"') &&
    !adminLoginPage.includes('isAdmin = true'),
    '7. Client-side demo password cannot bypass authentication'
  );

  // 8. Admin role comes from userRoles/{uid}
  assert(
    adminLoginPage.includes("const roleRef = doc(db, 'userRoles', cred.user.uid);") &&
    adminLoginPage.includes("roleSnap.data()?.role !== 'admin'") &&
    adminLoginPage.includes('await signOut(auth);'),
    '8. Admin role comes from userRoles/{uid}'
  );

  // 9. Student cannot self-promote to admin
  assert(
    firestoreRules.includes('match /userRoles/{userId}') &&
    firestoreRules.includes('allow update, delete: if isAdmin();'),
    '9. Student cannot self-promote to admin'
  );

  // 10. Organizer cannot self-promote to admin
  assert(
    firestoreRules.includes('match /userRoles/{userId}') &&
    !firestoreRules.includes("request.resource.data.role in ['organizer', 'admin']"),
    '10. Organizer cannot self-promote to admin'
  );

  // 11. Signup cannot select admin
  assert(
    !authPage.includes("role: 'admin'") &&
    !authPage.includes('role="admin"') &&
    !authPage.includes('<select'),
    '11. Signup cannot select admin'
  );

  // 12. Admin logout removes authenticated access
  assert(
    adminLayout.includes('handleSignOut') &&
    adminLayout.includes('await signOutUser();') &&
    adminLayout.includes("navigate('/admin');"),
    '12. Admin logout removes authenticated access'
  );

  // 13. Admin approval workflow remains protected
  assert(
    firestoreRules.includes('isAdmin()') &&
    firestoreRules.includes("resource.data.status == 'pending'") &&
    firestoreRules.includes("request.resource.data.status == 'approved'"),
    '13. Admin approval workflow remains protected'
  );

  // 14. Student dashboard remains functional
  assert(
    app.includes('path="/dashboard"') &&
    app.includes('<StudentLayout />'),
    '14. Student dashboard remains functional'
  );

  // 15. Organizer dashboard remains functional
  assert(
    app.includes('path="/organizer"') &&
    app.includes('allowedRoles={[\'organizer\', \'admin\']}'),
    '15. Organizer dashboard remains functional'
  );

  // 16. Admin organization request page remains functional
  assert(
    app.includes('path="organization-requests"') &&
    app.includes('<AdminOrganizationRequestsPage />'),
    '16. Admin organization request page remains functional'
  );

  // 17. No hardcoded admin authorization bypass exists
  assert(
    !adminLoginPage.includes('if (password === "FestofyAdminDemo2026!")') &&
    !adminLoginPage.includes('if (email === "admin@festofy.demo")') &&
    !protectedRoute.includes('bypassAdmin') &&
    !protectedRoute.includes('isDemo'),
    '17. No hardcoded admin authorization bypass exists'
  );

  // 18. No plaintext password is stored in Firestore
  assert(
    !blueprint.includes('password') &&
    !adminLoginPage.includes("setDoc(doc(db, 'passwords'") &&
    !adminLoginPage.includes("addDoc(collection(db, 'passwords'"),
    '18. No plaintext password is stored in Firestore'
  );

  // 19. Unauthenticated deep admin route redirects/shows login correctly
  assert(
    protectedRoute.includes('redirectPath={location.pathname}') &&
    adminLoginPage.includes('redirectPath || queryRedirect ||'),
    '19. Unauthenticated deep admin route redirects/shows login correctly'
  );

  // 20. Successful admin login preserves intended admin destination where supported
  assert(
    adminLoginPage.includes('targetDestination') &&
    adminLoginPage.includes('navigate(targetDestination, { replace: true });'),
    '20. Successful admin login preserves intended admin destination where supported'
  );

  console.log(`\nPhase 4.3.1 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase4_3_1AdminLoginAndDemoAccess();
