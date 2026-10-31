import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Filter,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { calculateAnnouncementStatus, formatDate, getDateTile, parseDateSafe } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface CalendarPageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

type CalendarFilterOption =
  | 'All Events'
  | 'Academic'
  | 'Technical'
  | 'Cultural'
  | 'Sports'
  | 'Competitions'
  | 'Workshops'
  | 'Internships'
  | 'Deadlines';

const CALENDAR_FILTERS: CalendarFilterOption[] = [
  'All Events',
  'Academic',
  'Technical',
  'Cultural',
  'Sports',
  'Competitions',
  'Workshops',
  'Internships',
  'Deadlines',
];

export const CalendarPage: React.FC<CalendarPageProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedFilter, setSelectedFilter] = useState<CalendarFilterOption>('All Events');
  
  // Date anchor: default to Nov 2026 (Anchor around Sat 31 Oct 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 10 is November (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-01');

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (selectedFilter === 'All Events') return true;
      if (selectedFilter === 'Deadlines') return Boolean(a.registration_deadline);
      if (selectedFilter === 'Academic') return a.category === 'Academic' || a.category === 'Academics' || a.category === 'Examination' || a.category === 'Assignment';
      if (selectedFilter === 'Technical') return a.category === 'Technology' || a.category === 'Artificial Intelligence' || a.category === 'Machine Learning' || a.category === 'Web Development';
      if (selectedFilter === 'Cultural') return a.category === 'Cultural Event' || a.category === 'Cultural Activities';
      if (selectedFilter === 'Sports') return a.category === 'Sports';
      if (selectedFilter === 'Competitions') return a.category === 'Hackathon' || a.category === 'Hackathons' || a.category === 'Competition';
      if (selectedFilter === 'Workshops') return a.category === 'Workshop' || a.category === 'Workshops' || a.category === 'Seminar';
      if (selectedFilter === 'Internships') return a.category === 'Internship' || a.category === 'Internships' || a.category === 'Placement' || a.category === 'Placements';
      return true;
    });
  }, [announcements, selectedFilter]);

  // Month metadata
  const monthDate = new Date(currentYear, currentMonth, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayWeekday = monthDate.getDay(); // 0 is Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setSelectedDateStr('2026-11-01');
  };

  // Color helper for category pill
  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('hackathon') || c.includes('competition')) return 'bg-[#FDF3EB] text-[#C96B35] border-[#F8DCBA]';
    if (c.includes('intern') || c.includes('placement')) return 'bg-[#EAF5EF] text-[#2D6A4F] border-[#CDE8D8]';
    if (c.includes('exam') || c.includes('academic')) return 'bg-[#FEF9EE] text-[#8A5A1C] border-[#FBEAC4]';
    if (c.includes('sport')) return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    if (c.includes('cultural')) return 'bg-[#FDF4FF] text-[#86198F] border-[#F0ABFC]';
    return 'bg-[#E8F0FC] text-[#1F5FBF] border-[#CFE0FB]';
  };

  // Week calculation (first 7 days of November or around selectedDate)
  const weekStart = new Date(selectedDateStr);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() - weekStart.getDay() + i);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });

  const selectedDayItems = filteredAnnouncements.filter(
    (a) => a.event_date === selectedDateStr || a.registration_deadline?.startsWith(selectedDateStr)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#292A28] tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#C96B35]" />
            <span>Campus Schedule & Master Calendar</span>
          </h2>
          <p className="text-xs text-[#787774]">
            Unified view of academic exams, club workshops, hackathons, and registration cutoffs.
          </p>
        </div>

        {/* View Mode & Month Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Switcher */}
          <div className="flex items-center bg-white border border-[#E0DBD0] p-1 rounded-xl shadow-2xs">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-[#292A28] text-white'
                    : 'text-[#787774] hover:text-[#292A28]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Month Stepper */}
          <div className="flex items-center bg-white border border-[#E0DBD0] rounded-xl px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#787774] hover:text-[#292A28] hover:bg-[#FAF8F3]"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#292A28] px-2 whitespace-nowrap">
              {monthName}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#787774] hover:text-[#292A28] hover:bg-[#FAF8F3]"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToday}
            className="px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#E0DBD0] hover:bg-[#EFECE6] text-xs font-bold text-[#292A28] transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-white border border-[#E0DBD0] p-2 rounded-2xl overflow-x-auto shadow-2xs">
        {CALENDAR_FILTERS.map((filt) => (
          <button
            key={filt}
            type="button"
            onClick={() => setSelectedFilter(filt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === filt
                ? 'bg-[#C96B35] text-white shadow-2xs'
                : 'text-[#787774] hover:text-[#292A28] hover:bg-[#FAF8F3]'
            }`}
          >
            {filt}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-[#787774] px-1 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1F5FBF]" />
          <span>Scheduled Event</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B42318]" />
          <span>Registration Cutoff / Deadline</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
          <span>Opportunity & Career Drive</span>
        </span>
      </div>

      {/* MAIN VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-5 shadow-xs space-y-3">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#8C8880] pb-2 border-b border-[#F2EFE9]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty Offset cells */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-26 p-2 rounded-2xl bg-[#FAF8F3]/50 border border-transparent" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              
              const dayEvents = filteredAnnouncements.filter((a) => a.event_date === dateStr);
              const dayDeadlines = filteredAnnouncements.filter((a) => a.registration_deadline?.startsWith(dateStr));
              const allDayItems = [...dayEvents, ...dayDeadlines];
              const isSelected = selectedDateStr === dateStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    if (allDayItems.length > 0) {
                      onSelectAnnouncement(allDayItems[0]);
                    }
                  }}
                  className={`min-h-26 p-2 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C96B35] bg-[#FDF3EB]/40 ring-1 ring-[#C96B35]'
                      : allDayItems.length > 0
                      ? 'bg-white border-[#E0DBD0] hover:border-[#C96B35]/60 hover:shadow-2xs'
                      : 'bg-[#FAF8F3] border-[#F2EFE9] text-[#9B9890]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#C96B35]' : 'text-[#292A28]'}`}>
                      {dayNum}
                    </span>
                    <div className="flex items-center gap-1">
                      {dayDeadlines.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#B42318]" title="Deadline on this day" />
                      )}
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#1F5FBF]" title="Event on this day" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayDeadlines.slice(0, 1).map((item) => (
                      <div
                        key={`dl-${item.id}`}
                        className="text-[10px] p-1 rounded-lg bg-[#FDECEA] border border-[#F9D2CE] text-[#B42318] truncate font-bold"
                        title={`Deadline: ${item.title}`}
                      >
                        ⏰ {item.title}
                      </div>
                    ))}
                    {dayEvents.slice(0, dayDeadlines.length > 0 ? 1 : 2).map((item) => (
                      <div
                        key={`ev-${item.id}`}
                        className={`text-[10px] p-1 rounded-lg border truncate font-medium ${getCategoryColor(item.category)}`}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    {allDayItems.length > 2 && (
                      <div className="text-[9px] text-[#C96B35] font-bold">
                        +{allDayItems.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
            <span className="text-xs font-bold text-[#292A28]">
              Week of {weekDays[0].dateStr} to {weekDays[6].dateStr}
            </span>
            <span className="text-[11px] text-[#787774]">Click any card to inspect details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wd) => {
              const dayItems = filteredAnnouncements.filter(
                (a) => a.event_date === wd.dateStr || a.registration_deadline?.startsWith(wd.dateStr)
              );
              const isSelected = selectedDateStr === wd.dateStr;

              return (
                <div
                  key={wd.dateStr}
                  onClick={() => setSelectedDateStr(wd.dateStr)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[#C96B35] bg-[#FDF3EB]/30'
                      : 'border-[#EAE6DF] bg-[#FAF8F3]'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-[#E0DBD0]">
                    <span className="text-[10px] uppercase font-bold text-[#8C8880] block">
                      {wd.dayName}
                    </span>
                    <span className="text-base font-extrabold text-[#292A28] font-mono">
                      {wd.dayNum}
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {dayItems.length > 0 ? (
                      dayItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnnouncement(item);
                          }}
                          className="p-2 bg-white rounded-xl border border-[#E0DBD0] hover:border-[#C96B35] cursor-pointer shadow-2xs space-y-1"
                        >
                          <span className="text-[9px] font-bold text-[#C96B35] uppercase block truncate">
                            {item.category}
                          </span>
                          <h6 className="text-[11px] font-bold text-[#292A28] leading-tight line-clamp-2">
                            {item.title}
                          </h6>
                          {item.event_time && (
                            <span className="text-[10px] text-[#787774] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {item.event_time}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[10px] text-[#9B9890]">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
            <div>
              <h3 className="text-base font-bold text-[#292A28]">
                Daily Schedule: {formatDate(selectedDateStr, true)}
              </h3>
              <p className="text-xs text-[#787774]">
                {selectedDayItems.length} active announcements / cutoffs for this day
              </p>
            </div>

            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] font-mono focus:outline-none focus:border-[#C96B35]"
            />
          </div>

          {selectedDayItems.length > 0 ? (
            <div className="space-y-3">
              {selectedDayItems.map((item) => {
                const isDeadline = item.registration_deadline?.startsWith(selectedDateStr);
                const isEvent = item.event_date === selectedDateStr;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAnnouncement(item)}
                    className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#EAE6DF] hover:border-[#C96B35] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDeadline ? 'bg-[#FDECEA] text-[#B42318]' : 'bg-[#E8F0FC] text-[#1F5FBF]'}`}>
                          {isDeadline ? 'Registration Deadline' : 'Scheduled Event'}
                        </span>
                        <span className="text-xs font-semibold text-[#787774]">{item.category}</span>
                        <span className="text-[#C4C0B6]">·</span>
                        <span className="text-xs text-[#787774]">{item.organizer}</span>
                      </div>

                      <h4 className="text-sm font-bold text-[#292A28]">{item.title}</h4>
                      <p className="text-xs text-[#555] line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      {item.event_time && (
                        <div className="text-right">
                          <span className="text-[10px] text-[#8C8880] block">Time</span>
                          <span className="font-bold text-[#292A28] font-mono">{item.event_time}</span>
                        </div>
                      )}
                      {item.venue && (
                        <div className="text-right">
                          <span className="text-[10px] text-[#8C8880] block">Location</span>
                          <span className="font-bold text-[#292A28]">{item.venue}</span>
                        </div>
                      )}
                      <span className="p-2 rounded-xl bg-white text-[#C96B35] border border-[#E0DBD0]">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#9B9890] mx-auto" />
              <p className="text-xs font-bold text-[#292A28]">No campus activities scheduled on this date.</p>
              <p className="text-[11px] text-[#787774]">Select another date or switch to the Month view.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
