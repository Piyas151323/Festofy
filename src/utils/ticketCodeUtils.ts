/**
 * Safely extracts the canonical ticket code from a scanned QR payload or user input.
 * Supports:
 * - Direct ticket code: "FST-K9M2-8KJ7"
 * - Digital pass payload with ID: "FST-K9M2-8KJ7::reg_1791531754097"
 * - URL encoded params: "https://festofy.app/verify?ticket=FST-K9M2-8KJ7"
 * - JSON encoded strings: '{"ticketCode":"FST-K9M2-8KJ7"}'
 */
export function extractTicketCodeFromQR(rawPayload: string): string {
  if (!rawPayload || typeof rawPayload !== 'string') return '';
  const trimmed = rawPayload.trim();

  // 1. Digital pass compound payload "TICKET::REG_ID"
  if (trimmed.includes('::')) {
    const parts = trimmed.split('::');
    if (parts[0] && parts[0].trim()) {
      return parts[0].trim().toUpperCase();
    }
  }

  // 2. JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.ticketCode) return String(parsed.ticketCode).trim().toUpperCase();
      if (parsed.code) return String(parsed.code).trim().toUpperCase();
    } catch {
      // Ignore JSON parse error and fallback
    }
  }

  // 3. URL format
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const ticketParam =
        url.searchParams.get('ticket') ||
        url.searchParams.get('code') ||
        url.searchParams.get('ticketCode');
      if (ticketParam) return ticketParam.trim().toUpperCase();
    } catch {
      // Ignore URL parse error and fallback
    }
  }

  // 4. Default: normalized ticket code
  return trimmed.toUpperCase();
}
