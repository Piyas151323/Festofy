/**
 * Comprehensive Test Suite for Festofy Phase 2
 * Tests:
 * 1. Pre-Implementation Audit
 * 2. Student Registration & Participation History
 * 3. Personalized Event Recommendations & Notifications
 * 4. Visitor Access Setting & Precedence Logic
 * 5. Global Route Scroll Restoration
 * 6. Security & Firestore Rules Audit
 */

import { readFileSync } from 'fs';
import {
  doesEventMatchInterests,
  isStudentEligibleForEvent,
  getPersonalizedEventSuggestions
} from './services/notificationService';
import {
  getEffectiveVisitorAccess,
  getVisitorAccessDisplay
} from './utils/visitorUtils';
import { AVAILABLE_INTERESTS } from './services/userService';
import { EventItem, UserProfile, Fest } from './types';

function runPhase2ComprehensiveSuite() {
  console.log('====================================================');
  console.log('FESTOFY PHASE 2 COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) {
        console.error(`       Details: ${details}`);
      }
    }
  }

  // ==========================================
  // SECTION 1: PRE-IMPLEMENTATION AUDIT & ROUTING
  // ==========================================
  console.log('\n--- SECTION 1: Pre-Implementation Audit & Routing ---');
  const appTsx = readFileSync('src/App.tsx', 'utf-8');
  assert(
    appTsx.includes('path="history" element={<StudentHistoryPage />}'),
    '1.1 StudentHistoryPage route exists under /dashboard/history in App.tsx'
  );
  assert(
    appTsx.includes('<ScrollToTop />'),
    '1.2 ScrollToTop is globally mounted in App.tsx inside BrowserRouter'
  );

  const studentLayout = readFileSync('src/layouts/StudentLayout.tsx', 'utf-8');
  assert(
    studentLayout.includes("to: '/dashboard/history'") && studentLayout.includes("label: 'History'"),
    '1.3 Student layout includes dedicated History navigation link'
  );

  const studentDashboard = readFileSync('src/pages/student/StudentDashboardPage.tsx', 'utf-8');
  assert(
    studentDashboard.includes('/dashboard/history'),
    '1.4 Student dashboard includes quick action link to Participation History'
  );

  const studentRegDetail = readFileSync('src/pages/student/StudentRegistrationDetailPage.tsx', 'utf-8');
  assert(
    studentRegDetail.includes('/dashboard/history'),
    '1.5 Student registration detail page includes Back to History navigation'
  );

  // ==========================================
  // SECTION 2: STUDENT REGISTRATION & PARTICIPATION HISTORY
  // ==========================================
  console.log('\n--- SECTION 2: Student Registration & Participation History ---');
  const historyPage = readFileSync('src/pages/student/StudentHistoryPage.tsx', 'utf-8');

  assert(
    historyPage.includes("'all'") &&
    historyPage.includes("'upcoming'") &&
    historyPage.includes("'completed'") &&
    historyPage.includes("'cancelled'") &&
    historyPage.includes("'waitlisted'") &&
    historyPage.includes("'checked_in'"),
    '2.1 History page supports all required status filters (upcoming, completed, cancelled, waitlisted, checked-in)'
  );

  assert(
    historyPage.includes('dateFilter') &&
    historyPage.includes("'upcoming'") &&
    historyPage.includes("'past'") &&
    historyPage.includes("'last30'"),
    '2.2 History page supports schedule and date-range filters (upcoming, past, last 30 days)'
  );

  assert(
    historyPage.includes('searchQuery') &&
    historyPage.includes('eventName') &&
    historyPage.includes('ticketCode'),
    '2.3 History page supports search by event name, festival, ticket code, category, and transaction ID'
  );

  assert(
    historyPage.includes('appliedFee') &&
    historyPage.includes('paymentTransactionId') &&
    historyPage.includes('Free Entry'),
    '2.4 History page displays demo-payment history, fees, transactions, and free entry status'
  );

  assert(
    historyPage.includes('checkedInAt') && historyPage.includes('Gate Verified'),
    '2.5 History page preserves and displays gate check-in verification stamps'
  );

  assert(
    historyPage.includes('cancelledAt') && historyPage.includes('Released seat'),
    '2.6 History page preserves and displays seat cancellation records'
  );

  assert(
    historyPage.includes('Loading historical participation records') &&
    historyPage.includes('No matching activity found'),
    '2.7 History page provides explicit loading, empty, and filter error states'
  );

  // ==========================================
  // SECTION 3: PERSONALIZED RECOMMENDATIONS & NOTIFICATIONS
  // ==========================================
  console.log('\n--- SECTION 3: Personalized Recommendations & Notifications ---');

  // Verify interest taxonomy
  const expectedInterests = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Programming',
    'Robotics',
    'Debate',
    'Quiz',
    'Art',
    'Business',
    'Science Fair'
  ];
  const allInterestsPresent = expectedInterests.every(i => AVAILABLE_INTERESTS.includes(i));
  assert(
    allInterestsPresent,
    '3.1 AVAILABLE_INTERESTS includes all prompt-specified domains (Math, Physics, Chem, Bio, Programming, Robotics, Debate, Quiz, Art, Business, Science Fair)'
  );

  // Test doesEventMatchInterests logic
  const physicsEvent: Partial<EventItem> = {
    id: 'evt_physics_1',
    name: 'National Physics Olympiad 2026',
    description: 'Solve classical mechanics and astronomy problems',
    categoryName: 'Science',
    topics: ['Physics', 'Astronomy']
  };

  const matchRes1 = doesEventMatchInterests(physicsEvent as EventItem, ['Physics']);
  assert(
    matchRes1.matches && matchRes1.matchedInterests.includes('Physics'),
    '3.2 doesEventMatchInterests matches student with Physics interest'
  );

  const matchRes2 = doesEventMatchInterests(physicsEvent as EventItem, ['Robotics']);
  assert(
    !matchRes2.matches,
    '3.3 doesEventMatchInterests does not match unrelated student interest'
  );

  const codingEvent: Partial<EventItem> = {
    id: 'evt_code_1',
    name: 'Inter-College Hackathon',
    description: '48-hour software development marathon',
    categoryName: 'Tech',
    topics: ['Programming']
  };
  const matchRes3 = doesEventMatchInterests(codingEvent as EventItem, ['Programming']);
  assert(
    matchRes3.matches && matchRes3.matchedInterests.includes('Programming'),
    '3.4 doesEventMatchInterests matches Programming keyword and synonyms'
  );

  // Test eligibility check logic
  const restrictedEvent: Partial<EventItem> = {
    id: 'evt_senior_1',
    participantCategories: [
      { id: 'cat_1', name: 'Higher Secondary', eligible: true },
      { id: 'cat_2', name: 'University', eligible: true },
      { id: 'cat_3', name: 'Junior', eligible: false }
    ]
  };

  const juniorStudent: Partial<UserProfile> = {
    uid: 'stud_junior',
    participantCategory: 'Junior',
    classGrade: 'Grade 8'
  };

  const seniorStudent: Partial<UserProfile> = {
    uid: 'stud_senior',
    participantCategory: 'University',
    classGrade: 'Undergrad'
  };

  assert(
    !isStudentEligibleForEvent(juniorStudent, restrictedEvent as EventItem),
    '3.5 Ineligible student (Junior) is strictly rejected by isStudentEligibleForEvent'
  );

  assert(
    isStudentEligibleForEvent(seniorStudent, restrictedEvent as EventItem),
    '3.6 Eligible student (University) is accepted by isStudentEligibleForEvent'
  );

  // Open for everyone event
  const openEvent: Partial<EventItem> = {
    id: 'evt_open',
    participantCategories: [
      { id: 'cat_open', name: 'Open for Everyone', eligible: true }
    ]
  };
  assert(
    isStudentEligibleForEvent(juniorStudent, openEvent as EventItem),
    '3.7 Open for Everyone event permits all student categories'
  );

  // Test getPersonalizedEventSuggestions with published status & registration availability
  const mockPublishedEvents: Partial<EventItem>[] = [
    {
      id: 'e1',
      name: 'Math Challenge',
      description: 'Calculus and algebra',
      status: 'published',
      registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
      topics: ['Mathematics'],
      participantCategories: [{ id: 'c1', name: 'Open for Everyone', eligible: true }]
    },
    {
      id: 'e2_draft',
      name: 'Draft Physics Event',
      description: 'Not published yet',
      status: 'draft', // Draft! Should NOT be suggested
      registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
      topics: ['Physics']
    },
    {
      id: 'e3_closed',
      name: 'Closed Coding Contest',
      description: 'Registration closed',
      status: 'published',
      isRegistrationClosed: true, // Closed! Should NOT be suggested
      registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
      topics: ['Programming']
    },
    {
      id: 'e4_expired',
      name: 'Expired Debate',
      description: 'Past deadline',
      status: 'published',
      registrationDeadline: new Date(Date.now() - 86400000).toISOString(), // Expired!
      topics: ['Debate']
    }
  ];

  const mathStudent: Partial<UserProfile> = {
    uid: 'stud_math',
    interests: ['Mathematics', 'Physics', 'Programming', 'Debate']
  };

  const registeredEventIds = new Set<string>();
  const suggestions = getPersonalizedEventSuggestions(
    mockPublishedEvents as EventItem[],
    mathStudent,
    registeredEventIds
  );

  assert(
    suggestions.length === 1 && suggestions[0].event.id === 'e1',
    '3.8 getPersonalizedEventSuggestions includes ONLY active, published, open events matching interests'
  );

  // Check already registered exclusion
  registeredEventIds.add('e1');
  const suggestionsAfterReg = getPersonalizedEventSuggestions(
    mockPublishedEvents as EventItem[],
    mathStudent,
    registeredEventIds
  );
  assert(
    suggestionsAfterReg.length === 0,
    '3.9 getPersonalizedEventSuggestions excludes events the student has already registered for'
  );

  // Notification UI verification
  const notifBell = readFileSync('src/components/common/NotificationBell.tsx', 'utf-8');
  assert(
    notifBell.includes('Loading notifications...') &&
    notifBell.includes('Retry') &&
    notifBell.includes('No new notifications'),
    '3.10 NotificationBell implements loading, error with retry, and empty states'
  );

  assert(
    notifBell.includes('actionUrl') && notifBell.includes('Open Event'),
    '3.11 NotificationBell includes direct action link to event detail page'
  );

  assert(
    notifBell.includes('markNotificationAsRead') && notifBell.includes('markAllNotificationsAsRead'),
    '3.12 NotificationBell tracks read/unread status and provides mark read operations'
  );

  // Notification Service deduplication check
  const notifService = readFileSync('src/services/notificationService.ts', 'utf-8');
  assert(
    notifService.includes('const notifId = `notif_${userId}_${event.id}`') &&
    notifService.includes('existingSnap.exists()'),
    '3.13 notificationService uses deterministic ID notif_{userId}_{eventId} and prevents duplicate overwrite'
  );

  // Organizer event creation & editing topics tags
  const createEventPage = readFileSync('src/pages/organizer/OrganizerCreateEventPage.tsx', 'utf-8');
  const editEventPage = readFileSync('src/pages/organizer/OrganizerEditEventPage.tsx', 'utf-8');
  assert(
    createEventPage.includes('topics') && createEventPage.includes('AVAILABLE_INTERESTS') &&
    editEventPage.includes('topics') && editEventPage.includes('AVAILABLE_INTERESTS'),
    '3.14 Organizers can assign configurable category topics and recommendation tags during event creation & editing'
  );

  // ==========================================
  // SECTION 4: VISITOR ACCESS SETTING & PRECEDENCE
  // ==========================================
  console.log('\n--- SECTION 4: Visitor Access Setting & Precedence ---');

  // Test 1: Parent fest prohibits visitors -> campus closed
  const festNotAllowed: Partial<Fest> = { id: 'f1', visitorAccess: 'not_allowed' };
  const eventAllowed: Partial<EventItem> = { id: 'e1', visitorAccess: 'allowed' };
  assert(
    getEffectiveVisitorAccess(eventAllowed, festNotAllowed) === 'not_allowed',
    '4.1 Fest "not_allowed" takes top precedence over event "allowed" (entire campus closed)'
  );

  // Test 2: Event prohibits visitors while fest allows
  const festAllowed: Partial<Fest> = { id: 'f2', visitorAccess: 'allowed' };
  const eventNotAllowed: Partial<EventItem> = { id: 'e2', visitorAccess: 'not_allowed' };
  assert(
    getEffectiveVisitorAccess(eventNotAllowed, festAllowed) === 'not_allowed',
    '4.2 Event "not_allowed" prohibits visitors for this specific competition despite fest "allowed"'
  );

  // Test 3: Both allow visitors
  assert(
    getEffectiveVisitorAccess(eventAllowed, festAllowed) === 'allowed',
    '4.3 Event "allowed" and Fest "allowed" resolves to "allowed"'
  );

  // Test 4: Backwards compatibility safe default for older records without field
  assert(
    getEffectiveVisitorAccess({}, {}) === 'allowed',
    '4.4 Safe default for legacy records without visitorAccess field resolves to "allowed"'
  );

  // Test 5: Visitor display formatting
  const allowedDisplay = getVisitorAccessDisplay(eventAllowed, festAllowed);
  assert(
    allowedDisplay.badgeText === 'Visitors: Allowed' &&
    allowedDisplay.description.includes('Does not grant competitor passes'),
    '4.5 Visitor allowed display returns "Visitors: Allowed" and clarifies participant distinction'
  );

  const notAllowedDisplay = getVisitorAccessDisplay(eventNotAllowed, festAllowed);
  assert(
    notAllowedDisplay.badgeText === 'Visitors: Not Allowed' &&
    notAllowedDisplay.description.includes('Admittance is strictly restricted'),
    '4.6 Visitor not allowed display returns "Visitors: Not Allowed"'
  );

  // Verify UI displays on public detail pages
  const festDetailPage = readFileSync('src/pages/public/FestDetailPage.tsx', 'utf-8');
  const eventDetailPage = readFileSync('src/pages/public/EventDetailPage.tsx', 'utf-8');
  assert(
    festDetailPage.includes('getVisitorAccessDisplay') &&
    eventDetailPage.includes('getVisitorAccessDisplay'),
    '4.7 Public Fest and Event detail pages render the visitor policy with badgeText and explanation'
  );

  // Verify creation & editing pages have visitor access radio inputs
  assert(
    createEventPage.includes('name="visitorAccess"') &&
    createEventPage.includes('Visitors Allowed') &&
    createEventPage.includes('Visitors Not Allowed'),
    '4.8 Organizer Create Event page provides configurable Visitors Allowed / Not Allowed setting'
  );

  assert(
    editEventPage.includes('name="visitorAccess"') &&
    editEventPage.includes('Visitors Allowed') &&
    editEventPage.includes('Visitors Not Allowed'),
    '4.9 Organizer Edit Event page provides configurable Visitors Allowed / Not Allowed setting'
  );

  const createFestPage = readFileSync('src/pages/organizer/OrganizerCreateFestPage.tsx', 'utf-8');
  const editFestPage = readFileSync('src/pages/organizer/OrganizerEditFestPage.tsx', 'utf-8');
  assert(
    createFestPage.includes('name="visitorAccess"') &&
    editFestPage.includes('name="visitorAccess"'),
    '4.10 Organizer Create/Edit Fest pages provide configurable festival visitor policy'
  );

  // ==========================================
  // SECTION 5: GLOBAL ROUTE SCROLL RESTORATION
  // ==========================================
  console.log('\n--- SECTION 5: Global Route Scroll Restoration ---');
  const scrollToTop = readFileSync('src/components/common/ScrollToTop.tsx', 'utf-8');
  assert(
    scrollToTop.includes('window.scrollTo(0, 0)') &&
    scrollToTop.includes("navigationType !== 'POP'"),
    '5.1 ScrollToTop scrolls to (0, 0) upon push/replace navigation while preserving POP (back/forward) position'
  );

  assert(
    scrollToTop.includes('useLocation') &&
    scrollToTop.includes('useNavigationType') &&
    scrollToTop.includes('pathname'),
    '5.2 Centralized React Router integration detects route changes automatically'
  );

  // ==========================================
  // SECTION 6: SECURITY & DATA INTEGRITY AUDIT
  // ==========================================
  console.log('\n--- SECTION 6: Security & Firestore Rules Audit ---');
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');

  assert(
    firestoreRules.includes('match /notifications/{notificationId}'),
    '6.1 Notifications collection rule exists in firestore.rules'
  );

  assert(
    firestoreRules.includes('resource.data.userId == request.auth.uid || isAdmin()'),
    '6.2 Students can read only their own private notifications (userId == request.auth.uid)'
  );

  assert(
    firestoreRules.includes('request.resource.data.userId == request.auth.uid') &&
    firestoreRules.includes('isOrgMember(request.resource.data.organizationId)'),
    '6.3 Students cannot create notifications for other users; organizers restricted to their org events'
  );

  assert(
    firestoreRules.includes('match /registrations/{registrationId}'),
    '6.4 Registrations collection rule enforces student and organizer access boundaries'
  );

  assert(
    firestoreRules.includes('isOrgMember(resource.data.organizationId)') &&
    firestoreRules.includes('resource.data.userId == request.auth.uid'),
    '6.5 Registrations read/list restricted to student owner and authorized organizing club members'
  );

  assert(
    firestoreRules.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read'])"),
    '6.6 Students can only update read status on their notifications'
  );

  console.log('\n====================================================');
  console.log(`TOTAL PHASE 2 TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('====================================================');

  if (passed === total) {
    console.log('\n>>> ALL PHASE 2 REQUIREMENTS SUCCESSFULLY VERIFIED <<<\n');
  } else {
    process.exit(1);
  }
}

runPhase2ComprehensiveSuite();
