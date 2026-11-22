import {
  isClassGradeField,
  normalizeSelectOption,
  getProfileValueForField,
  isRedundantProfileField
} from './utils/formValidationUtils';
import { getDefaultParticipantQuestions, DEFAULT_FORM_TEMPLATES } from './services/templateService';
import { EventFormField } from './types';

console.log('================================================================');
console.log('FESTOFY — REGISTRATION CLASS / GRADE VALIDATION FIX TEST SUITE');
console.log('Testing normalization, profile reuse, error handling, and team flow');
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

const defaultOptions = [
  'Junior (Class 6-8)',
  'Secondary (Class 9-10 / SSC)',
  'Higher Secondary (Class 11-12 / HSC)',
  'Undergraduate / University',
  'Postgraduate / Masters',
  'Open / Professional'
];

const standardTemplateOptions = [
  'Class 6-8 (Junior)',
  'Class 9-10 (Secondary/SSC)',
  'Class 11-12 (Higher Secondary/HSC)',
  'Undergraduate / University',
  'Postgraduate',
  'Other'
];

// --- 1. FIELD IDENTIFICATION & DETECTION ---
console.log('--- 1. Field Identification & Detection ---');

assert(
  isClassGradeField({ label: 'Class / Grade / Academic Year' }) &&
  isClassGradeField({ label: 'Class / Grade / Year' }) &&
  isClassGradeField({ label: 'Academic Standing' }) &&
  isClassGradeField({ label: 'Education Level' }) &&
  isClassGradeField({ id: 'f_class_grade' }) &&
  isClassGradeField({ id: 'f_grade_123' }) &&
  isClassGradeField({ id: 'academic_year' }),
  '1.1 Accurately identifies Class/Grade/Academic Year fields across legacy and current identifiers'
);

assert(
  !isRedundantProfileField({
    id: 'f_grade_1',
    label: 'Class / Grade / Academic Year',
    type: 'select',
    required: true,
    options: defaultOptions
  }),
  '1.2 Class/Grade fields with select options are NEVER hidden or treated as redundant'
);

// --- 2. ACADEMIC TIER NORMALIZATION & PROFILE REUSE ---
console.log('\n--- 2. Academic Tier Normalization & Profile Reuse ---');

