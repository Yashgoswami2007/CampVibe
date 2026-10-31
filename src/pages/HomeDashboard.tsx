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

  // Events won / total tracked
  const completedCount = Object.values(opportunityStates).filter(s => s.folder === 'completed').length;
  const totalTracked = Object.keys(opportunityStates).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Dark Analytics Banner Card — Matching reference design */}
      <div className="bg-[#121620] text-white rounded-3xl p-6 md:p-7 shadow-lg relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Metric 1: Upcoming Events */}
          <div className="md:col-span-4 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">Upcoming events</span>
            <div className="flex items-center space-x-4">
              {/* Circular chart */}
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(#FFFFFF 0% ${Math.round((upcomingThisWeek.length / Math.max(announcements.length, 1)) * 100)}%, #282E3E ${Math.round((upcomingThisWeek.length / Math.max(announcements.length, 1)) * 100)}% 100%)` }}>
                <div className="w-10 h-10 bg-[#121620] rounded-full" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-white">{upcomingThisWeek.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">This month</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-12 bg-slate-800" />

          {/* Metric 2: Match Distribution */}
          <div className="md:col-span-3 flex flex-col pl-0 md:pl-2">
            <span className="text-xs font-semibold text-slate-400 mb-4 tracking-wide">Match distribution</span>
            <div className="flex items-end space-x-4 h-11">
              {[
                { h: 'h-3.5', label: '90+', active: false },
                { h: 'h-9', label: '70+', active: true },
                { h: 'h-5', label: '50+', active: false },
                { h: 'h-3', label: '30+', active: false },
                { h: 'h-2', label: '<30', active: false },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center space-y-1.5">
                  <div className={`${bar.active ? 'w-1.5 bg-white' : 'w-1 bg-slate-700'} ${bar.h} rounded-full`} />
                  <span className={`text-[10px] ${bar.active ? 'text-slate-300 font-semibold' : 'text-slate-500'} font-medium`}>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-12 bg-slate-800" />

          {/* Metric 3: Tracked / Total */}
          <div className="md:col-span-4 flex items-center justify-between pl-0 md:pl-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 tracking-wide block mb-1.5">Events tracked</span>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
                {completedCount}/{totalTracked || announcements.length}
              </div>
            </div>
            {/* Trophy Icon */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 drop-shadow-md" fill="none" viewBox="0 0 64 64">
                <rect fill="#6B7280" height="6" rx="2" width="20" x="22" y="52" />
                <rect fill="#D97706" height="6" width="12" x="26" y="47" />
                <path d="M18 16H46V28C46 36 39.5 42 32 42C24.5 42 18 36 18 28V16Z" fill="#FBBF24" />
                <path d="M22 18H42V28C42 34 37 38 32 38C27 38 22 34 22 28V18Z" fill="#F59E0B" />
                <path d="M18 20H13C11 20 10 22 10 24C10 29 13 32 18 32V29C15 29 13 27 13 24H18V20Z" fill="#F59E0B" />
                <path d="M46 20H51C53 20 54 22 54 24C54 29 51 32 46 32V29C49 29 51 27 51 24H46V20Z" fill="#F59E0B" />
                <circle cx="32" cy="27" fill="#EF4444" r="7" />
                <text fill="#FFFFFF" fontFamily="sans-serif" fontSize="7.5" fontWeight="bold" textAnchor="middle" x="32" y="30.5">#1</text>
                <path d="M28 32L26 40L30 38L32 41L33 34" fill="#DC2626" />
                <path d="M36 32L38 40L34 38L32 41L31 34" fill="#B91C1C" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended For You Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Recommended For You</h2>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
          >
            view all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {topRecommendations.slice(0, 2).map((ann, idx) => {
            const rel = calculateRelevance(ann, profile);
            const bgColors = ['bg-[#D4F5EC]', 'bg-white'];
            const borderColors = ['border-[#BDEFE2]/50', 'border-slate-100'];
            return (
              <article
                key={ann.id}
                onClick={() => onSelectAnnouncement(ann)}
                className={`${bgColors[idx]} rounded-2xl p-3.5 flex flex-col justify-between ${borderColors[idx]} border shadow-sm min-h-[220px] cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div>
                  {/* SVG Image Header */}
                  <div className="w-full h-24 rounded-xl overflow-hidden mb-3 bg-white/60 shadow-xs relative">
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                      <rect fill={idx === 0 ? '#E2F6F0' : '#F9F6F0'} height="100" width="200" />
                      {idx === 0 ? (
                        <>
                          <rect fill="#C2A180" height="6" rx="1" width="150" x="25" y="60" />
                          <rect fill="#AF8F70" height="8" rx="1" width="150" x="25" y="85" />
                          <rect fill="#A08060" height="30" width="6" x="35" y="60" />
                          <rect fill="#A08060" height="30" width="6" x="160" y="60" />
                          <rect fill="#FDE047" height="52" rx="4" stroke="#CA8A04" strokeWidth="1" width="10" x="48" y="24" />
                          <rect fill="#F472B6" height="56" rx="4" stroke="#DB2777" strokeWidth="1" width="10" x="68" y="20" />
                          <rect fill="#60A5FA" height="48" rx="4" stroke="#2563EB" strokeWidth="1" width="10" x="88" y="28" />
                          <rect fill="#FB923C" height="54" rx="4" stroke="#EA580C" strokeWidth="1" width="10" x="108" y="22" />
                          <rect fill="#38BDF8" height="51" rx="4" stroke="#0284C7" strokeWidth="1" width="10" x="128" y="25" />
                          <rect fill="#C084FC" height="58" rx="4" stroke="#9333EA" strokeWidth="1" width="10" x="148" y="18" />
                        </>
                      ) : (
                        <>
                          <line stroke="#EDE8DF" strokeWidth="1" x1="0" x2="200" y1="30" y2="30" />
                          <line stroke="#EDE8DF" strokeWidth="1" x1="0" x2="200" y1="65" y2="65" />
                          <rect fill="#FFFFFF" height="70" rx="4" stroke="#E2E8F0" strokeWidth="2" width="55" x="70" y="15" />
                          <rect fill="#0EA5E9" height="30" opacity="0.8" rx="2" width="40" x="78" y="22" />
                          <rect fill="#F1F5F9" height="26" rx="8" stroke="#CBD5E1" width="16" x="42" y="32" />
                          <rect fill="#EC4899" height="60" rx="2" width="4" x="142" y="20" />
                          <rect fill="#10B981" height="56" rx="2" width="4" x="150" y="24" />
                          <circle cx="50" cy="72" fill="#FED7AA" r="8" stroke="#FDBA74" />
                        </>
                      )}
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{ann.title}</h3>
                </div>
                {idx === 0 ? (
                  <span className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 mt-3 cursor-pointer">
                    <span>view details</span>
                    <span className="text-xs">&gt;</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnnouncement(ann);
                    }}
                    className="w-full py-2 bg-[#181B20] hover:bg-black text-white text-[11px] font-semibold rounded-xl transition shadow-xs mt-3"
                  >
                    View details
                  </button>
                )}
              </article>
            );
          })}
          {/* Empty Slots */}
          {[0, 1].map((_, i) => (
            <div
              key={`empty-${i}`}
              onClick={() => onNavigate('explore')}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[220px] bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-400">Explore more</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions Row */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Smart Notice Card (Cream/Yellow) */}
        <div
          onClick={() => onNavigate('add')}
          className="md:col-span-6 bg-[#FCF7E8] rounded-2xl p-5 border border-amber-100/70 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="pr-2">
            <h3 className="text-xs font-bold text-slate-900 mb-1.5">Smart Notice</h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              Paste a notice, AI turns it into a clear campus update
            </p>
          </div>
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <svg className="w-14 h-14 drop-shadow-sm" fill="none" viewBox="0 0 60 60">
              <rect fill="#FFFFFF" height="48" rx="5" stroke="#E5E7EB" width="36" x="12" y="6" />
              <circle cx="16" cy="14" fill="#60A5FA" r="7" />
              <text fill="#FFFFFF" fontFamily="sans-serif" fontSize="7" fontWeight="bold" textAnchor="middle" x="16" y="17">A+</text>
              <rect fill="#CBD5E1" height="2" rx="1" width="18" x="25" y="14" />
              <rect fill="#E2E8F0" height="2" rx="1" width="27" x="16" y="25" />
              <rect fill="#E2E8F0" height="2" rx="1" width="22" x="16" y="30" />
              <rect fill="#FDE047" height="6" rx="1.5" width="6" x="16" y="36" />
              <rect fill="#E2E8F0" height="2" rx="1" width="18" x="25" y="38" />
              <rect fill="#F43F5E" height="4" rx="2" width="18" x="16" y="44" />
            </svg>
          </div>
        </div>

        {/* Campus Calendar Card */}
        <div
          onClick={() => onNavigate('calendar')}
          className="md:col-span-3 bg-[#F4F5F8] rounded-2xl p-5 border border-slate-100 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <h3 className="text-xs font-bold text-slate-900 mb-1.5">Campus Calendar</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            View and track all upcoming campus events and deadlines.
          </p>
        </div>

        {/* Weekly Briefing Card */}
        <div
          onClick={() => onNavigate('briefing')}
          className="md:col-span-3 bg-[#F4F5F8] rounded-2xl p-5 border border-slate-100 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <h3 className="text-xs font-bold text-slate-900 mb-1.5">Weekly Briefing</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            AI synthesized summary of your campus priorities this week.
          </p>
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
            <span className="text-xs text-slate-400 font-medium">
              Action required within 48h
            </span>
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
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
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
          <h3 className="text-base font-bold text-slate-800">
            Upcoming on Campus
          </h3>
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
            <h3 className="text-base font-bold text-slate-800">
              Recently Added
            </h3>
            <p className="text-xs text-slate-400">Latest circulars, notices, and club registrations</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add')}
            className="text-xs font-semibold text-[#1E3A8A] hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>+ Add Notice</span>
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
