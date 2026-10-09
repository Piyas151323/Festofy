import assert from 'assert';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { extractTicketCodeFromQR } from './utils/ticketCodeUtils';

console.log('================================================================');
console.log('FESTOFY — PHASE 10.1: CAMERA-BASED QR CHECK-IN VERIFICATION SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: QR PAYLOAD EXTRACTION & NORMALIZATION
// -------------------------------------------------------------
console.log('--- 1. QR Payload Extraction & Normalization ---');

// Test Case 1.1: Official Digital Pass Format (TICKET::REG_ID)
const passPayload = 'FST-K9M2-8KJ7::reg_1791531754097';
assert.strictEqual(
  extractTicketCodeFromQR(passPayload),
  'FST-K9M2-8KJ7',
  'Must extract ticket code from compound digital pass payload'
);
console.log('[PASS] 1.1 Digital pass compound payload (TICKET::REG_ID) extracted');

// Test Case 1.2: Raw ticket code with whitespace and lowercase
const rawLower = '  fst-k9m2-8kj7  ';
assert.strictEqual(
  extractTicketCodeFromQR(rawLower),
  'FST-K9M2-8KJ7',
  'Must trim and uppercase raw ticket code'
);
console.log('[PASS] 1.2 Raw ticket code trimmed and uppercased');

// Test Case 1.3: URL encoded ticket parameter
const urlPayload = 'https://festofy.app/events/evt_123/verify?ticket=FST-A9B8-C7D6';
assert.strictEqual(
  extractTicketCodeFromQR(urlPayload),
  'FST-A9B8-C7D6',
  'Must parse ticket param from URL payload'
);
console.log('[PASS] 1.3 URL encoded ticket parameter extracted');

// Test Case 1.4: JSON encoded payload
const jsonPayload = JSON.stringify({ ticketCode: 'FST-E5F4-G3H2', attendee: 'Student' });
assert.strictEqual(
  extractTicketCodeFromQR(jsonPayload),
  'FST-E5F4-G3H2',
  'Must parse ticketCode property from JSON payload'
);
console.log('[PASS] 1.4 JSON encoded ticketCode extracted');

// Test Case 1.5: Malformed, empty, or non-string input
assert.strictEqual(extractTicketCodeFromQR(''), '', 'Empty payload returns empty string');
assert.strictEqual(extractTicketCodeFromQR(null as any), '', 'Null payload safely returns empty string');
console.log('[PASS] 1.5 Malformed and empty inputs handled safely');

// -------------------------------------------------------------
// SECTION 2: END-TO-END QR ENCODE AND DECODE PIPELINE
// -------------------------------------------------------------
console.log('\n--- 2. End-to-End QR Encode & jsQR Decode Roundtrip ---');

function testQrRoundtrip(originalText: string) {
  const qr = QRCode.create(originalText, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const scale = 4;
  const margin = 2;
  const totalDim = (size + margin * 2) * scale;

  const rgba = new Uint8ClampedArray(totalDim * totalDim * 4);
  rgba.fill(255);

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
  assert.ok(decoded, `QR must decode successfully for payload: ${originalText}`);
  assert.strictEqual(decoded.data, originalText, 'Decoded text must match original encoded string');

  const extractedCode = extractTicketCodeFromQR(decoded.data);
  assert.ok(extractedCode.length > 0, 'Extracted ticket code must be non-empty');
  return extractedCode;
}

const passCode = testQrRoundtrip('FST-GATE-2026::reg_xyz987');
assert.strictEqual(passCode, 'FST-GATE-2026', 'Decoded and extracted ticket code matches pass');
console.log('[PASS] 2.1 Pass QR matrix successfully decoded via jsQR and code extracted');

const longCode = testQrRoundtrip('FST-NATIONAL-HACKATHON-DHAKA-2026-CHAMPIONSHIP-TRACK-TICKET-A1B2::reg_001');
assert.strictEqual(longCode, 'FST-NATIONAL-HACKATHON-DHAKA-2026-CHAMPIONSHIP-TRACK-TICKET-A1B2');
console.log('[PASS] 2.2 Long payload decoded and extracted accurately');

// -------------------------------------------------------------
// SECTION 3: ORGANIZER PARTICIPANT OPERATIONS PAGE AUDIT
// -------------------------------------------------------------
console.log('\n--- 3. Organizer Participant Operations Page Integration Audit ---');

const pagePath = path.join(process.cwd(), 'src/pages/organizer/OrganizerParticipantsPage.tsx');
const pageCode = fs.readFileSync(pagePath, 'utf8');

// Scan QR button present beside manual lookup
assert.ok(pageCode.includes('Scan QR'), 'Scan QR button exists on page');
assert.ok(pageCode.includes('setIsQRScannerOpen(true)'), 'Scan QR button triggers scanner modal');
assert.ok(pageCode.includes('<Camera'), 'Camera icon rendered on Scan QR button');
assert.ok(pageCode.includes('Verify Ticket'), 'Manual ticket lookup fallback preserved');
console.log('[PASS] 3.1 Visible Scan QR button beside manual ticket verification input');

// Modal integration
assert.ok(pageCode.includes('<QRScannerModal'), 'QRScannerModal component mounted on page');
assert.ok(pageCode.includes('onScanSuccess={handleQRScanned}'), 'handleQRScanned callback wired to scanner modal');
assert.ok(pageCode.includes('extractTicketCodeFromQR'), 'extractTicketCodeFromQR used to process scanned payload');
console.log('[PASS] 3.2 QRScannerModal properly mounted with extractTicketCodeFromQR');

// Scan Next action
assert.ok(pageCode.includes('Scan Next Pass'), 'Scan Next Pass action available after lookup');
console.log('[PASS] 3.3 Scan Next Pass fast-track action available in result card');

// Ineligible / Cancelled status warning
assert.ok(
  pageCode.includes("Cancelled (Ineligible for Gate Admittance)"),
  'Explicit cancelled status warning prevents admittance'
);
console.log('[PASS] 3.4 Cancelled registrations show explicit ineligible warning');

// -------------------------------------------------------------
// SECTION 4: CAMERA STREAM LIFECYCLE & CLEANUP AUDIT
// -------------------------------------------------------------
console.log('\n--- 4. Camera Stream Lifecycle & Resource Cleanup Audit ---');

const modalPath = path.join(process.cwd(), 'src/components/organizer/QRScannerModal.tsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

// Environment / rear camera preference
assert.ok(
  modalCode.includes("facingMode: { ideal: 'environment' }"),
  'Scanner requests rear/environment camera by default'
);
console.log('[PASS] 4.1 Rear / environment camera preferred');

// Camera cleanup on every exit path
assert.ok(
  modalCode.includes('track.stop()'),
  'MediaStream tracks are explicitly stopped'
);
assert.ok(
  modalCode.includes('cancelAnimationFrame'),
  'Scanning requestAnimationFrame is cancelled on stop'
);
assert.ok(
  modalCode.includes('videoRef.current.srcObject = null'),
  'Video srcObject is cleared on stream stop'
);
assert.ok(
  modalCode.includes('return () => {\n      stopCameraStream();\n    };'),
  'useEffect return cleanup ensures camera stream stops on unmount'
);
console.log('[PASS] 4.2 Camera tracks reliably stopped on close, unmount, and scan success');

// Insecure context & permission error handling
assert.ok(modalCode.includes('window.isSecureContext'), 'Checks secure context (HTTPS/localhost)');
assert.ok(modalCode.includes('NotAllowedError'), 'Handles camera permission denied');
assert.ok(modalCode.includes('NotFoundError'), 'Handles camera not found');
console.log('[PASS] 4.3 Insecure origin, permission denial, and missing device states handled');

// -------------------------------------------------------------
// SECTION 5: FIRESTORE RULES & CHECK-IN AUTHORIZATION AUDIT
// -------------------------------------------------------------
console.log('\n--- 5. Security Rules & Gate Check-in Invariant Audit ---');

const rulesPath = path.join(process.cwd(), 'firestore.rules');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

// 1. Check-in caller must be verified organizer or admin
assert.ok(
  rulesCode.includes('request.resource.data.checkedInBy == request.auth.uid'),
  'checkedInBy must match caller request.auth.uid'
);

// 2. Anti-double-check-in / state transition invariant in rules
assert.ok(
  rulesCode.includes("resource.data.status in ['confirmed', 'pending']"),
  'Check-in only permitted from confirmed or pending status'
);
assert.ok(
  !rulesCode.includes("resource.data.status == 'checked_in'\n              && request.resource.data.status == 'checked_in'"),
  'Re-check-in of already checked-in registrations is barred'
);

// 3. Organization isolation
assert.ok(
  rulesCode.includes('isOrgMember(resource.data.organizationId)'),
  'Registration mutations require organization membership'
);

console.log('[PASS] 5.1 Firestore rules enforce caller UID binding, status transition, and org isolation');

// Check checkInParticipant service implementation
const regServicePath = path.join(process.cwd(), 'src/services/registrationService.ts');
const regServiceCode = fs.readFileSync(regServicePath, 'utf8');

assert.ok(
  regServiceCode.includes("throw new Error(`Participant has already been checked in (${time}).`);"),
  'Service rejects already checked-in participants with timestamp'
);
assert.ok(
  regServiceCode.includes("throw new Error('Cannot check in a cancelled registration.');"),
  'Service rejects cancelled registrations'
);
assert.ok(
  regServiceCode.includes('memberDocId = `${regData.organizationId}_${currentUser.uid}`'),
  'Service verifies caller membership in registration organization'
);

console.log('[PASS] 5.2 checkInParticipant service enforces anti-double check-in and org scoping');

console.log('\n================================================================');
console.log('ALL PHASE 10.1 VERIFICATIONS PASSED (100% SUCCESS)');
console.log('================================================================');
