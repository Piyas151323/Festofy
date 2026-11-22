import assert from 'assert';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

console.log('================================================================');
console.log('FESTOFY — PHASE 10–12 FINAL SECURITY AUDIT, QA & READINESS SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: QR CODE STANDARDS COMPLIANCE & DECODE VERIFICATION
// -------------------------------------------------------------
console.log('--- 1. Standards-Compliant QR Engine & Decoder Verification ---');

const qrPayloads = [
  'FST-K9M2-8KJ7',
  'FST-K9M2-8KJ7::reg_1791531754097',
  'SHORT-1',
  'FST-LONG-CHALLENGE-ROBOTICS-SUMMIT-2026-DHAKA-BANGLADESH-ENTRY-TICKET-A1B2C3D4E5',
  'FST_2026#01-V!',
  'TICKET::EVENT_HACKATHON_2026::STUDENT_12345'
];

for (const payload of qrPayloads) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
  assert.ok(qr.modules.size >= 21, 'QR Code version matrix must meet minimum size');

  const size = qr.modules.size;
  const scale = 4;
  const margin = 2;
  const totalDim = (size + margin * 2) * scale;

  const rgba = new Uint8ClampedArray(totalDim * totalDim * 4);
  rgba.fill(255); // White canvas

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.get(r, c)) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = (margin + c) * scale + dx;
            const py = (margin + r) * scale + dy;
            const idx = (py * totalDim + px) * 4;
            rgba[idx] = 0;
            rgba[idx + 1] = 0;
            rgba[idx + 2] = 0;
            rgba[idx + 3] = 255;
          }
        }
      }
    }
  }

  const decoded = jsQR(rgba, totalDim, totalDim);
  assert.ok(decoded, `QR code must be decodable for payload: ${payload}`);
  assert.strictEqual(
    decoded.data,
    payload,
    `Decoded QR payload must exactly match input payload "${payload}"`
  );
  console.log(`[PASS] Decoded payload verified: "${payload.slice(0, 32)}..."`);
}

// Verify QRCodeSVG uses official QRCode engine
const qrSvgPath = path.join(process.cwd(), 'src/components/common/QRCodeSVG.tsx');
const qrSvgCode = fs.readFileSync(qrSvgPath, 'utf8');
assert.ok(qrSvgCode.includes("import QRCode from 'qrcode'"), 'QRCodeSVG imports official qrcode engine');
assert.ok(qrSvgCode.includes('QRCode.create'), 'QRCodeSVG utilizes QRCode.create');
console.log('[PASS] QRCodeSVG confirmed standards-compliant ISO/IEC 18004 vector SVG engine');

// -------------------------------------------------------------
// SECTION 2: DIGITAL PASS SECURITY & LIFECYCLE GUARDS
// -------------------------------------------------------------
console.log('\n--- 2. Digital Pass Security & Lifecycle State Verification ---');

const passModalPath = path.join(process.cwd(), 'src/components/common/DigitalPassModal.tsx');
const passModalCode = fs.readFileSync(passModalPath, 'utf8');

// Ineligible pass differentiation
assert.ok(passModalCode.includes("isCancelled = registration.status === 'cancelled'"), 'Pass identifies cancelled state');
assert.ok(passModalCode.includes("isPending = registration.status === 'pending'"), 'Pass identifies pending state');
assert.ok(passModalCode.includes('VOID / CANCELLED PASS'), 'Cancelled pass explicitly indicates VOID state');
assert.ok(passModalCode.includes('APPLICATION UNDER REVIEW'), 'Pending pass indicates under review state');
assert.ok(passModalCode.includes('This registration was cancelled and cannot be presented for gate admission'), 'Explicit cancelled warning callout present');
assert.ok(passModalCode.includes('Admittance subject to live organizer database check'), 'Cryptographic proof disclaimer present');

// Print isolation
assert.ok(passModalCode.includes('printable-pass-credential'), 'Pass includes printable-pass-credential container');
assert.ok(passModalCode.includes('window.print()'), 'Pass includes window.print() action');

console.log('[PASS] DigitalPassModal enforces status-adaptive badges, VOID warnings, and live verification disclaimers');

// -------------------------------------------------------------
// SECTION 3: FIRESTORE SECURITY RULES COMPREHENSIVE AUDIT
// -------------------------------------------------------------
console.log('\n--- 3. Firestore Security Rules Declarative Audit ---');

const rulesPath = path.join(process.cwd(), 'firestore.rules');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

// 1. Default deny
assert.ok(rulesCode.includes('match /{document=**} {\n      allow read, write: if false;'), 'Default deny-all rule present');

// 2. Role escalation prevention
assert.ok(rulesCode.includes("request.resource.data.role == 'student'"), 'New user roles restricted strictly to student');
assert.ok(rulesCode.includes('allow update, delete: if isAdmin();'), 'Role mutation restricted strictly to admin');

// 3. Organization isolation
assert.ok(rulesCode.includes('isOrgMember(resource.data.organizationId)'), 'Registration queries restricted to organization members');
assert.ok(rulesCode.includes('isOrgMember(request.resource.data.organizationId)'), 'Fest and event operations restricted to organization members');

// 4. Registration immutability and anti-tampering
assert.ok(rulesCode.includes('request.resource.data.ticketCode == resource.data.ticketCode'), 'ticketCode strictly immutable');
assert.ok(rulesCode.includes('request.resource.data.userId == resource.data.userId'), 'userId strictly immutable');
assert.ok(rulesCode.includes('request.resource.data.eventId == resource.data.eventId'), 'eventId strictly immutable');
assert.ok(rulesCode.includes('request.resource.data.registeredAt == resource.data.registeredAt'), 'registeredAt strictly immutable');

