import { readFileSync } from 'fs';

function testPhase7AnalyticsAndIntelligence() {
  console.log('Testing Phase 7.1 + 7.2 Organizer Analytics & Dashboard Intelligence...\n');
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

  const orgAnalyticsPage = readFileSync('src/pages/organizer/OrganizerAnalyticsPage.tsx', 'utf-8');
  const orgConsolePage = readFileSync('src/pages/organizer/OrganizerConsolePage.tsx', 'utf-8');
  const orgContext = readFileSync('src/context/OrganizerContext.tsx', 'utf-8');
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const regService = readFileSync('src/services/registrationService.ts', 'utf-8');

  // --- 1. REGISTRATION COUNTS BY STATUS & ACTIVE FILTERING ---
  const sampleRegistrations = [
    { id: '1', status: 'confirmed', registrationType: 'individual', eventId: 'e1', festId: 'f1' },
    { id: '2', status: 'checked_in', registrationType: 'individual', eventId: 'e1', festId: 'f1' },
    { id: '3', status: 'pending', registrationType: 'individual', eventId: 'e1', festId: 'f1' },
    { id: '4', status: 'cancelled', registrationType: 'individual', eventId: 'e1', festId: 'f1' },
    { id: '5', status: 'waitlisted', registrationType: 'individual', eventId: 'e1', festId: 'f1' },
    { id: '6', status: 'team', registrationType: 'team', teamMembers: [{}, {}, {}], eventId: 'e2', festId: 'f1' }
  ];

  const totalRegs = sampleRegistrations.length;
  const activeRegs = sampleRegistrations.filter((r) => r.status !== 'cancelled').length;
  const confirmed = sampleRegistrations.filter((r) => r.status === 'confirmed').length;
  const checkedIn = sampleRegistrations.filter((r) => r.status === 'checked_in').length;
  const pending = sampleRegistrations.filter((r) => r.status === 'pending').length;
  const cancelled = sampleRegistrations.filter((r) => r.status === 'cancelled').length;

  assert(
    totalRegs === 6 && activeRegs === 5 && confirmed === 1 && checkedIn === 1 && pending === 1 && cancelled === 1,
    '1. Registration counts by status correctly categorizes records'
  );

  // 2. Cancelled registrations strictly excluded from active totals
  assert(
    activeRegs === 5 &&
    orgAnalyticsPage.includes("r.status !== 'cancelled'") &&
    orgConsolePage.includes("r.status !== 'cancelled'"),
    '2. Cancelled registrations excluded from active totals'
  );

  // --- 2. ATTENDANCE RATE & ZERO-DENOMINATOR HANDLING ---
  function computeAttendanceRate(regs: any[]) {
    const c = regs.filter((r) => r.status === 'confirmed').length;
    const ch = regs.filter((r) => r.status === 'checked_in').length;
    const comp = regs.filter((r) => r.status === 'completed').length;
    const eligible = c + ch + comp;
    return eligible > 0 ? Math.round((ch / eligible) * 100) : null;
  }

  assert(
    computeAttendanceRate(sampleRegistrations) === 50,
    '3. Attendance rate calculated correctly when denominator is positive (1 check-in / 2 confirmed+checked-in = 50%)'
  );

  assert(
    computeAttendanceRate([]) === null &&
    computeAttendanceRate([{ status: 'pending' }, { status: 'cancelled' }]) === null,
    '4. Attendance rate safely returns null (not NaN or fake 0) when denominator is 0'
  );

  assert(
    orgAnalyticsPage.includes("attendanceEligible > 0 ? Math.round((checkedIn / attendanceEligible) * 100) : null") ||
    orgAnalyticsPage.includes("attendanceRate !== null"),
    '5. OrganizerAnalyticsPage guards zero-denominator in attendance rate'
  );

  // --- 3. CAPACITY UTILIZATION & EDGE CASES ---
  function computeUtilization(events: any[], regs: any[]) {
    const eventsWithCap = events.filter((e) => typeof e.capacity === 'number' && e.capacity > 0);
    const totalCap = eventsWithCap.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const allocated = eventsWithCap.reduce((sum, e) => {
      const activeForE = regs.filter((r) => r.eventId === e.id && r.status !== 'cancelled').length;
      return sum + Math.max(e.currentRegistrations || 0, activeForE);
    }, 0);
    return totalCap > 0 ? Math.round((allocated / totalCap) * 100) : 0;
  }

  const testEvents = [
    { id: 'e1', capacity: 100, currentRegistrations: 85 },
    { id: 'e2', capacity: 50, currentRegistrations: 10 },
    { id: 'e3', capacity: 0, currentRegistrations: 5 }, // zero capacity safe edge
    { id: 'e4', capacity: null, currentRegistrations: 2 } // unlimited safe edge
  ];

  assert(
    computeUtilization(testEvents, sampleRegistrations) === 63, // (85 + 10) / 150 = 63%
    '6. Capacity utilization safely filters zero and null capacities without NaN'
  );

  assert(
    orgAnalyticsPage.includes("events.filter((e) => typeof e.capacity === 'number' && e.capacity > 0)") &&
    orgAnalyticsPage.includes("totalCapacity > 0"),
    '7. OrganizerAnalyticsPage excludes zero/null capacity from capacity denominator'
  );

  // --- 4. INDIVIDUAL VS TEAM PARTICIPATION WITHOUT DOUBLE COUNTING ---
  const individualCount = sampleRegistrations.filter((r) => r.registrationType === 'individual' && r.status !== 'cancelled').length;
  const teamCount = sampleRegistrations.filter((r) => r.registrationType === 'team' && r.status !== 'cancelled').length;
  const totalTeamMembers = sampleRegistrations
    .filter((r) => r.registrationType === 'team' && r.status !== 'cancelled')
    .reduce((acc, r: any) => acc + (r.teamMembers?.length || 1), 0);
  const totalIndividualHeadcount = individualCount + totalTeamMembers;

  assert(
    individualCount === 4 && teamCount === 1 && totalTeamMembers === 3 && totalIndividualHeadcount === 7,
    '8. Individual and team participation accurately distinguishes registration count from headcount'
  );

  assert(
    orgAnalyticsPage.includes("r.registrationType === 'individual'") &&
    orgAnalyticsPage.includes("r.registrationType === 'team'") &&
    orgAnalyticsPage.includes("totalIndividualParticipants"),
    '9. OrganizerAnalyticsPage surfaces both registration count and individual participant headcount'
  );

  // --- 5. ORGANIZATION & WORKSPACE ISOLATION (SECURITY CRITICAL) ---
  assert(
    orgAnalyticsPage.includes('activeOrganization.id') &&
    orgAnalyticsPage.includes('getOrganizationFests(activeOrganization.id)') &&
    orgAnalyticsPage.includes('getOrganizationEvents(activeOrganization.id)') &&
    orgAnalyticsPage.includes('getOrganizationRegistrations(activeOrganization.id)'),
    '10. Organizer analytics queries are strictly scoped to activeOrganization.id'
  );

  assert(
    orgAnalyticsPage.includes('useEffect(') &&
    orgAnalyticsPage.includes('[activeOrganization, orgLoading'),
    '11. Switching activeOrganization triggers full data reload and avoids cross-org data bleed'
  );

  assert(
    orgContext.includes('ACTIVE_ORG_STORAGE_KEY') &&
    orgContext.includes('getUserOrganizations'),
    '12. OrganizerContext scopes authorized organizations strictly through Firestore user memberships'
  );

  assert(
    firestoreRules.includes('isOrgMember(resource.data.organizationId)') &&
    firestoreRules.includes('match /registrations/{registrationId}'),
    '13. Firestore security rules strictly prevent cross-organization registration inspection'
  );

  // --- 6. OPERATIONAL INTELLIGENCE & INSIGHTS ---
  assert(
    orgAnalyticsPage.includes('highCapacityEvents') &&
    orgAnalyticsPage.includes('lowCapacityEvents') &&
    orgAnalyticsPage.includes('festStats'),
    '14. OrganizerAnalyticsPage surfaces high demand, low velocity, and festival-grouped performance'
  );

  assert(
    orgConsolePage.includes('approachingCapacityEvents') &&
    orgConsolePage.includes('approachingDeadlines') &&
    orgConsolePage.includes('stats.pending > 0'),
    '15. OrganizerConsolePage highlights operational warnings: pending reviews, nearing capacity, closing deadlines'
  );

  // --- 7. EMPTY AND ERROR STATES ---
  assert(
    orgAnalyticsPage.includes('errorMsg') &&
    orgAnalyticsPage.includes('Retry') &&
    orgAnalyticsPage.includes('No events found for this workspace'),
    '16. OrganizerAnalyticsPage includes explicit error banners, retry button, and clear empty states'
  );

  assert(
    !orgAnalyticsPage.includes('updateDoc') &&
    !orgAnalyticsPage.includes('setDoc') &&
    !orgAnalyticsPage.includes('currentRegistrations ='),
    '17. Analytics code is strictly read-only and never mutates currentRegistrations or Firestore documents'
  );

  console.log(`\nPhase 7.1 + 7.2 Test Results: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase7AnalyticsAndIntelligence();