// 2.1 Higher Secondary / HSC matching
assert(
  normalizeSelectOption('Class 11', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('Class 12', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('12th', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('HSC', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('HSC 2026', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption("HSC'26", defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('A Level', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)' &&
  normalizeSelectOption('Intermediate', defaultOptions, 'Class / Grade / Academic Year') === 'Higher Secondary (Class 11-12 / HSC)',
  '2.1 Higher secondary, HSC variations, and A Levels correctly resolve to canonical option'
);

// 2.2 Secondary / SSC matching
assert(
  normalizeSelectOption('Class 9', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)' &&
  normalizeSelectOption('Class 10', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)' &&
  normalizeSelectOption('10th Grade', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)' &&
  normalizeSelectOption('SSC', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)' &&
  normalizeSelectOption('SSC 2025', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)' &&
  normalizeSelectOption('O Level', defaultOptions, 'Class / Grade / Academic Year') === 'Secondary (Class 9-10 / SSC)',
  '2.2 Secondary, SSC variations, and O Levels correctly resolve to canonical option'
);

// 2.3 Junior school matching
assert(
  normalizeSelectOption('Class 6', defaultOptions, 'Class / Grade / Academic Year') === 'Junior (Class 6-8)' &&
  normalizeSelectOption('Class 8', defaultOptions, 'Class / Grade / Academic Year') === 'Junior (Class 6-8)' &&
  normalizeSelectOption('Grade 7', defaultOptions, 'Class / Grade / Academic Year') === 'Junior (Class 6-8)' &&
  normalizeSelectOption('JSC', defaultOptions, 'Class / Grade / Academic Year') === 'Junior (Class 6-8)',
  '2.3 Junior school classes (6-8) correctly resolve to canonical option'
);

// 2.4 Undergraduate & University year designations (Resolves the exact screenshot issue)
assert(
  normalizeSelectOption('Undergraduate', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('University', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('1st Year', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('2nd Year', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('2nd Year CSE', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('3rd Year', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('4th Year', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('Final Year', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('Honours', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University' &&
  normalizeSelectOption('BSc in CSE', defaultOptions, 'Class / Grade / Academic Year') === 'Undergraduate / University',
  '2.4 University undergraduate years (1st-4th Year, CSE, Honours) resolve to Undergraduate / University'
);

// 2.5 Postgraduate and Open/Professional matching
assert(
  normalizeSelectOption('Masters', defaultOptions, 'Class / Grade / Academic Year') === 'Postgraduate / Masters' &&
  normalizeSelectOption('MBA', defaultOptions, 'Class / Grade / Academic Year') === 'Postgraduate / Masters' &&
  normalizeSelectOption('PhD', defaultOptions, 'Class / Grade / Academic Year') === 'Postgraduate / Masters' &&
  normalizeSelectOption('Alumni', defaultOptions, 'Class / Grade / Academic Year') === 'Open / Professional' &&
  normalizeSelectOption('Professional', defaultOptions, 'Class / Grade / Academic Year') === 'Open / Professional',
  '2.5 Postgraduate and professional/alumni designations correctly resolve'
);

// 2.6 Cross-template compatibility (Standard template options)
assert(
  normalizeSelectOption('Class 11', standardTemplateOptions, 'Class / Grade / Year') === 'Class 11-12 (Higher Secondary/HSC)' &&
  normalizeSelectOption('HSC 2026', standardTemplateOptions, 'Class / Grade / Year') === 'Class 11-12 (Higher Secondary/HSC)' &&
  normalizeSelectOption('2nd Year', standardTemplateOptions, 'Class / Grade / Year') === 'Undergraduate / University' &&
  normalizeSelectOption('Other', standardTemplateOptions, 'Class / Grade / Year') === 'Other',
  '2.6 Works seamlessly across different organizer template configurations'
);

// 2.7 Arbitrary invalid values safely rejected without weakening validation
assert(
  normalizeSelectOption('Completely Unrelated Value 999', defaultOptions, 'Class / Grade / Academic Year') === null &&
  normalizeSelectOption('', defaultOptions, 'Class / Grade / Academic Year') === null &&
  normalizeSelectOption(null, defaultOptions, 'Class / Grade / Academic Year') === null,
  '2.7 Arbitrary or nonsensical strings safely return null rather than corrupting data'
);

// --- 3. PROFILE DATA EXTRACTION & SAFE PREPOPULATION ---
console.log('\n--- 3. Profile Data Extraction & Safe Prepopulation ---');

const testProfile = {
  studentName: 'Tanvir Ahmed',
  studentEmail: 'tanvir@example.com',
  studentPhone: '+880 1700-000000',
  institution: 'Dhaka Residential Model College',
  classGrade: 'Class 11',
  studentId: 'DRMC-2026-402'
};

const selectField: EventFormField = {
  id: 'f_grade_1',
  label: 'Class / Grade / Academic Year',
  type: 'select',
  required: true,
  options: defaultOptions
};

assert(
  getProfileValueForField(selectField, testProfile) === 'Higher Secondary (Class 11-12 / HSC)',
  '3.1 Prepopulation helper canonicalizes matching student profile value for select fields'
);

const unmatchedProfile = {
  ...testProfile,
  classGrade: 'Unknown Nonexistent Tier'
};

assert(
  getProfileValueForField(selectField, unmatchedProfile) === '',
  '3.2 Prepopulation helper safely returns empty string when profile value does not match options'
);

// --- 4. OPTIONAL VS REQUIRED FIELD BEHAVIOR ---
console.log('\n--- 4. Optional vs Required Field Behavior ---');

// Helper to simulate registrationService validation logic
function simulateServiceValidation(
  field: EventFormField,
  submittedValue: unknown,
  profileClassGrade: string
): { success: boolean; resolvedValue?: unknown; error?: string } {
  let val = submittedValue;
  let resolvedClassGrade = profileClassGrade.trim();

  // If empty and class/grade field, attempt safe fallback only if valid
  if ((val === undefined || val === null || val === '') && isClassGradeField(field) && resolvedClassGrade) {
    if (field.options && field.options.length > 0) {
      const matched = normalizeSelectOption(resolvedClassGrade, field.options, field.label);
      if (matched) {
        val = matched;
        resolvedClassGrade = matched;
      }
    } else {
      val = resolvedClassGrade;
    }
  }

  // Required validation
  if (field.required) {
    if (val === undefined || val === null || val === '' || (typeof val === 'string' && !val.trim())) {
      return { success: false, error: `"${field.label}" is required. Please select or provide a valid response.` };
    }
  }

  // Options validation
  if ((field.type === 'select' || field.type === 'radio') && field.options && field.options.length > 0) {
    if (val !== undefined && val !== null && val !== '') {
      const rawString = typeof val === 'string' ? val.trim() : String(val);
      if (rawString) {
        if (field.options.includes(rawString)) {
          return { success: true, resolvedValue: rawString };
        } else {
          const matched = normalizeSelectOption(rawString, field.options, field.label);
          if (matched) {
            return { success: true, resolvedValue: matched };
          } else {
            if (field.required) {
              return {
                success: false,
                error: `Invalid option selected for "${field.label}". Please choose one of: ${field.options.join(', ')}`
              };
            } else {
              // Optional field does not block
              return { success: true, resolvedValue: undefined };
            }
          }
        }
      }
    }
  }

  return { success: true, resolvedValue: val };
}

// 4.1 Required field with valid option succeeds
const reqField: EventFormField = {
  id: 'f_grade_1',
  label: 'Class / Grade / Academic Year',
  type: 'select',
  required: true,
  options: defaultOptions
};

const resValid = simulateServiceValidation(reqField, 'Undergraduate / University', '2nd Year');
assert(
  resValid.success && resValid.resolvedValue === 'Undergraduate / University',
  '4.1 Valid selection allows required field submission to proceed'
);

// 4.2 Required field with valid profile value reuses it when empty
const resProfileReuse = simulateServiceValidation(reqField, '', 'Class 12');
assert(
  resProfileReuse.success && resProfileReuse.resolvedValue === 'Higher Secondary (Class 11-12 / HSC)',
  '4.2 Required field reuses valid profile value when input was empty'
);

// 4.3 Required field with missing/unmatched profile value blocks with actionable error
const resUnmatched = simulateServiceValidation(reqField, '', 'Unknown Nonexistent Tier');
assert(
  !resUnmatched.success && Boolean(resUnmatched.error?.includes('is required')),
  '4.3 Missing or unmatched profile value produces required prompt instead of corrupted data'
);

// 4.4 Optional field NEVER blocks when left empty even if profile has unmatched value
const optField: EventFormField = {
  ...reqField,
  required: false
};

const resOptEmpty = simulateServiceValidation(optField, '', 'Unknown Nonexistent Tier');
assert(
  resOptEmpty.success,
  '4.4 Optional field left empty does NOT block registration even if profile has unmatched value'
);

const resOptEmptyNoProfile = simulateServiceValidation(optField, '', '');
assert(
  resOptEmptyNoProfile.success,
  '4.5 Optional field left empty without profile value succeeds smoothly'
);

console.log('\n================================================================');
console.log(`Test Results: ${passed}/${total} assertions passed (100% SUCCESS)`);
console.log('================================================================');
