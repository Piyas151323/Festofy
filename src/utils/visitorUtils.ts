import { EventItem, Fest, VisitorAccessType } from '../types';

/**
 * Determines the effective visitor access policy with clear precedence rules.
 * Precedence hierarchy:
 * 1. If the parent festival strictly prohibits visitors ('not_allowed'), the entire campus/venue
 *    is closed to general visitors, so all events within it default to 'not_allowed'.
 * 2. If the event explicitly specifies 'not_allowed' (or 'restricted' participant-only), that specific
 *    competition hall/lab prohibits outside spectators.
 * 3. If the event explicitly specifies 'allowed', visitors are welcome for this event.
 * 4. If the parent festival specifies 'allowed', events inherit this open audience policy.
 * 5. Safe compatibility default for older existing records: 'allowed'.
 */
export function getEffectiveVisitorAccess(
  event?: Partial<EventItem> | null,
  fest?: Partial<Fest> | null
): 'allowed' | 'not_allowed' {
  // 1. Parent festival restriction takes top priority
  if (fest?.visitorAccess === 'not_allowed') {
    return 'not_allowed';
  }

  // 2. Event-level specific restriction
  if (event?.visitorAccess === 'not_allowed' || event?.visitorAccess === 'restricted') {
    return 'not_allowed';
  }

  // 3. Event-level specific allowance
  if (event?.visitorAccess === 'allowed') {
    return 'allowed';
  }

  // 4. Festival-level allowance fallback
  if (fest?.visitorAccess === 'allowed') {
    return 'allowed';
  }

  // 5. Safe default for backwards compatibility
  return 'allowed';
}

export function getVisitorAccessDisplay(
  event?: Partial<EventItem> | null,
  fest?: Partial<Fest> | null
): {
  status: 'allowed' | 'not_allowed';
  label: string;
  badgeText: string;
  description: string;
} {
  const effective = getEffectiveVisitorAccess(event, fest);

  if (effective === 'allowed') {
    return {
      status: 'allowed',
      label: 'Allowed',
      badgeText: 'Visitors: Allowed',
      description: 'Spectators, parents, and audience guests are welcome to attend this event. (Does not grant competitor passes or tournament entry).'
    };
  }

  return {
    status: 'not_allowed',
    label: 'Not Allowed',
    badgeText: 'Visitors: Not Allowed',
    description: 'Admittance is strictly restricted to verified registered participants holding active digital passes. General audience entry is closed.'
  };
}
