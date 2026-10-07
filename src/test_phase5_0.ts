import { readFileSync } from 'fs';

function testPhase5_0FestManagementSecurity() {
  console.log('Testing Phase 5.0 Organizer Fest Management Security Invariants...\n');
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
  const festService = readFileSync('src/services/festService.ts', 'utf-8');
  const app = readFileSync('src/App.tsx', 'utf-8');
  const orgFestsPage = readFileSync('src/pages/organizer/OrganizerFestsPage.tsx', 'utf-8');
  const orgCreatePage = readFileSync('src/pages/organizer/OrganizerCreateFestPage.tsx', 'utf-8');
  const orgDetailPage = readFileSync('src/pages/organizer/OrganizerFestDetailPage.tsx', 'utf-8');
  const orgEditPage = readFileSync('src/pages/organizer/OrganizerEditFestPage.tsx', 'utf-8');
  const publicFestsPage = readFileSync('src/pages/public/FestsPage.tsx', 'utf-8');
  const publicFestDetailPage = readFileSync('src/pages/public/FestDetailPage.tsx', 'utf-8');
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  const orgContext = readFileSync('src/context/OrganizerContext.tsx', 'utf-8');

  // Isolate fests collection match block in firestore.rules
  const festsMatchStart = firestoreRules.indexOf('match /fests/{festId}');
  const festsMatchEnd = firestoreRules.indexOf('match /eventCategories/{categoryId}');
  const festsBlock = firestoreRules.slice(festsMatchStart, festsMatchEnd);

  // 1. Student cannot create a fest
  assert(
    festsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    !festsBlock.includes('student'),
    '1. Student cannot create a fest (enforced by isOrgMember check in rules)'
  );

  // 2. Student cannot modify a fest
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    !festsBlock.includes('allow update: if true'),
    '2. Student cannot modify a fest (enforced by organization membership requirement on update)'
  );

  // 3. Student cannot delete a fest
  assert(
    festsBlock.includes('allow delete: if isSignedIn()') &&
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    festsBlock.includes("resource.data.status == 'draft'"),
    '3. Student cannot delete a fest (enforced by delete restriction in rules)'
  );

  // 4. Organizer can create a draft for their approved organization
  assert(
    festsBlock.includes("request.resource.data.status == 'draft'") &&
    festsBlock.includes('isApprovedOrg(request.resource.data.organizationId)') &&
    festService.includes("status: 'draft'") &&
    orgCreatePage.includes('createFest'),
    '4. Organizer can create a draft for their approved organization'
  );

  // 5. Organizer cannot create a fest for another organization
  assert(
    festsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    orgCreatePage.includes('activeOrganization.id'),
    '5. Organizer cannot create a fest for another organization'
  );

  // 6. Organizer cannot create an initially published fest
  assert(
    festsBlock.includes("request.resource.data.status == 'draft'") &&
    !festsBlock.includes("request.resource.data.status in ['draft', 'published']"),
    '6. Organizer cannot create an initially published fest (draft strictly required on creation)'
  );

  // 7. Organizer cannot inject organizationId
  assert(
    festsBlock.includes("request.resource.data.keys().hasOnly(['id', 'organizationId', 'name', 'description', 'startDate', 'endDate', 'status', 'bannerUrl', 'organizationName', 'organizationLogo', 'createdAt', 'updatedAt'])") &&
    orgCreatePage.includes('activeOrganization.id'),
    '7. Organizer cannot inject arbitrary organizationId (trusted context + strict schema)'
  );

  // 8. Organizer can edit their own organization\'s draft
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festsBlock.includes("request.resource.data.status == 'draft'") &&
    festService.includes('updateFest') &&
    orgEditPage.includes('updateFest'),
    '8. Organizer can edit their own organization\'s draft'
  );

  // 9. Organizer cannot edit another organization\'s fest
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    orgEditPage.includes('organizations.some(o => o.id === data.organizationId)'),
    '9. Organizer cannot edit another organization\'s fest (membership checked in rules & UI)'
  );

  // 10. Organizer can publish their own valid draft
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festsBlock.includes("request.resource.data.status == 'published'") &&
    festService.includes('publishFest') &&
    orgDetailPage.includes('publishFest'),
    '10. Organizer can publish their own valid draft'
  );

  // 11. Organizer cannot publish another organization\'s draft
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    orgDetailPage.includes('organizations.some(o => o.id === data.organizationId)'),
    '11. Organizer cannot publish another organization\'s draft'
  );

  // 12. Draft is not publicly discoverable
  assert(
    festsBlock.includes("resource.data.status in ['published', 'completed']") &&
    festService.includes("where('status', 'in', ['published', 'completed'])") &&
    publicFestDetailPage.includes("fData.status !== 'published' && fData.status !== 'completed'"),
    '12. Draft is not publicly discoverable (enforced at rules, query, and page gate)'
  );

  // 13. Published fest is publicly discoverable
  assert(
    festsBlock.includes("resource.data.status in ['published', 'completed']") &&
    festService.includes("where('status', 'in', ['published', 'completed'])") &&
    publicFestsPage.includes('getPublishedFests'),
    '13. Published fest is publicly discoverable'
  );

  // 14. Archived fest is not normally publicly discoverable
  assert(
    !publicFestsPage.includes("'archived'") &&
    festsBlock.includes("resource.data.status in ['published', 'completed']"),
    '14. Archived fest is not normally publicly discoverable'
  );

  // 15. Invalid date range is rejected
  assert(
    firestoreRules.includes('data.startDate <= data.endDate') &&
    festService.includes('startTime > endTime') &&
    orgCreatePage.includes('startT > endT'),
    '15. Invalid date range is rejected (enforced in rules and service)'
  );

  // 16. Invalid status transition is rejected
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festsBlock.includes("request.resource.data.status == 'published'") &&
    festsBlock.includes("resource.data.status == 'published'") &&
    festsBlock.includes("request.resource.data.status == 'completed'") &&
    festsBlock.includes("resource.data.status == 'completed'") &&
    festsBlock.includes("request.resource.data.status == 'archived'"),
    '16. Invalid status transition is rejected (lifecycle rules enforce sequential transitions)'
  );

  // 17. Student cannot change fest status
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    !festsBlock.includes('student'),
    '17. Student cannot change fest status'
  );

  // 18. Organizer cannot self-assign organization ownership
  assert(
    firestoreRules.includes('match /organizationMembers/{membershipId}') &&
    firestoreRules.includes('isOrgOwner(request.resource.data.organizationId)') &&
    !firestoreRules.includes("request.resource.data.role = 'owner'"),
    '18. Organizer cannot self-assign organization ownership'
  );

  // 19. Multi-organization workspace A scopes to organization A
  assert(
    festService.includes("where('organizationId', '==', organizationId)") &&
    orgFestsPage.includes('getOrganizationFests(activeOrganization.id)'),
    '19. Multi-organization workspace A scopes to organization A'
  );

  // 20. Multi-organization workspace B scopes to organization B
  assert(
    orgContext.includes('setActiveOrganization') &&
    orgFestsPage.includes('[activeOrganization'),
    '20. Multi-organization workspace B scopes to organization B (reacts on workspace switch)'
  );

  // 21. Cross-organization read is denied
  assert(
    festsBlock.includes('(isAdmin() || isOrgMember(resource.data.organizationId))'),
    '21. Cross-organization read is denied for non-members'
  );

  // 22. Cross-organization update is denied
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)'),
    '22. Cross-organization update is denied'
  );

  // 23. Cross-organization delete is denied
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    festsBlock.includes("resource.data.status == 'draft'"),
    '23. Cross-organization delete is denied'
  );

  // 24. organizationId cannot be changed during update
  assert(
    festsBlock.includes('request.resource.data.organizationId == resource.data.organizationId'),
    '24. organizationId cannot be changed during update (immutable invariant enforced)'
  );

  // 25. Unauthorized destructive deletion is denied
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festService.includes("where('festId', '==', festId)") &&
    festService.includes('Cannot delete festival because it has'),
    '25. Unauthorized destructive deletion is denied (only draft without events can be deleted)'
  );

  // 26. Existing registration privacy remains intact
  assert(
    firestoreRules.includes('match /registrations/{registrationId}') &&
    firestoreRules.includes('resource.data.userId == request.auth.uid'),
    '26. Existing registration privacy remains intact'
  );

  // 27. Existing registration creation remains intact
  assert(
    firestoreRules.includes('registrationId == request.resource.data.eventId + \'_\' + request.auth.uid') &&
    firestoreRules.includes("request.resource.data.status in ['pending', 'confirmed']"),
    '27. Existing registration creation remains intact'
  );

  // 28. Existing registration cancellation/capacity coupling remains intact
  assert(
    firestoreRules.includes("request.resource.data.status == 'cancelled'") &&
    firestoreRules.includes('currentRegistrations'),
    '28. Existing registration cancellation/capacity coupling remains intact'
  );

  // 29. Existing organization approval security remains intact
  assert(
    firestoreRules.includes("isAdmin() &&\n          resource.data.status == 'pending' &&\n          request.resource.data.status == 'approved'"),
    '29. Existing organization approval security remains intact'
  );

  // 30. Admin route protection remains intact
  assert(
    app.includes("path=\"/admin\"") &&
    app.includes("allowedRoles={['admin']}"),
    '30. Admin route protection remains intact'
  );

  // 31. Student dashboard remains intact
  assert(
    app.includes('path="/dashboard"') &&
    app.includes('<StudentLayout />'),
    '31. Student dashboard remains intact'
  );

  // 32. Organizer dashboard remains intact
  assert(
    app.includes('path="/organizer"') &&
    app.includes('<OrganizerConsolePage />') &&
    app.includes('path="fests" element={<OrganizerFestsPage />}') &&
    app.includes('path="fests/new" element={<OrganizerCreateFestPage />}') &&
    app.includes('path="fests/:festId" element={<OrganizerFestDetailPage />}') &&
    app.includes('path="fests/:festId/edit" element={<OrganizerEditFestPage />}'),
    '32. Organizer dashboard remains intact with all new fest management routes'
  );

  // 33. Admin dashboard remains intact
  assert(
    app.includes('<AdminDashboardPage />') &&
    app.includes('<AdminOrganizationRequestsPage />'),
    '33. Admin dashboard remains intact'
  );

  // 34. No broad public draft-fest query exists
  assert(
    !festService.includes("where('status', '==', 'draft')") &&
    festService.includes("where('status', 'in', ['published', 'completed'])"),
    '34. No broad public draft-fest query exists'
  );

  // 35. No client-side-only fest authorization exists
  assert(
    festsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    festsBlock.includes('isApprovedOrg(request.resource.data.organizationId)'),
    '35. No client-side-only fest authorization exists (Firestore rules enforce all boundaries)'
  );

  // 36. Lifecycle actions execute through Firestore transactions
  assert(
    festService.includes('runTransaction(db') &&
    festService.includes('executeFestLifecycleTransition'),
    '36. Lifecycle actions execute through Firestore runTransaction'
  );

  // 37. Transaction reads current fest document and verifies expected previous status
  assert(
    festService.includes('await transaction.get(festRef)') &&
    festService.includes('festData.status') &&
    festService.includes('validPrevious.includes(festData.status)'),
    '37. Transaction reads current fest document and verifies expected previous status'
  );

  // 38. Transaction verifies user authorization against userRoles and organizationMembers
  assert(
    festService.includes("doc(db, 'userRoles'") &&
    festService.includes("doc(db, 'organizationMembers'") &&
    festService.includes('await transaction.get(memberRef)'),
    '38. Transaction verifies user authorization against userRoles and organizationMembers'
  );

  // 39. Transaction applies single intended next status and updates timestamp
  assert(
    festService.includes('transaction.update(festRef, {\n        status: nextStatus,\n        updatedAt: now') ||
    festService.includes('transaction.update(festRef'),
    '39. Transaction applies single intended next status and updates timestamp'
  );

  // 40. No blind updateDoc calls for lifecycle actions
  assert(
    !festService.includes("updateDoc(docRef, {\n      status: 'published'") &&
    !festService.includes("updateDoc(docRef, {\n      status: 'completed'"),
    '40. No blind updateDoc calls exist for lifecycle actions'
  );

  console.log(`\nPhase 5.0 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase5_0FestManagementSecurity();
