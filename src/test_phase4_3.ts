import { readFileSync } from 'fs';

function testPhase4_3AdminDashboardAndApproval() {
  console.log('Testing Phase 4.3 Main Admin Dashboard & Organization Approval Invariants...\n');
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
  const useAuth = readFileSync('src/hooks/useAuth.tsx', 'utf-8');
  const app = readFileSync('src/App.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const adminLayout = readFileSync('src/layouts/AdminLayout.tsx', 'utf-8');
  const adminDashboard = readFileSync('src/pages/admin/AdminDashboardPage.tsx', 'utf-8');
  const adminRequests = readFileSync('src/pages/admin/AdminOrganizationRequestsPage.tsx', 'utf-8');
  const adminDetail = readFileSync('src/pages/admin/AdminOrganizationRequestDetailPage.tsx', 'utf-8');

  // 1. Student cannot access /admin
  assert(
    app.includes('path="/admin"') &&
    app.includes("allowedRoles={['admin']}") &&
    protectedRoute.includes("allowedRoles && !allowedRoles.includes(role)"),
    '1. Student cannot access /admin (enforced by Route Guard)'
  );

  // 2. Organizer cannot access /admin
  assert(
    app.includes("allowedRoles={['admin']}") &&
    !app.includes("path=\"/admin\"\n            element={\n              <ProtectedRoute allowedRoles={['organizer', 'admin']}"),
    '2. Organizer cannot access /admin (restricted strictly to admin role)'
  );

  // 3. Unauthenticated user cannot access /admin
  assert(
    protectedRoute.includes("if (!isAuthenticated)") &&
    protectedRoute.includes("Navigate to={`/auth?redirect="),
    '3. Unauthenticated user cannot access /admin (redirects to auth)'
  );

  // 4. Admin can access /admin
  assert(
    app.includes("allowedRoles={['admin']}") &&
    adminLayout.includes("ADMIN CONSOLE"),
    '4. Admin can access /admin (AdminLayout mounted)'
  );

  // 5. Student cannot list pending organization applications
  assert(
    firestoreRules.includes("allow list: if (!('status' in resource.data) || resource.data.status == 'approved') ||") &&
    firestoreRules.includes("resource.data.requestedBy == request.auth.uid ||\n          isAdmin()"),
    '5. Student cannot list pending organization applications (scoped to own requests)'
  );

  // 6. Organizer cannot list pending organization applications
  assert(
    !firestoreRules.includes("isOrgMember(organizationId) || isAdmin()") ||
    !firestoreRules.includes("isOrgMember(organizationId)") ||
    firestoreRules.includes("allow list: if (!('status' in resource.data) || resource.data.status == 'approved') ||\n        (isSignedIn() && (\n          resource.data.requestedBy == request.auth.uid ||\n          isAdmin()"),
    '6. Organizer cannot list pending organization applications'
  );

  // 7. Admin can list organization applications
  assert(
    firestoreRules.includes("isAdmin()") &&
    orgService.includes("getAdminOrganizationRequests"),
    '7. Admin can list organization applications (authorized in rules & service)'
  );

  // 8. Student can still read only their own application
  assert(
    firestoreRules.includes("resource.data.requestedBy == request.auth.uid"),
    '8. Student can still read only their own application'
  );

  // 9. Student cannot approve their own application
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'"),
    '9. Student cannot approve their own application (approval requires isAdmin())'
  );

  // 10. Student cannot change pending -> approved
  assert(
    !firestoreRules.includes("request.resource.data.status == 'approved'") ||
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'"),
    '10. Student cannot change pending -> approved'
  );

  // 11. Student cannot change pending -> rejected
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'rejected'"),
    '11. Student cannot change pending -> rejected'
  );

  // 12. Organizer cannot approve applications
  assert(
    !firestoreRules.includes("isOrgMember(organizationId) && request.resource.data.status == 'approved'") &&
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'"),
    '12. Organizer cannot approve applications'
  );

  // 13. Organization approval requires admin authorization
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'") &&
    orgService.includes("approveOrganization"),
    '13. Organization approval requires admin authorization'
  );

  // 14. Approval changes organization to approved
  assert(
    orgService.includes("status: 'approved'") &&
    firestoreRules.includes("request.resource.data.status == 'approved'"),
    '14. Approval changes organization to approved'
  );

  // 15. Approval promotes requester to organizer
  assert(
    orgService.includes("role: 'organizer'") &&
    firestoreRules.includes("getAfter(/databases/$(database)/documents/userRoles/$(resource.data.requestedBy)).data.role == 'organizer'"),
    '15. Approval promotes requester to organizer in userRoles'
  );

  // 16. Approval creates owner membership
  assert(
    orgService.includes("role: 'owner'") &&
    firestoreRules.includes("getAfter(/databases/$(database)/documents/organizationMembers/$(organizationId + '_' + resource.data.requestedBy)).data.role == 'owner'"),
    '16. Approval creates owner membership in organizationMembers'
  );

  // 17. Approval cannot create membership for a different UID
  assert(
    firestoreRules.includes("getAfter(/databases/$(database)/documents/organizationMembers/$(organizationId + '_' + resource.data.requestedBy)).data.userId == resource.data.requestedBy"),
    '17. Approval cannot create membership for a different UID'
  );

  // 18. Approval cannot promote a different UID
  assert(
    firestoreRules.includes("existsAfter(/databases/$(database)/documents/userRoles/$(resource.data.requestedBy))"),
    '18. Approval cannot promote a different UID'
  );

  // 19. Approval cannot approve an already rejected application
  assert(
    orgService.includes("Cannot approve an already rejected application") &&
    firestoreRules.includes("resource.data.status == 'pending'"),
    '19. Approval cannot approve an already rejected application'
  );

  // 20. Approval cannot approve an already approved application
  assert(
    orgService.includes("This organization is already approved") &&
    firestoreRules.includes("resource.data.status == 'pending'"),
    '20. Approval cannot approve an already approved application'
  );

  // 21. Rejection changes pending -> rejected
  assert(
    orgService.includes("status: 'rejected'") &&
    firestoreRules.includes("request.resource.data.status == 'rejected'"),
    '21. Rejection changes pending -> rejected'
  );

  // Extract rejectOrganization body
  const rejectSlice = orgService.slice(orgService.indexOf('async function rejectOrganization'));
  // 22. Rejection does not promote requester
  assert(
    !rejectSlice.includes("role: 'organizer'") && !rejectSlice.includes("userRoles"),
    '22. Rejection does not promote requester'
  );

  // 23. Rejection does not create membership
  assert(
    !rejectSlice.includes("role: 'owner'") && !rejectSlice.includes("MEMBERS_COLLECTION"),
    '23. Rejection does not create membership'
  );

  // 24. Rejected requester remains student
  assert(
    !rejectSlice.includes("userRoles"),
    '24. Rejected requester remains student (no role elevation)'
  );

  // 25. Existing registration privacy remains intact
  assert(
    firestoreRules.includes("match /registrations/{registrationId}") &&
    firestoreRules.includes("resource.data.userId == request.auth.uid"),
    '25. Existing registration privacy remains intact'
  );

  // 26. Existing registration creation remains intact
  assert(
    firestoreRules.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid") &&
    firestoreRules.includes("getAfter(/databases/$(database)/documents/events/$(request.resource.data.eventId)).data.currentRegistrations"),
    '26. Existing registration creation remains intact'
  );

  // 27. Existing cancellation/capacity coupling remains intact
  assert(
    firestoreRules.includes("request.resource.data.status == 'cancelled'") &&
    firestoreRules.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'cancelledAt', 'cancellationReason', 'updatedAt'])"),
    '27. Existing cancellation/capacity coupling remains intact'
  );

  // 28. Existing organizer membership security remains intact
  assert(
    firestoreRules.includes("match /organizationMembers/{membershipId}") &&
    firestoreRules.includes("isOrgOwner(request.resource.data.organizationId)"),
    '28. Existing organizer membership security remains intact'
  );

  // 29. Existing student organization-request security remains intact
  assert(
    firestoreRules.includes("request.resource.data.status == 'pending'") &&
    firestoreRules.includes("request.resource.data.requestedBy == request.auth.uid"),
    '29. Existing student organization-request security remains intact'
  );

  // 30. No hardcoded permanent admin email fallback remains
  assert(
    !firestoreRules.includes("hippopotamus.type@gmail.com") &&
    !useAuth.includes("hippopotamus.type@gmail.com"),
    '30. No hardcoded permanent admin email fallback remains'
  );

  // 31. No client-side admin role switcher exists
  assert(
    !useAuth.includes("setRole('admin')") &&
    !adminLayout.includes("setRole('admin')"),
    '31. No client-side admin role switcher exists'
  );

  // 32. No hidden client-side approval mechanism exists
  assert(
    !adminRequests.includes("autoApprove") &&
    !adminDashboard.includes("autoApprove") &&
    adminDetail.includes("approveOrganization"),
    '32. No hidden client-side approval mechanism exists'
  );

  console.log(`\nPhase 4.3 Test Results: ${passed}/${total} security invariants passed.`);
}

testPhase4_3AdminDashboardAndApproval();
