/**
 * Form field normalization and validation utilities.
 * Handles robust matching between saved profile fields (e.g. classGrade, institution)
 * and event-specific questionnaire fields, option lists, and dynamic templates.
 */

import { EventFormField } from '../types';

/**
 * Detects if a custom questionnaire field asks for Class, Grade, or Academic Year.
 */
export function isClassGradeField(field: { label?: string; id?: string }): boolean {
  const lbl = (field.label || '').toLowerCase();
  const id = (field.id || '').toLowerCase();
  return (
    lbl.includes('class') ||
    lbl.includes('grade') ||
    lbl.includes('academic year') ||
    lbl.includes('academic standing') ||
    lbl.includes('education level') ||
    lbl.includes('study level') ||
    lbl.includes('academic level') ||
    lbl.includes('grade level') ||
    lbl.includes('batch') ||
    lbl.includes('year') ||
    lbl.includes('level') ||
    lbl.includes('standing') ||
    id.includes('grade') ||
    id.includes('class') ||
    id.includes('academic_year') ||
    id.includes('class_grade') ||
    id.includes('year') ||
    id.includes('level')
  );
}

/**
 * Helper to identify if an event custom field duplicates standard student profile information
 * that is already captured in the profile header and team leader section.
 *
 * NOTE: Fields with closed selection options (select, radio) and Class/Grade questions
 * are NEVER treated as redundant because they enforce specific event-configured option sets.
 */
