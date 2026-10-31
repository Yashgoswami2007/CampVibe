import { CalculatedStatus, CampusAnnouncement, PriorityOption, UrgencyLevel } from '../types';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Current reference anchor for 2026-10-31 (Sat) in IST
export function getNow(): Date {
  return new Date();
}

/**
 * Returns formatted date string like "Sat, 31 Oct" or "31 Oct 2026"
 */
export function formatDate(dateStr: string | null | undefined, includeYear = false): string {
  if (!dateStr) return 'Date not specified';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return dateStr;
  }
}

/**
 * Formats date tile: { month: "OCT", day: "31", weekday: "SAT" }
 */
export function getDateTile(dateStr: string | null | undefined): { month: string; day: string; weekday: string } {
  if (!dateStr) {
    return { month: 'TBD', day: '--', weekday: 'TBD' };
  }
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    if (isNaN(d.getTime())) return { month: 'TBD', day: '--', weekday: 'TBD' };
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate().toString().padStart(2, '0'),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
  } catch {
    return { month: 'TBD', day: '--', weekday: 'TBD' };
  }
}

/**
 * Parse date string safely into a Date object
 */
export function parseDateSafe(dateStr: string | null | undefined, timeStr?: string | null): Date | null {
  if (!dateStr) return null;
  try {
    let combined = dateStr.trim();
    if (!combined.includes('T') && !combined.includes(' ')) {
      const timePart = timeStr ? normalizeTime(timeStr) : '23:59:59';
      combined = `${combined}T${timePart}`;
    }
    const d = new Date(combined);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function normalizeTime(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!match) return '23:59:59';
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? match[2] : '00';
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Calculates priority, urgency status, and countdown strings deterministically
 */
export function calculateAnnouncementStatus(
  announcement: CampusAnnouncement,
  now: Date = getNow()
): CalculatedStatus {
  const regDeadline = parseDateSafe(announcement.registration_deadline);
  const eventDate = parseDateSafe(announcement.event_date, announcement.event_time);

  const nowMs = now.getTime();
  let isRegistrationClosed = false;
  let isEventPassed = false;

  if (regDeadline) {
    isRegistrationClosed = regDeadline.getTime() < nowMs;
  }

  if (eventDate) {
    // Events stay active until end of event day or 3 hours after start
    const eventEndMs = eventDate.getTime() + (announcement.event_time ? 3 * 3600 * 1000 : 24 * 3600 * 1000);
    isEventPassed = eventEndMs < nowMs;
  }

  // Determine urgency
  let urgency: UrgencyLevel = 'active';
  let badgeLabel = 'Active';
  let countdownText = 'Upcoming';

  // 1. Both registration and event passed
  if ((regDeadline && isRegistrationClosed) && (!eventDate || isEventPassed)) {
    urgency = 'expired';
    badgeLabel = 'Concluded';
    countdownText = 'Event concluded';
    return { urgency, badgeLabel, countdownText, isRegistrationClosed, isEventPassed };
  }

  // 2. Check registration deadline urgency
  if (regDeadline && !isRegistrationClosed) {
    const diffHours = (regDeadline.getTime() - nowMs) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (diffHours <= 24 && diffHours > 0) {
      urgency = 'urgent';
      badgeLabel = 'Closing Soon';
      countdownText = diffHours <= 1 ? 'Closes in < 1 hr' : `Closes in ${Math.round(diffHours)} hrs`;
    } else if (diffHours <= 48 && diffHours > 0) {
      urgency = 'urgent';
      badgeLabel = 'Deadline Approaching';
      countdownText = 'Closes tomorrow';
    } else if (diffDays <= 7) {
      urgency = 'upcoming';
      badgeLabel = 'Upcoming Deadline';
      countdownText = `Closes in ${diffDays} days`;
    } else {
      urgency = 'active';
      badgeLabel = 'Open';
      countdownText = `Deadline: ${formatDate(announcement.registration_deadline)}`;
    }
  } else if (eventDate && !isEventPassed) {
    const diffHours = (eventDate.getTime() - nowMs) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (diffHours >= -2 && diffHours <= 12) {
      urgency = 'urgent';
      badgeLabel = 'Today';
      countdownText = 'Happening today';
    } else if (diffHours > 12 && diffHours <= 36) {
      urgency = 'upcoming';
      badgeLabel = 'Tomorrow';
      countdownText = 'Happening tomorrow';
    } else if (diffDays <= 7) {
      urgency = 'upcoming';
      badgeLabel = 'This Week';
      countdownText = `In ${diffDays} days`;
    } else {
      urgency = 'active';
      badgeLabel = 'Upcoming';
      countdownText = `On ${formatDate(announcement.event_date)}`;
    }
  } else if (isRegistrationClosed && eventDate && !isEventPassed) {
    urgency = 'active';
    badgeLabel = 'Reg. Closed';
    countdownText = `Event on ${formatDate(announcement.event_date)}`;
  } else if (!announcement.event_date && !announcement.registration_deadline) {
    urgency = 'active';
    badgeLabel = 'Opportunity';
    countdownText = 'Ongoing opportunity';
  }

  // If announcement explicitly flagged as high urgency in text
  if (announcement.urgency_reason && (urgency as string) !== 'urgent' && (urgency as string) !== 'expired') {
    if (announcement.kind === 'deadline' || announcement.kind === 'opportunity') {
      urgency = 'urgent';
      badgeLabel = 'Urgent Notice';
    }
  }

  return { urgency, badgeLabel, countdownText, isRegistrationClosed, isEventPassed };
}

/**
 * Maps announcement to one of the 7 exact priority options:
 * 'Critical' | 'Urgent' | 'Upcoming' | 'Today' | 'Normal' | 'Expired' | 'Completed'
 */
export function getAnnouncementPriority(
  announcement: CampusAnnouncement,
  isCompleted = false,
  now: Date = getNow()
): PriorityOption {
  if (isCompleted || announcement.is_completed) return 'Completed';
  if (announcement.priority_override) return announcement.priority_override;

  const status = calculateAnnouncementStatus(announcement, now);
  if (status.urgency === 'expired') return 'Expired';

  const regDeadline = parseDateSafe(announcement.registration_deadline);
  const nowMs = now.getTime();

  if (regDeadline && !status.isRegistrationClosed) {
    const diffHours = (regDeadline.getTime() - nowMs) / (1000 * 60 * 60);
    if (diffHours <= 12 && diffHours > 0) return 'Critical';
    if (diffHours <= 48 && diffHours > 0) return 'Urgent';
  }

  const eventDate = parseDateSafe(announcement.event_date, announcement.event_time);
  if (eventDate) {
    const diffHours = (eventDate.getTime() - nowMs) / (1000 * 60 * 60);
    if (diffHours >= -2 && diffHours <= 14) return 'Today';
  }

  if (status.urgency === 'urgent') return 'Urgent';
  if (status.urgency === 'upcoming') return 'Upcoming';

  return 'Normal';
}

/**
 * Generates an iCalendar (.ics) download string
 */
export function generateICS(announcement: CampusAnnouncement): string {
  const d = parseDateSafe(announcement.event_date, announcement.event_time) || parseDateSafe(announcement.registration_deadline) || new Date();
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const startStr = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const endDate = new Date(d.getTime() + 2 * 3600 * 1000);
  const endStr = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Radar//Campus Opportunity Discovery//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${announcement.id}@campusradar.app`,
    `DTSTAMP:${startStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${announcement.title.replace(/[,;]/g, '')}`,
    `DESCRIPTION:${(announcement.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(announcement.venue || 'Campus').replace(/[,;]/g, '')}`,
    announcement.registration_url ? `URL:${announcement.registration_url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return icsLines.join('\r\n');
}

/**
 * Triggers browser download of .ics file
 */
export function downloadICS(announcement: CampusAnnouncement) {
  const content = generateICS(announcement);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${announcement.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
