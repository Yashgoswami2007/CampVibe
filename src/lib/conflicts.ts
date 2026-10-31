import { CampusAnnouncement } from '../types';

export interface ConflictNotice {
  existingAnnouncement: CampusAnnouncement;
  type: 'duplicate' | 'schedule_conflict';
  message: string;
}

/**
 * Tokenize string for simple similarity matching
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Checks for duplicates or schedule conflicts against existing announcements
 */
export function checkConflictsAndDuplicates(
  newAnnouncement: Partial<CampusAnnouncement>,
  existingList: CampusAnnouncement[],
  excludeId?: string
): ConflictNotice[] {
  const warnings: ConflictNotice[] = [];
  const newTokens = tokenize(newAnnouncement.title || '');

  for (const existing of existingList) {
    if (excludeId && existing.id === excludeId) continue;

    // 1. Check for Duplicate
    const existingTokens = tokenize(existing.title);
    const similarity = calculateJaccardSimilarity(newTokens, existingTokens);

    const sameUrl =
      newAnnouncement.registration_url &&
      existing.registration_url &&
      newAnnouncement.registration_url === existing.registration_url;

    if (similarity > 0.65 || sameUrl) {
      warnings.push({
        existingAnnouncement: existing,
        type: 'duplicate',
        message: `Likely duplicate of "${existing.title}" (${Math.round(similarity * 100)}% title match).`,
      });
      continue;
    }

    // 2. Check for Schedule Clash (same event date and overlapping event time)
    if (
      newAnnouncement.event_date &&
      existing.event_date &&
      newAnnouncement.event_date === existing.event_date &&
      newAnnouncement.event_time &&
      existing.event_time
    ) {
      // If times are within 1 hour of each other
      warnings.push({
        existingAnnouncement: existing,
        type: 'schedule_conflict',
        message: `Schedule conflict: Occurs on the same date (${existing.event_date}) as "${existing.title}".`,
      });
    }
  }

  return warnings;
}
