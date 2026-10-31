import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkConflictsAndDuplicates } from '../src/lib/conflicts';
import { makeAnnouncement } from './helpers/fixtures';

describe('announcement duplicate detection', () => {
  it('detects an announcement with an identical title', () => {
    const existing = makeAnnouncement({
      id: 'existing-1',
      title: 'National AI Hackathon 2026',
    });

    const result = checkConflictsAndDuplicates(
      makeAnnouncement({ title: 'National AI Hackathon 2026' }),
      [existing]
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'duplicate');
    assert.equal(result[0].existingAnnouncement.id, 'existing-1');
    assert.match(result[0].message, /100% title match/);
  });

  it('detects matching registration URLs even when titles differ', () => {
    const existing = makeAnnouncement({
      id: 'existing-2',
      title: 'AI Build Sprint',
      registration_url: 'https://example.edu/register',
    });

    const result = checkConflictsAndDuplicates(
      makeAnnouncement({
        title: 'Build Sprint for Students',
        registration_url: 'https://example.edu/register',
      }),
      [existing]
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'duplicate');
  });

  it('does not compare an announcement against its own ID when excluded', () => {
    const existing = makeAnnouncement({
      id: 'same-id',
      title: 'Campus Workshop',
    });

    const result = checkConflictsAndDuplicates(
      makeAnnouncement({ id: 'same-id', title: 'Campus Workshop' }),
      [existing],
      'same-id'
    );

    assert.deepEqual(result, []);
  });

  it('returns no warnings for unrelated announcements on different dates', () => {
    const existing = makeAnnouncement({
      id: 'existing-3',
      title: 'Robotics Exhibition',
      event_date: '2026-11-10',
      event_time: '9:00 AM',
    });

    const result = checkConflictsAndDuplicates(
      makeAnnouncement({
        title: 'Literature Society Meetup',
        event_date: '2026-11-12',
        event_time: '4:00 PM',
      }),
      [existing]
    );

    assert.deepEqual(result, []);
  });

  it('returns an empty result when there are no existing announcements', () => {
    assert.deepEqual(
      checkConflictsAndDuplicates(makeAnnouncement(), []),
      []
    );
  });
});
