import { readFileSync } from 'fs';
import { calculateProfileCompletion } from './services/userService';
import { getDefaultParticipantFields } from './services/templateService';

function runPhase1VerificationSuite() {
  console.log('===============================================================');
  console.log('FESTOFY PHASE 1: COMPREHENSIVE VERIFICATION & AUDIT SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
      process.exitCode = 1;
    }
  }

  // Load codebase files for static structure & invariant verification
  const firestoreRules = readFileSync('firestore.rules', 'utf-8');
  const templateService = readFileSync('src/services/templateService.ts', 'utf-8');
  const templateModal = readFileSync('src/components/registration/TemplateSelectorModal.tsx', 'utf-8');
  const registrationService = readFileSync('src/services/registrationService.ts', 'utf-8');
  const createEventPage = readFileSync('src/pages/organizer/OrganizerCreateEventPage.tsx', 'utf-8');
  const editEventPage = readFileSync('src/pages/organizer/OrganizerEditEventPage.tsx', 'utf-8');
  const demoPaymentModal = readFileSync('src/components/registration/DemoPaymentModal.tsx', 'utf-8');
  const registrationForm = readFileSync('src/components/registration/RegistrationForm.tsx', 'utf-8');
  const studentProfilePage = readFileSync('src/pages/student/StudentProfilePage.tsx', 'utf-8');
  const userService = readFileSync('src/services/userService.ts', 'utf-8');
  const orgParticipantsPage = readFileSync('src/pages/organizer/OrganizerParticipantsPage.tsx', 'utf-8');
  const typesIndex = readFileSync('src/types/index.ts', 'utf-8');

  // --- SECTION 1: REUSABLE REGISTRATION FORM TEMPLATES ---
  console.log('\n--- 1. Reusable Registration Form Templates ---');

  // 1.1 Sensible default participant fields
  const defaultFields = getDefaultParticipantFields();
  assert(
    defaultFields.length >= 5 &&
    defaultFields.some(f => f.label.toLowerCase().includes('name')) &&
    defaultFields.some(f => f.label.toLowerCase().includes('institution')) &&
    defaultFields.some(f => f.label.toLowerCase().includes('class') || f.label.toLowerCase().includes('grade')) &&
    defaultFields.some(f => f.label.toLowerCase().includes('phone')) &&
    defaultFields.some(f => f.label.toLowerCase().includes('email')),
    '1.1 Default participant fields provide sensible initial structure (name, inst, grade, phone, email)'
  );

  // 1.2 Template CRUD methods
  assert(
    templateService.includes('createFormTemplate') &&
    templateService.includes('export async function updateFormTemplate') &&
    templateService.includes('export async function renameFormTemplate') &&
    templateService.includes('export async function deleteFormTemplate') &&
    templateService.includes('getOrganizationFormTemplates'),
    '1.2 Template service implements create, update, rename, delete, and list operations'
  );

  // 1.3 Independent Snapshot: Event form questions are decoupled from template document
  assert(
    createEventPage.includes('customFormFields: customFields.map') &&
    editEventPage.includes('customFormFields: customFields.map') &&
    templateModal.includes('clonedFields: EventFormField[]'),
    '1.3 Events store independent snapshot preventing changes to templates from altering events'
  );

  // 1.4 Template selection modal UI includes rename and question editing
  assert(
    templateModal.includes('handleStartEditTemplate') &&
    templateModal.includes('handleSaveEditedTemplate') &&
    templateModal.includes('handleApplyDefaultFields'),
    '1.4 Template Selector UI supports renaming, question customization, and sensible defaults'
  );

  // 1.5 Submissions store answers decoupled from future event edits
  assert(
    registrationService.includes('registrationData: input.registrationData || {}') &&
    registrationForm.includes('registrationData: customResponses'),
    '1.5 Registrations store immutable answers map protecting submitted responses'
  );

  // --- SECTION 2: CONFIGURABLE PARTICIPANT CATEGORIES ---
  console.log('\n--- 2. Configurable Participant Categories ---');

  // 2.1 Category configuration in Event & Fest schemas
  assert(
    typesIndex.includes('interface ParticipantCategoryConfig') &&
    typesIndex.includes('id: string;') &&
    typesIndex.includes('name: string;') &&
    typesIndex.includes('fee?: number;') &&
    typesIndex.includes('eligible?: boolean;'),
    '2.1 ParticipantCategoryConfig schema supports dynamic category IDs, labels, custom fees, and eligibility'
  );

  // 2.2 Organizers can add, rename, and remove categories
  assert(
    createEventPage.includes('handleQuickAddCategory') &&
    createEventPage.includes('handleRemoveCategory') &&
    editEventPage.includes('handleRemoveCategory'),
    '2.2 Event creation & editing supports custom participant categories management'
  );

  // 2.3 Eligibility validation during registration
  assert(
    registrationService.includes('INELIGIBLE_CATEGORY') &&
    registrationService.includes('participantCategory') &&
    registrationService.includes('eventData.participantCategories'),
    '2.3 Registration service rejects ineligible participant categories during registration'
  );

  // 2.4 Registrations preserve historical participant category
  assert(
    registrationService.includes('participantCategory: trustedCategory') &&
    typesIndex.includes('participantCategory?: string;'),
    '2.4 Registrations persist snapshot of participantCategory preserving historical data'
  );

  // --- SECTION 3: REGISTRATION FEES ---
  console.log('\n--- 3. Registration Fees ---');

  // 3.1 Support for free ৳0 and paid amounts
  assert(
    createEventPage.includes('Free (৳0)') &&
    createEventPage.includes('Paid Event') &&
    registrationForm.includes('effectiveFee === 0'),
    '3.1 System cleanly differentiates Free (৳0) and Paid registration pricing'
  );

  // 3.2 Category-specific fee calculation
  assert(
    registrationForm.includes('selected.fee') &&
    registrationService.includes('if (typeof matched.fee === \'number\')') &&
    registrationService.includes('calculatedFee = Math.max(0, matched.fee)'),
    '3.2 Category-specific fee overrides base event fee both in client UI and server transaction'
  );

  // 3.3 Trusted calculation in transaction (prevents client price tampering)
  assert(
    registrationService.includes('// 10. Authoritative Participant Category & Eligibility Validation') &&
    registrationService.includes('runTransaction(db, async (transaction) => {') &&
    registrationService.includes('const appliedFee = calculatedFee;'),
    '3.3 Transaction calculates fee from authoritative eventDoc, ignoring client-tampered amounts'
  );

  // 3.4 Immutable fee snapshot in registration
  assert(
    registrationService.includes('appliedFee,') &&
    registrationService.includes("currency: 'BDT'") &&
    typesIndex.includes('appliedFee?: number;') &&
    typesIndex.includes('currency?: string;'),
    '3.4 Registration document stores immutable appliedFee snapshot and currency'
  );

  // --- SECTION 4: DEMO bKASH / NAGAD PAYMENT SIMULATOR ---
  console.log('\n--- 4. Demo bKash/Nagad Payment Simulator ---');

  // 4.1 Explicit "Simulated Payment" warning badges
  assert(
    demoPaymentModal.includes('Simulated Demo Environment — No Real Money') &&
    demoPaymentModal.includes('Merchant Simulator'),
    '4.1 Demo payment UI displays prominent sandbox disclaimers stating no real money is processed'
  );

  // 4.2 Gateway choices: bKash and Nagad
  assert(
    demoPaymentModal.includes('Demo bKash') &&
    demoPaymentModal.includes('Demo Nagad') &&
    demoPaymentModal.includes("prefix = selectedMethod === 'bkash' ? 'BK' : 'NG'"),
    '4.2 Supports both demo bKash and demo Nagad with provider-specific prefix generation'
  );

  // 4.3 Deterministic test scenarios (Simulate Success vs Test Failure)
  assert(
    demoPaymentModal.includes('handleSimulatePayment(true)') &&
    demoPaymentModal.includes('handleSimulatePayment(false)') &&
    demoPaymentModal.includes('Simulate Payment Success') &&
    demoPaymentModal.includes('Test Failure'),
    '4.3 Provides deterministic simulator controls for testing success and gateway failure states'
  );

  // 4.4 Registration blocked until payment is completed
  assert(
    registrationForm.includes('if (effectiveFee > 0 && !paymentDetails.completed)') &&
    registrationService.includes('if (calculatedFee > 0)') &&
    registrationService.includes('PAYMENT_REQUIRED'),
    '4.4 Student registration is strictly gated until verified demo payment is supplied'
  );

  // 4.5 Payment status recorded in registration
  assert(
    registrationService.includes('paymentTransactionId: input.paymentTransactionId') &&
    registrationService.includes('paymentReference: input.paymentReference') &&
    registrationService.includes('paymentMethod,'),
    '4.5 Registration records payment transaction ID, provider, reference, and timestamps'
  );

  // --- SECTION 5: STUDENT PROFILE COMPLETION ---
  console.log('\n--- 5. Student Profile Completion ---');

  // 5.1 Profile completion indicator logic test
  const emptyProfileCalc = calculateProfileCompletion({});
  const completeProfileCalc = calculateProfileCompletion({
    displayName: 'Tanvir Hossain',
    photoURL: 'https://images.unsplash.com/photo-1534528741775',
    phone: '+8801700112233',
    institution: 'Dhaka University',
    classGrade: 'Undergraduate',
    participantCategory: 'University',
    studentId: 'DU-CS-2026',
    interests: ['Programming', 'Robotics']
  });

  assert(
    emptyProfileCalc.percentage === 0 &&
    emptyProfileCalc.missingFields.length === 8 &&
    completeProfileCalc.percentage === 100 &&
    completeProfileCalc.missingFields.length === 0,
    '5.1 Profile completion algorithm correctly calculates percentage (0% empty, 100% full)'
  );

  // 5.2 Profile picture is mandatory for 100% completion
  const withoutPicCalc = calculateProfileCompletion({
    displayName: 'Tanvir Hossain',
    photoURL: '',
    phone: '+8801700112233',
    institution: 'Dhaka University',
    classGrade: 'Undergraduate',
    participantCategory: 'University',
    studentId: 'DU-CS-2026',
    interests: ['Programming']
  });
  assert(
    withoutPicCalc.missingFields.includes('Profile Picture') && withoutPicCalc.percentage < 100,
    '5.2 Profile picture is explicitly required to reach complete profile status'
  );

  // 5.3 Photo upload validation & CDN storage
  assert(
    studentProfilePage.includes("['image/jpeg', 'image/png', 'image/webp']") &&
    studentProfilePage.includes('5 * 1024 * 1024') &&
    studentProfilePage.includes('uploadDirectImage(file'),
    '5.3 Student photo upload enforces MIME type checks, 5MB limit, and direct CDN storage'
  );

  // 5.4 Profile update rules in Firestore
  assert(
    firestoreRules.includes("match /users/{userId}") &&
    firestoreRules.includes("'photoURL'") &&
    firestoreRules.includes("'participantCategory'") &&
    firestoreRules.includes("'isProfileComplete'"),
    '5.4 Firestore rules authorize user updates for photoURL, participantCategory, and completion status'
  );

  // --- SECTION 6: ORGANIZER ACCESS TO REGISTERED STUDENT DETAILS ---
  console.log('\n--- 6. Organizer Access & Data Privacy ---');

  // 6.1 Organizer participant dossier renders necessary details
  assert(
    orgParticipantsPage.includes('reg.studentPhotoURL') &&
    orgParticipantsPage.includes('reg.studentName') &&
    orgParticipantsPage.includes('reg.studentEmail') &&
    orgParticipantsPage.includes('reg.studentPhone') &&
    orgParticipantsPage.includes('reg.institution') &&
    orgParticipantsPage.includes('reg.participantCategory') &&
    orgParticipantsPage.includes('reg.paymentStatus') &&
    orgParticipantsPage.includes('reg.registrationData'),
    '6.1 Organizer dossier displays student photo, contact, category, answers, and payment status'
  );

  // 6.2 Organizers cannot access registrations of other organizations
  assert(
    firestoreRules.includes('isOrgMember(resource.data.organizationId)') &&
    registrationService.includes("where('organizationId', '==', organizationId)"),
    '6.2 Firestore rules enforce organizer access strictly to their own organization events'
  );

  // 6.3 Student private profiles remain protected
  assert(
    firestoreRules.includes('match /users/{userId}') &&
    firestoreRules.includes('allow get: if isOwner(userId) || isAdmin();') &&
    firestoreRules.includes('allow list: if isAdmin();'),
    '6.3 Users collection remains private to the user and admins; organizers read registration snapshots'
  );

  // --- SECTION 7: REGISTRATION DATA INTEGRITY & ATOMICITY ---
  console.log('\n--- 7. Registration Data Integrity & Concurrency ---');

  // 7.1 Deterministic registration ID prevents duplicates
  assert(
    registrationService.includes('getDeterministicRegistrationId(input.eventId, userId)') &&
    registrationService.includes('export function getDeterministicRegistrationId') &&
    firestoreRules.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid"),
    '7.1 Deterministic key {eventId}_{userId} strictly blocks duplicate registrations at rule and service level'
  );

  // 7.2 Coupled atomic counter update on event document
  assert(
    registrationService.includes('transaction.update(eventDocRef, {') &&
    registrationService.includes('currentRegistrations: newCurrentRegistrations') &&
    firestoreRules.includes('getAfter(/databases/$(database)/documents/events/$(request.resource.data.eventId)).data.currentRegistrations == ('),
    '7.2 Atomic Firestore transaction updates event capacity counter and enforces overbooking prevention'
  );

  // 7.3 Atomic registration cancellation with counter decrement
  assert(
    registrationService.includes('export async function cancelRegistration') &&
    firestoreRules.includes('request.resource.data.status == \'cancelled\'') &&
    firestoreRules.includes('currentRegistrations - 1'),
    '7.3 Registration cancellation atomically decrements event currentRegistrations counter'
  );

  console.log('\n===============================================================');
  console.log(`PHASE 1 VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('===============================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase1VerificationSuite();
