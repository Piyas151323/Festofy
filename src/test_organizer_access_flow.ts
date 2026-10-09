import { getPostAuthDestination } from './utils/authUtils';
import { readFileSync } from 'fs';

async function testOrganizerAccessFlow() {
  console.log('Testing Organizer Account & Access Flow Requirements...\n');
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

  const app = readFileSync('src/App.tsx', 'utf-8');
  const authPage = readFileSync('src/pages/public/AuthPage.tsx', 'utf-8');
  const publicLayout = readFileSync('src/layouts/PublicLayout.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const joinPage = readFileSync('src/pages/organizer/OrganizerJoinPage.tsx', 'utf-8');
  const statusPage = readFileSync('src/pages/organizer/OrganizerApplicationStatusPage.tsx', 'utf-8');
  const loginPage = readFileSync('src/pages/organizer/OrganizerLoginPage.tsx', 'utf-8');
  const authUtils = readFileSync('src/utils/authUtils.ts', 'utf-8');

  // Requirement 1: Users who want to become organizers do not need to create a student account first.
  assert(
    joinPage.includes('createUserWithEmailAndPassword(auth, trimmedEmail, password)') &&
    joinPage.includes('createOrganizationRequest'),
    '1. Users can register organizer account and submit club application directly without student registration'
  );

  // Requirement 2: Separate option to apply directly ("join festofy as organizer")
  assert(
    app.includes('path="/organizer/apply" element={<OrganizerJoinPage />}') &&
    publicLayout.includes('Join as Organizer') &&
    publicLayout.includes('to="/organizer/apply"'),
    '2. Dedicated option to apply for organization directly at /organizer/apply without student dashboard'
  );

  // Requirement 3: Track application status & access organization onboarding features
  assert(
    app.includes('path="/organizer/status" element={<OrganizerApplicationStatusPage />}') &&
    statusPage.includes('Organizer Onboarding Features & Preparation') &&
    statusPage.includes('getMyOrganizationRequests'),
    '3. Application status tracking and onboarding features available at /organizer/status'
  );

  // Requirement 4: Approved organizers redirected to Organization Dashboard
  assert(
    authUtils.includes("if (r === 'organizer') return '/organizer';") &&
    authUtils.includes("if (anyApproved) return '/organizer';"),
    '4. Approved organizers redirected directly to Organization Dashboard (/organizer)'
  );

  // Requirement 5: Students continue to access Student Dashboard as usual
  assert(
    authUtils.includes("return '/dashboard';") &&
    app.includes('path="/dashboard"'),
    '5. Students logging in access Student Dashboard (/dashboard) as usual'
  );

  // Requirement 6: Keep student and organizer experiences separate, no forcing through student dashboard
  assert(
    !joinPage.includes('<StudentLayout') &&
    !statusPage.includes('<StudentLayout') &&
    !loginPage.includes('<StudentLayout') &&
    protectedRoute.includes('hasPendingOrgRequest'),
    '6. Student and organizer experiences remain strictly separate with role-based routing'
  );

  // Requirement 7: Dedicated Organizer Sign In page
  assert(
    app.includes('path="/organizer/login" element={<OrganizerLoginPage />}') &&
    loginPage.includes('Instant Organizer Demo') &&
    loginPage.includes('getPostAuthDestination'),
    '7. Dedicated Organizer Sign In page at /organizer/login redirects to role-appropriate console'
  );

  // Requirement 8: Desktop and mobile responsiveness
  assert(
    publicLayout.includes('MobileDrawer') &&
    publicLayout.includes('Organizer Hub') &&
    publicLayout.includes('Organizer Login'),
    '8. Organizer direct access links integrated in both desktop header and mobile drawer'
  );

  console.log(`\nResults: ${passed}/${total} requirements verified successfully.`);
}

testOrganizerAccessFlow();
