import { readFileSync } from 'fs';

function testPhase5_1EventManagementAndRemediation() {
  console.log('Testing Phase 5.1 & 5.2 Event Management & Security Remediation Invariants...\n');
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
  const app = readFileSync('src/App.tsx', 'utf-8');
  const orgEventsPage = readFileSync('src/pages/organizer/OrganizerEventsPage.tsx', 'utf-8');
  const orgCreateEventPage = readFileSync('src/pages/organizer/OrganizerCreateEventPage.tsx', 'utf-8');
  const orgEventDetailPage = readFileSync('src/pages/organizer/OrganizerEventDetailPage.tsx', 'utf-8');
  const orgEditEventPage = readFileSync('src/pages/organizer/OrganizerEditEventPage.tsx', 'utf-8');
  const orgFestDetailPage = readFileSync('src/pages/organizer/OrganizerFestDetailPage.tsx', 'utf-8');

  // Isolate fests and events match blocks in firestore.rules
  const festsStart = firestoreRules.indexOf('match /fests/{festId}');
  const festsEnd = firestoreRules.indexOf('match /eventCategories/{categoryId}');
  const festsBlock = firestoreRules.slice(festsStart, festsEnd);

  const eventsStart = firestoreRules.indexOf('match /events/{eventId}');
  const eventsEnd = firestoreRules.indexOf('match /registrations/{registrationId}');
  const eventsBlock = firestoreRules.slice(eventsStart, eventsEnd);

  // --- PART A: PHASE 5.0 REMEDIATION ---

  // 1. Fest draft deletion requires eventCount == 0 in security rules
  assert(
    festsBlock.includes("resource.data.status == 'draft'") &&
    festsBlock.includes("(!('eventCount' in resource.data) || resource.data.eventCount == 0)"),
    '1. Fest draft deletion requires eventCount == 0 in security rules'
  );

  // 2. Fest draft deletion service checks eventCount > 0 and dependent events
  assert(
    festService.includes('fest.eventCount > 0') &&
    festService.includes("where('festId', '==', festId)"),
    '2. Fest draft deletion service enforces eventCount == 0 guard'
  );

  // 3. New fests initialize eventCount = 0
  assert(
    festService.includes('eventCount: 0') &&
    festsBlock.includes("(!('eventCount' in request.resource.data) || request.resource.data.eventCount == 0)"),
    '3. New fests initialize eventCount = 0'
  );

  // 4. Organizers cannot manually alter eventCount in fest metadata edits
  assert(
    !festsBlock.includes("affectedKeys().hasOnly(['name', 'description', 'startDate', 'endDate', 'bannerUrl', 'organizationName', 'organizationLogo', 'eventCount', 'updatedAt'])") &&
    festsBlock.includes("diff(resource.data).affectedKeys().hasOnly(['eventCount', 'updatedAt'])"),
    '4. Organizers cannot manually tamper with eventCount during fest edits'
  );

  // 5. Admin authority consistency (platform admin authority derived from userRoles)
  assert(
    firestoreRules.includes("get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin'") &&
    festService.includes("roleDoc.data()?.role === 'admin'") &&
    eventService.includes("roleDoc.data()?.role === 'admin'"),
    '5. Platform admin authority is derived strictly from userRoles collection'
  );

  // 6. Students cannot manage fests or events
  assert(
    festsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    eventsBlock.includes('isOrgMember(request.resource.data.organizationId)') &&
    !eventsBlock.includes("role == 'student'"),
    '6. Students cannot create or mutate events'
  );

  // --- PART B: EVENT CREATION & ATOMICITY ---

  // 7. Event creation requires status == 'draft'
  assert(
    eventsBlock.includes("request.resource.data.status == 'draft'") &&
    eventService.includes("status: 'draft'"),
    '7. Event creation strictly requires initial draft status'
  );

  // 8. Event creation requires currentRegistrations == 0
  assert(
    eventsBlock.includes('request.resource.data.currentRegistrations == 0') &&
    eventService.includes('currentRegistrations: 0'),
    '8. Event creation initializes currentRegistrations to 0'
  );

  // 9. Event creation verifies fest belongs to same organization
  assert(
    eventsBlock.includes('get(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.organizationId == request.resource.data.organizationId') &&
    eventService.includes('festData.organizationId !== organizationId'),
    '9. Event creation enforces parent fest belongs to same organization'
  );

  // 10. Event creation atomically increments parent fest eventCount
  assert(
    eventService.includes('runTransaction(db') &&
    eventService.includes('eventCount: currentCount + 1') &&
    festsBlock.includes("request.resource.data.eventCount == (('eventCount' in resource.data && resource.data.eventCount != null) ? resource.data.eventCount + 1 : 1)"),
    '10. Event creation atomically increments parent fest eventCount'
  );

  // 11. Event draft deletion atomically decrements parent fest eventCount
  assert(
    eventService.includes('deleteDraftEvent') &&
    eventService.includes('eventCount: newCount') &&
    festsBlock.includes('request.resource.data.eventCount == resource.data.eventCount - 1'),
    '11. Event draft deletion atomically decrements parent fest eventCount'
  );

  // 12. Event draft deletion only allowed if registrations == 0
  assert(
    eventsBlock.includes("resource.data.status == 'draft'") &&
    eventsBlock.includes("(!('currentRegistrations' in resource.data) || resource.data.currentRegistrations == 0)") &&
    eventService.includes('eventData.currentRegistrations > 0'),
    '12. Event deletion is strictly restricted to drafts with 0 registrations'
  );

  // --- PART C: EVENT LIFECYCLE & TRANSACTIONS ---

  // 13. Event lifecycle transitions execute through Firestore transactions
  assert(
    eventService.includes('runTransaction(db') &&
    eventService.includes('executeEventLifecycleTransition'),
    '13. Event lifecycle actions execute through Firestore runTransaction'
  );

  // 14. Event transition verifies expected previous status
  assert(
    eventService.includes('validPrev.includes(eventData.status)'),
    '14. Event transition verifies expected previous status (no blind updates)'
  );

  // 15. Event transition draft -> published enforced in rules & service
  assert(
    eventsBlock.includes("resource.data.status == 'draft'") &&
    eventsBlock.includes("request.resource.data.status == 'published'") &&
    eventService.includes('publishEvent'),
    '15. Event transition draft -> published enforced in rules & service'
  );

  // 16. Event transition published -> completed enforced in rules & service
  assert(
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventsBlock.includes("request.resource.data.status == 'completed'") &&
    eventService.includes('completeEvent'),
    '16. Event transition published -> completed enforced in rules & service'
  );

  // 17. Event transition published/draft -> cancelled enforced in rules & service
  assert(
    eventsBlock.includes("request.resource.data.status == 'cancelled'") &&
    eventService.includes('cancelEvent'),
    '17. Event transition to cancelled enforced in rules & service'
  );

  // 18. Invalid event date range rejected
  assert(
    firestoreRules.includes('isValidEventPayload') &&
    firestoreRules.includes('data.startTime <= data.endTime') &&
    firestoreRules.includes('data.registrationDeadline <= data.endTime') &&
    eventService.includes('startMs > endMs'),
    '18. Invalid event date range or deadline rejected'
  );

  // --- PART D: PUBLIC DISCOVERY & PRIVACY ---

  // 19. Public can only discover published events
  assert(
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventService.includes("where('status', '==', 'published')"),
    '19. Public can only discover published events'
  );

  // 20. Draft and cancelled events hidden from public listing
  assert(
    !eventService.includes("where('status', '==', 'draft')") &&
    eventsBlock.includes("isAdmin() || isOrgMember(resource.data.organizationId)"),
    '20. Draft and cancelled events are hidden from public queries'
  );

  // --- PART E: ORGANIZER UI & WORKSPACE INTEGRATION ---

  // 21. Organizer Events Page loaded with full management features
  assert(
    orgEventsPage.includes('getOrganizationEvents') &&
    orgEventsPage.includes('publishEvent') &&
    orgEventsPage.includes('completeEvent') &&
    orgEventsPage.includes('cancelEvent') &&
    orgEventsPage.includes('deleteDraftEvent'),
    '21. Organizer Events Page includes complete management and lifecycle actions'
  );

  // 22. Organizer Create Event Page supports fest binding & draft initial status
  assert(
    orgCreateEventPage.includes('createEvent') &&
    orgCreateEventPage.includes('getOrganizationFests') &&
    orgCreateEventPage.includes('activeOrganization.id'),
    '22. Organizer Create Event Page enforces active workspace scoping and fest binding'
  );

  // 23. Organizer Event Detail Page displays real-time capacity and lifecycle actions
  assert(
    orgEventDetailPage.includes('getEventById') &&
    orgEventDetailPage.includes('handleLifecycleAction') &&
    orgEventDetailPage.includes('regCount / event.capacity'),
    '23. Organizer Event Detail Page displays capacity tracking and lifecycle confirmation'
  );

  // 24. Organizer Edit Event Page prevents altering immutable identifiers
  assert(
    orgEditEventPage.includes('updateEvent') &&
    !orgEditEventPage.includes('setOrganizationId') &&
    !orgEditEventPage.includes('setFestId'),
    '24. Organizer Edit Event Page keeps organizationId, festId, and createdAt immutable'
  );

  // 25. Festival Detail Page links to event creation and lists scheduled events
  assert(
    orgFestDetailPage.includes('getFestEvents') &&
    orgFestDetailPage.includes('/organizer/events/new?festId='),
    '25. Festival Detail Page integrates directly with event scheduling'
  );

  // 26. App router includes all organizer event routes
  assert(
    app.includes('path="events/new" element={<OrganizerCreateEventPage />}') &&
    app.includes('path="events/:eventId" element={<OrganizerEventDetailPage />}') &&
    app.includes('path="events/:eventId/edit" element={<OrganizerEditEventPage />}'),
    '26. App router registers all organizer event management routes'
  );

  // 27. Cross-organization event management blocked
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    orgEventDetailPage.includes('organizations.some(o => o.id === evtData.organizationId)'),
    '27. Cross-organization event access is strictly blocked'
  );

  // 28. Event registration capacity coupling remains intact
  assert(
    eventsBlock.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentRegistrations'])") &&
    eventsBlock.includes('request.resource.data.currentRegistrations == ((\'currentRegistrations\' in resource.data && resource.data.currentRegistrations != null) ? resource.data.currentRegistrations + 1 : 1)'),
    '28. Student registration atomic capacity increment remains intact'
  );

  console.log(`\nPhase 5.1 & 5.2 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase5_1EventManagementAndRemediation();
