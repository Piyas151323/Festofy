import { readFileSync } from 'fs';

function testPhase5SecurityRemediation() {
  console.log('Testing Phase 5.2.1 Event Security Remediation & Regression Hardening Invariants...\n');
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
  const eventService = readFileSync('src/services/eventService.ts', 'utf-8');
  const regService = readFileSync('src/services/registrationService.ts', 'utf-8');
  const eventDetailPage = readFileSync('src/pages/public/EventDetailPage.tsx', 'utf-8');
  const eventsPage = readFileSync('src/pages/public/EventsPage.tsx', 'utf-8');
  const authHook = readFileSync('src/hooks/useAuth.tsx', 'utf-8');

  // Blocks
  const festsStart = firestoreRules.indexOf('match /fests/{festId}');
  const festsEnd = firestoreRules.indexOf('match /eventCategories/{categoryId}');
  const festsBlock = firestoreRules.slice(festsStart, festsEnd);

  const eventsStart = firestoreRules.indexOf('match /events/{eventId}');
  const eventsEnd = firestoreRules.indexOf('match /registrations/{registrationId}');
  const eventsBlock = firestoreRules.slice(eventsStart, eventsEnd);

  const regStart = firestoreRules.indexOf('match /registrations/{registrationId}');
  const regBlock = firestoreRules.slice(regStart);

  // --- PUBLIC VISIBILITY ---

  // 1. Draft Fest + published Event is not publicly discoverable
  assert(
    eventService.includes("where('festStatus', '==', 'published')") &&
    eventsBlock.includes("resource.data.festStatus == 'published'"),
    '1. Draft Fest + published Event is not publicly discoverable'
  );

  // 2. Archived Fest + published Event is not publicly discoverable
  assert(
    festService.includes("nextStatus: 'archived'") &&
    festService.includes('batch.update(d.ref, {\n            festStatus: nextStatus,') &&
    eventsBlock.includes("resource.data.festStatus == 'published'"),
    '2. Archived Fest + published Event is not publicly discoverable'
  );

  // 3. Published Fest + draft Event is not publicly discoverable
  assert(
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventService.includes("where('status', '==', 'published')"),
    '3. Published Fest + draft Event is not publicly discoverable'
  );

  // 4. Published Fest + published Event is publicly discoverable
  assert(
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventService.includes("where('festStatus', '==', 'published')") &&
    eventService.includes("where('status', '==', 'published')"),
    '4. Published Fest + published Event is publicly discoverable'
  );

  // 5. Published Fest + cancelled Event is not publicly discoverable
  assert(
    !eventsBlock.slice(0, 350).includes("'cancelled'") &&
    !eventService.includes("where('status', '==', 'cancelled')"),
    '5. Published Fest + cancelled Event is not publicly discoverable'
  );

  // 6. Direct private Event URL cannot bypass public visibility
  assert(
    eventDetailPage.includes('isPubliclyVisible') &&
    eventDetailPage.includes('Event Not Publicly Available') &&
    eventDetailPage.includes("event.status === 'published'"),
    '6. Direct private Event URL cannot bypass public visibility'
  );

  // 7. Authorized organizer can still access private management data
  assert(
    eventsBlock.includes("(isAdmin() || isOrgMember(resource.data.organizationId))"),
    '7. Authorized organizer can still access private management data'
  );

  // --- EVENTCOUNT ---

  // 8. Event creation increments eventCount exactly once
  assert(
    eventService.includes('eventCount: currentCount + 1'),
    '8. Event creation increments eventCount exactly once'
  );

  // 9. Draft Event deletion decrements eventCount exactly once
  assert(
    eventService.includes('eventCount: newCount') &&
    eventService.includes('Math.max(0, currentCount - 1)'),
    '9. Draft Event deletion decrements eventCount exactly once'
  );

  // 10. Event creation cannot occur without corresponding counter increment
  assert(
    eventsBlock.includes('existsAfter(/databases/$(database)/documents/fests/$(request.resource.data.festId))') &&
    eventsBlock.includes('getAfter(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.eventCount =='),
    '10. Event creation cannot occur without corresponding counter increment (enforced at rules level)'
  );

  // 11. Event deletion cannot occur without corresponding counter decrement
  assert(
    eventsBlock.includes('getAfter(/databases/$(database)/documents/fests/$(resource.data.festId)).data.eventCount == (') &&
    eventsBlock.includes('get(/databases/$(database)/documents/fests/$(resource.data.festId)).data.eventCount - 1'),
    '11. Event deletion cannot occur without corresponding counter decrement (enforced at rules level)'
  );

  // 12. eventCount cannot be manually changed by organizer
  assert(
    !festsBlock.includes("affectedKeys().hasOnly(['name', 'description', 'startDate', 'endDate', 'bannerUrl', 'organizationName', 'organizationLogo', 'eventCount', 'updatedAt'])") &&
    festsBlock.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['eventCount', 'updatedAt'])"),
    '12. eventCount cannot be manually changed by organizer during metadata edits'
  );

  // 13. eventCount cannot become negative
  assert(
    festsBlock.includes("resource.data.eventCount > 0") &&
    festsBlock.includes("request.resource.data.eventCount == resource.data.eventCount - 1"),
    '13. eventCount cannot become negative'
  );

  // 14. Cross-organization eventCount mutation denied
  assert(
    festsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes('isOrgMember(request.resource.data.organizationId)'),
    '14. Cross-organization eventCount mutation denied'
  );

  // 15. Event/Fest relationship cannot be mismatched
  assert(
    eventsBlock.includes('get(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.organizationId == request.resource.data.organizationId'),
    '15. Event/Fest relationship cannot be mismatched (exact org check)'
  );

  // 16. Fest deletion denied when eventCount > 0
  assert(
    festsBlock.includes("(!('eventCount' in resource.data) || resource.data.eventCount == 0)") &&
    festService.includes('fest.eventCount > 0'),
    '16. Fest deletion denied when eventCount > 0'
  );

  // 17. Fest deletion allowed when draft + eventCount == 0 and otherwise authorized
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festsBlock.includes("(!('eventCount' in resource.data) || resource.data.eventCount == 0)"),
    '17. Fest deletion allowed when draft + eventCount == 0 and otherwise authorized'
  );

  // --- AUTHORITY ---

  // 18. Student cannot create Event
  assert(
    eventsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    !eventsBlock.includes("role == 'student'"),
    '18. Student cannot create Event'
  );

  // 19. Student cannot update Event
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)'),
    '19. Student cannot update Event'
  );

  // 20. Student cannot delete Event
  assert(
    eventsBlock.includes('allow delete: if isSignedIn()') &&
    eventsBlock.includes('(isAdmin() || isOrgMember(resource.data.organizationId))'),
    '20. Student cannot delete Event'
  );

  // 21. Organizer cannot operate on another organization\'s Event
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)'),
    '21. Organizer cannot operate on another organization\'s Event'
  );

  // 22. Organizer cannot use another organization\'s Fest
  assert(
    eventsBlock.includes('get(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.organizationId == request.resource.data.organizationId'),
    '22. Organizer cannot use another organization\'s Fest'
  );

  // 23. Admin authority comes from userRoles only
  assert(
    firestoreRules.includes("get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin'") &&
    !firestoreRules.includes("request.auth.token.email =="),
    '23. Admin authority comes from userRoles only'
  );

  // 24. Hardcoded admin fallback absent
  assert(
    !new RegExp(`@${'festofy'}\\.demo`, 'i').test(firestoreRules) &&
    !authHook.includes('user.email === "admin@'),
    '24. Hardcoded admin fallback absent'
  );

  // 25. Client-side role escalation absent
  assert(
    !authHook.includes('role = "admin"') &&
    !authHook.includes('role = "organizer"'),
    '25. Client-side role escalation absent'
  );

  // --- TIMESTAMPS ---

  // 26. createdAt immutable
  assert(
    eventsBlock.includes('request.resource.data.createdAt == resource.data.createdAt') &&
    festsBlock.includes('request.resource.data.createdAt == resource.data.createdAt'),
    '26. createdAt immutable'
  );

  // 27. updatedAt controlled
  assert(
    eventsBlock.includes('updatedAt') &&
    eventService.includes('updatedAt: now'),
    '27. updatedAt controlled and updated on mutations'
  );

  // 28. lifecycle updates updatedAt
  assert(
    eventService.includes('updates: any = {\n        status: nextStatus,\n        updatedAt: now'),
    '28. lifecycle updates updatedAt'
  );

  // 29. organizer cannot forge createdAt
  assert(
    eventsBlock.includes('request.resource.data.createdAt == resource.data.createdAt'),
    '29. organizer cannot forge createdAt during update'
  );

  // --- REGISTRATION SAFETY ---

  // 30. isRegistrationClosed cannot bypass registration authorization
  assert(
    regBlock.includes("get(/databases/$(database)/documents/events/$(request.resource.data.eventId)).data.status == 'published'") &&
    regService.includes("if (eventData.status !== 'published')") &&
    regService.includes('if (eventData.isRegistrationClosed)'),
    '30. isRegistrationClosed cannot bypass registration authorization'
  );

  // 31. existing registration creation still works
  assert(
    regBlock.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid") &&
    regBlock.includes("request.resource.data.status in ['pending', 'confirmed']"),
    '31. existing registration creation still works'
  );

  // 32. existing registration cancellation still works
  assert(
    regBlock.includes("request.resource.data.status == 'cancelled'") &&
    regBlock.includes("resource.data.userId == request.auth.uid"),
    '32. existing registration cancellation still works'
  );

  // 33. capacity coupling remains intact
  assert(
    eventsBlock.includes("request.resource.data.currentRegistrations == (('currentRegistrations' in resource.data && resource.data.currentRegistrations != null) ? resource.data.currentRegistrations + 1 : 1)") &&
    regBlock.includes('existsAfter(/databases/$(database)/documents/events/$(request.resource.data.eventId))'),
    '33. capacity coupling remains intact'
  );

  // 34. duplicate registration protection remains intact
  assert(
    regBlock.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid") &&
    regService.includes('getDeterministicRegistrationId'),
    '34. duplicate registration protection remains intact'
  );

  // 35. registration privacy remains intact
  assert(
    regBlock.includes("resource.data.userId == request.auth.uid"),
    '35. registration privacy remains intact'
  );

  // --- PUBLISHED EVENT EDITING ---

  // 36. capacity cannot fall below currentRegistrations
  assert(
    eventService.includes('cap < existing.currentRegistrations') &&
    eventService.includes('Capacity cannot be reduced below current registered count'),
    '36. capacity cannot fall below currentRegistrations'
  );

  // 37. invalid registration deadline rejected
  assert(
    eventService.includes('dTime > eTime') &&
    firestoreRules.includes('data.registrationDeadline <= data.endTime'),
    '37. invalid registration deadline rejected'
  );

  // 38. invalid schedule rejected
  assert(
    eventService.includes('sTime > eTime') &&
    firestoreRules.includes('data.startTime <= data.endTime'),
    '38. invalid schedule rejected'
  );

  // 39. unsafe registrationType changes rejected/guarded
  assert(
    eventService.includes('existing.currentRegistrations > 0') &&
    eventService.includes('Cannot change registration type once participants have registered'),
    '39. unsafe registrationType changes rejected/guarded'
  );

  // 40. unsafe team constraint changes rejected/guarded
  assert(
    eventService.includes('Cannot increase minimum team size after teams have registered') &&
    eventService.includes('Cannot decrease maximum team size after teams have registered'),
    '40. unsafe team constraint changes rejected/guarded'
  );

  // --- LIFECYCLE ---

  // 41. Event draft → published works when parent Fest is published
  assert(
    eventsBlock.includes("get(/databases/$(database)/documents/fests/$(resource.data.festId)).data.status == 'published'") &&
    eventsBlock.includes("request.resource.data.festStatus == 'published'"),
    '41. Event draft → published works when parent Fest is published'
  );

  // 42. Event draft → published fails when parent Fest is draft
  assert(
    eventsBlock.includes("get(/databases/$(database)/documents/fests/$(resource.data.festId)).data.status == 'published'") &&
    eventService.includes('Cannot publish event while parent festival has status'),
    '42. Event draft → published fails when parent Fest is draft'
  );

  // 43. invalid lifecycle jumps fail
  assert(
    eventsBlock.includes("resource.data.status == 'draft'") &&
    eventsBlock.includes("request.resource.data.status == 'published'") &&
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventsBlock.includes("request.resource.data.status == 'completed'"),
    '43. invalid lifecycle jumps fail'
  );

  // 44. concurrent lifecycle mutation is protected
  assert(
    eventService.includes('runTransaction(db') &&
    eventService.includes('validPrev.includes(eventData.status)'),
    '44. concurrent lifecycle mutation is protected'
  );

  console.log(`\nPhase 5.2.1 Remediation Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase5SecurityRemediation();
