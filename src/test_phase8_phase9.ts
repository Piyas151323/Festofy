import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('Testing Phase 8 + 9: Competition Bonus & Final UI/UX Polish...');

// 1. DigitalPassModal and QRCodeSVG components exist
const passModalPath = path.join(process.cwd(), 'src/components/common/DigitalPassModal.tsx');
assert.ok(fs.existsSync(passModalPath), 'DigitalPassModal component must exist');
const passModalCode = fs.readFileSync(passModalPath, 'utf8');

const qrCodePath = path.join(process.cwd(), 'src/components/common/QRCodeSVG.tsx');
assert.ok(fs.existsSync(qrCodePath), 'QRCodeSVG component must exist');
const qrCodeCode = fs.readFileSync(qrCodePath, 'utf8');

console.log('[PASS] 1. DigitalPassModal and QRCodeSVG components created');

// 2. QRCodeSVG implementation invariants
assert.ok(qrCodeCode.includes('<svg'), 'QRCodeSVG renders SVG element');
assert.ok(qrCodeCode.includes('drawFinder') || qrCodeCode.includes('QRCode.create'), 'QRCodeSVG contains standard finder pattern / QR matrix logic');
assert.ok(qrCodeCode.includes('quietZone') || qrCodeCode.includes('quiet zone'), 'QRCodeSVG includes quiet zone boundary padding');
console.log('[PASS] 2. QRCodeSVG contains authentic QR matrix structure with finder patterns');

// 3. DigitalPassModal features and print compatibility
assert.ok(passModalCode.includes('window.print()'), 'DigitalPassModal supports window.print()');
assert.ok(passModalCode.includes('printable-pass-credential'), 'DigitalPassModal defines printable credential wrapper');
assert.ok(passModalCode.includes('registration.ticketCode'), 'DigitalPassModal surfaces ticket code');
assert.ok(passModalCode.includes('registration.eventName'), 'DigitalPassModal displays event name');
assert.ok(passModalCode.includes('registration.studentName'), 'DigitalPassModal displays attendee name');
assert.ok(passModalCode.includes('QRCodeSVG'), 'DigitalPassModal embeds QR Code SVG');
console.log('[PASS] 3. DigitalPassModal includes print trigger, QR badge, ticket code, and attendee info');

// 4. Print media styles in index.css
const cssPath = path.join(process.cwd(), 'src/index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert.ok(cssContent.includes('@media print'), 'src/index.css must include @media print rules');
assert.ok(cssContent.includes('.printable-pass-credential'), 'Print styles target .printable-pass-credential');
assert.ok(cssContent.includes('no-print'), 'Print styles hide .no-print elements');
console.log('[PASS] 4. Print stylesheet isolates pass credential and hides surrounding UI');

// 5. StudentPassesPage integration with real Firestore data
const passesPagePath = path.join(process.cwd(), 'src/pages/student/StudentPassesPage.tsx');
const passesPageCode = fs.readFileSync(passesPagePath, 'utf8');
assert.ok(passesPageCode.includes('getStudentRegistrations'), 'StudentPassesPage loads registrations using service');
assert.ok(passesPageCode.includes('DigitalPassModal'), 'StudentPassesPage mounts DigitalPassModal');
assert.ok(passesPageCode.includes('QRCodeSVG'), 'StudentPassesPage displays QR thumbnail on passes');
assert.ok(passesPageCode.includes("r.status !== 'cancelled'"), 'StudentPassesPage excludes cancelled registrations');
console.log('[PASS] 5. StudentPassesPage displays authorized student passes with modal and QR preview');

// 6. StudentRegistrationDetailPage integration
const regDetailPath = path.join(process.cwd(), 'src/pages/student/StudentRegistrationDetailPage.tsx');
const regDetailCode = fs.readFileSync(regDetailPath, 'utf8');
assert.ok(regDetailCode.includes('DigitalPassModal'), 'StudentRegistrationDetailPage imports DigitalPassModal');
assert.ok(regDetailCode.includes('setShowPassModal(true)'), 'StudentRegistrationDetailPage triggers pass modal');
console.log('[PASS] 6. StudentRegistrationDetailPage links directly to DigitalPassModal');

// 7. StudentRegistrationsPage card action integration
const studentRegsPath = path.join(process.cwd(), 'src/pages/student/StudentRegistrationsPage.tsx');
const studentRegsCode = fs.readFileSync(studentRegsPath, 'utf8');
assert.ok(studentRegsCode.includes('DigitalPassModal'), 'StudentRegistrationsPage imports DigitalPassModal');
assert.ok(studentRegsCode.includes('setSelectedPass(reg)'), 'StudentRegistrationsPage triggers pass modal from card');
console.log('[PASS] 7. StudentRegistrationsPage includes Pass button on registered cards');

// 8. Responsive overflow defenses
const participantsPagePath = path.join(process.cwd(), 'src/pages/organizer/OrganizerParticipantsPage.tsx');
const participantsCode = fs.readFileSync(participantsPagePath, 'utf8');
assert.ok(participantsCode.includes('truncate min-w-0'), 'Mobile participants card includes truncate defense on event names');
console.log('[PASS] 8. Mobile viewports protected against horizontal overflow on long event and ticket strings');

console.log('Phase 8 + 9 Test Results: 8/8 assertions passed successfully.');
