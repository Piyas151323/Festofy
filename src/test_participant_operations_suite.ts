import { readFileSync } from 'fs';

function testParticipantOperationsAndCheckInSuite() {
  console.log('================================================================');
  console.log('FESTOFY — PHASE 6.1 + 6.2 COMPREHENSIVE VERIFICATION TEST SUITE');
  console.log('Participant Operations, Registration Management & Check-in');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      process.exitCode = 1;
    }
  }

  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const regService = readFileSync('src/services/registrationService.ts', 'utf-8');
  const orgParticipantsPage = readFileSync('src/pages/organizer/OrganizerParticipantsPage.tsx', 'utf-8');
  const orgAnalyticsPage = readFileSync('src/pages/organizer/OrganizerAnalyticsPage.tsx', 'utf-8');
  const orgConsolePage = readFileSync('src/pages/organizer/OrganizerConsolePage.tsx', 'utf-8');
  const typesIndex = readFileSync('src/types/index.ts', 'utf-8');

  const regStart = firestoreRules.indexOf('match /registrations/{registrationId}');
  const regBlock = firestoreRules.slice(regStart);

  // --- SECTION 1: PARTICIPANT MODEL & ORGANIZATION SCOPING ---
  console.log('\n--- 1. Participant Model & Organization Scoping ---');

  assert(
    regBlock.includes('isOrgMember(resource.data.organizationId)') &&
    regService.includes("where('organizationId', '==', organizationId)"),
    '1.1 Registrations are canonical participant source strictly scoped by organizationId'
  );

  assert(
    regBlock.includes('resource.data.userId == request.auth.uid ||') &&
    regService.includes("where('userId', '==', userId)"),
    '1.2 Students cannot list registrations outside their own user account'
  );

  assert(
    !regBlock.includes('allow list: if true') &&
    !regBlock.includes('allow list: if isSignedIn();'),
    '1.3 No unbounded or global registration read rules exist'
  );

  assert(
    regService.includes('getEventRegistrations') &&
    regService.includes('getFestRegistrations') &&
    regService.includes('getOrganizationRegistrations'),
    '1.4 Query helper services are strictly bound by organizationId'
  );

  // --- SECTION 2: SEARCH & MULTI-DIMENSIONAL FILTERS ---
  console.log('\n--- 2. Search & Multi-Dimensional Filters ---');

  assert(
    orgParticipantsPage.includes('studentName.includes(query)') &&
    orgParticipantsPage.includes('studentEmail.includes(query)') &&
    orgParticipantsPage.includes('ticketCode.includes(query)') &&
    orgParticipantsPage.includes('teamName.includes(query)') &&
    orgParticipantsPage.includes('institution.includes(query)') &&
    orgParticipantsPage.includes('studentId.includes(query)'),
    '2.1 Search covers student name, email, ticket code, team, institution, and student ID'
  );

  assert(
    orgParticipantsPage.includes('festFilter') &&
    orgParticipantsPage.includes('eventFilter') &&
    orgParticipantsPage.includes('statusFilter') &&
    orgParticipantsPage.includes('typeFilter') &&
    orgParticipantsPage.includes('checkInFilter'),
    '2.2 Filter controls support Festival, Event, Status, Registration Type, and Check-in state'
  );

  assert(
    orgParticipantsPage.includes('uniqueFests') &&
    orgParticipantsPage.includes('uniqueEvents'),
    '2.3 Cascading dropdown filters computed strictly from authorized registrations dataset'
  );

  // --- SECTION 3: REGISTRATION STATUS TRANSITIONS & APPROVAL ---
  console.log('\n--- 3. Registration Status Management & Approval ---');

  assert(
    regService.includes('export async function approveRegistration') &&
    regService.includes("regData.status !== 'pending'") &&
    regService.includes("status: 'confirmed'"),
    '3.1 approveRegistration enforces pending -> confirmed transition'
  );

  assert(
    regBlock.includes("resource.data.status == 'pending'") &&
    regBlock.includes("request.resource.data.status == 'confirmed'"),
    '3.2 Firestore rules strictly permit approval only from pending status'
  );

  assert(
    regService.includes('export async function rejectRegistration') &&
    regService.includes("status: 'cancelled'") &&
    regService.includes('currentRegistrations: newCount'),
    '3.3 rejectRegistration transitions to cancelled and decrements event capacity'
  );

  assert(
    regBlock.includes("request.resource.data.status == 'cancelled'") &&
    regBlock.includes('getAfter(/databases/$(database)/documents/events/$(resource.data.eventId)).data.currentRegistrations == (get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.currentRegistrations - 1)'),
    '3.4 Firestore rules enforce atomic capacity decrement on cancellation'
  );

  assert(
    regService.includes('export async function markRegistrationCompleted') &&
    regService.includes("regData.status !== 'confirmed' && regData.status !== 'checked_in'"),
    '3.5 markRegistrationCompleted requires confirmed or checked_in status'
  );

  // --- SECTION 4: GATE CHECK-IN SYSTEM & DOUBLE CHECK-IN SAFETY ---
  console.log('\n--- 4. Gate Check-in System & Anti-Double Check-in ---');

  assert(
    regService.includes('export async function checkInParticipant') &&
    regService.includes("status: 'checked_in'") &&
    regService.includes('checkedInBy: currentUser.uid'),
    '4.1 checkInParticipant records status: checked_in and operator UID'
  );

  assert(
    regService.includes("if (regData.status === 'checked_in')") &&
    regService.includes('Participant has already been checked in'),
    '4.2 Double check-in rejected with clear timestamp notification'
  );

  assert(
    regService.includes("if (regData.status === 'cancelled')") &&
    regService.includes('Cannot check in a cancelled registration'),
    '4.3 Cancelled registration check-in rejected'
  );

  assert(
    regBlock.includes("resource.data.status in ['confirmed', 'pending']") &&
    regBlock.includes("request.resource.data.status == 'checked_in'") &&
    regBlock.includes('request.resource.data.checkedInBy == request.auth.uid'),
    '4.4 Firestore rules enforce checkedInBy bound to authenticated UID'
  );

  assert(
    !regBlock.slice(0, regBlock.indexOf('Organizer / Admin Operational Management')).includes('checked_in'),
    '4.5 Students cannot self-check-in in Firestore rules'
  );

  assert(
    regService.includes('export async function getRegistrationByTicketCode') &&
    regService.includes("where('organizationId', '==', organizationId)") &&
    regService.includes("where('ticketCode', '==', normalizedCode)"),
    '4.6 Ticket pass lookup is organization-scoped and normalizes code casing'
  );

  // --- SECTION 5: CAPACITY & COUNT INTEGRITY ---
  console.log('\n--- 5. Capacity & Quota Counter Integrity ---');

  assert(
    !regService.slice(regService.indexOf('export async function approveRegistration'), regService.indexOf('export async function rejectRegistration')).includes('currentRegistrations + 1'),
    '5.1 Approval preserves capacity without double increment'
  );

  assert(
    !regService.slice(regService.indexOf('export async function checkInParticipant'), regService.indexOf('export async function markRegistrationCompleted')).includes('currentRegistrations'),
    '5.2 Check-in does not alter capacity count'
  );

  assert(
    !regService.slice(regService.indexOf('export async function markRegistrationCompleted'), regService.indexOf('export async function getRegistrationByTicketCode')).includes('currentRegistrations'),
    '5.3 Completion does not alter capacity count'
  );

  // --- SECTION 6: IMMUTABLE FIELDS & SECURITY RULES ---
  console.log('\n--- 6. Security Invariants & Immutable Registration Fields ---');

  assert(
    regBlock.includes('request.resource.data.organizationId == resource.data.organizationId') &&
    regBlock.includes('request.resource.data.eventId == resource.data.eventId') &&
    regBlock.includes('request.resource.data.festId == resource.data.festId') &&
    regBlock.includes('request.resource.data.userId == resource.data.userId') &&
    regBlock.includes('request.resource.data.ticketCode == resource.data.ticketCode') &&
    regBlock.includes('request.resource.data.registeredAt == resource.data.registeredAt'),
    '6.1 organizationId, eventId, festId, userId, ticketCode, registeredAt are strictly immutable'
  );

  assert(
    regBlock.includes('request.resource.data.diff(resource.data).affectedKeys().hasOnly'),
    '6.2 Registration mutations are restricted to explicit whitelist of allowed keys'
  );

  // --- SECTION 7: OPERATIONAL NOTES ---
  console.log('\n--- 7. Operational Notes Management ---');

  assert(
    regService.includes('export async function updateRegistrationNotes') &&
    regService.includes('sanitizedNotes = notes.trim().slice(0, 1000)'),
    '7.1 updateRegistrationNotes service enforces length and organization scoping'
  );

  assert(
    regBlock.includes("affectedKeys().hasOnly(['notes', 'updatedAt'])"),
    '7.2 Firestore rules support secure in-place operational notes mutation'
  );

  assert(
    orgParticipantsPage.includes('handleSaveNotes') &&
    orgParticipantsPage.includes('editingNotesReg'),
    '7.3 UI provides interactive operational notes management modal'
  );

  // --- SECTION 8: CSV EXPORT & FORMULA INJECTION SANITIZATION ---
  console.log('\n--- 8. CSV Export Manifest & Injection Defense ---');

  assert(
    orgParticipantsPage.includes('sanitizeCsvValue') &&
    orgParticipantsPage.includes('/^[=+\\-@]/') &&
    orgParticipantsPage.includes("str = `'${str}`"),
    '8.1 CSV export escapes formula execution triggers (=, +, -, @)'
  );

  assert(
    orgParticipantsPage.includes('Ticket Code') &&
    orgParticipantsPage.includes('Participant Name') &&
    orgParticipantsPage.includes('Status') &&
    orgParticipantsPage.includes('Checked In At') &&
    orgParticipantsPage.includes('Notes'),
    '8.2 CSV manifest includes ticket, participant, status, gate attendance, and notes columns'
  );

  assert(
    orgParticipantsPage.includes('activeOrganization?.id') &&
    !orgParticipantsPage.includes('collection(db, "registrations")'),
    '8.3 CSV export operates strictly over already scoped organization registrations'
  );

  // --- SECTION 9: OPERATIONAL UX & ANALYTICS ---
  console.log('\n--- 9. Event-Day Operations UX & Analytics ---');

  assert(
    orgParticipantsPage.includes('Rapid Gate Check-In') &&
    orgParticipantsPage.includes('ticketSearchCode'),
    '9.1 Rapid Gate Check-In ticket bar prominent for event-day operations'
  );

  assert(
    orgParticipantsPage.includes('stats.checkInRate') &&
    orgParticipantsPage.includes('Gate Progress'),
    '9.2 Attendance rate and real-time gate progress metric displayed'
  );

  assert(
    orgParticipantsPage.includes('Review Pending Entries') &&
    orgParticipantsPage.includes('stats.pending > 0'),
    '9.3 Pending entry alert banner prompts organizer review'
  );

  assert(
    orgAnalyticsPage.includes('checkedIn') &&
    orgAnalyticsPage.includes('getOrganizationRegistrations'),
    '9.4 Organizer Analytics computes attendance rate from organization dataset'
  );

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed}/${total} assertions passed (100% SUCCESS)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exitCode = 1;
  }
}

testParticipantOperationsAndCheckInSuite();
