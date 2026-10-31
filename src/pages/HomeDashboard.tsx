import React from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Flame,
  CheckCircle2,
  BookmarkCheck,
  Trophy,
  Megaphone,
  CalendarDays,
  Briefcase,
  Shield,
  Building2,
  Users,
  Check,
  XCircle,
  Plus,
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { NoticeCard } from '../components/NoticeCard';
import { calculateAnnouncementStatus, formatDate } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';
import { Permissions } from '../lib/permissions';
import { StorageService } from '../lib/storage';

interface HomeDashboardProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
  onShare?: (a: CampusAnnouncement) => void;
  onNavigate: (view: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
  onShare,
  onNavigate,
  onApprove,
  onReject,
}) => {
  const role = Permissions.getRole(profile);
  const isSuperAdmin = Permissions.isSuperAdmin(profile);
  const isHead = Permissions.isHead(profile);
  const canApprove = Permissions.canApproveAnnouncement(profile);

  // Common calculations
  const pendingApprovals = announcements.filter((a) => a.status === 'pending_approval');
  const publishedAnnouncements = announcements.filter((a) => !a.status || a.status === 'published');
  const clubs = StorageService.getClubs();
  const allMembers = StorageService.getClubMembers();

  // Sort announcements by personalized relevance score
  const rankedAnnouncements = [...publishedAnnouncements].sort((a, b) => {
    const scoreA = calculateRelevance(a, profile).score;
    const scoreB = calculateRelevance(b, profile).score;
    return scoreB - scoreA;
  });

  const urgentItems = publishedAnnouncements.filter((a) => {
    const s = calculateAnnouncementStatus(a);
    return s.urgency === 'urgent';
  });

  const upcomingThisWeek = publishedAnnouncements.filter((a) => {
    const s = calculateAnnouncementStatus(a);
    return s.urgency === 'upcoming' || s.urgency === 'urgent';
  });

  const todayPriorities = urgentItems.slice(0, 3);
  const topRecommendations = rankedAnnouncements.slice(0, 4);

  const chronologicalUpcoming = [...publishedAnnouncements]
    .filter((a) => Boolean(a.event_date))
    .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
    .slice(0, 4);

  const recentlyAdded = [...publishedAnnouncements]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 4);

  // Club specific calculations for Head
  const clubId = profile.assigned_club_id || 'club-gdsc';
  const myClub = clubs.find((c) => c.id === clubId) || clubs[0];
  const myClubMembers = allMembers.filter((m) => m.club_id === clubId);
  const myClubAnnouncements = announcements.filter(
    (a) => a.club_id === clubId || a.organizer === myClub.name || a.created_by_user_id === profile.id
  );
  const myClubLiveNotices = myClubAnnouncements.filter((a) => !a.status || a.status === 'published');
  const myClubPendingNotices = myClubAnnouncements.filter((a) => a.status === 'pending_approval' || a.status === 'draft');

  /* =========================================================================
     1. SUPER ADMIN DASHBOARD VIEW (Full Institutional Overview & Queues)
     ========================================================================= */
  if (isSuperAdmin) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Institutional Admin Banner */}
        <div className="bg-[#121620] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Campus-Wide Administration
                </span>
                <span className="text-xs text-slate-400">Moradabad Institute of Technology</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Institutional Operations & Pulse
              </h2>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Centralized authority to govern campus announcements, student societies, approval queues, and cross-department communications.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('approvals')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-slate-950" />
                <span>Review Approvals ({pendingApprovals.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('add')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Notice</span>
              </button>
            </div>
          </div>

          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Notices</span>
              <div className="text-2xl font-black text-white mt-0.5">{publishedAnnouncements.length}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">Active college-wide</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{pendingApprovals.length}</div>
              <span className="text-[10px] text-amber-300 font-semibold">Awaiting Dean action</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Campus Clubs</span>
              <div className="text-2xl font-black text-white mt-0.5">{clubs.length}</div>
              <span className="text-[10px] text-slate-400">Registered societies</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Club Members</span>
              <div className="text-2xl font-black text-white mt-0.5">{allMembers.length}</div>
              <span className="text-[10px] text-indigo-300 font-semibold">Across all branches</span>
            </div>
          </div>
        </div>

        {/* Actionable Urgent Queue: Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Needs Immediate Review ({pendingApprovals.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('approvals')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {ann.category} · {ann.organizer}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    </div>
                    <h4
                      onClick={() => onSelectAnnouncement(ann)}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                    >
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{ann.description}</p>
                    <div className="text-[11px] text-slate-400">
                      Target: {ann.target_departments?.join(', ') || 'All Depts'} · {ann.venue || 'Campus'}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectAnnouncement(ann)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Preview Full Notice
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove && onApprove(ann.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const r = window.prompt('Enter rejection feedback:');
                          if (r !== null && onReject) onReject(ann.id, r);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Campus Clubs & Organizations Overview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Active Student Clubs & Societies
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('clubs')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Clubs Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {clubs.slice(0, 3).map((club) => {
              const count = allMembers.filter((m) => m.club_id === club.id).length;
              const notifCount = announcements.filter((a) => a.club_id === club.id).length;
              return (
                <div key={club.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50">
                      {club.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{count} Members</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{club.name}</h4>
                  <div className="text-[11px] text-slate-500">Lead: {club.lead_name}</div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{notifCount} notices posted</span>
                    <span>{club.code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* College-Wide Recent Announcements */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Institutional Announcement Feed
              </h3>
              <p className="text-xs text-slate-400">All published notices across faculties and student branches</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentlyAdded.map((ann) => (
              <NoticeCard
                key={`adm-${ann.id}`}
                announcement={ann}
                profile={profile}
                currentFolder={opportunityStates[ann.id]?.folder || null}
                onSelect={onSelectAnnouncement}
                onToggleSave={onToggleSave}
                onShare={onShare}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================================
     2. CLUB HEAD DASHBOARD VIEW (Club-Specific Leadership Hub)
     ========================================================================= */
  if (isHead) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Club Executive Header Banner */}
        <div className="bg-[#121620] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {myClub.code} Lead Dashboard
                </span>
                {profile.explicit_permissions?.can_approve_announcements && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 font-mono">
                    *Direct Approval Authority Granted
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {myClub.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                {myClub.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('add')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Club Notice</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Member Roster</span>
              </button>
            </div>
          </div>

          {/* Club Specific KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Club Notices Live</span>
              <div className="text-2xl font-black text-white mt-0.5">{myClubLiveNotices.length}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">Active campus circulars</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Review / Draft</span>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{myClubPendingNotices.length}</div>
              <span className="text-[10px] text-amber-300 font-semibold">Submissions in progress</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Members</span>
              <div className="text-2xl font-black text-white mt-0.5">{myClubMembers.length || myClub.member_count}</div>
              <span className="text-[10px] text-slate-400">Registered student roster</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Next Scheduled Meet</span>
              <div className="text-sm font-bold text-white mt-1.5 truncate">{myClub.meeting_schedule?.split(',')[0] || 'Wednesday'}</div>
              <span className="text-[10px] text-indigo-300 font-semibold">Seminar Hall 2</span>
            </div>
          </div>
        </div>

        {/* My Club's Notices & Statuses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {myClub.name} Activity Pipeline
              </h3>
              <p className="text-xs text-slate-400">Notices, hackathons, and workshops organized by your club</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('add')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>+ Post New Club Event</span>
            </button>
          </div>

          {myClubAnnouncements.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No notices published under {myClub.name} yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClubAnnouncements.map((ann) => (
                <NoticeCard
                  key={`club-${ann.id}`}
                  announcement={ann}
                  profile={profile}
                  currentFolder={opportunityStates[ann.id]?.folder || null}
                  onSelect={onSelectAnnouncement}
                  onToggleSave={onToggleSave}
                  onShare={onShare}
                />
              ))}
            </div>
          )}
        </section>

        {/* Club Member Roster Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Club Core Team & Members ({myClubMembers.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {myClubMembers.slice(0, 3).map((m) => (
              <div key={m.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{m.student_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.club_role === 'Core Team' ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.club_role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{m.department} · {m.academic_year}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{m.student_email}</div>
              </div>
            ))}
          </div>
        </section>

        {/* College-wide Upcoming Events */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Campus-Wide Events (Avoid Conflict Slots)
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
            >
              <span>View Master Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chronologicalUpcoming.slice(0, 2).map((ann) => (
              <NoticeCard
                key={`up-${ann.id}`}
                announcement={ann}
                profile={profile}
                currentFolder={opportunityStates[ann.id]?.folder || null}
                onSelect={onSelectAnnouncement}
                onToggleSave={onToggleSave}
                onShare={onShare}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================================
     3. STUDENT DASHBOARD VIEW (Personalized Student Opportunity Engine)
     ========================================================================= */
  const completedCount = Object.values(opportunityStates).filter((s) => s.folder === 'completed').length;
  const totalTracked = Object.keys(opportunityStates).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dark Personalized Student Analytics Banner Card */}
      <div className="bg-[#121620] text-white rounded-3xl p-6 md:p-7 shadow-lg relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Metric 1: Upcoming Events */}
          <div className="md:col-span-4 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">Upcoming events</span>
            <div className="flex items-center space-x-4">
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `conic-gradient(#FFFFFF 0% ${Math.round(
                    (upcomingThisWeek.length / Math.max(publishedAnnouncements.length, 1)) * 100
                  )}%, #282E3E ${Math.round(
                    (upcomingThisWeek.length / Math.max(publishedAnnouncements.length, 1)) * 100
                  )}% 100%)`,
                }}
              >
                <div className="w-10 h-10 bg-[#121620] rounded-full" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-white">{upcomingThisWeek.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">This month</div>
              </div>
            </div>
          </div>

          {/* Metric 2: Tracked Opportunities */}
          <div className="md:col-span-4 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <span className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">Tracked Pipeline</span>
            <div className="flex items-center space-x-4">
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `conic-gradient(#FFFFFF 0% ${Math.round(
                    (totalTracked / Math.max(publishedAnnouncements.length, 1)) * 100
                  )}%, #282E3E ${Math.round(
                    (totalTracked / Math.max(publishedAnnouncements.length, 1)) * 100
                  )}% 100%)`,
                }}
              >
                <div className="w-10 h-10 bg-[#121620] rounded-full" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-white">{totalTracked}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{completedCount} Completed / Attended</div>
              </div>
            </div>
          </div>

          {/* Profile Match Score */}
          <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Personal Focus</span>
              <span className="text-sm font-bold text-white block mt-0.5">{profile.department}</span>
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                {profile.academic_year} · Active Matching
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('interests')}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              My Interests
            </button>
          </div>
        </div>
      </div>

      {/* Top Recommendations for Student */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">
                Personalized Matches for {profile.name.split(' ')[0]}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Scored based on your profile interests in {profile.interests?.slice(0, 3).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topRecommendations.map((ann) => (
            <NoticeCard
              key={`rec-${ann.id}`}
              announcement={ann}
              profile={profile}
              currentFolder={opportunityStates[ann.id]?.folder || null}
              onSelect={onSelectAnnouncement}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      </section>

      {/* Today's Priorities (High Urgency) */}
      {todayPriorities.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Needs Immediate Attention
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Action required within 48h</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {todayPriorities.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAnnouncement(item)}
                className="p-4 rounded-2xl bg-white border border-red-100 hover:border-red-300 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-red-600 font-bold mb-1.5">
                    <span>{item.category}</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50">
                      {calculateAnnouncementStatus(item).countdownText}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.required_action || item.urgency_reason || item.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.organizer}</span>
                  <span className="font-semibold text-[#1E3A8A] flex items-center gap-1">
                    Act Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming on Campus */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Upcoming on Campus</h3>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
          >
            <span>Open Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chronologicalUpcoming.map((ann) => (
            <NoticeCard
              key={`up-${ann.id}`}
              announcement={ann}
              profile={profile}
              currentFolder={opportunityStates[ann.id]?.folder || null}
              onSelect={onSelectAnnouncement}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      </section>

      {/* Recently Added Announcements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recently Added</h3>
            <p className="text-xs text-slate-400">Latest circulars, notices, and opportunities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentlyAdded.map((ann) => (
            <NoticeCard
              key={`recent-${ann.id}`}
              announcement={ann}
              profile={profile}
              currentFolder={opportunityStates[ann.id]?.folder || null}
              onSelect={onSelectAnnouncement}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
