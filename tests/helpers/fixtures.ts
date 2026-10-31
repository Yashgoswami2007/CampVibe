import type { CampusAnnouncement, StudentProfile } from '../../src/types';

export function makeAnnouncement(
  overrides: Partial<CampusAnnouncement> = {}
): CampusAnnouncement {
  return {
    id: 'test-announcement-1',
    title: 'Campus Workshop',
    description: 'A practical campus workshop for students.',
    kind: 'event',
    category: 'Workshop',
    organizer: 'Testing Club',
    event_date: null,
    event_time: null,
    registration_deadline: null,
    venue: null,
    eligibility: 'Open to all students',
    target_departments: ['All'],
    target_years: ['All'],
    required_action: null,
    urgency_reason: null,
    registration_url: null,
    tags: ['campus', 'workshop'],
    raw_text: 'Campus Workshop notice',
    source: 'manual',
    evidence: {},
    date_resolution: null,
    confidence: { overall: 100 },
    missing_fields: [],
    warnings: [],
    created_at: '2026-10-31T00:00:00.000Z',
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<StudentProfile> = {}
): StudentProfile {
  return {
    id: 'test-profile-1',
    name: 'Test Student',
    college: 'Example Institute',
    department: 'Computer Science',
    academic_year: '3rd Year',
    interests: [],
    career_goals: [],
    notifications_enabled: true,
    created_at: '2026-10-31T00:00:00.000Z',
    ...overrides,
  };
}
