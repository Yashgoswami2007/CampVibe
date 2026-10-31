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
