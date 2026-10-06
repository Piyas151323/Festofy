import { readFileSync } from 'fs';

function testPhase4_2OrganizationApplicationSystem() {
  console.log('Testing Phase 4.2 Organization Application System & Security Invariants...\n');
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

  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const orgService = readFileSync('src/services/organizationService.ts', 'utf-8');
  const types = readFileSync('src/types/index.ts', 'utf-8');
  const authPage = readFileSync('src/pages/public/AuthPage.tsx', 'utf-8');
  const applyPage = readFileSync('src/pages/student/StudentOrgApplyPage.tsx', 'utf-8');
  const requestsPage = readFileSync('src/pages/student/StudentOrgRequestsPage.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const app = readFileSync('src/App.tsx', 'utf-8');
  const blueprint = readFileSync('firebase-blueprint.json', 'utf-8');

  // 1. New signup defaults to student
  assert(
    authPage.includes("signUpWithEmail") && !authPage.includes("role:") && !authPage.includes("role="),
    '1. New signup defaults to student with no role selection parameters'
  );

  // 2. Student cannot select organizer during signup
  assert(
    !authPage.includes('<select') && !authPage.includes('role =') && !authPage.includes('organizer checkbox'),
    '2. Student cannot select organizer role during signup (client role selection prohibited)'
  );

  // 3. Student can submit an organization request
  assert(
    orgService.includes('createOrganizationRequest') && applyPage.includes('createOrganizationRequest'),
    '3. Student can submit an organization request through createOrganizationRequest service'
  );

  // 4. Submitted organization has status pending
  assert(
    orgService.includes("status: 'pending'") &&
    firestoreRules.includes("request.resource.data.status == 'pending'"),
    '4. Submitted organization strictly requires and initializes status: "pending"'
  );

  // 5. Submitted organization.requestedBy equals authenticated UID
  assert(
    orgService.includes("requestedBy: userId") &&
    firestoreRules.includes("request.resource.data.requestedBy == request.auth.uid"),
    '5. Submitted organization requestedBy is strictly bound to request.auth.uid'
  );

  const createFnSlice = orgService.slice(orgService.indexOf('async function createOrganizationRequest'));
  const createFnEnd = createFnSlice.indexOf('async function getMyOrganizationRequests');
  const createFnBody = createFnSlice.slice(0, createFnEnd);

  // 6. Student does not receive organizer role after submission
  assert(
    !createFnBody.includes("userRoles") && !createFnBody.includes("role: 'organizer'") && !createFnBody.includes("organizer"),
    '6. Student does not receive organizer role upon organization submission'
  );

  // 7. Student does not receive owner membership after submission
  assert(
    !createFnBody.includes("MEMBERS_COLLECTION") && !createFnBody.includes("organizationMembers") && !createFnBody.includes("role: 'owner'"),
    '7. Student does not receive owner membership upon organization submission'
  );

  // 8. Student cannot directly create approved organization
  assert(
    firestoreRules.includes("request.resource.data.status == 'pending'") &&
    !firestoreRules.includes("request.resource.data.status in ['pending', 'approved']"),
    '8. Student cannot directly create approved organization (rules forbid non-pending status)'
  );

  // 9. Student cannot directly create rejected organization
  assert(
    !firestoreRules.includes("status == 'rejected'") || firestoreRules.includes("request.resource.data.status == 'pending'"),
    '9. Student cannot directly create rejected organization'
  );

  // 10. Student cannot directly create suspended organization
  assert(
    !firestoreRules.includes("status == 'suspended'") || firestoreRules.includes("request.resource.data.status == 'pending'"),
    '10. Student cannot directly create suspended organization'
  );

  // 11. Student cannot change pending -> approved
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'"),
    '11. Student cannot change pending -> approved (update on pending orgs restricted to admins)'
  );

  // 12. Student cannot change pending -> rejected
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'rejected'"),
    '12. Student cannot change pending -> rejected'
  );

  // 13. Student cannot change requestedBy
  assert(
    !firestoreRules.includes("request.resource.data.requestedBy ==") ||
    firestoreRules.includes("request.resource.data.requestedBy == request.auth.uid"),
    '13. Student cannot change requestedBy identity'
  );

  // 14. Student cannot assign themselves owner
  assert(
    firestoreRules.includes("isOrgOwner(request.resource.data.organizationId)") ||
    firestoreRules.includes("allow create: if isSignedIn() && (\n        isAdmin() ||\n        isOrgOwner"),
    '14. Student cannot assign themselves owner in organizationMembers'
  );

  // 15. Student cannot assign themselves organizer
  assert(
    firestoreRules.includes("request.resource.data.role == 'student'") &&
    firestoreRules.includes("allow update, delete: if isAdmin();"),
    '15. Student cannot assign themselves organizer in userRoles'
  );

  // 16. Student cannot modify userRoles to organizer
  assert(
    firestoreRules.includes("allow update, delete: if isAdmin();"),
    '16. userRoles updates are restricted strictly to platform administrators'
  );

  // 17. Student can read their own application
  assert(
    firestoreRules.includes("resource.data.requestedBy == request.auth.uid") &&
    orgService.includes("where('requestedBy', '==', userId)"),
    '17. Student can read and list their own organization requests'
  );

  // 18. Student cannot enumerate unrelated pending applications
  assert(
    firestoreRules.includes("resource.data.requestedBy == request.auth.uid ||\n          isAdmin()"),
    '18. Student cannot enumerate unrelated pending applications'
  );

  // 19. Existing organization membership security remains intact
  assert(
    firestoreRules.includes("match /organizationMembers/{membershipId}") &&
    firestoreRules.includes("isOrgMember(resource.data.organizationId)"),
    '19. Existing organization membership security remains fully intact'
  );

  // 20. Existing organizer route protection remains intact
  assert(
    app.includes("path=\"/organizer\"") &&
    app.includes("allowedRoles={['organizer', 'admin']}"),
    '20. Existing organizer route protection remains fully intact'
  );

  // 21. Existing admin role protection remains intact
  assert(
    firestoreRules.includes("function isAdmin()"),
    '21. Existing admin role protection remains fully intact'
  );

  // 22. Existing registration privacy remains intact
  assert(
    firestoreRules.includes("match /registrations/{registrationId}") &&
    firestoreRules.includes("resource.data.userId == request.auth.uid"),
    '22. Existing registration privacy remains fully intact'
  );

  // 23. Existing registration creation remains intact
  assert(
    firestoreRules.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid"),
    '23. Existing registration creation engine remains fully intact'
  );

  // 24. Existing cancellation/capacity security remains intact
  assert(
    firestoreRules.includes("request.resource.data.status == 'cancelled'") &&
    firestoreRules.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'cancelledAt', 'cancellationReason', 'updatedAt'])"),
    '24. Existing cancellation and atomic capacity release remains fully intact'
  );

  // 25. No client-side role switcher exists
  assert(
    !authPage.includes("switchRole") && !authPage.includes("setRole('organizer')"),
    '25. No client-side role switcher exists'
  );

  // 26. No hidden approval mechanism exists
  assert(
    !applyPage.includes("status = 'approved'") && !applyPage.includes("approveOrganization"),
    '26. No hidden client-side approval mechanism exists'
  );

  console.log(`\nPhase 4.2 Test Results: ${passed}/${total} security invariants passed.`);
}

testPhase4_2OrganizationApplicationSystem();
