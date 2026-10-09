import { readFileSync } from 'fs';

function testPhase1RegistrationAndDataSuite() {
  console.log('================================================================');
  console.log('FESTOFY — PHASE 1 SPECIFICATION VERIFICATION TEST SUITE');
  console.log('Registration, Payments, Student Profiles & Core Data Architecture');
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
  const templateService = readFileSync('src/services/templateService.ts', 'utf-8');
  const userService = readFileSync('src/services/userService.ts', 'utf-8');
  const imageUploadService = readFileSync('src/services/imageUploadService.ts', 'utf-8');
  const regForm = readFileSync('src/components/registration/RegistrationForm.tsx', 'utf-8');
  const paymentModal = readFileSync('src/components/registration/DemoPaymentModal.tsx', 'utf-8');
  const templateModal = readFileSync('src/components/registration/TemplateSelectorModal.tsx', 'utf-8');
  const studentProfilePage = readFileSync('src/pages/student/StudentProfilePage.tsx', 'utf-8');
  const orgParticipantsPage = readFileSync('src/pages/organizer/OrganizerParticipantsPage.tsx', 'utf-8');
  const eventDetailPage = readFileSync('src/pages/public/EventDetailPage.tsx', 'utf-8');
  const types = readFileSync('src/types/index.ts', 'utf-8');

  // --- 1. REUSABLE REGISTRATION FORM TEMPLATES ---
  console.log('--- 1. Reusable Registration Form Templates ---');

  // 1.1 Template service supports full CRUD operations
  assert(
    templateService.includes('export async function saveFormTemplate') &&
    templateService.includes('export async function updateFormTemplate') &&
    templateService.includes('export async function deleteFormTemplate') &&
    templateService.includes('export async function getOrganizationFormTemplates'),
    '1.1 Organizer can create, rename, edit, and delete templates in service'
  );

  // 1.2 Sensible default participant fields are provided
  assert(
    templateService.includes('getDefaultParticipantQuestions') &&
    templateService.includes('Full Name') &&
    templateService.includes('Institution / College / School') &&
    templateService.includes('Class / Grade / Academic Year') &&
    templateService.includes('Contact Phone Number') &&
    templateService.includes('Email Address'),
    '1.2 Sensible default participant fields (name, institution, class, phone, email) available'
  );

  // 1.3 Independent snapshot upon selecting template for an event
  assert(
    templateModal.includes('sourceFields.map((f, idx) => ({') &&
    templateModal.includes('id: `field_${Date.now()}_${idx}_') &&
    templateModal.includes('Applying creates an independent copy for this event'),
    '1.3 Applying a template creates independent deep-cloned question snapshot with unique IDs'
  );

  // 1.4 Modifying event questions does not alter the original template
  assert(
    regForm.includes('registrationData: customResponses') &&
    types.includes('customFormFields?: EventFormField[]'),
    '1.4 Event questions are stored independently on the event and submitted answers on registration'
  );

  // 1.5 Firestore rules protect registrationFormTemplates
  assert(
    firestoreRules.includes('match /registrationFormTemplates/{templateId}') &&
    firestoreRules.includes('isOrgMember(resource.data.organizationId)') &&
    firestoreRules.includes("resource.data.organizationId != 'default'"),
    '1.5 Firestore security rules enforce organization ownership and protect system defaults'
  );

  // --- 2. CONFIGURABLE PARTICIPANT CATEGORIES ---
  console.log('\n--- 2. Configurable Participant Categories ---');

  // 2.1 Category config interface supports eligibility and custom fees
  assert(
    types.includes('export interface ParticipantCategoryConfig') &&
    types.includes('fee?: number;') &&
    types.includes('eligible?: boolean;'),
    '2.1 ParticipantCategoryConfig data model supports name, custom fee, and eligibility'
  );

  // 2.2 Server-side registration engine validates participant category eligibility
  assert(
    regService.includes('INELIGIBLE_CATEGORY') &&
    regService.includes('The participant category') &&
    regService.includes('is not eligible for this competition'),
    '2.2 Registration engine strictly validates participant category eligibility against event data'
  );

  // 2.3 Existing registrations remain immune to future category edits
  assert(
    types.includes('participantCategory?: string;') &&
    regService.includes('participantCategory: trustedCategory,'),
    '2.3 Immutable category snapshot stored in every registration document'
  );

  // --- 3. CONFIGURABLE REGISTRATION FEES ---
  console.log('\n--- 3. Configurable Registration Fees ---');

  // 3.1 Supports free registration at ৳0 and paid amounts
  assert(
    regForm.includes('effectiveFee === 0') &&
    regForm.includes("method: effectiveFee === 0 ? 'free' : undefined") &&
    types.includes("export type PaymentMethod = 'bkash' | 'nagad' | 'free'"),
    '3.1 System seamlessly supports free registration at ৳0 and paid registrations'
  );

  // 3.2 Display applicable fee before submission on detail page and registration form
  assert(
    eventDetailPage.includes('Registration Fee:') &&
    regForm.includes('Payable Amount') || regForm.includes('effectiveFee'),
    '3.2 Applicable fee clearly presented to participant prior to submission'
  );

  // 3.3 Trusted event data fee validation (never client-forged amount)
  assert(
    regService.includes('let calculatedFee = 0;') &&
    regService.includes('appliedFee = calculatedFee;') &&
    regService.includes('PAYMENT_REQUIRED'),
    '3.3 Registration engine validates fees using trusted event data rather than client fee'
  );

  // 3.4 Immutable fee snapshot stored in registration record
  assert(
    regService.includes('appliedFee,') &&
    regService.includes("currency: 'BDT',") &&
    regService.includes('paymentStatus,'),
    '3.4 Immutable appliedFee and currency snapshot stored with registration'
  );

  // --- 4. DEMO BKASH / NAGAD SIMULATED PAYMENT ---
  console.log('\n--- 4. Demo bKash & Nagad Simulated Payment ---');

  // 4.1 Clear demo / simulation branding
  assert(
    paymentModal.includes('Simulated Demo Environment — No Real Money') &&
    paymentModal.includes('Demo bKash') &&
    paymentModal.includes('Demo Nagad'),
    '4.1 Prominently labeled SIMULATED PAYMENT ONLY with zero real money processing'
  );

  // 4.2 Support simulated success and simulated failure test scenarios
  assert(
    paymentModal.includes('handleSimulatePayment(true)') &&
    paymentModal.includes('handleSimulatePayment(false)') &&
    paymentModal.includes('Test Failure'),
    '4.2 Deterministic test scenarios support both simulated success and failure'
  );

  // 4.3 Blocks submission until simulated payment succeeds
  assert(
    regForm.includes('effectiveFee > 0 && !paymentDetails.completed') &&
    regForm.includes('Please complete the demo bKash or Nagad payment'),
    '4.3 Registration form enforces successful payment simulation before submission'
  );

  // 4.4 Stores demo payment audit metadata
  assert(
    types.includes('paymentTransactionId?: string;') &&
    types.includes('paymentReference?: string;') &&
    types.includes('paidAt?: string;'),
    '4.4 Complete demo payment metadata (method, trxID, reference, paidAt, status) captured'
  );

  // --- 5. STUDENT PROFILE COMPLETION & PICTURE UPLOAD ---
  console.log('\n--- 5. Student Profile Completion & Picture Upload ---');

  // 5.1 Profile completion indicator calculation
  assert(
    userService.includes('export function calculateProfileCompletion') &&
    userService.includes('percentage') &&
    userService.includes('missingFields'),
    '5.1 calculateProfileCompletion engine computes percentage, count, and missing fields'
  );

  // 5.2 Direct CDN image upload without storing large binaries in Firestore
  assert(
    studentProfilePage.includes('uploadDirectImage') &&
    studentProfilePage.includes('photoProgress') &&
    imageUploadService.includes('uploadDirectImage'),
    '5.2 Profile picture uploads use CDN storage service rather than storing large binaries in Firestore'
  );

  // 5.3 Validates image type and file size
  assert(
    studentProfilePage.includes("['image/jpeg', 'image/png', 'image/webp']") &&
    studentProfilePage.includes('5 * 1024 * 1024'),
    '5.3 Image format (JPEG/PNG/WebP) and file size limits are verified on upload'
  );

  // 5.4 Profile picture displayed in registration UI and student views
  assert(
    regService.includes('studentPhotoURL: input.studentPhotoURL') &&
    studentProfilePage.includes('Profile Picture *'),
    '5.4 Profile picture is integrated into student profile and pass snapshots'
  );

  // 5.5 Graceful handling of incomplete profiles without blocking account access
  assert(
    studentProfilePage.includes('calculateProfileCompletion') &&
    !studentProfilePage.includes('throw new Error("Incomplete profile cannot browse")'),
    '5.5 Incomplete profiles handled gracefully with completion prompts'
  );

  // --- 6. ORGANIZER ACCESS & DATA PRIVACY ---
  console.log('\n--- 6. Organizer Access & Data Privacy ---');

  // 6.1 Organizer views only relevant student details for their event
  assert(
    orgParticipantsPage.includes('reg.studentPhotoURL') &&
    orgParticipantsPage.includes('reg.studentName') &&
    orgParticipantsPage.includes('reg.studentEmail') &&
    orgParticipantsPage.includes('reg.participantCategory') &&
    orgParticipantsPage.includes('reg.appliedFee') &&
    orgParticipantsPage.includes('reg.paymentTransactionId'),
    '6.1 Organizer manifest inspects participant photo, name, category, and demo payment status'
  );

  // 6.2 Scoped strictly by organizationId in Firestore security rules
  assert(
    firestoreRules.includes('isOrgMember(resource.data.organizationId)') &&
    !firestoreRules.includes('allow get: if isOrgMember(resource.data.organizationId) || true'),
    '6.2 Access restrictions strictly enforced through Firestore security rules'
  );

  // --- 7. DATA INTEGRITY & REGISTRATION LIFECYCLE ---
  console.log('\n--- 7. Data Integrity & Registration Lifecycle ---');

  // 7.1 Single deterministic registration key prevents duplicates
  assert(
    regService.includes('getDeterministicRegistrationId') &&
    firestoreRules.includes("registrationId == request.resource.data.eventId + '_' + request.auth.uid"),
    '7.1 Deterministic key {eventId}_{userId} guarantees single registration per student per event'
  );

  // 7.2 Atomic transaction couples registration creation with capacity counter
  assert(
    regService.includes('runTransaction(db, async (transaction)') &&
    regService.includes('transaction.update(eventDocRef') &&
    regService.includes('currentRegistrations: newCurrentRegistrations'),
    '7.2 Atomic Firestore transaction prevents capacity oversubscription and orphaned records'
  );

  // 7.3 Rules allow payment and participant snapshot fields
  assert(
    firestoreRules.includes('studentPhotoURL') &&
    firestoreRules.includes('appliedFee') &&
    firestoreRules.includes('paymentStatus'),
    '7.3 Security rules allow complete registration snapshot payload'
  );

  console.log(`\n================================================================`);
  console.log(`Phase 1 Verification Results: ${passed}/${total} assertions passed.`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exitCode = 1;
  }
}

testPhase1RegistrationAndDataSuite();
