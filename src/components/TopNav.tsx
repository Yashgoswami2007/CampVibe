import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Menu, X, Sparkles, AlertCircle, History, Bot, ArrowRight } from 'lucide-react';
import { CampusAnnouncement, CampusNotification, StudentProfile } from '../types';
import { StorageService } from '../lib/storage';

interface TopNavProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAdd: () => void;
  onOpenNotifications: () => void;
  onOpenAssistant: () => void;
  onMobileMenuToggle: () => void;
  announcements: CampusAnnouncement[];
  profile: StudentProfile;
  notifications: CampusNotification[];
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
}

const POPULAR_SUGGESTIONS = [
  'National AI Hackathon',
  'Summer 2027 Internship',
  'PyTorch Workshop',
  'Placement Mock Interviews',
  'E-Cell Bootcamp',
  'DBMS Exam Block B',
  'Varsity Cricket Trials',
];

export const TopNav: React.FC<TopNavProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onOpenAdd,
  onOpenNotifications,
  onOpenAssistant,
  onMobileMenuToggle,
  announcements,
  profile,
  notifications,
  onSelectAnnouncement,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => StorageService.getRecentSearches());
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectQuery = (q: string) => {
    onSearchChange(q);
    const updated = StorageService.addRecentSearch(q);
    setRecentSearches(updated);
    setSearchFocused(false);
  };

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

      {/* Zone 2: Global Search Bar with Suggestions */}
      <div ref={searchContainerRef} className="max-w-md w-full mx-auto relative hidden sm:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8C8880] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, organizers, hackathons, seminars..."
            className="w-full bg-white border border-[#E0DBD0] rounded-full pl-9.5 pr-12 py-2 text-xs text-[#292A28] placeholder-[#9B9890] focus:outline-none focus:border-[#C96B35] transition-colors shadow-2xs"
          />
          <kbd className="absolute right-3.5 text-[10px] text-[#8C8880] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#E0DBD0] font-mono pointer-events-none">
            /
          </kbd>
        </div>

        {/* Search Suggestions & Recent Searches Dropdown */}
        {searchFocused && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#E0DBD0] shadow-xl p-3 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-3">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-[10px] text-[#C96B35] hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuery(term)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#FAF8F3] hover:bg-[#FDF3EB] text-[#4D4B47] hover:text-[#C96B35] border border-[#E8E5DF] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="px-1 mb-1.5 text-[10px] font-bold text-[#8C8880] uppercase tracking-wider">
                Popular on Campus
              </div>
              <div className="space-y-1">
                {POPULAR_SUGGESTIONS.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuery(item)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#292A28] hover:bg-[#FAF8F3] flex items-center justify-between group transition-colors"
                  >
                    <span>{item}</span>
                    <ArrowRight className="w-3 h-3 text-[#C96B35] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: AI Assistant, Notification Bell, Add Notice */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* AI Campus Assistant Trigger */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FDF3EB] border border-[#F8DCBA] text-[#C96B35] hover:bg-[#FBE8DA] transition-colors shadow-2xs"
        >
          <Bot className="w-4 h-4 animate-bounce" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notification Centre"
          className="p-2 rounded-xl bg-white border border-[#E0DBD0] text-[#5C5A56] hover:text-[#292A28] hover:border-[#C96B35]/40 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B42318] text-white text-[9px] font-bold flex items-center justify-center font-mono">
              {unreadNotifCount}
            </span>
          )}
        </button>

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
