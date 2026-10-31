import assert from 'node:assert/strict';
import { after, beforeEach, describe, it } from 'node:test';
import { StorageService } from '../src/lib/storage';
import { makeAnnouncement, makeProfile } from './helpers/fixtures';

let values = new Map<string, string>();
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installLocalStorageMock() {
  values = new Map<string, string>();

  const localStorage = {
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });
}

beforeEach(() => {
  installLocalStorageMock();
});

after(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});

describe('announcement persistence', () => {
  it('initializes demonstration announcements when storage is empty', () => {
    const announcements = StorageService.getAnnouncements();

    assert.ok(announcements.length > 0);
    assert.ok(values.has('campus_radar_v1_announcements'));
  });

  it('round-trips a saved non-empty announcement list', () => {
    const announcements = [makeAnnouncement({ id: 'persisted-1' })];

    StorageService.saveAnnouncements(announcements);

    assert.deepEqual(StorageService.getAnnouncements(), announcements);
  });

  it('prepends a new announcement and avoids duplicate IDs', () => {
    const existing = makeAnnouncement({ id: 'existing-1' });
    const added = makeAnnouncement({
      id: 'new-1',
      title: 'New Campus Event',
    });
    StorageService.saveAnnouncements([existing]);

    const result = StorageService.addAnnouncement(added);
    const repeated = StorageService.addAnnouncement({
      ...added,
      title: 'Updated title',
    });

    assert.deepEqual(result.map((item) => item.id), ['new-1', 'existing-1']);
    assert.equal(repeated.filter((item) => item.id === 'new-1').length, 1);
    assert.equal(repeated[0].title, 'Updated title');
  });

  it('updates an existing announcement by ID', () => {
    StorageService.saveAnnouncements([
      makeAnnouncement({ id: 'edit-me', title: 'Before edit' }),
    ]);

    const result = StorageService.updateAnnouncement(
      makeAnnouncement({ id: 'edit-me', title: 'After edit' })
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'After edit');
  });

  it('returns the remaining records when deleting an announcement', () => {
    StorageService.saveAnnouncements([
      makeAnnouncement({ id: 'keep-me' }),
      makeAnnouncement({ id: 'delete-me' }),
    ]);

    const result = StorageService.deleteAnnouncement('delete-me');

    assert.deepEqual(result.map((item) => item.id), ['keep-me']);
  });
});

describe('profile and opportunity persistence', () => {
  it('saves and retrieves a student profile', () => {
    const profile = makeProfile({ name: 'Alex Student' });

    StorageService.saveProfile(profile);

    assert.deepEqual(StorageService.getProfile(), profile);
  });

  it('adds, retrieves, and removes an opportunity folder state', () => {
    const saved = StorageService.setOpportunityFolder('ann-1', 'saved');

    assert.equal(saved['ann-1'].folder, 'saved');
    assert.equal(StorageService.getOpportunityStates()['ann-1'].folder, 'saved');

    const removed = StorageService.setOpportunityFolder('ann-1', null);

    assert.equal(removed['ann-1'], undefined);
    assert.deepEqual(StorageService.getOpportunityStates(), {});
  });
});

describe('notifications and recent searches', () => {
  it('marks one notification as read without changing the others', () => {
    const initial = StorageService.getNotifications();
    const unread = initial.find((item) => !item.read);

    assert.ok(unread);

    const updated = StorageService.markNotificationRead(unread.id);

    assert.equal(updated.find((item) => item.id === unread.id)?.read, true);
    assert.equal(
      updated.filter((item) => !item.read).length,
      initial.filter((item) => !item.read).length - 1
    );
  });

  it('keeps recent searches unique, trimmed, and capped at eight entries', () => {
    StorageService.addRecentSearch('  AI systems  ');
    StorageService.addRecentSearch('ai systems');

    for (let index = 0; index < 10; index += 1) {
      StorageService.addRecentSearch('search-' + index);
    }

    const searches = StorageService.getRecentSearches();

    assert.equal(searches.length, 8);
    assert.equal(searches[0], 'search-9');
    assert.equal(searches.filter((term) => term.toLowerCase() === 'ai systems').length, 1);
  });

  it('clears recent searches', () => {
    StorageService.addRecentSearch('temporary query');
    StorageService.clearRecentSearches();

    assert.deepEqual(StorageService.getRecentSearches(), []);
  });
});

