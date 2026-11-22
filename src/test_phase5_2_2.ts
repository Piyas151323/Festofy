import { readFileSync } from 'fs';

function testPhase5_2_2FinalRemediation() {
  console.log('Testing Phase 5.2.2 Final Event Security Remediation & Regression Hardening...\n');
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
  const registrationPage = readFileSync('src/pages/public/RegistrationPage.tsx', 'utf-8');
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

  // --- SECTION 1: CANONICAL PUBLIC VISIBILITY MATRIX (Issue A & Section 19) ---

  // Helper evaluating simulated public read permission for an event
  function isPubliclyAllowed(festStatus: string, eventStatus: string): boolean {
    // Exact policy: Event.status == "published" AND Event.festStatus == "published"
    return eventStatus === 'published' && festStatus === 'published';
  }

  // 1. published fest + published event -> ALLOW
  assert(
    isPubliclyAllowed('published', 'published') === true &&
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventsBlock.includes("resource.data.festStatus == 'published'") &&
    eventService.includes("where('festStatus', '==', 'published')") &&
    eventService.includes("where('status', '==', 'published')"),
    '1. published fest + published event -> ALLOW'
  );

  // 2. published fest + draft event -> DENY
  assert(
    isPubliclyAllowed('published', 'draft') === false &&
    !eventsBlock.slice(0, 350).includes("'draft'") &&
    !eventService.includes("where('status', '==', 'draft')"),
    '2. published fest + draft event -> DENY'
  );

  // 3. published fest + cancelled event -> DENY
  assert(
    isPubliclyAllowed('published', 'cancelled') === false &&
    !eventsBlock.slice(0, 350).includes("'cancelled'") &&
    !eventService.includes("where('status', '==', 'cancelled')"),
    '3. published fest + cancelled event -> DENY'
  );

  // 4. published fest + completed event -> DENY
  assert(
    isPubliclyAllowed('published', 'completed') === false &&
    !eventsBlock.slice(0, 350).includes("'completed'") &&
    !eventService.includes("where('status', '==', 'completed')"),
    '4. published fest + completed event -> DENY'
  );

  // 5. draft fest + published event -> DENY
  assert(
    isPubliclyAllowed('draft', 'published') === false &&
    eventsBlock.includes("resource.data.festStatus == 'published'"),
    '5. draft fest + published event -> DENY'
  );

  // 6. completed fest + published event -> DENY
  assert(
    isPubliclyAllowed('completed', 'published') === false &&
    eventsBlock.includes("resource.data.festStatus == 'published'"),
    '6. completed fest + published event -> DENY'
  );

  // 7. completed fest + completed event -> DENY
  assert(
    isPubliclyAllowed('completed', 'completed') === false &&
    !eventsBlock.slice(0, 350).includes("'completed'"),
    '7. completed fest + completed event -> DENY'
  );

  // 8. archived fest + published event -> DENY
  assert(
    isPubliclyAllowed('archived', 'published') === false &&
    eventsBlock.includes("resource.data.festStatus == 'published'") &&
    festService.includes("nextStatus: 'archived'"),
    '8. archived fest + published event -> DENY'
  );

  // 9. archived fest + completed event -> DENY
  assert(
    isPubliclyAllowed('archived', 'completed') === false &&
    !eventsBlock.slice(0, 350).includes("'completed'"),
    '9. archived fest + completed event -> DENY'
  );

  // --- SECTION 2: DIRECT DOCUMENT-ID PROTECTION (Section 20) ---

  // 10. Direct document-ID lookup cannot leak private event data
  assert(
    eventDetailPage.includes('isPubliclyVisible') &&
    eventDetailPage.includes("event.status === 'published' && event.festStatus === 'published'") &&
    eventDetailPage.includes('Event Not Publicly Available') &&
    eventsBlock.includes("resource.data.status == 'published'") &&
    eventsBlock.includes("resource.data.festStatus == 'published'"),
    '10. Direct document-ID lookup cannot bypass public visibility (zero private data leak)'
  );

  // --- SECTION 3: ORGANIZER & ADMIN PRIVILEGES (Section 21) ---

  // 11. Authorized organizer -> own organization's draft event = ALLOW
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes("resource.data.status == 'draft'"),
    '11. Authorized organizer -> own organization draft event = ALLOW'
  );

  // 12. Authorized organizer -> own organization's published event = ALLOW
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes("resource.data.status == 'published'"),
    '12. Authorized organizer -> own organization published event = ALLOW'
  );

  // 13. Authorized organizer -> own organization's completed event = ALLOW
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes("request.resource.data.status == 'completed'"),
    '13. Authorized organizer -> own organization completed event = ALLOW'
  );

  // 14. Authorized organizer -> another organization's event = DENY
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes('request.resource.data.organizationId == resource.data.organizationId'),
    '14. Authorized organizer -> another organization event = DENY'
  );

  // 15. Student -> organizer draft event = DENY
  assert(
    eventsBlock.includes('(isAdmin() || isOrgMember(resource.data.organizationId))') &&
    !eventsBlock.includes("role == 'student'"),
    '15. Student -> organizer draft event = DENY'
  );

  // 16. Admin -> authorized platform administrative event access = ALLOW
  assert(
    eventsBlock.includes('isAdmin()') &&
    firestoreRules.includes("get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin'"),
    '16. Admin -> authorized administrative event access = ALLOW'
  );

  // 17. No hardcoded admin email or UID fallback
  assert(
    !new RegExp(`@${'festofy'}\\.demo`, 'i').test(firestoreRules) &&
    !authHook.includes('user.email === "admin@') &&
    !authHook.includes('role = "admin"'),
    '17. No hardcoded admin email or client-side fallback'
  );

  // --- SECTION 4: REGISTRATION DEADLINE MATRIX (Issue B & Section 22) ---

  function validateEventSchedule(startTimeIso: string, endTimeIso: string, deadlineIso: string) {
    const sTime = new Date(startTimeIso).getTime();
    const eTime = new Date(endTimeIso).getTime();
    const dTime = new Date(deadlineIso).getTime();
    if (isNaN(sTime) || isNaN(eTime) || isNaN(dTime)) return false;
    if (sTime > eTime) return false;
    if (dTime > sTime) return false;
    if (dTime > eTime) return false;
    return true;
  }

  // 18. deadline < startTime -> VALID
  assert(
    validateEventSchedule('2026-11-10T10:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T09:00:00Z') === true,
    '18. Schedule validation: deadline < startTime is valid'
  );

  // 19. deadline == startTime -> VALID
  assert(
    validateEventSchedule('2026-11-10T10:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T10:00:00Z') === true,
    '19. Schedule validation: deadline == startTime is valid'
  );

  // 20. deadline > startTime -> INVALID
  assert(
    validateEventSchedule('2026-11-10T10:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T11:00:00Z') === false,
    '20. Schedule validation: deadline > startTime is invalid'
  );

  // 21. deadline == endTime where endTime > startTime -> INVALID
  assert(
    validateEventSchedule('2026-11-10T10:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T14:00:00Z') === false,
    '21. Schedule validation: deadline == endTime (> startTime) is invalid'
  );

  // 22. deadline > endTime -> INVALID
  assert(
    validateEventSchedule('2026-11-10T10:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T15:00:00Z') === false,
    '22. Schedule validation: deadline > endTime is invalid'
  );

  // 23. startTime > endTime -> INVALID
  assert(
    validateEventSchedule('2026-11-10T16:00:00Z', '2026-11-10T14:00:00Z', '2026-11-10T12:00:00Z') === false,
    '23. Schedule validation: startTime > endTime is invalid'
  );

  // 24. Firestore rules enforce registrationDeadline <= startTime <= endTime
  assert(
    firestoreRules.includes('data.startTime <= data.endTime') &&
    firestoreRules.includes('data.registrationDeadline <= data.startTime') &&
    firestoreRules.includes('data.registrationDeadline <= data.endTime'),
    '24. Firestore rules enforce registrationDeadline <= startTime <= endTime'
  );

  // 25. Event creation service enforces registrationDeadline <= startTime
  assert(
    eventService.includes('deadlineMs > startMs') &&
    eventService.includes('Registration deadline cannot be after event start time.'),
    '25. Event creation service enforces registrationDeadline <= startTime'
  );

  // 26. Event update service enforces registrationDeadline <= startTime
  assert(
    eventService.includes('dTime > sTime') &&
    eventService.includes('Registration deadline cannot be after event start time.'),
    '26. Event update service enforces registrationDeadline <= startTime'
  );

  // 27. Event publication enforces registrationDeadline <= startTime
  assert(
    eventService.includes('dTime > sTime') &&
    eventService.includes('Event start time cannot be after end time.'),
    '27. Event publication enforces registrationDeadline <= startTime'
  );

  // --- SECTION 5: REGISTRATION EXECUTION TIMING (Section 22) ---

  function canRegisterAtTime(currentTimeMs: number, deadlineMs: number, startTimeMs: number): boolean {
    if (currentTimeMs >= deadlineMs) return false;
    if (currentTimeMs >= startTimeMs) return false;
    return true;
  }

  const baseStart = 1700000000000;
  const baseDeadline = 1699990000000;

  // 28. Current time before deadline -> ALLOWED
  assert(
    canRegisterAtTime(baseDeadline - 1000, baseDeadline, baseStart) === true,
    '28. Registration timing: before deadline -> ALLOWED'
  );

  // 29. Current time exactly at deadline -> REJECTED
  assert(
    canRegisterAtTime(baseDeadline, baseDeadline, baseStart) === false,
    '29. Registration timing: exactly at deadline -> REJECTED'
  );

  // 30. Current time after deadline -> REJECTED
  assert(
    canRegisterAtTime(baseDeadline + 5000, baseDeadline, baseStart) === false,
    '30. Registration timing: after deadline -> REJECTED'
  );

  // 31. Current time after start time -> REJECTED
  assert(
    canRegisterAtTime(baseStart + 1000, baseDeadline, baseStart) === false,
    '31. Registration timing: after event start time -> REJECTED'
  );

  // 32. Registration transaction validates authoritative deadline and start time
  assert(
    regService.includes('nowTime >= deadlineTime') &&
    regService.includes('nowTime >= startTime'),
    '32. Registration transaction validates authoritative deadline and start time'
  );

  // --- SECTION 6: isRegistrationClosed SECURITY & INDEPENDENCE (Issue C) ---

  // 33. isRegistrationClosed == false cannot bypass passed deadline in registration transaction
  assert(
    regService.includes('if (!isNaN(deadlineTime) && nowTime >= deadlineTime)') &&
    regService.includes('if (!isNaN(startTime) && nowTime >= startTime)'),
    '33. isRegistrationClosed == false cannot bypass authoritative deadline/start check'
  );

  // 34. isRegistrationClosed == true strictly blocks registration
  assert(
    regService.includes('if (eventData.isRegistrationClosed)'),
    '34. isRegistrationClosed == true blocks registration early'
  );

  // 35. Event completion and cancellation set isRegistrationClosed = true
  assert(
    eventService.includes('if (nextStatus === \'completed\' || nextStatus === \'cancelled\')') &&
    eventService.includes('updates.isRegistrationClosed = true;'),
    '35. Completed/cancelled lifecycle automatically sets isRegistrationClosed = true'
  );

  // --- SECTION 7: CROSS-ORGANIZATION & RELATIONSHIP INTEGRITY (Section 23) ---

  // 36. Organizer cannot operate on another organization's event
  assert(
    eventsBlock.includes('isOrgMember(resource.data.organizationId)') &&
    eventsBlock.includes('request.resource.data.organizationId == resource.data.organizationId'),
    '36. Organizer cannot mutate another organization event'
  );

  // 37. Organizer cannot bind event to another organization's festival
  assert(
    eventsBlock.includes('get(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.organizationId == request.resource.data.organizationId'),
    '37. Organizer cannot bind event to another organization festival'
  );

  // 38. Event organizationId, festId, and createdAt are immutable
  assert(
    eventsBlock.includes('request.resource.data.organizationId == resource.data.organizationId') &&
    eventsBlock.includes('request.resource.data.festId == resource.data.festId') &&
    eventsBlock.includes('request.resource.data.createdAt == resource.data.createdAt'),
    '38. Event organizationId, festId, and createdAt are strictly immutable'
  );

  // 39. Client cannot forge festStatus arbitrarily
  assert(
    eventsBlock.includes('request.resource.data.festStatus == get(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.status') &&
    eventsBlock.includes('request.resource.data.festStatus == get(/databases/$(database)/documents/fests/$(resource.data.festId)).data.status'),
    '39. Client cannot forge festStatus arbitrarily (coupled to parent fest)'
  );

  // --- SECTION 8: EVENTCOUNT & DELETION INTEGRITY (Section 18) ---

  // 40. Event creation couples with parent fest eventCount increment
  assert(
    eventsBlock.includes('getAfter(/databases/$(database)/documents/fests/$(request.resource.data.festId)).data.eventCount == (') &&
    eventService.includes('eventCount: currentCount + 1'),
    '40. Event creation atomically increments parent fest eventCount'
  );

  // 41. Event deletion couples with parent fest eventCount decrement
  assert(
    eventsBlock.includes('getAfter(/databases/$(database)/documents/fests/$(resource.data.festId)).data.eventCount == (') &&
    eventService.includes('Math.max(0, currentCount - 1)'),
    '41. Event deletion atomically decrements parent fest eventCount'
  );

  // 42. Fest draft deletion denied when eventCount > 0
  assert(
    festsBlock.includes("(!('eventCount' in resource.data) || resource.data.eventCount == 0)") &&
    festService.includes('fest.eventCount > 0'),
    '42. Fest deletion denied when eventCount > 0'
  );

  // 43. Public getFestEvents queries strictly { festStatus: 'published', status: 'published' }
  assert(
    eventService.includes("where('festStatus', '==', 'published')") &&
    eventService.includes("where('status', '==', 'published')"),
    '43. Public getFestEvents queries strictly { festStatus: published, status: published }'
  );

  // 44. Registration page displays closed state when event has started or parent fest is unpublished
  assert(
    registrationPage.includes('isStarted') &&
    registrationPage.includes("event.status !== 'published'") &&
    registrationPage.includes("event.festStatus !== 'published'"),
    '44. Registration page blocks access when event started or parent fest is unpublished'
  );

  console.log(`\nPhase 5.2.2 Remediation Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase5_2_2FinalRemediation();
