import { readFileSync } from 'fs';

function testOrganizerFoundation() {
  console.log('Testing Phase 4.1 Organizer Dashboard Foundation...');
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

  // 1. Organizer Context & Services
  const orgService = readFileSync('src/services/organizationService.ts', 'utf-8');
  assert(orgService.includes('getUserOrganizations'), 'organizationService defines getUserOrganizations');
  assert(orgService.includes("where('userId', '==', userId)"), 'getUserOrganizations queries membership scoped by userId');

  const festService = readFileSync('src/services/festService.ts', 'utf-8');
  assert(festService.includes('getOrganizationFests'), 'festService defines getOrganizationFests');
  assert(festService.includes("where('organizationId', '==', organizationId)"), 'getOrganizationFests scopes query to organizationId');

  const eventService = readFileSync('src/services/eventService.ts', 'utf-8');
  assert(eventService.includes('getOrganizationEvents'), 'eventService defines getOrganizationEvents');
  assert(eventService.includes("where('organizationId', '==', organizationId)"), 'getOrganizationEvents scopes query to organizationId');

  const regService = readFileSync('src/services/registrationService.ts', 'utf-8');
  assert(regService.includes('getOrganizationRegistrations'), 'registrationService defines getOrganizationRegistrations');
  assert(regService.includes("where('organizationId', '==', organizationId)"), 'getOrganizationRegistrations scopes query to organizationId');

  // 2. Organizer Context
  const orgContext = readFileSync('src/context/OrganizerContext.tsx', 'utf-8');
  assert(orgContext.includes('OrganizerProvider'), 'OrganizerContext defines OrganizerProvider');
  assert(orgContext.includes('useOrganizer'), 'OrganizerContext defines useOrganizer hook');
  assert(orgContext.includes('activeOrganization'), 'OrganizerContext manages activeOrganization state');

  // 3. Organizer Layout
  const orgLayout = readFileSync('src/layouts/OrganizerLayout.tsx', 'utf-8');
  assert(orgLayout.includes('OrganizerProvider'), 'OrganizerLayout mounts OrganizerProvider');
  assert(orgLayout.includes('activeOrganization'), 'OrganizerLayout renders active organization dynamically');
  assert(orgLayout.includes('Back to Events'), 'OrganizerLayout provides Back to Events link');
  assert(orgLayout.includes('Student View'), 'OrganizerLayout provides Student View link');
  assert(orgLayout.includes('/organizer/fests'), 'OrganizerLayout navigation has Fests link');
  assert(orgLayout.includes('/organizer/events'), 'OrganizerLayout navigation has Events link');
  assert(orgLayout.includes('/organizer/participants'), 'OrganizerLayout navigation has Participants link');
  assert(orgLayout.includes('/organizer/analytics'), 'OrganizerLayout navigation has Analytics link');

  // 4. Organizer Dashboard Page
  const orgPage = readFileSync('src/pages/organizer/OrganizerConsolePage.tsx', 'utf-8');
  assert(orgPage.includes('useOrganizer'), 'OrganizerConsolePage consumes useOrganizer');
  assert(orgPage.includes('totalFests'), 'OrganizerConsolePage computes Total Fests metric');
  assert(orgPage.includes('activeFests'), 'OrganizerConsolePage computes Active Fests metric');
  assert(orgPage.includes('totalEvents'), 'OrganizerConsolePage computes Total Events metric');
  assert(orgPage.includes('totalRegistrations'), 'OrganizerConsolePage computes Total Registrations metric');
  assert(orgPage.includes('upcomingEvents'), 'OrganizerConsolePage lists Upcoming Events');
  assert(orgPage.includes('Recent Registrations'), 'OrganizerConsolePage lists Recent Registrations');

  // 5. ProtectedRoute & Access Control
  const protectedRoute = readFileSync('src/components/common/ProtectedRoute.tsx', 'utf-8');
  assert(protectedRoute.includes("allowedRoles"), 'ProtectedRoute enforces allowedRoles');
  assert(protectedRoute.includes("Access Restricted"), 'ProtectedRoute renders Access Restricted for unauthorized roles');

  const app = readFileSync('src/App.tsx', 'utf-8');
  assert(app.includes("allowedRoles={['organizer', 'admin']}"), 'App.tsx protects /organizer with organizer and admin roles');

  console.log(`\nCompleted: ${passed}/${total} assertions passed.`);
}

testOrganizerFoundation();
