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
  ChevronLeft,
  Home,
  Megaphone,
  HelpCircle,
  Info,
  Users,
  Briefcase,
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
    { id: 'home', label: 'Dashboard', icon: Home, count: null },
    { id: 'explore', label: 'Explore', icon: Compass, count: null },
    { id: 'add', label: 'Smart Add', icon: Megaphone, isHighlight: false, count: null },
    { id: 'calendar', label: 'Calendar', icon: Calendar, count: null },
    { id: 'briefing', label: 'Weekly Briefing', icon: Briefcase, count: null },
    { id: 'interests', label: 'My Interest', icon: Info, count: null },
    { id: 'opportunities', label: 'My Opportunities', icon: BookmarkCheck, count: savedCount > 0 ? savedCount : null },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, isHighlight: false, count: null },
    { id: 'settings', label: 'Help & Settings', icon: HelpCircle, count: null },
  ];

  return (
    <aside className="w-68 h-full min-h-[920px] bg-[#FBFBFC] border-r border-slate-100 flex flex-col justify-between p-6 select-none shrink-0">
      {/* Brand & Wordmark — MiT Branding */}
      <div>
        <div className="flex items-center justify-between pb-8 pt-1 px-1">
          <div className="flex items-center space-x-2.5">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">MiT</span>
            <div className="text-[9px] uppercase leading-tight font-semibold tracking-wider text-slate-500 border-l border-slate-300 pl-2">
              <div>MORADABAD</div>
              <div>INSTITUTE OF</div>
              <div>TECHNOLOGY</div>
            </div>
          </div>
          {/* Collapse Button */}
          <button
            aria-label="Collapse Menu"
            className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"
            type="button"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#181B20] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} strokeWidth={1.8} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-mono tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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

      {/* Bottom: Study Coaching Promo Card */}
      <div className="space-y-4">
        <div className="bg-[#EBF0FC] rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between border border-blue-100/60">
          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-1.5">Study Coaching</h4>
            <p className="text-[11px] leading-relaxed text-[#4A5D8A] font-medium pr-2">
              Do you need help with your studies? We are here for you!
            </p>
          </div>
          {/* Illustration + Action Button */}
          <div className="mt-4 flex items-end justify-between">
            <div className="w-20 h-14 relative flex items-center justify-start opacity-90">
              <svg className="w-full h-full" fill="none" viewBox="0 0 80 60">
                <rect fill="#C5D9F8" height="34" rx="4" width="46" x="6" y="8" />
                <line stroke="#4A7BD5" strokeLinecap="round" strokeWidth="2" x1="12" x2="30" y1="16" y2="16" />
                <line stroke="#4A7BD5" strokeLinecap="round" strokeWidth="2" x1="12" x2="24" y1="22" y2="22" />
                <circle cx="38" cy="24" fill="#3B82F6" r="5" />
                <line stroke="#8EAEDB" strokeWidth="2" x1="20" x2="16" y1="42" y2="54" />
                <line stroke="#8EAEDB" strokeWidth="2" x1="38" x2="42" y1="42" y2="54" />
                <circle cx="58" cy="22" fill="#1E293B" r="4.5" />
                <path d="M52 46V33C52 30 64 30 64 33V46" fill="#1E293B" />
                <line stroke="#1E293B" strokeWidth="2" x1="55" x2="55" y1="46" y2="55" />
                <line stroke="#1E293B" strokeWidth="2" x1="61" x2="61" y1="46" y2="55" />
              </svg>
            </div>
            <button
              aria-label="Contact study coaching"
              className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="relative">
          {profileDropdownOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xl z-30"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Demo Profiles
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
                      isSelected ? 'bg-[#EBF1FD] text-[#1E3A8A] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.department} ({p.academic_year})</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#1E3A8A] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#EBF1FD] border border-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs shrink-0">
                {activeProfile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                  {activeProfile.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {activeProfile.department}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
};