describe('backup and reset behavior', () => {
  it('exports application state and restores it from a valid JSON backup', () => {
    const originalProfile = makeProfile({ name: 'Backup Student' });
    StorageService.saveProfile(originalProfile);
    StorageService.saveAnnouncements([
      makeAnnouncement({ id: 'backup-announcement' }),
    ]);

    const backup = StorageService.exportJSON();

    StorageService.saveProfile(makeProfile({ name: 'Changed Student' }));
    assert.equal(StorageService.importJSON(backup), true);

    assert.deepEqual(StorageService.getProfile(), originalProfile);
    assert.equal(
      StorageService.getAnnouncements()[0].id,
      'backup-announcement'
    );
  });

  it('rejects malformed JSON without throwing', () => {
    assert.equal(StorageService.importJSON('{invalid json'), false);
  });

  it('restores demonstration defaults and marks onboarding complete', () => {
    StorageService.saveAnnouncements([
      makeAnnouncement({ id: 'temporary' }),
    ]);
    StorageService.setOnboarded(false);

    StorageService.resetToDefaults();

    assert.ok(StorageService.getAnnouncements().length > 1);
    assert.equal(StorageService.isOnboarded(), true);
    assert.deepEqual(StorageService.getOpportunityStates(), {});
  });
});


describe('notification and digest persistence', () => {
  it('marks every notification as read', () => {
    const initial = StorageService.getNotifications();
    assert.ok(initial.some((item) => !item.read));
    const updated = StorageService.markAllNotificationsRead();
    assert.ok(updated.every((item) => item.read));
    assert.equal(StorageService.getNotifications().filter((item) => !item.read).length, 0);
  });

  it('clears notifications and persists the empty list', () => {
    StorageService.getNotifications();
    assert.equal(StorageService.clearNotifications().length, 0);
    assert.deepEqual(StorageService.getNotifications(), []);
  });

  it('saves and retrieves notification arrays', () => {
    const notifications = [{
      id: 'custom-notification',
      title: 'Test reminder',
      message: 'Run the regression tests.',
      type: 'event' as const,
      timestamp: '2026-10-31T00:00:00.000Z',
      read: false,
    }];
    StorageService.saveNotifications(notifications);
    assert.deepEqual(StorageService.getNotifications(), notifications);
  });

  it('saves and retrieves a cached digest', () => {
    const digest = {
      headline: 'A focused test week',
      summary: 'Review upcoming campus activities.',
      must_do: [],
      days: [],
      heads_up: [],
      generated_at: '2026-10-31T00:00:00.000Z',
    };
    StorageService.saveDigest(digest);
    assert.deepEqual(StorageService.getCachedDigest(), digest);
  });

  it('returns null for an invalid cached digest', () => {
    values.set('campus_radar_v1_digest', '{bad json');
    assert.equal(StorageService.getCachedDigest(), null);
  });

  it('stores and reads the onboarding flag', () => {
    StorageService.setOnboarded(true);
    assert.equal(StorageService.isOnboarded(), true);
    StorageService.setOnboarded(false);
    assert.equal(StorageService.isOnboarded(), false);
  });
});

describe('storage resilience', () => {
  it('recovers from malformed notification JSON using defaults', () => {
    values.set('campus_radar_v1_notifications', '{broken');
    const notifications = StorageService.getNotifications();
    assert.ok(Array.isArray(notifications));
    assert.ok(notifications.length > 0);
  });

  it('returns empty opportunity states when stored JSON is invalid', () => {
    values.set('campus_radar_v1_opportunities', '{broken');
    assert.deepEqual(StorageService.getOpportunityStates(), {});
  });

  it('returns the default profile when stored profile JSON is invalid', () => {
    values.set('campus_radar_v1_profile', '{broken');
    assert.equal(StorageService.getProfile().id, 'demo-profile-1');
  });

  it('deduplicates recent searches case-insensitively', () => {
    StorageService.addRecentSearch('Hackathon');
    StorageService.addRecentSearch('hackathon');
    const searches = StorageService.getRecentSearches();
    assert.equal(searches.filter((term) => term.toLowerCase() === 'hackathon').length, 1);
  });
});