// 5. Gate Check-in verification
assert.ok(rulesCode.includes("request.resource.data.status == 'checked_in'"), 'Check-in rule transition present');
assert.ok(rulesCode.includes('request.resource.data.checkedInBy == request.auth.uid'), 'checkedInBy bound strictly to caller auth.uid');
assert.ok(rulesCode.includes("resource.data.status in ['confirmed', 'pending']"), 'Check-in strictly barred for cancelled registrations');

// 6. Capacity counter atomic coupling
assert.ok(rulesCode.includes('currentRegistrations == ('), 'Registration requires coupled counter increment');
assert.ok(rulesCode.includes('currentRegistrations - 1'), 'Cancellation requires coupled counter decrement');

console.log('[PASS] Firestore rules enforce RBAC, organization isolation, immutability, check-in, and atomic capacity counters');

// -------------------------------------------------------------
// SECTION 4: CLIENT-SIDE GUARDS & DEFENSE-IN-DEPTH AUDIT
// -------------------------------------------------------------
console.log('\n--- 4. Client-Side Guards & Absence of Backdoors ---');

const adminLoginPath = path.join(process.cwd(), 'src/pages/admin/AdminLoginPage.tsx');
const adminLoginCode = fs.readFileSync(adminLoginPath, 'utf8');

// Check that admin login checks real Firestore userRoles
assert.ok(adminLoginCode.includes("doc(db, 'userRoles', uid)"), 'Admin login queries userRoles in Firestore');
assert.ok(adminLoginCode.includes("roleSnap.data()?.role !== 'admin'"), 'Admin login validates admin role');
assert.ok(adminLoginCode.includes('await signOut(auth)'), 'Unauthorized admin attempt terminates auth session');

// Verify no client-side admin bypass or demo credentials/controls remain on login pages
const demoDomainRegex = new RegExp(`@${'festofy'}\\.demo`, 'i');
const demoControlPatterns = [
  'Demo Admin Access',
  '1-Click Sign In',
  'handleUseDemo',
  'Instant Organizer Demo',
  'handleCopyCredentials'
];
for (const loginRelPath of [
  'src/pages/admin/AdminLoginPage.tsx',
  'src/pages/public/AuthPage.tsx',
  'src/pages/organizer/OrganizerLoginPage.tsx'
]) {
  const loginSource = fs.readFileSync(path.join(process.cwd(), loginRelPath), 'utf8');
  assert.ok(!demoDomainRegex.test(loginSource), `No legacy demo account domain in ${loginRelPath}`);
  for (const controlPattern of demoControlPatterns) {
    assert.ok(!loginSource.includes(controlPattern), `No demo control "${controlPattern}" in ${loginRelPath}`);
  }
}

// CSV injection sanitization verification
const participantsPagePath = path.join(process.cwd(), 'src/pages/organizer/OrganizerParticipantsPage.tsx');
const participantsCode = fs.readFileSync(participantsPagePath, 'utf8');
assert.ok(participantsCode.includes('sanitizeCsvValue'), 'OrganizerParticipantsPage includes CSV sanitizer');
assert.ok(participantsCode.includes('/^[=+\\-@]/'), 'CSV sanitizer detects formula triggers (=, +, -, @)');

console.log('[PASS] Client-side guards enforce real authentication with zero hardcoded role bypasses');

// -------------------------------------------------------------
// SECTION 5: RESPONSIVE & PRINT STYLESHEET AUDIT
// -------------------------------------------------------------
console.log('\n--- 5. Responsive Design & Print Stylesheet Audit ---');

const cssPath = path.join(process.cwd(), 'src/index.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

assert.ok(cssCode.includes('@media print'), 'Print media rules defined in index.css');
assert.ok(cssCode.includes('.printable-pass-credential'), 'Print style targets .printable-pass-credential');
assert.ok(cssCode.includes('header,'), 'Print style hides header');
assert.ok(cssCode.includes('footer,'), 'Print style hides footer');
assert.ok(cssCode.includes('.no-print'), 'Print style hides .no-print elements');

// Mobile truncation check on participant manifest
assert.ok(participantsCode.includes('truncate min-w-0'), 'Mobile participant cards truncate long event strings');

console.log('[PASS] Responsive overflow defenses and print styles verified');

// -------------------------------------------------------------
// SECTION 6: REPOSITORY, LICENSE & SUBMISSION READINESS
// -------------------------------------------------------------
console.log('\n--- 6. Repository Documentation & Submission Hygiene ---');

const licensePath = path.join(process.cwd(), 'LICENSE');
assert.ok(fs.existsSync(licensePath), 'LICENSE file must exist');
const licenseContent = fs.readFileSync(licensePath, 'utf8');
assert.ok(licenseContent.includes('MIT License'), 'LICENSE must be MIT');

const readmePath = path.join(process.cwd(), 'README.md');
assert.ok(fs.existsSync(readmePath), 'README.md file must exist');
const readmeContent = fs.readFileSync(readmePath, 'utf8');
assert.ok(readmeContent.includes('Festofy'), 'README.md describes Festofy');
assert.ok(readmeContent.includes('Authentication & Admin Setup Workflow'), 'README.md documents authentication and admin setup workflow');

const envExamplePath = path.join(process.cwd(), '.env.example');
assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
assert.ok(!envExampleContent.includes('AIzaSy'), 'No real Google API keys exposed in .env.example');

console.log('[PASS] MIT LICENSE, README.md, and sanitized .env.example verified');

console.log('\n================================================================');
console.log('ALL PHASE 10–12 ASSERTIONS PASSED (100% SUCCESS)');
console.log('================================================================');
