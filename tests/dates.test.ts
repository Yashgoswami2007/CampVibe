import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateAnnouncementStatus,
  formatDate,
  generateICS,
  getAnnouncementPriority,
  getDateTile,
  parseDateSafe,
} from '../src/lib/dates';
import { makeAnnouncement } from './helpers/fixtures';

const fixedNow = new Date(2026, 9, 31, 12, 0, 0);

describe('date formatting', () => {
  it('returns a useful fallback when no date is supplied', () => {
    assert.equal(formatDate(null), 'Date not specified');
  });

  it('formats a valid date and optionally includes its year', () => {
    assert.equal(formatDate('2026-11-05'), 'Nov 5');
    assert.equal(formatDate('2026-11-05', true), 'Nov 5, 2026');
  });

  it('returns the original value when a date cannot be parsed', () => {
    assert.equal(formatDate('not-a-date'), 'not-a-date');
  });

  it('creates a date tile for a valid date', () => {
    assert.deepEqual(getDateTile('2026-11-05'), {
      month: 'NOV',
      day: '05',
      weekday: 'THU',
    });
  });

  it('returns a TBD tile when the date is missing or invalid', () => {
    assert.deepEqual(getDateTile(null), {
      month: 'TBD',
      day: '--',
      weekday: 'TBD',
    });
    assert.deepEqual(getDateTile('invalid'), {
      month: 'TBD',
      day: '--',
      weekday: 'TBD',
    });
  });
});

describe('safe date parsing', () => {
  it('returns null for missing and invalid dates', () => {
    assert.equal(parseDateSafe(null), null);
    assert.equal(parseDateSafe('not-a-date'), null);
  });

  it('uses the end of the day when parsing a date without a time', () => {
    const parsed = parseDateSafe('2026-11-05');
    assert.ok(parsed);
    assert.equal(parsed.getHours(), 23);
    assert.equal(parsed.getMinutes(), 59);
    assert.equal(parsed.getSeconds(), 59);
  });

  it('normalizes AM and PM times including midnight and noon', () => {
    const midnight = parseDateSafe('2026-11-05', '12:00 AM');
    const noon = parseDateSafe('2026-11-05', '12:00 PM');
    const morning = parseDateSafe('2026-11-05', '9 AM');

    assert.ok(midnight && noon && morning);
    assert.equal(midnight.getHours(), 0);
    assert.equal(noon.getHours(), 12);
    assert.equal(morning.getHours(), 9);
  });
});

describe('announcement status and priority', () => {
  it('marks a notice as expired after its registration deadline when no event remains', () => {
    const status = calculateAnnouncementStatus(
      makeAnnouncement({ registration_deadline: '2026-10-30' }),
      fixedNow
    );

    assert.equal(status.urgency, 'expired');
    assert.equal(status.isRegistrationClosed, true);
    assert.equal(status.badgeLabel, 'Concluded');
  });

  it('marks a deadline within 24 hours as urgent', () => {
    const status = calculateAnnouncementStatus(
      makeAnnouncement({ registration_deadline: '2026-10-31T18:00:00' }),
      fixedNow
    );

    assert.equal(status.urgency, 'urgent');
    assert.equal(status.isRegistrationClosed, false);
  });

  it('marks an upcoming event within seven days as upcoming', () => {
    const status = calculateAnnouncementStatus(
      makeAnnouncement({
        event_date: '2026-11-03',
        event_time: '9:00 AM',
      }),
      fixedNow
    );

    assert.equal(status.urgency, 'upcoming');
    assert.equal(status.isEventPassed, false);
  });

  it('assigns Critical priority to a registration deadline within 12 hours', () => {
    const priority = getAnnouncementPriority(
      makeAnnouncement({ registration_deadline: '2026-10-31T18:00:00' }),
      false,
      fixedNow
    );

    assert.equal(priority, 'Critical');
  });

  it('does not let a lower computed priority override Completed', () => {
    const priority = getAnnouncementPriority(
      makeAnnouncement(),
      true,
      fixedNow
    );

    assert.equal(priority, 'Completed');
  });
});

describe('iCalendar export', () => {
  it('generates a calendar event with stable required fields', () => {
    const ics = generateICS(
      makeAnnouncement({
        id: 'workshop-42',
        title: 'Testing Workshop',
        description: 'Learn practical testing.',
        event_date: '2026-11-05',
        event_time: '10:00 AM',
        venue: 'Main Auditorium',
      })
    );

    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /UID:workshop-42@campusradar\.app/);
    assert.match(ics, /DTSTART:/);
    assert.match(ics, /SUMMARY:Testing Workshop/);
    assert.match(ics, /DESCRIPTION:Learn practical testing\./);
    assert.match(ics, /LOCATION:Main Auditorium/);
    assert.match(ics, /END:VEVENT/);
    assert.match(ics, /END:VCALENDAR/);
    assert.ok(ics.includes('\r\n'));
  });
});


describe('additional status edge cases', () => {
  it('marks a deadline within seven days as upcoming', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement({ registration_deadline: '2026-11-05T18:00:00' }), fixedNow);
    assert.equal(status.urgency, 'upcoming');
    assert.equal(status.isRegistrationClosed, false);
  });

  it('marks an event happening within the next twelve hours as urgent', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement({ event_date: '2026-10-31', event_time: '5:00 PM' }), fixedNow);
    assert.equal(status.urgency, 'urgent');
    assert.equal(status.badgeLabel, 'Today');
  });

  it('marks an event as passed after its event window', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement({ event_date: '2026-10-30', event_time: '9:00 AM' }), fixedNow);
    assert.equal(status.isEventPassed, true);
  });

  it('keeps a future event active when registration has already closed', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement({
      registration_deadline: '2026-10-30',
      event_date: '2026-11-05',
      event_time: '10:00 AM',
    }), fixedNow);
    assert.equal(status.isRegistrationClosed, true);
    assert.equal(status.isEventPassed, false);
    assert.equal(status.badgeLabel, 'Reg. Closed');
  });

  it('treats a notice without dates as an ongoing opportunity', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement(), fixedNow);
    assert.equal(status.urgency, 'active');
    assert.equal(status.badgeLabel, 'Opportunity');
  });

  it('applies an explicit urgency reason to a deadline notice', () => {
    const status = calculateAnnouncementStatus(makeAnnouncement({
      kind: 'deadline',
      urgency_reason: 'Limited seats available',
    }), fixedNow);
    assert.equal(status.urgency, 'urgent');
    assert.equal(status.badgeLabel, 'Urgent Notice');
  });

  it('honors a valid manual priority override', () => {
    assert.equal(getAnnouncementPriority(makeAnnouncement({ priority_override: 'Critical' }), false, fixedNow), 'Critical');
  });

  it('returns Upcoming for a registration deadline several days away', () => {
    assert.equal(getAnnouncementPriority(makeAnnouncement({ registration_deadline: '2026-11-05T18:00:00' }), false, fixedNow), 'Upcoming');
  });

  it('uses registration deadline as the calendar event date when no event date exists', () => {
    const ics = generateICS(makeAnnouncement({
      id: 'deadline-only',
      title: 'Submission Deadline',
      registration_deadline: '2026-11-05T18:00:00',
    }));
    assert.match(ics, /UID:deadline-only@campusradar\.app/);
    assert.match(ics, /DTSTART:20261105T/);
  });
});