export function isRedundantProfileField(field: EventFormField): boolean {
  // If the field has options (select or radio), it is NEVER redundant — the user must pick or confirm an allowed option
  if (field.type === 'select' || field.type === 'radio' || (field.options && field.options.length > 0)) {
    return false;
  }

  // Class/grade questions are explicitly rendered so the user can verify or select their tier
  if (isClassGradeField(field)) {
    return false;
  }

  const lbl = (field.label || '').trim().toLowerCase();
  const id = (field.id || '').trim().toLowerCase();

  // Full Name (excluding team name, project title, emergency contact name)
  if (
    (lbl.includes('name') &&
      !lbl.includes('team') &&
      !lbl.includes('project') &&
      !lbl.includes('emergency') &&
      !lbl.includes('parent') &&
      !lbl.includes('guardian')) ||
    id.includes('name')
  ) {
    return true;
  }

  // Email
  if (lbl.includes('email') || field.type === 'email' || id.includes('email')) {
    return true;
  }

  // Contact Phone Number (excluding emergency phone)
  if (
    ((lbl.includes('phone') || lbl.includes('contact') || lbl.includes('mobile')) &&
      !lbl.includes('emergency') &&
      !lbl.includes('parent') &&
      !lbl.includes('guardian')) ||
    (id.includes('phone') && !id.includes('emergency'))
  ) {
    return true;
  }

  // Institution / College / School / University
  if (
    lbl.includes('institution') ||
    lbl.includes('college') ||
    lbl.includes('school') ||
    lbl.includes('university') ||
    id.includes('inst')
  ) {
    return true;
  }

  // Institutional Roll / Student ID
  if (
    lbl.includes('student id') ||
    lbl.includes('roll number') ||
    lbl.includes('institutional roll') ||
    id.includes('roll') ||
    id.includes('studentid')
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts student profile value matching a redundant field so backend customResponses
 * remain fully populated for organizer exports and firestore validations.
 */
export function getProfileValueForField(
  field: EventFormField,
  data: {
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    institution: string;
    classGrade: string;
    studentId: string;
  }
): string {
  const lbl = (field.label || '').trim().toLowerCase();
  const id = (field.id || '').trim().toLowerCase();

  if (
    (lbl.includes('name') &&
      !lbl.includes('team') &&
      !lbl.includes('project') &&
      !lbl.includes('emergency') &&
      !lbl.includes('parent') &&
      !lbl.includes('guardian')) ||
    id.includes('name')
  ) {
    return data.studentName;
  }

  if (lbl.includes('email') || field.type === 'email' || id.includes('email')) {
    return data.studentEmail;
  }

  if (
    ((lbl.includes('phone') || lbl.includes('contact') || lbl.includes('mobile')) &&
      !lbl.includes('emergency')) ||
    (id.includes('phone') && !id.includes('emergency'))
  ) {
    return data.studentPhone;
  }

  if (
    lbl.includes('institution') ||
    lbl.includes('college') ||
    lbl.includes('school') ||
    lbl.includes('university') ||
    id.includes('inst')
  ) {
    return data.institution;
  }

  if (isClassGradeField(field)) {
    // If the field has options (select/radio), only return value if it matches an allowed option
    if (field.options && field.options.length > 0) {
      const matched = normalizeSelectOption(data.classGrade, field.options, field.label);
      return matched || '';
    }
    return data.classGrade;
  }

  if (
    lbl.includes('student id') ||
    lbl.includes('roll number') ||
    lbl.includes('institutional roll') ||
    id.includes('roll') ||
    id.includes('studentid')
  ) {
    return data.studentId;
  }

  return '';
}

/**
 * Helper to match an input string (e.g., student profile classGrade "12", "HSC", "Grade 9", "Undergraduate", "2nd Year")
 * against an allowed list of option strings defined for an event custom field.
 *
 * Normalizes values consistently without incorrectly accepting arbitrary values or weakening validation.
 *
 * Returns the exact matching option string from `options` if found, or null if no unambiguous match exists.
 */
export function normalizeSelectOption(
  val: unknown,
  options: string[],
  fieldLabel?: string
): string | null {
  if (val === undefined || val === null) return null;
  const raw = String(val).trim();
  if (!raw) return null;

  // 1. Exact string match (case-sensitive)
  const exact = options.find((opt) => opt.trim() === raw);
  if (exact) return exact;

  // 2. Case-insensitive trimmed match
  const lowerRaw = raw.toLowerCase();
  const caseInsensitive = options.find((opt) => opt.trim().toLowerCase() === lowerRaw);
  if (caseInsensitive) return caseInsensitive;

  const isGrade = fieldLabel ? isClassGradeField({ label: fieldLabel }) : true;

  // 3. Class / Grade / Academic Year smart educational tier matching
  if (isGrade) {
    // Check if the user specified an academic year in higher ed (e.g. "1st Year", "2nd Year CSE", "Final Year")
    const isCollegeOrUniYear =
      /\b(1st|2nd|3rd|4th|first|second|third|fourth|final)\s+year\b/i.test(lowerRaw) ||
      /\b(year\s*[1-4])\b/i.test(lowerRaw) ||
      /\b(freshman|sophomore|senior)\b/i.test(lowerRaw) ||
      /\b(semester|sem|honours|honors|bachelor|bba|bsc|b\.sc|btech|cse|eee|undergrad)\b/i.test(lowerRaw);

    // Extract any class/grade integers from raw input, filtering out graduation calendar years (e.g. 2024, 2025, 2026)
    const rawNumbers = (raw.match(/\b\d+\b/g) || [])
      .map(Number)
      .filter((n) => n < 1900 || n > 2100);

    // Keyword-based canonical tier mappings with bidirectional triggers
    const tierKeywords: { tier: string; triggers: string[]; optTerms: string[] }[] = [
      {
        tier: 'higher_secondary',
        triggers: [
          'higher secondary', 'hsc', '11th', '12th', 'a level', 'a-level', 'a levels',
          'intermediate', 'alim', 'class 11', 'class 12', 'grade 11', 'grade 12', 'xi', 'xii'
        ],
        optTerms: ['higher secondary', 'hsc', '11-12', '11 - 12', '11th-12th', 'a level', 'a-level', 'intermediate']
      },
      {
        tier: 'secondary',
        triggers: [
          'secondary', 'ssc', '9th', '10th', 'o level', 'o-level', 'o levels',
          'matric', 'dakhil', 'class 9', 'class 10', 'grade 9', 'grade 10', 'ix', 'x'
        ],
        optTerms: ['secondary', 'ssc', '9-10', '9 - 10', '9th-10th', 'o level', 'o-level', 'matric']
      },
      {
        tier: 'junior',
        triggers: [
          'junior', 'jsc', '6th', '7th', '8th', 'middle school',
          'class 6', 'class 7', 'class 8', 'grade 6', 'grade 7', 'grade 8', 'vi', 'vii', 'viii'
        ],
        optTerms: ['junior', '6-8', '6 - 8', '6th-8th', 'jsc', 'middle school']
      },
      {
        tier: 'undergrad',
        triggers: [
          'undergrad', 'undergraduate', 'bachelor', 'bachelors', 'university', 'college',
          'cse', 'bba', 'bsc', 'b.sc', 'btech', 'b.tech', 'honours', 'honors',
          '1st year', '2nd year', '3rd year', '4th year', 'first year', 'second year',
          'third year', 'fourth year', 'final year', 'freshman', 'sophomore', 'senior',
          'year 1', 'year 2', 'year 3', 'year 4', 'degree', 'diploma', 'campus'
        ],
        optTerms: ['undergraduate', 'university', 'bachelor', 'college']
      },
      {
        tier: 'postgrad',
        triggers: [
          'postgrad', 'postgraduate', 'masters', "master's", 'master', 'msc', 'm.sc',
          'mba', 'phd', 'doctorate', 'm.phil', 'mphil', 'grad school'
        ],
        optTerms: ['postgraduate', 'masters', 'doctorate', 'phd']
      },
      {
        tier: 'open',
        triggers: [
          'open', 'professional', 'working', 'alumni', 'job holder',
          'general', 'corporate', 'freelancer', 'self-employed'
        ],
        optTerms: ['open', 'professional', 'alumni']
      }
    ];

    // Priority 3.1: Check canonical educational tier triggers using word-boundary matching
    for (const tier of tierKeywords) {
      const hasTrigger = tier.triggers.some((trig) => {
        const escaped = trig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerRaw);
      });

      if (hasTrigger) {
        const matchingOpts = options.filter((opt) => {
          const lOpt = opt.toLowerCase();
          // Avoid matching "secondary" inside "higher secondary" unless intentional
          if (tier.tier === 'secondary') {
            if (lOpt.includes('higher secondary')) return false;
          }
          return tier.optTerms.some((term) => lOpt.includes(term));
        });

        if (matchingOpts.length === 1) {
          return matchingOpts[0];
        }
      }
    }

    // Priority 3.2: Number range or specific grade check (only if not a college/university year)
    if (!isCollegeOrUniYear && rawNumbers.length > 0) {
      const matchesByNumber: string[] = [];

      for (const opt of options) {
        // Parse numbers or number ranges from the option string
        // Examples: "Class 11-12", "Junior (Class 6-8)", "Grade 9-10 / SSC", "Class 12"
        const optRanges = Array.from(opt.matchAll(/(\d+)\s*[-–—to]\s*(\d+)/gi));
        let matchedRange = false;

        for (const r of optRanges) {
          const start = Number(r[1]);
          const end = Number(r[2]);
          for (const num of rawNumbers) {
            if (num >= Math.min(start, end) && num <= Math.max(start, end)) {
              matchedRange = true;
              break;
            }
          }
          if (matchedRange) break;
        }

        if (matchedRange) {
          matchesByNumber.push(opt);
          continue;
        }

        // Single number check (e.g. option has "Class 12" and input is 12)
        const optNumbers = (opt.match(/\b\d+\b/g) || []).map(Number);
        if (rawNumbers.some((n) => optNumbers.includes(n))) {
          matchesByNumber.push(opt);
        }
      }

      if (matchesByNumber.length === 1) {
        return matchesByNumber[0];
      }
    }
  }

  // 4. Whole-word / phrase containment match (only if input is distinct and length >= 3)
  if (lowerRaw.length >= 3) {
    const escapedRaw = lowerRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const substringMatches = options.filter((opt) => {
      const lOpt = opt.toLowerCase();
      const escapedOpt = lOpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return (
        new RegExp(`\\b${escapedRaw}\\b`, 'i').test(lOpt) ||
        new RegExp(`\\b${escapedOpt}\\b`, 'i').test(lowerRaw)
      );
    });

    if (substringMatches.length === 1) {
      return substringMatches[0];
    }
  }

  return null;
}

