import { CampusAnnouncement, StudentProfile, UserRole } from '../types';

export const Permissions = {
  getRole(user?: StudentProfile | null): UserRole {
    return user?.role || 'student';
  },

  isSuperAdmin(user?: StudentProfile | null): boolean {
    return this.getRole(user) === 'super_admin';
  },

  isHead(user?: StudentProfile | null): boolean {
    return this.getRole(user) === 'head';
  },

  isStudent(user?: StudentProfile | null): boolean {
    return this.getRole(user) === 'student';
  },

  // View Announcements: Super Admin = All, Head = All published + own club drafts/pending, Student = All published
  canViewAnnouncement(user: StudentProfile | null | undefined, announcement: CampusAnnouncement): boolean {
    if (!user) return announcement.status === 'published' || !announcement.status;
    const role = this.getRole(user);

    if (role === 'super_admin') return true;

    const isPublished = !announcement.status || announcement.status === 'published';
    if (isPublished) return true;

    if (role === 'head') {
      const isOwnClub = Boolean(user.assigned_club_id && announcement.club_id === user.assigned_club_id);
      const isCreator = Boolean(announcement.created_by_user_id && announcement.created_by_user_id === user.id);
      return isOwnClub || isCreator;
    }

    return false;
  },

  // Create Announcements: Super Admin = Yes, Head = Assigned club only, Student = No
  canCreateAnnouncement(user?: StudentProfile | null): boolean {
    if (!user) return false;
    const role = this.getRole(user);
    return role === 'super_admin' || role === 'head';
  },

  // Edit Announcements: Super Admin = All authorized, Head = Own club, Student = No
  canEditAnnouncement(user: StudentProfile | null | undefined, announcement: CampusAnnouncement): boolean {
    if (!user) return false;
    const role = this.getRole(user);

    if (role === 'super_admin') return true;

    if (role === 'head') {
      const isOwnClub = Boolean(user.assigned_club_id && announcement.club_id === user.assigned_club_id);
      const isCreator = Boolean(announcement.created_by_user_id && announcement.created_by_user_id === user.id);
      return isOwnClub || isCreator;
    }

    return false;
  },

  // Delete Announcements: Super Admin = All, Head = Own club, Student = No
  canDeleteAnnouncement(user: StudentProfile | null | undefined, announcement: CampusAnnouncement): boolean {
    return this.canEditAnnouncement(user, announcement);
  },

  // Approve Announcements: Super Admin = Yes, Head = No* (Can be granted explicitly), Student = No
  canApproveAnnouncement(user?: StudentProfile | null): boolean {
    if (!user) return false;
    const role = this.getRole(user);

    if (role === 'super_admin') return true;
    if (role === 'head' && user.explicit_permissions?.can_approve_announcements) return true;

    return false;
  },

  // Manage Clubs: Super Admin = Yes, Head = Own club, Student = No
  canManageClubs(user?: StudentProfile | null): { canManageAll: boolean; canManageOwn: boolean } {
    if (!user) return { canManageAll: false, canManageOwn: false };
    const role = this.getRole(user);

    if (role === 'super_admin') return { canManageAll: true, canManageOwn: true };
    if (role === 'head') return { canManageAll: false, canManageOwn: true };

    return { canManageAll: false, canManageOwn: false };
  },

  // Manage Students: Super Admin = Yes, Head = Club members* (can be granted all), Student = No
  canManageStudents(user?: StudentProfile | null): { canManageAll: boolean; canManageClubMembers: boolean } {
    if (!user) return { canManageAll: false, canManageClubMembers: false };
    const role = this.getRole(user);

    if (role === 'super_admin') return { canManageAll: true, canManageClubMembers: true };
    if (role === 'head') {
      const canManageAll = Boolean(user.explicit_permissions?.can_manage_all_students);
      return { canManageAll, canManageClubMembers: true };
    }

    return { canManageAll: false, canManageClubMembers: false };
  },

  // Manage Users/Roles: Super Admin = Yes, Head = No, Student = No
  canManageRoles(user?: StudentProfile | null): boolean {
    return this.isSuperAdmin(user);
  },

  // AI Extraction: Super Admin = Yes, Head = Yes, Student = Optional
  canAiExtract(user?: StudentProfile | null): boolean {
    // Accessible to all or toggleable
    return true;
  },

  // Dashboard Type
  getDashboardType(user?: StudentProfile | null): 'full' | 'club_specific' | 'personal' {
    if (this.isSuperAdmin(user)) return 'full';
    if (this.isHead(user)) return 'club_specific';
    return 'personal';
  },

  // Calendar Scope
  getCalendarScope(user?: StudentProfile | null): 'college_wide' | 'club_specific' | 'personal' {
    if (this.isSuperAdmin(user)) return 'college_wide';
    if (this.isHead(user)) return 'club_specific';
    return 'personal';
  },

  // Analytics Scope
  getAnalyticsScope(user?: StudentProfile | null): 'institution_wide' | 'club_specific' | 'personal' {
    if (this.isSuperAdmin(user)) return 'institution_wide';
    if (this.isHead(user)) return 'club_specific';
    return 'personal';
  },
};
