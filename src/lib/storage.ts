import { CampusAnnouncement, OpportunityFolder, StudentProfile, UserOpportunityState, WeeklyDigest } from '../types';
import { DEMO_PROFILES, INITIAL_ANNOUNCEMENTS } from './seedData';

const STORAGE_KEYS = {
  ANNOUNCEMENTS: 'campus_radar_v1_announcements',
  PROFILE: 'campus_radar_v1_profile',
  OPPORTUNITIES: 'campus_radar_v1_opportunities',
  DIGEST: 'campus_radar_v1_digest',
  ONBOARDED: 'campus_radar_v1_onboarded',
  ACTIVE_DEMO_ID: 'campus_radar_v1_active_demo_id',
};

// Memory fallback if localStorage is disabled in iframe
const memoryFallback: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryFallback[key] || null;
  } catch {
    return memoryFallback[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryFallback[key] = value;
  } catch {
    memoryFallback[key] = value;
  }
}

export const StorageService = {
  // Announcements
  getAnnouncements(): CampusAnnouncement[] {
    const raw = safeGetItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!raw) {
      this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
      return INITIAL_ANNOUNCEMENTS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  saveAnnouncements(announcements: CampusAnnouncement[]): void {
    safeSetItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  },

  addAnnouncement(announcement: CampusAnnouncement): CampusAnnouncement[] {
    const list = this.getAnnouncements();
    // Prepend new announcement
    const updated = [announcement, ...list.filter(a => a.id !== announcement.id)];
    this.saveAnnouncements(updated);
    return updated;
  },

  updateAnnouncement(announcement: CampusAnnouncement): CampusAnnouncement[] {
    const list = this.getAnnouncements();
    const updated = list.map(a => (a.id === announcement.id ? announcement : a));
    this.saveAnnouncements(updated);
    return updated;
  },

  deleteAnnouncement(id: string): CampusAnnouncement[] {
    const list = this.getAnnouncements();
    const updated = list.filter(a => a.id !== id);
    this.saveAnnouncements(updated);
    return updated;
  },

  // Student Profile
  getProfile(): StudentProfile {
    const raw = safeGetItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const defaultProfile = DEMO_PROFILES[0];
      this.saveProfile(defaultProfile);
      return defaultProfile;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_PROFILES[0];
    }
  },

  saveProfile(profile: StudentProfile): void {
    safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // User Opportunities (Saved, Interested, Applied, Completed)
  getOpportunityStates(): Record<string, UserOpportunityState> {
    const raw = safeGetItem(STORAGE_KEYS.OPPORTUNITIES);
    if (!raw) return {};
    try {
      const list: UserOpportunityState[] = JSON.parse(raw);
      const map: Record<string, UserOpportunityState> = {};
      list.forEach(item => {
        map[item.announcement_id] = item;
      });
      return map;
    } catch {
      return {};
    }
  },

  setOpportunityFolder(announcementId: string, folder: OpportunityFolder | null): Record<string, UserOpportunityState> {
    const map = this.getOpportunityStates();
    if (!folder) {
      delete map[announcementId];
    } else {
      map[announcementId] = {
        announcement_id: announcementId,
        folder,
        updated_at: new Date().toISOString(),
      };
    }
    safeSetItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(Object.values(map)));
    return map;
  },

  // Cached Weekly Digest
  getCachedDigest(): WeeklyDigest | null {
    const raw = safeGetItem(STORAGE_KEYS.DIGEST);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveDigest(digest: WeeklyDigest): void {
    safeSetItem(STORAGE_KEYS.DIGEST, JSON.stringify(digest));
  },

  // Onboarding status
  isOnboarded(): boolean {
    const raw = safeGetItem(STORAGE_KEYS.ONBOARDED);
    return raw === 'true';
  },

  setOnboarded(value: boolean): void {
    safeSetItem(STORAGE_KEYS.ONBOARDED, value ? 'true' : 'false');
  },

  // Reset to default
  resetToDefaults(): void {
    this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
    this.saveProfile(DEMO_PROFILES[0]);
    safeSetItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.DIGEST, '');
    this.setOnboarded(true);
  },

  // Export full JSON state
  exportJSON(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      announcements: this.getAnnouncements(),
      opportunities: Object.values(this.getOpportunityStates()),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import JSON state
  importJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.announcements)) this.saveAnnouncements(data.announcements);
      if (Array.isArray(data.opportunities)) {
        safeSetItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(data.opportunities));
      }
      return true;
    } catch {
      return false;
    }
  },
};
