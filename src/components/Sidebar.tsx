import React, { useState } from 'react';
import {
  Compass,
  BookmarkCheck,
  PlusCircle,
  Sparkles,
  Sliders,
  Settings,
  Radio,
  ChevronDown,
  User,
  GraduationCap,
  Calendar,
  Check,
  Bot,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { DEMO_PROFILES } from '../lib/seedData';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeProfile: StudentProfile;
  onSelectProfile: (profile: StudentProfile) => void;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeProfile,
  onSelectProfile,
  savedCount,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Radio, count: null },
    { id: 'explore', label: 'Explore', icon: Compass, count: null },
    { id: 'calendar', label: 'Calendar', icon: Calendar, count: null },
    { id: 'opportunities', label: 'My Opportunities', icon: BookmarkCheck, count: savedCount > 0 ? savedCount : null },
    { id: 'add', label: 'Add Announcement', icon: PlusCircle, isHighlight: true, count: null },
    { id: 'briefing', label: 'Weekly Briefing', icon: Sparkles, count: null },
    { id: 'interests', label: 'My Interests', icon: Sliders, count: null },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, isHighlight: false, count: null },
    { id: 'settings', label: 'Settings', icon: Settings, count: null },
  ];

  return (
    <aside className="w-68 h-screen bg-[#FAF8F3] border-r border-[#EAE6DF] flex flex-col justify-between p-5 select-none shrink-0 sticky top-0">
      {/* Brand & Wordmark */}
      <div>
        <div className="flex items-center gap-3 px-2 py-1 mb-7">
          <div className="w-10 h-10 rounded-2xl bg-[#C96B35] flex items-center justify-center text-white shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[#292A28] tracking-tight block leading-tight">
              Campus Radar
            </span>
            <span className="text-[11px] text-[#787774] font-medium block">
              Don't Miss What Matters
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#292A28] text-white shadow-xs'
                    : item.isHighlight
                    ? 'text-[#C96B35] bg-[#FDF3EB] hover:bg-[#FBE8DA]'
                    : 'text-[#5C5A56] hover:bg-[#EFECE6] hover:text-[#292A28]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : item.isHighlight ? 'text-[#C96B35]' : 'text-[#787774]'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-mono tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E8E5DF] text-[#292A28]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Demo Switcher Card */}
      <div className="relative pt-4 border-t border-[#EAE6DF]">
        {/* Profile Dropdown Menu */}
        {profileDropdownOpen && (
          <div
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl p-2.5 border border-[#E0DBD0] shadow-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#8C8880] uppercase tracking-wider">
              Judge Demo Profiles
            </div>
            {DEMO_PROFILES.map((p) => {
              const isSelected = p.id === activeProfile.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectProfile(p);
                    setProfileDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-[#FDF3EB] text-[#C96B35] font-semibold' : 'text-[#4D4B47] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-[10px] text-[#787774] truncate">{p.department} ({p.academic_year})</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#C96B35] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Profile Pill Trigger */}
        <div
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="p-3 bg-white rounded-2xl border border-[#E0DBD0] hover:border-[#C96B35]/40 transition-colors cursor-pointer flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3EB] border border-[#F8DCBA] text-[#C96B35] flex items-center justify-center font-bold text-xs shrink-0">
              {activeProfile.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#292A28] truncate block leading-tight">
                {activeProfile.name}
              </span>
              <span className="text-[11px] text-[#787774] truncate block">
                {activeProfile.department}
              </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#787774] shrink-0" />
        </div>
      </div>
    </aside>
  );
};
