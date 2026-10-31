import React, { useState } from 'react';
import { Search, Bell, Plus, Menu, X, Sparkles, AlertCircle } from 'lucide-react';
import { CampusAnnouncement, StudentProfile } from '../types';
import { calculateAnnouncementStatus } from '../lib/dates';

interface TopNavProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAdd: () => void;
  onMobileMenuToggle: () => void;
  announcements: CampusAnnouncement[];
  profile: StudentProfile;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onOpenAdd,
  onMobileMenuToggle,
  announcements,
  profile,
  onSelectAnnouncement,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Filter urgent announcements closing within 48 hours
  const urgentItems = announcements.filter(a => {
    const s = calculateAnnouncementStatus(a);
    return s.urgency === 'urgent';
  });

  return (
    <header className="h-17 px-6 bg-[#FAF8F3]/80 backdrop-blur-md border-b border-[#EAE6DF] sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-[#787774] hover:bg-[#EFECE6] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-[#292A28] tracking-tight whitespace-nowrap">
          {title}
        </h1>
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="max-w-md w-full mx-auto relative hidden sm:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8C8880] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, organizers, hackathons, seminars..."
            className="w-full bg-white border border-[#E0DBD0] rounded-full pl-9.5 pr-12 py-2 text-xs text-[#292A28] placeholder-[#9B9890] focus:outline-none focus:border-[#C96B35] transition-colors shadow-2xs"
          />
          <kbd className="absolute right-3.5 text-[10px] text-[#8C8880] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#E0DBD0] font-mono pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Zone 3: Notification Bell & Quick Add CTA */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            className="p-2 rounded-xl bg-white border border-[#E0DBD0] text-[#5C5A56] hover:text-[#292A28] hover:border-[#C96B35]/40 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {urgentItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B42318] text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {urgentItems.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E0DBD0] shadow-xl p-3 z-40 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9] mb-2 px-1">
                <span className="text-xs font-bold text-[#292A28]">Deadlines Requiring Action</span>
                <span className="text-[10px] font-semibold text-[#B42318]">{urgentItems.length} Urgent</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {urgentItems.length > 0 ? (
                  urgentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectAnnouncement(item);
                        setNotificationsOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#FDF3EB] cursor-pointer transition-colors border border-[#EFECE6]"
                    >
                      <div className="text-xs font-bold text-[#292A28] truncate">{item.title}</div>
                      <div className="text-[11px] text-[#B42318] font-medium mt-0.5">
                        {item.urgency_reason || 'Deadline closing within 24 hours'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#787774]">
                    No urgent deadlines closing in the next 24 hours.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: Add Notice */}
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Notice</span>
        </button>
      </div>
    </header>
  );
};
