/**
 * Phone number validation and WhatsApp deep-link normalization utility.
 */

/**
 * Validates international/local phone number format.
 * Accepts numbers starting with optional '+', followed by digits, spaces, hyphens, or parentheses.
 * Requires at least 7 digits and at most 16 digits (E.164 standard).
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number cannot be empty.' };
  }

  const trimmed = phone.trim();
  // Strip allowed formatting characters to count raw digits
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7) {
    return { isValid: false, error: 'Phone number is too short (at least 7 digits required).' };
  }

  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number exceeds maximum length (max 15 digits).' };
  }

  // Regex allowing optional leading +, followed by digits, spaces, parentheses, hyphens
  const phonePattern = /^\+?[0-9\s\-()]{7,25}$/;
  if (!phonePattern.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid phone number with country code (e.g. +8801712345678).' };
  }

  return { isValid: true };
}

/**
 * Normalizes a phone number for WhatsApp URL (https://wa.me/<digits>).
 * Strips all non-digit characters. If starts with 0 (e.g. BD local 017...), optionally prepends BD code 88 if desired,
 * or preserves international format without leading '+'.
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // If local Bangladesh format (01XXXXXXXXX - 11 digits starting with 01)
  if (digits.length === 11 && digits.startsWith('01')) {
    return `880${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generates a clean WhatsApp chat link with an optional prefilled message.
 */
export function buildWhatsAppLink(phone: string, eventName?: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return '';
  const message = eventName
    ? encodeURIComponent(`Hello! I have an inquiry regarding "${eventName}" on Festofy.`)
    : encodeURIComponent('Hello! I have an inquiry regarding your event on Festofy.');
  return `https://wa.me/${normalized}?text=${message}`;
}
