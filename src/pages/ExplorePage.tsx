import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  LayoutGrid,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { AnnouncementCategory, CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { NoticeCard } from '../components/NoticeCard';
import { calculateAnnouncementStatus } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface ExplorePageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
  onShare?: (a: CampusAnnouncement) => void;
  initialSearch?: string;
}

const CATEGORIES: AnnouncementCategory[] = [
  'Academic',
  'Examination',
  'Assignment',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Competition',
  'Internship',
  'Placement',
  'Cultural Event',
  'Sports',
  'Club Activity',
  'Research',
  'Scholarship',
  'General Notice',
  'Important Announcement',
  'Technology',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Entrepreneurship',
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
  onShare,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All');
  const [selectedKind, setSelectedKind] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevant' | 'priority' | 'deadline' | 'date' | 'newest'>('relevant');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  // Filtered announcements
  const filteredList = useMemo(() => {
    return announcements.filter((a) => {
      // Search text
      if (search.trim()) {
        const query = search.toLowerCase();
        const searchable = `${a.title} ${a.description} ${a.organizer} ${a.venue || ''} ${a.category} ${(a.tags || []).join(' ')}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // Category
      if (selectedCategory !== 'All' && a.category !== selectedCategory) {
        return false;
      }

      // Event Kind / Type
      if (selectedKind !== 'All' && a.kind !== selectedKind) {
        return false;
      }

      // Date Filter
      if (selectedDateFilter !== 'All') {
        const d = a.event_date || a.registration_deadline?.split(' ')[0];
        if (!d) return false;
        if (selectedDateFilter === 'today' && d !== '2026-10-31' && d !== '2026-11-01') return false;
        if (selectedDateFilter === 'tomorrow' && d !== '2026-11-01' && d !== '2026-11-02') return false;
        if (selectedDateFilter === 'week' && (d < '2026-10-31' || d > '2026-11-07')) return false;
        if (selectedDateFilter === 'month' && !d.startsWith('2026-11')) return false;
        if (selectedDateFilter === 'past' && d >= '2026-10-31') return false;
      }

      // Urgency
      if (selectedUrgency !== 'All') {
        const status = calculateAnnouncementStatus(a);
        if (selectedUrgency === 'urgent' && status.urgency !== 'urgent') return false;
        if (selectedUrgency === 'upcoming' && status.urgency !== 'upcoming') return false;
        if (selectedUrgency === 'active' && status.urgency !== 'active') return false;
        if (selectedUrgency === 'expired' && status.urgency !== 'expired') return false;
      }

      // Department
      if (selectedDept !== 'All') {
        const depts = (a.target_departments || []).map(d => d.toLowerCase());
        const isAll = depts.length === 0 || depts.some(d => d.includes('all'));
        if (!isAll && !depts.some(d => d.includes(selectedDept.toLowerCase()))) {
          return false;
        }
      }

      // Academic Year
      if (selectedYear !== 'All') {
        const years = (a.target_years || []).map(y => y.toLowerCase());
        const isAll = years.length === 0 || years.some(y => y.includes('all'));
        if (!isAll && !years.some(y => y.includes(selectedYear.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, search, selectedCategory, selectedKind, selectedDateFilter, selectedUrgency, selectedDept, selectedYear]);

  // Sorted list
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (sortBy === 'relevant') {
        const scoreA = calculateRelevance(a, profile).score;
        const scoreB = calculateRelevance(b, profile).score;
        return scoreB - scoreA;
      }
      if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = {
          Critical: 6,
          Urgent: 5,
          Today: 4,
          Upcoming: 3,
          Normal: 2,
          Completed: 1,
          Expired: 0,
        };
        const pa = priorityOrder[calculateAnnouncementStatus(a).urgency === 'urgent' ? 'Urgent' : 'Normal'] || 0;
        const pb = priorityOrder[calculateAnnouncementStatus(b).urgency === 'urgent' ? 'Urgent' : 'Normal'] || 0;
        return pb - pa;
      }
      if (sortBy === 'deadline') {
        const da = a.registration_deadline || '9999';
        const db = b.registration_deadline || '9999';
        return da.localeCompare(db);
      }
      if (sortBy === 'date') {
        const da = a.event_date || '9999';
        const db = b.event_date || '9999';
        return da.localeCompare(db);
      }
      if (sortBy === 'newest') {
        return (b.created_at || '').localeCompare(a.created_at || '');
      }
      return 0;
    });
  }, [filteredList, sortBy, profile]);

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedKind !== 'All' ? 1 : 0) +
    (selectedDateFilter !== 'All' ? 1 : 0) +
    (selectedUrgency !== 'All' ? 1 : 0) +
    (selectedDept !== 'All' ? 1 : 0) +
    (selectedYear !== 'All' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedKind('All');
    setSelectedDateFilter('All');
    setSelectedUrgency('All');
    setSelectedDept('All');
    setSelectedYear('All');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Explore Campus Opportunities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and discover verified notices, workshops, and placement drives at MiT.
          </p>
        </div>

        {/* View Mode & Sort */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View switcher */}
          <div className="flex items-center bg-[#F8F9FA] border border-slate-200/80 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#181B20] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar' ? 'bg-[#181B20] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="relevant">Most Relevant</option>
              <option value="priority">Priority First</option>
              <option value="deadline">Deadline Approaching</option>
              <option value="date">Event Date</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords, topics, organizers, rooms, eligibility..."
            className="w-full bg-[#F8F9FA] border border-slate-200/70 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Event Type / Kind Dropdown */}
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Event Types</option>
            <option value="event">Campus Events</option>
            <option value="deadline">Deadlines</option>
            <option value="opportunity">Opportunities</option>
            <option value="announcement">Announcements</option>
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="today">Happening Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="past">Past / Concluded</option>
          </select>

          {/* Urgency Dropdown */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Urgency</option>
            <option value="urgent">Closing Soon / Urgent (48h)</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="expired">Concluded</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics & Comm.</option>
            <option value="Mechanical Engineering">Mechanical Eng.</option>
          </select>

          {/* Academic Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-[#F8F9FA] text-slate-700 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="All">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>

          {/* Clear Filters Button if any active */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 flex items-center gap-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Count Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong className="text-slate-900 font-mono">{sortedList.length}</strong> opportunities</span>
        {sortBy === 'relevant' && (
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            Ranked for {profile.name} ({profile.department})
          </span>
        )}
      </div>

      {/* View Content: Grid or Calendar */}
      {viewMode === 'grid' ? (
        sortedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedList.map((ann) => (
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
        ) : (
          /* Empty State */
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No opportunities match your filters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, changing the department or year filter, or resetting all filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Reset All Filters
            </button>
          </div>
        )
      ) : (
        /* Calendar Month Grid View (November 2026) */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              November 2026 Campus Calendar
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Anchor: Sat, 31 Oct 2026
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* 30-Day Grid for Nov 2026 */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-11-${dayNum.toString().padStart(2, '0')}`;
              const dayAnnouncements = announcements.filter(a => a.event_date === dateStr || a.registration_deadline?.startsWith(dateStr));

              return (
                <div
                  key={dayNum}
                  className={`min-h-24 p-2.5 rounded-2xl border flex flex-col justify-between transition-colors ${
                    dayAnnouncements.length > 0
                      ? 'bg-[#F8F9FA] border-slate-200 hover:border-slate-400 cursor-pointer shadow-2xs'
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                  onClick={() => {
                    if (dayAnnouncements.length > 0) {
                      onSelectAnnouncement(dayAnnouncements[0]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{dayNum}</span>
                    {dayAnnouncements.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#181B20]" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayAnnouncements.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        className="text-[10px] p-1 rounded-lg bg-white border border-slate-200/80 text-slate-800 truncate font-medium text-left shadow-2xs"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayAnnouncements.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-semibold text-left">
                        +{dayAnnouncements.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
