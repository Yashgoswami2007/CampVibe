import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  LayoutGrid,
  Sparkles,
  Clock,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { AnnouncementCategory, CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { NoticeCard } from '../components/NoticeCard';
import { calculateAnnouncementStatus, formatDate, getDateTile } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface ExplorePageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
  initialSearch?: string;
}

const CATEGORIES: AnnouncementCategory[] = [
  'Technology',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Hackathons',
  'Internships',
  'Placements',
  'Entrepreneurship',
  'Cultural Activities',
  'Sports',
  'Research',
  'Workshops',
  'Academics',
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevant' | 'deadline' | 'date' | 'newest'>('relevant');
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
  }, [announcements, search, selectedCategory, selectedUrgency, selectedDept, selectedYear]);

  // Sorted list
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (sortBy === 'relevant') {
        const scoreA = calculateRelevance(a, profile).score;
        const scoreB = calculateRelevance(b, profile).score;
        return scoreB - scoreA;
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
    (selectedUrgency !== 'All' ? 1 : 0) +
    (selectedDept !== 'All' ? 1 : 0) +
    (selectedYear !== 'All' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedUrgency('All');
    setSelectedDept('All');
    setSelectedYear('All');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#292A28] tracking-tight">
            Explore Campus Opportunities
          </h2>
          <p className="text-xs text-[#787774]">
            Search, filter, and discover all verified announcements across clubs, departments, and placement drives.
          </p>
        </div>

        {/* View Mode & Sort */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View switcher */}
          <div className="flex items-center bg-white border border-[#E0DBD0] p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#292A28] text-white' : 'text-[#787774] hover:text-[#292A28]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar' ? 'bg-[#292A28] text-white' : 'text-[#787774] hover:text-[#292A28]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center bg-white border border-[#E0DBD0] rounded-xl px-2.5 py-1.5 shadow-2xs text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C8880] mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#292A28] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="relevant">Most Relevant</option>
              <option value="deadline">Deadline Approaching</option>
              <option value="date">Event Date</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="bg-white border border-[#E0DBD0] rounded-2xl p-4 shadow-2xs space-y-3.5">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C8880] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords, topics, organizers, rooms, eligibility..."
            className="w-full bg-[#FAF8F3] border border-[#EAE6DF] rounded-xl pl-9.5 pr-4 py-2 text-xs text-[#292A28] placeholder-[#9B9890] focus:outline-none focus:border-[#C96B35]"
          />
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E0DBD0] bg-white text-[#292A28] font-medium focus:outline-none focus:border-[#C96B35]"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Urgency Dropdown */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E0DBD0] bg-white text-[#292A28] font-medium focus:outline-none focus:border-[#C96B35]"
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
            className="px-3 py-1.5 rounded-xl border border-[#E0DBD0] bg-white text-[#292A28] font-medium focus:outline-none focus:border-[#C96B35]"
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
            className="px-3 py-1.5 rounded-xl border border-[#E0DBD0] bg-white text-[#292A28] font-medium focus:outline-none focus:border-[#C96B35]"
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
              className="text-xs font-bold text-[#C96B35] hover:text-[#B85E2B] px-2 py-1.5 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Count Status Bar */}
      <div className="flex items-center justify-between text-xs text-[#787774] px-1">
        <span>Showing <strong className="text-[#292A28] font-mono">{sortedList.length}</strong> opportunities</span>
        {sortBy === 'relevant' && (
          <span className="flex items-center gap-1 text-[#C96B35]">
            <Sparkles className="w-3.5 h-3.5" />
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
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E0DBD0] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F3] border border-[#EAE6DF] text-[#787774] flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#292A28]">
              No opportunities match your filters
            </h3>
            <p className="text-xs text-[#787774] max-w-sm mx-auto">
              Try adjusting your search terms, changing the department or year filter, or resetting all filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )
      ) : (
        /* Calendar Month Grid View (November 2026) */
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
            <h3 className="text-base font-bold text-[#292A28]">
              November 2026 Campus Calendar
            </h3>
            <span className="text-xs text-[#787774]">
              Anchor: Sat, 31 Oct 2026
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#8C8880] pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* 30-Day Grid for Nov 2026 (Nov 1 is Sunday) */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-11-${dayNum.toString().padStart(2, '0')}`;
              const dayAnnouncements = announcements.filter(a => a.event_date === dateStr || a.registration_deadline?.startsWith(dateStr));

              return (
                <div
                  key={dayNum}
                  className={`min-h-24 p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                    dayAnnouncements.length > 0
                      ? 'bg-[#FAF8F3] border-[#E8E5DF] hover:border-[#C96B35]/50 cursor-pointer'
                      : 'bg-white border-[#F2EFE9] text-[#9B9890]'
                  }`}
                  onClick={() => {
                    if (dayAnnouncements.length > 0) {
                      onSelectAnnouncement(dayAnnouncements[0]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#292A28]">{dayNum}</span>
                    {dayAnnouncements.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#C96B35]" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayAnnouncements.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        className="text-[10px] p-1 rounded-md bg-white border border-[#E0DBD0] text-[#292A28] truncate font-medium text-left"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayAnnouncements.length > 2 && (
                      <div className="text-[9px] text-[#C96B35] font-semibold text-left">
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
