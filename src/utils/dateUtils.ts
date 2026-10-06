/**
 * Date formatting utilities with consistent Bangladesh Timezone (BST, UTC+6) support
 */

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateRange(startIso: string, endIso: string): string {
  try {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return `${startIso} - ${endIso}`;
    }

    const startStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: 'numeric'
    }).format(startDate);

    const endStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(endDate);

    return `${startStr} – ${endStr}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

export function isDeadlinePassed(deadlineIso: string): boolean {
  try {
    const deadline = new Date(deadlineIso);
    return Date.now() > deadline.getTime();
  } catch {
    return false;
  }
}

export function getDeadlineText(deadlineIso: string): { label: string; isClosed: boolean } {
  try {
    const deadline = new Date(deadlineIso);
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: 'Registration Closed', isClosed: true };
    }
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      return { label: 'Closes today', isClosed: false };
    }
    return { label: `Closes in ${diffDays} days`, isClosed: false };
  } catch {
    return { label: 'Closes soon', isClosed: false };
  }
}
