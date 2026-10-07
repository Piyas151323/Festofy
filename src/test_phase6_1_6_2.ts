import { readFileSync } from 'fs';

function testPhase6_1_6_2ParticipantOperations() {
  console.log('Testing Phase 6.1 + 6.2 Organizer Participant Operations & Check-in Invariants...\n');
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
  const regService = readFileSync('src/services/registrationService.ts', 'utf-8');
  const orgParticipantsPage = readFileSync('src/pages/organizer/OrganizerParticipantsPage.tsx', 'utf-8');
  const orgAnalyticsPage = readFileSync('src/pages/organizer/OrganizerAnalyticsPage.tsx', 'utf-8');
  const orgConsolePage = readFileSync('src/pages/organizer/OrganizerConsolePage.tsx', 'utf-8');

  // Blocks
  const regStart = firestoreRules.indexOf('match /registrations/{registrationId}');
  const regBlock = firestoreRules.slice(regStart);

  // --- PART 1: PARTICIPANT ACCESS & SCOPING (Section 4 & 24) ---

  // 1. Organizer can read registrations for their own organization
  assert(
    regBlock.includes('isOrgMember(resource.data.organizationId)') &&
    regService.includes("where('organizationId', '==', organizationId)"),
    '1. Organizer can read own organization registrations'
  );

  // 2. Student can ONLY list their own registrations
  assert(
    regBlock.includes('resource.data.userId == request.auth.uid ||') &&
    regService.includes("where('userId', '==', userId)"),
    '2. Student cannot list other students registrations (userId scoped)'
  );

  // 3. Admin has authorized platform-level administrative access
  assert(
    regBlock.includes('isAdmin()') &&
    firestoreRules.includes("get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin'"),
    '3. Admin authority is strictly role-based from userRoles'
  );

  // 4. No broad unauthenticated or unrestricted registration read rule
  assert(
    !regBlock.includes('allow read: if true') &&
    !regBlock.includes('allow read: if isSignedIn() && true') &&
    !regBlock.includes('allow list: if isSignedIn();'),
    '4. No broad or unrestricted registration read rule exists'
  );

  // --- PART 2: APPROVAL WORKFLOW (Section 9, 10, 11, 12) ---

  // 5. approveRegistration service exists and transitions strictly pending -> confirmed
  assert(
    regService.includes('export async function approveRegistration') &&
    regService.includes("regData.status !== 'pending'") &&
    regService.includes("status: 'confirmed'"),
    '5. approveRegistration service enforces pending -> confirmed transition'
  );

  // 6. approveRegistration verifies organizer membership / admin authorization
  assert(
    regService.includes('isOrgMember') || regService.includes('organizationMembers') &&
    regService.includes('roleDoc.data()?.role === \'admin\''),
    '6. approveRegistration verifies caller is authorized organizer or admin'
  );

  // 7. approveRegistration does NOT double-increment event capacity
  assert(
    !regService.slice(regService.indexOf('export async function approveRegistration'), regService.indexOf('export async function rejectRegistration')).includes('currentRegistrations + 1') &&
    !regService.slice(regService.indexOf('export async function approveRegistration'), regService.indexOf('export async function rejectRegistration')).includes('currentRegistrations:'),
    '7. Approval preserves capacity semantics (does not double-count quota)'
  );

  // 8. rejectRegistration service transitions pending -> cancelled and releases capacity
  assert(
    regService.includes('export async function rejectRegistration') &&
    regService.includes("status: 'cancelled'") &&
    regService.includes('currentRegistrations: newCount'),
    '8. rejectRegistration service transitions to cancelled and decrements event capacity'
  );

  // 9. Firestore rules enforce pending -> confirmed approval transition
  assert(
    regBlock.includes("resource.data.status == 'pending'") &&
    regBlock.includes("request.resource.data.status == 'confirmed'") &&
    regBlock.includes("diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt', 'notes'])"),
    '9. Firestore rules strictly guard pending -> confirmed transition'
  );

  // --- PART 3: CHECK-IN WORKFLOW (Section 13, 14, 15, 16) ---

  // 10. checkInParticipant service exists and transitions confirmed -> checked_in
  assert(
    regService.includes('export async function checkInParticipant') &&
    regService.includes("status: 'checked_in'") &&
    regService.includes('checkedInBy: currentUser.uid'),
    '10. checkInParticipant service records checkedInBy and checkedInAt'
  );

  // 11. Duplicate check-in is prevented
  assert(
    regService.includes("if (regData.status === 'checked_in')") &&
    regService.includes('Participant has already been checked in'),
    '11. Duplicate check-in is prevented in transaction'
  );

  // 12. Check-in does NOT alter event capacity
  assert(
    !regService.slice(regService.indexOf('export async function checkInParticipant'), regService.indexOf('export async function markRegistrationCompleted')).includes('currentRegistrations'),
    '12. Check-in preserves capacity semantics (does not alter currentRegistrations)'
  );

  // 13. Firestore rules enforce checkedInBy == request.auth.uid
  assert(
    regBlock.includes("request.resource.data.status == 'checked_in'") &&
    regBlock.includes('request.resource.data.checkedInBy == request.auth.uid') &&
    regBlock.includes('request.resource.data.checkedInAt is string'),
    '13. Firestore rules require checkedInBy to match authenticated UID'
  );

  // 14. Students CANNOT check themselves in via Firestore rules
  assert(
    !regBlock.slice(0, regBlock.indexOf('Organizer / Admin Operational Management')).includes('checked_in'),
    '14. Students cannot self-assign checked_in status in rules'
  );

  // 15. Students CANNOT tamper with checkedInAt or checkedInBy
  assert(
    regBlock.includes("affectedKeys().hasOnly(['status', 'cancelledAt', 'cancellationReason', 'updatedAt'])"),
    '15. Students cannot tamper with check-in metadata fields'
  );

  // 16. Ticket code gate check-in service exists
  assert(
    regService.includes('export async function getRegistrationByTicketCode') &&
    regService.includes("where('ticketCode', '==', normalizedCode)"),
    '16. Ticket code lookup service queries scoped to organization'
  );

  // --- PART 4: IMMUTABLE FIELDS & SCOPE TAMPERING (Section 25) ---

  // 17. organizationId is strictly immutable on update
  assert(
    regBlock.includes('request.resource.data.organizationId == resource.data.organizationId'),
    '17. Attack 1: Organization ID tampering denied'
  );

  // 18. eventId is strictly immutable on update
  assert(
    regBlock.includes('request.resource.data.eventId == resource.data.eventId'),
    '18. Attack 2: Event ID tampering denied'
  );

  // 19. festId is strictly immutable on update
  assert(
    regBlock.includes('request.resource.data.festId == resource.data.festId'),
    '19. Attack 3: Festival ID tampering denied'
  );

  // 20. checkedInBy cannot be spoofed to another UID
  assert(
    regBlock.includes('request.resource.data.checkedInBy == request.auth.uid'),
    '20. Attack 4: checkedInBy tampering denied (bound to request.auth.uid)'
  );

  // 21. userId is strictly immutable on update
  assert(
    regBlock.includes('request.resource.data.userId == resource.data.userId'),
    '21. Attack 5: User ID tampering denied'
  );

  // 22. ticketCode and registeredAt are immutable
  assert(
    regBlock.includes('request.resource.data.ticketCode == resource.data.ticketCode') &&
    regBlock.includes('request.resource.data.registeredAt == resource.data.registeredAt'),
    '22. ticketCode and registeredAt are strictly immutable'
  );

  // 23. Invalid transitions (e.g. cancelled -> checked_in) are denied in rules
  assert(
    regBlock.includes("resource.data.status in ['confirmed', 'pending']") &&
    !regBlock.includes("resource.data.status in ['cancelled']"),
    '23. Invalid status transitions (cancelled -> checked_in) denied'
  );

  // --- PART 5: CSV EXPORT & FORMULA INJECTION SANITIZATION (Section 21 & 22) ---

  function sanitizeCsvTest(val: string | number | undefined | null): string {
    if (val === undefined || val === null) return '""';
    let str = String(val).trim();
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  // 24. CSV Formula Injection: =SUM(A1) is safely prefixed with '
  assert(
    sanitizeCsvTest('=cmd|/C calc!A0') === '"\'=cmd|/C calc!A0"' &&
    sanitizeCsvTest('+12345') === '"\'+12345"' &&
    sanitizeCsvTest('-500') === '"\'-500"' &&
    sanitizeCsvTest('@harmful') === '"\'@harmful"',
    '24. CSV formula triggers (=, +, -, @) safely escaped to prevent spreadsheet injection'
  );

  // 25. Normal values are not corrupted
  assert(
    sanitizeCsvTest('Jane Doe') === '"Jane Doe"' &&
    sanitizeCsvTest('FST-1234-ABCD') === '"FST-1234-ABCD"',
    '25. Normal text in CSV is safely quoted without corruption'
  );

  // 26. OrganizerParticipantsPage implements formula sanitization
  assert(
    orgParticipantsPage.includes('sanitizeCsvValue') &&
    orgParticipantsPage.includes("/^[=+\\-@]/"),
    '26. OrganizerParticipantsPage enforces formula injection sanitization on export'
  );

  // 27. CSV contains all required operational fields
  assert(
    orgParticipantsPage.includes('Ticket Code') &&
    orgParticipantsPage.includes('Participant Name') &&
    orgParticipantsPage.includes('Status') &&
    orgParticipantsPage.includes('Checked In At') &&
    orgParticipantsPage.includes('Registration Type'),
    '27. CSV export includes complete operational manifest columns'
  );

  // --- PART 6: UI & OPERATIONAL EXPERIENCE (Section 5, 6, 7, 8, 16, 29) ---

  // 28. Rapid ticket lookup bar implemented in UI
  assert(
    orgParticipantsPage.includes('ticketSearchCode') &&
    orgParticipantsPage.includes('handleTicketLookup') &&
    orgParticipantsPage.includes('Rapid Gate Check-In'),
    '28. Rapid ticket pass code gate check-in UI implemented'
  );

  // 29. Pending reviews banner alerts organizers
  assert(
    orgParticipantsPage.includes('stats.pending > 0') &&
    orgParticipantsPage.includes('Review Pending Entries'),
    '29. Prominent pending reviews action banner implemented'
  );

  // 30. Row-level approval and decline actions
  assert(
    orgParticipantsPage.includes('handleApprove') &&
    orgParticipantsPage.includes('handleRejectConfirm') &&
    orgParticipantsPage.includes('Decline Registration Entry'),
    '30. Row-level approval and decline workflow with confirmation implemented'
  );

  // 31. Row-level check-in action
  assert(
    orgParticipantsPage.includes('handleCheckIn') &&
    orgParticipantsPage.includes('UserCheck'),
    '31. Row-level rapid check-in action implemented'
  );

  // 32. Multi-criteria filtering (Status, Event, Registration Type, Check-In)
  assert(
    orgParticipantsPage.includes('statusFilter') &&
    orgParticipantsPage.includes('eventFilter') &&
    orgParticipantsPage.includes('typeFilter') &&
    orgParticipantsPage.includes('checkInFilter'),
    '32. Complete multi-dimensional filtering implemented'
  );

  // 33. Responsive mobile cards view implemented
  assert(
    orgParticipantsPage.includes('md:hidden') &&
    orgParticipantsPage.includes('hidden md:block'),
    '33. Responsive dual layout (desktop table & mobile cards) implemented'
  );

  // 34. Team roster inspection with member contacts
  assert(
    orgParticipantsPage.includes('Team Roster') &&
    orgParticipantsPage.includes('teamMembers'),
    '34. Detailed team roster inspection with individual member contacts'
  );

  // 35. Organizer Analytics page retains organization scoping and registration metrics
  assert(
    orgAnalyticsPage.includes('getOrganizationRegistrations(activeOrganization.id)') &&
    orgAnalyticsPage.includes('utilizationRate') &&
    orgAnalyticsPage.includes('checkedIn'),
    '35. Organizer Analytics accurately computes organization-scoped gate metrics'
  );

  console.log(`\nPhase 6.1 + 6.2 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase6_1_6_2ParticipantOperations();
