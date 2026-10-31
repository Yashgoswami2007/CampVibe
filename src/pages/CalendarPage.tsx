import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { formatDate } from '../lib/dates';

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
  announcements,
  onSelectAnnouncement,
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
    if (c.includes('hackathon') || c.includes('competition')) return 'bg-[#FBF5E5] text-amber-800 border-amber-200/70';
    if (c.includes('intern') || c.includes('placement')) return 'bg-[#D4F5EC] text-emerald-800 border-emerald-200/70';
    if (c.includes('exam') || c.includes('academic')) return 'bg-[#F4F5F8] text-slate-800 border-slate-200';
    if (c.includes('sport')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c.includes('cultural')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-[#EBF1FD] text-blue-700 border-blue-200';
  };

  // Week calculation
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-800" />
            <span>Campus Schedule & Master Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified view of academic exams, club workshops, hackathons, and cutoffs at MiT Moradabad.
          </p>
        </div>

        {/* View Mode & Month Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Switcher */}
          <div className="flex items-center bg-[#F8F9FA] border border-slate-200/80 p-1 rounded-xl shadow-2xs">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-[#181B20] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Month Stepper */}
          <div className="flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2.5 whitespace-nowrap">
              {monthName}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToday}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 p-2 rounded-2xl overflow-x-auto shadow-2xs">
        {CALENDAR_FILTERS.map((filt) => (
          <button
            key={filt}
            type="button"
            onClick={() => setSelectedFilter(filt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === filt
                ? 'bg-[#181B20] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {filt}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 px-1 flex-wrap font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Scheduled Event</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Registration Cutoff / Deadline</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Opportunity & Career Drive</span>
        </span>
      </div>

      {/* MAIN VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100">
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
              <div key={`offset-${i}`} className="min-h-26 p-2 rounded-2xl bg-slate-50/40 border border-transparent" />
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
                      ? 'border-slate-800 bg-[#F4F5F8] ring-1 ring-slate-800'
                      : allDayItems.length > 0
                      ? 'bg-white border-slate-200/80 hover:border-slate-400 hover:shadow-2xs'
                      : 'bg-[#F8F9FA]/60 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {dayNum}
                    </span>
                    <div className="flex items-center gap-1">
                      {dayDeadlines.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Deadline on this day" />
                      )}
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Event on this day" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayDeadlines.slice(0, 1).map((item) => (
                      <div
                        key={`dl-${item.id}`}
                        className="text-[10px] p-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 truncate font-semibold"
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
                      <div className="text-[9px] text-slate-500 font-bold">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">
              Week of {weekDays[0].dateStr} to {weekDays[6].dateStr}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Click any card to inspect details</span>
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
                      ? 'border-slate-800 bg-[#F4F5F8]'
                      : 'border-slate-200/70 bg-[#F8F9FA]'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {wd.dayName}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
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
                          className="p-2 bg-white rounded-xl border border-slate-200/80 hover:border-slate-400 cursor-pointer shadow-2xs space-y-1"
                        >
                          <span className="text-[9px] font-bold text-slate-700 uppercase block truncate">
                            {item.category}
                          </span>
                          <h6 className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2">
                            {item.title}
                          </h6>
                          {item.event_time && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {item.event_time}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[10px] text-slate-400">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daily Schedule: {formatDate(selectedDateStr, true)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDayItems.length} active announcements / cutoffs for this day
              </p>
            </div>

            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800"
            />
          </div>

          {selectedDayItems.length > 0 ? (
            <div className="space-y-3">
              {selectedDayItems.map((item) => {
                const isDeadline = item.registration_deadline?.startsWith(selectedDateStr);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAnnouncement(item)}
                    className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/70 hover:border-slate-400 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDeadline ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-[#EBF1FD] text-blue-700 border border-blue-200'}`}>
                          {isDeadline ? 'Registration Deadline' : 'Scheduled Event'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{item.category}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{item.organizer}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      {item.event_time && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Time</span>
                          <span className="font-bold text-slate-900 font-mono">{item.event_time}</span>
                        </div>
                      )}
                      {item.venue && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Location</span>
                          <span className="font-bold text-slate-900">{item.venue}</span>
                        </div>
                      )}
                      <span className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No campus activities scheduled on this date.</p>
              <p className="text-[11px] text-slate-500">Select another date or switch to the Month view.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
