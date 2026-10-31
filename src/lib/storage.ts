import {
  CampusAnnouncement,
  CampusNotification,
  ClubInfo,
  ClubMember,
  OpportunityFolder,
  StudentProfile,
  UserOpportunityState,
  WeeklyDigest,
} from '../types';
import { DEMO_PROFILES, INITIAL_ANNOUNCEMENTS, INITIAL_CLUBS, INITIAL_CLUB_MEMBERS } from './seedData';

const STORAGE_KEYS = {
  ANNOUNCEMENTS: 'campus_radar_v1_announcements',
  PROFILE: 'campus_radar_v1_profile',
  OPPORTUNITIES: 'campus_radar_v1_opportunities',
  DIGEST: 'campus_radar_v1_digest',
  ONBOARDED: 'campus_radar_v1_onboarded',
  ACTIVE_DEMO_ID: 'campus_radar_v1_active_demo_id',
  NOTIFICATIONS: 'campus_radar_v1_notifications',
  RECENT_SEARCHES: 'campus_radar_v1_recent_searches',
  CLUBS: 'campus_radar_v1_clubs',
  CLUB_MEMBERS: 'campus_radar_v1_club_members',
  USERS: 'campus_radar_v1_users',
};

export const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'notif-1',
    title: 'Urgent Deadline: National AI Hackathon',
    message: 'Registrations close tomorrow midnight (Nov 1). Only 60 team slots remaining!',
    type: 'deadline',
    announcement_id: 'ann-1',
    timestamp: '2026-10-31T08:00:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New Opportunity: Cloud SWE Internship',
    message: 'T&P Cell posted Summer 2027 Internship with ₹85,000/mo stipend.',
    type: 'new_announcement',
    announcement_id: 'ann-3',
    timestamp: '2026-10-30T14:30:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Happening Tomorrow: Varsity Cricket Trials',
    message: 'Open selection trials at 7:30 AM in Main Stadium.',
    type: 'event',
    announcement_id: 'ann-6',
    timestamp: '2026-10-30T17:00:00Z',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'Recommended Match: PyTorch & LLM Workshop',
    message: '92% match with your interests in Artificial Intelligence & Machine Learning.',
    type: 'recommendation',
    announcement_id: 'ann-2',
    timestamp: '2026-10-29T16:00:00Z',
    read: true,
  },
];

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

  approveAnnouncement(id: string, approver: StudentProfile): CampusAnnouncement[] {
    const list = this.getAnnouncements();
    const updated = list.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'published' as const,
          approved_by_user_id: approver.id,
          approval_timestamp: new Date().toISOString(),
        };
      }
      return a;
    });
    this.saveAnnouncements(updated);
    return updated;
  },

  rejectAnnouncement(id: string, reason?: string): CampusAnnouncement[] {
    const list = this.getAnnouncements();
    const updated = list.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'rejected' as const,
          rejection_reason: reason || 'Does not meet campus notice guidelines.',
        };
      }
      return a;
    });
    this.saveAnnouncements(updated);
    return updated;
  },

  // Active Profile & Users Directory
  getUsers(): StudentProfile[] {
    const raw = safeGetItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.saveUsers(DEMO_PROFILES);
      return DEMO_PROFILES;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_PROFILES;
    } catch {
      return DEMO_PROFILES;
    }
  },

  saveUsers(users: StudentProfile[]): void {
    safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  updateUser(user: StudentProfile): StudentProfile[] {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === user.id ? user : u));
    this.saveUsers(updated);
    // If the updated user is currently active, save profile as well
    const current = this.getProfile();
    if (current.id === user.id) {
      this.saveProfile(user);
    }
    return updated;
  },

  getProfile(): StudentProfile {
    const raw = safeGetItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const defaultProfile = DEMO_PROFILES[0];
      this.saveProfile(defaultProfile);
      return defaultProfile;
    }
    try {
      const parsed = JSON.parse(raw);
      // Ensure role exists; if legacy profile, merge with DEMO_PROFILES or default to student
      if (!parsed.role) {
        const found = DEMO_PROFILES.find(p => p.id === parsed.id);
        parsed.role = found?.role || 'student';
        if (found?.assigned_club_id) parsed.assigned_club_id = found.assigned_club_id;
        if (found?.assigned_club_name) parsed.assigned_club_name = found.assigned_club_name;
        if (found?.explicit_permissions) parsed.explicit_permissions = found.explicit_permissions;
        this.saveProfile(parsed);
      }
      return parsed;
    } catch {
      return DEMO_PROFILES[0];
    }
  },

  saveProfile(profile: StudentProfile): void {
    safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // Clubs
  getClubs(): ClubInfo[] {
    const raw = safeGetItem(STORAGE_KEYS.CLUBS);
    if (!raw) {
      this.saveClubs(INITIAL_CLUBS);
      return INITIAL_CLUBS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CLUBS;
    } catch {
      return INITIAL_CLUBS;
    }
  },

  saveClubs(clubs: ClubInfo[]): void {
    safeSetItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
  },

  addClub(club: ClubInfo): ClubInfo[] {
    const list = this.getClubs();
    const updated = [...list, club];
    this.saveClubs(updated);
    return updated;
  },

  updateClub(club: ClubInfo): ClubInfo[] {
    const list = this.getClubs();
    const updated = list.map(c => (c.id === club.id ? club : c));
    this.saveClubs(updated);
    return updated;
  },

  deleteClub(clubId: string): ClubInfo[] {
    const list = this.getClubs();
    const updated = list.filter(c => c.id !== clubId);
    this.saveClubs(updated);
    return updated;
  },

  // Club Members
  getClubMembers(clubId?: string): ClubMember[] {
    const raw = safeGetItem(STORAGE_KEYS.CLUB_MEMBERS);
    let all: ClubMember[] = [];
    if (!raw) {
      this.saveClubMembers(INITIAL_CLUB_MEMBERS);
      all = INITIAL_CLUB_MEMBERS;
    } else {
      try {
        const parsed = JSON.parse(raw);
        all = Array.isArray(parsed) ? parsed : INITIAL_CLUB_MEMBERS;
      } catch {
        all = INITIAL_CLUB_MEMBERS;
      }
    }
    return clubId ? all.filter(m => m.club_id === clubId) : all;
  },

  saveClubMembers(members: ClubMember[]): void {
    safeSetItem(STORAGE_KEYS.CLUB_MEMBERS, JSON.stringify(members));
  },

  addClubMember(member: ClubMember): ClubMember[] {
    const list = this.getClubMembers();
    const updated = [...list, member];
    this.saveClubMembers(updated);
    return updated;
  },

  updateClubMember(member: ClubMember): ClubMember[] {
    const list = this.getClubMembers();
    const updated = list.map(m => (m.id === member.id ? member : m));
    this.saveClubMembers(updated);
    return updated;
  },

  deleteClubMember(memberId: string): ClubMember[] {
    const list = this.getClubMembers();
    const updated = list.filter(m => m.id !== memberId);
    this.saveClubMembers(updated);
    return updated;
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

  // Notifications
  getNotifications(): CampusNotification[] {
    const raw = safeGetItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      this.saveNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifs: CampusNotification[]): void {
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  markNotificationRead(id: string): CampusNotification[] {
    const list = this.getNotifications();
    const updated = list.map(n => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(updated);
    return updated;
  },

  markAllNotificationsRead(): CampusNotification[] {
    const list = this.getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
    return updated;
  },

  clearNotifications(): CampusNotification[] {
    this.saveNotifications([]);
    return [];
  },

  // Recent Searches
  getRecentSearches(): string[] {
    const raw = safeGetItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (!raw) return ['Hackathons', 'PyTorch', 'Internships', 'Placements', 'Block B'];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : ['Hackathons', 'PyTorch', 'Internships'];
    } catch {
      return ['Hackathons', 'PyTorch', 'Internships'];
    }
  },

  addRecentSearch(term: string): string[] {
    if (!term || !term.trim()) return this.getRecentSearches();
    const clean = term.trim();
    const current = this.getRecentSearches();
    const updated = [clean, ...current.filter(t => t.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    return updated;
  },

  clearRecentSearches(): void {
    safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([]));
  },

  // Reset to default
  resetToDefaults(): void {
    this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
    this.saveUsers(DEMO_PROFILES);
    this.saveProfile(DEMO_PROFILES[0]);
    this.saveClubs(INITIAL_CLUBS);
    this.saveClubMembers(INITIAL_CLUB_MEMBERS);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    safeSetItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.DIGEST, '');
    this.setOnboarded(true);
  },

  // Export full JSON state
  exportJSON(): string {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      users: this.getUsers(),
      clubs: this.getClubs(),
      club_members: this.getClubMembers(),
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
      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (Array.isArray(data.clubs)) this.saveClubs(data.clubs);
      if (Array.isArray(data.club_members)) this.saveClubMembers(data.club_members);
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
