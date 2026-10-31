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
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { NoticeCard } from '../components/NoticeCard';
import { calculateAnnouncementStatus, formatDate } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface HomeDashboardProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
  onShare?: (a: CampusAnnouncement) => void;
  onNavigate: (view: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
  onShare,
  onNavigate,
}) => {
  // Sort announcements by personalized relevance score
  const rankedAnnouncements = [...announcements].sort((a, b) => {
    const scoreA = calculateRelevance(a, profile).score;
    const scoreB = calculateRelevance(b, profile).score;
    return scoreB - scoreA;
  });

  // Calculate real metrics
  const strongMatches = rankedAnnouncements.filter(a => calculateRelevance(a, profile).score >= 70);
  const urgentItems = announcements.filter(a => {
    const s = calculateAnnouncementStatus(a);
    return s.urgency === 'urgent';
  });
  const upcomingThisWeek = announcements.filter(a => {
    const s = calculateAnnouncementStatus(a);
    return s.urgency === 'upcoming' || s.urgency === 'urgent';
  });

  // Top urgent priority items (max 3)
  const todayPriorities = urgentItems.slice(0, 3);

  // Top recommendations (top 4)
  const topRecommendations = rankedAnnouncements.slice(0, 4);

  // Recently added announcements (newest first)
  const recentlyAdded = [...announcements]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 4);

  // Chronological upcoming events
  const chronologicalUpcoming = [...announcements]
    .filter(a => Boolean(a.event_date))
    .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
    .slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* A. Personalized Greeting & Priority Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#C96B35] tracking-wider uppercase">
            Personalized Campus Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292A28] tracking-tight mt-1">
            Good evening, {profile.name.split(' ')[0]}.
          </h2>
          <p className="text-xs sm:text-sm text-[#787774] mt-1">
            Here are the priority opportunities aligned with your {profile.department} curriculum & career roadmap.
          </p>
        </div>

        {/* Demo Profile Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E0DBD0] shadow-2xs text-xs text-[#5C5A56] flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#C96B35]" />
          <span>Profile: <strong className="text-[#292A28]">{profile.name}</strong> ({profile.academic_year})</span>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8880] mb-2">
            <span className="text-xs font-semibold">Matched for You</span>
            <Sparkles className="w-4 h-4 text-[#C96B35]" />
          </div>
          <div className="text-2xl font-black text-[#292A28] font-mono tabular-nums">
            {strongMatches.length}
          </div>
          <div className="text-[11px] text-[#787774] mt-0.5">
            Strong score ({'>'}70% match)
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8880] mb-2">
            <span className="text-xs font-semibold">Closing Soon</span>
            <Flame className="w-4 h-4 text-[#B42318]" />
          </div>
          <div className="text-2xl font-black text-[#B42318] font-mono tabular-nums">
            {urgentItems.length}
          </div>
          <div className="text-[11px] text-[#787774] mt-0.5">
            Deadline within 48 hours
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8880] mb-2">
            <span className="text-xs font-semibold">Events This Week</span>
            <Calendar className="w-4 h-4 text-[#1F5FBF]" />
          </div>
          <div className="text-2xl font-black text-[#292A28] font-mono tabular-nums">
            {upcomingThisWeek.length}
          </div>
          <div className="text-[11px] text-[#787774] mt-0.5">
            Scheduled across campus
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8880] mb-2">
            <span className="text-xs font-semibold">Tracked by You</span>
            <BookmarkCheck className="w-4 h-4 text-[#2D6A4F]" />
          </div>
          <div className="text-2xl font-black text-[#292A28] font-mono tabular-nums">
            {Object.keys(opportunityStates).length}
          </div>
          <div className="text-[11px] text-[#787774] mt-0.5">
            In your opportunity pipeline
          </div>
        </div>
      </div>

      {/* Featured Banner: Weekly Intelligence Digest CTA */}
      <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-r from-[#FDF3EB] via-[#FAF8F3] to-[#FEF9EE] border border-[#F8DCBA] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#C96B35] text-white">
            <Sparkles className="w-3.5 h-3.5" />
            WEEKLY RADAR INTELLIGENCE
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#292A28]">
            What do I need to know this week?
          </h3>
          <p className="text-xs sm:text-sm text-[#5C5A56] leading-relaxed">
            Generate an executive synthesized briefing linking your saved events, urgent registration cutoffs, and department announcements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('briefing')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs shrink-0"
        >
          <span>Open Weekly Briefing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Today's Priorities (High Urgency) */}
      {todayPriorities.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B42318] animate-pulse" />
              <h3 className="text-sm font-bold text-[#292A28] uppercase tracking-wider">
                Needs Immediate Attention
              </h3>
            </div>
            <span className="text-xs text-[#787774] font-medium">
              Action required within 48h
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {todayPriorities.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAnnouncement(item)}
                className="p-4 rounded-2xl bg-white border border-[#F9D2CE] hover:border-[#B42318]/50 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#B42318] font-bold mb-1.5">
                    <span>{item.category}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FDECEA]">
                      {calculateAnnouncementStatus(item).countdownText}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#292A28] line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#5C5A56] line-clamp-2 mt-1 leading-relaxed">
                    {item.required_action || item.urgency_reason || item.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F2EFE9] flex items-center justify-between text-[11px] text-[#787774]">
                  <span>{item.organizer}</span>
                  <span className="font-semibold text-[#C96B35] flex items-center gap-1">
                    Act Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* C. Recommended For You (Personalized Ranking) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#292A28] tracking-tight">
              Recommended for You
            </h3>
            <p className="text-xs text-[#787774]">
              Ranked dynamically by interests ({profile.interests.slice(0, 3).join(', ')}), year ({profile.academic_year}), and department
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-[#C96B35] hover:text-[#B85E2B] flex items-center gap-1 transition-colors"
          >
            <span>View All ({announcements.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topRecommendations.map((ann) => (
            <NoticeCard
              key={ann.id}
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

      {/* Upcoming Campus Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#292A28] tracking-tight">
            Upcoming on Campus
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="text-xs font-bold text-[#C96B35] hover:text-[#B85E2B] flex items-center gap-1 transition-colors"
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
            <h3 className="text-base font-extrabold text-[#292A28] tracking-tight">
              Recently Added Announcements
            </h3>
            <p className="text-xs text-[#787774]">Latest circulars, notices, and club registrations posted to Campus Radar</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add')}
            className="text-xs font-bold text-[#C96B35] hover:text-[#B85E2B] flex items-center gap-1 transition-colors"
          >
            <span>+ Ingest Notice</span>
          </button>
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
