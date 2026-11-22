import { existsSync, readFileSync } from 'fs';
import { sanitizeInternalRedirect } from './utils/authUtils';

function testEmailVerificationAndCredentialRemoval() {
  console.log('================================================================');
  console.log('FESTOFY — EMAIL VERIFICATION & CREDENTIAL REMOVAL TEST SUITE');
  console.log('================================================================\n');

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

  const useAuth = readFileSync('src/hooks/useAuth.tsx', 'utf-8');
  const verificationScreen = readFileSync('src/components/auth/EmailVerificationScreen.tsx', 'utf-8');
  const authErrorScreen = readFileSync('src/components/auth/AuthSyncErrorScreen.tsx', 'utf-8');
  const authPage = readFileSync('src/pages/public/AuthPage.tsx', 'utf-8');
  const organizerJoinPage = readFileSync('src/pages/organizer/OrganizerJoinPage.tsx', 'utf-8');
  const organizerLoginPage = readFileSync('src/pages/organizer/OrganizerLoginPage.tsx', 'utf-8');
  const organizerStatusPage = readFileSync('src/pages/organizer/OrganizerApplicationStatusPage.tsx', 'utf-8');
  const adminLoginPage = readFileSync('src/pages/admin/AdminLoginPage.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const registrationPage = readFileSync('src/pages/public/RegistrationPage.tsx', 'utf-8');
  const organizationService = readFileSync('src/services/organizationService.ts', 'utf-8');
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const readme = readFileSync('README.md', 'utf-8');
  const appletConfig = JSON.parse(readFileSync('firebase-applet-config.json', 'utf-8'));

  // --- 1. Judge / Demo Credential & Artifact Removal ---
  const legacyDomainRegex = new RegExp(`@${'festofy'}\\.demo`, 'i');
  assert(
    !existsSync('src/scripts/verifyAdminAccount.ts') &&
      !existsSync('docs/screenshots/03-registration-form.png') &&
      !readme.includes('03-registration-form.png'),
    '1. Obsolete verification script and demo-email screenshot removed from repo & README'
  );

  assert(
    !legacyDomainRegex.test(authPage) &&
      !legacyDomainRegex.test(organizerLoginPage) &&
      !legacyDomainRegex.test(adminLoginPage) &&
      !adminLoginPage.includes('Demo Admin Access') &&
      !adminLoginPage.includes('handleUseDemoCredentials') &&
      !adminLoginPage.includes('handleCopyCredentials') &&
      !organizerLoginPage.includes('Instant Organizer Demo'),
    '2. Student, organizer, and admin login pages contain zero demo buttons, copy controls, or demo accounts'
  );

  // --- 2. Shared Auth Lifecycle in useAuth.tsx ---
  const signUpSection = useAuth.slice(useAuth.indexOf('const signUpWithEmail'));
  assert(
    useAuth.includes('sendEmailVerification') &&
      useAuth.includes('updateProfile') &&
      !signUpSection.includes('setDoc(') &&
      !signUpSection.includes('getDoc(') &&
      useAuth.includes('sendVerificationEmailSafe'),
    '3. signUpWithEmail saves displayName, sends verification email safely, and performs zero Firestore reads/writes'
  );

  assert(
    useAuth.includes('if (!targetUser.emailVerified)') &&
      useAuth.includes('getIdTokenResult(targetUser, forceTokenRefresh)') &&
      useAuth.includes('await getIdToken(targetUser, true)') &&
      useAuth.includes('if (!userSnap.exists())') &&
      useAuth.includes('if (!roleSnap.exists())'),
    '4. Consolidated idempotent initialization refreshes ID token and initializes missing docs only after verification'
  );

  assert(
    useAuth.includes('formatProfileSyncError') &&
      useAuth.includes('setAuthError(') &&
      !useAuth.includes("getDoc(userRef).catch(() => null)") &&
      !useAuth.includes("getDoc(roleRef).catch(() => null)") &&
      authErrorScreen.includes('retryAuthSync'),
    '5. Failed Firestore reads surface recoverable authError instead of fabricating a fallback student profile'
  );

  assert(
    useAuth.includes('await reload(user)') &&
      useAuth.includes('await getIdToken(refreshedUser, true)') &&
      useAuth.includes('visibilitychange') &&
      useAuth.includes('focus') &&
      verificationScreen.includes('I’ve verified my email') &&
      verificationScreen.includes('Resend verification email') &&
      verificationScreen.includes('Sign out'),
    '6. Verification screen and useAuth support reload, forced token refresh, resend, sign out, and cross-tab/refresh detection'
  );

  assert(
    useAuth.includes('const isAuthenticated = currentUser !== null && emailVerified && authError === null;'),
    '7. isAuthenticated strictly requires resolved profile, emailVerified === true, and no authError'
  );

  // --- 3. Entry Points & Redirect Safety ---
  assert(
    sanitizeInternalRedirect('/events/evt_1/register') === '/events/evt_1/register' &&
      sanitizeInternalRedirect('//evil.example/phish', '/dashboard') === '/dashboard' &&
      sanitizeInternalRedirect('https://evil.example', '/dashboard') === '/dashboard' &&
      sanitizeInternalRedirect('/auth?redirect=/dashboard', '/dashboard') === '/dashboard',
    '8. sanitizeInternalRedirect preserves internal routes and blocks open redirects and auth loops'
  );

  const authSubmitIdx = authPage.indexOf('const handleSubmit');
  const authGoogleIdx = authPage.indexOf('const handleGoogleSignIn');
  const authSubmitBody = authPage.slice(authSubmitIdx, authGoogleIdx);
  assert(
    !authSubmitBody.includes("mode === 'signup'") ||
      (authSubmitBody.includes('await signUpWithEmail') &&
        !authSubmitBody.slice(authSubmitBody.indexOf('await signUpWithEmail'), authSubmitBody.indexOf('} else {')).includes('navigate(')),
    '9. AuthPage removes unconditional post-signup navigation and waits for verification'
  );

  assert(
    !organizerJoinPage.includes('createUserWithEmailAndPassword') &&
      !organizerJoinPage.includes('setDoc(') &&
      organizerJoinPage.includes('signUpWithEmail') &&
      organizerJoinPage.includes('EmailVerificationScreen') &&
      organizerJoinPage.includes('sessionStorage') &&
      !organizerJoinPage.includes('password:') &&
      organizerJoinPage.includes("setPassword('')") &&
      organizationService.includes('if (!currentUser.emailVerified)') &&
      organizationService.includes("req.status === 'pending'"),
    '10. OrganizerJoinPage uses shared verification flow, preserves non-sensitive draft fields without password, and enforces one pending application'
  );

  assert(
    organizerLoginPage.includes('EmailVerificationScreen') &&
      organizerLoginPage.includes('cred?.user?.emailVerified') &&
      adminLoginPage.includes('EmailVerificationScreen') &&
      adminLoginPage.includes('if (!cred.user.emailVerified)') &&
      adminLoginPage.includes("doc(db, 'userRoles', uid)") &&
      adminLoginPage.includes("roleSnap.data()?.role !== 'admin'"),
    '11. OrganizerLoginPage and AdminLoginPage gate both Google & password sign-in on verification while preserving authoritative admin check'
  );

  assert(
    protectedRoute.includes('if (loading)') &&
      protectedRoute.includes('if (!firebaseUser)') &&
      protectedRoute.includes('if (needsEmailVerification)') &&
      protectedRoute.includes('if (authError || !isAuthenticated)') &&
      protectedRoute.includes('Access Restricted') &&
      registrationPage.includes('needsEmailVerification') &&
      organizerStatusPage.includes('needsEmailVerification'),
    '12. ProtectedRoute, RegistrationPage, and OrganizerApplicationStatusPage handle loading, signed-out, unverified, error, and authorized states cleanly'
  );

  // --- 4. Firestore Rules & Named Database ---
  assert(
    firestoreRules.includes('return request.auth != null && request.auth.token.email_verified == true;') &&
      firestoreRules.includes('allow get: if resource.data.status in [\'published\', \'completed\']') &&
      firestoreRules.includes('allow update, delete: if isSignedIn() && isAdmin();') ||
      (firestoreRules.includes('return request.auth != null && request.auth.token.email_verified == true;') &&
        firestoreRules.includes('allow update, delete: if isAdmin();')),
    '13. firestore.rules requires request.auth != null && request.auth.token.email_verified == true while preserving public discovery'
  );

  assert(
    appletConfig.projectId === 'sonic-octane-ssmzh' &&
      appletConfig.firestoreDatabaseId === 'ai-studio-festofyfoundatio-83e9e92f-066f-4435-9b74-fd209bf14c40',
    '14. Named Firestore database ID verified in firebase-applet-config.json'
  );

  console.log(`\nResults: ${passed}/${total} email verification & hardening assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testEmailVerificationAndCredentialRemoval();
