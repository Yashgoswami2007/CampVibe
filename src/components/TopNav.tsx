import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  X,
  Sparkles,
  AlertCircle,
  History,
  Bot,
  ArrowRight,
  User,
  Shield,
  ChevronDown,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { CampusAnnouncement, CampusNotification, StudentProfile } from '../types';
import { StorageService } from '../lib/storage';
import { Permissions } from '../lib/permissions';
import { DEMO_PROFILES } from '../lib/seedData';

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
  onSelectProfile: (profile: StudentProfile) => void;
  onOpenRoleMatrix: () => void;
  pendingApprovalsCount?: number;
  onOpenPendingApprovals?: () => void;
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
  onSelectProfile,
  onOpenRoleMatrix,
  pendingApprovalsCount = 0,
  onOpenPendingApprovals,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => StorageService.getRecentSearches());
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const personaContainerRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const canApprove = Permissions.canApproveAnnouncement(profile);
  const role = Permissions.getRole(profile);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (personaContainerRef.current && !personaContainerRef.current.contains(e.target as Node)) {
        setPersonaDropdownOpen(false);
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

  // Role Badge Styling
  const getRoleBadge = () => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs border border-slate-700">
          <Shield className="w-3 h-3 text-emerald-400" />
          Super Admin
        </span>
      );
    }
    if (role === 'head') {
      const isOverridden = Boolean(profile.explicit_permissions?.can_approve_announcements);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300">
          <span>Head: {profile.assigned_club_name?.split(' ')[0] || 'Club'}</span>
          {isOverridden && (
            <span className="text-amber-700 font-bold bg-amber-100 px-1 py-0.2 rounded" title="Special Explicit Permission Override Active">
              *
            </span>
          )}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
        Student
      </span>
    );
  };

  return (
    <header className="h-18 px-4 sm:px-6 md:px-8 bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between gap-3">
      {/* Zone 1: Mobile Hamburger & Page Title + Role Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 whitespace-nowrap">
              Hi, {profile.name.split(' ')[0]}
            </h1>
            {getRoleBadge()}
          </div>
          {profile.title && (
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              {profile.title}
            </p>
          )}
        </div>
      </div>

      {/* Zone 2: Global Search Bar with Suggestions */}
      <div ref={searchContainerRef} className="max-w-md w-full mx-auto relative hidden lg:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, clubs, deadlines, approvals..."
            className="w-full bg-[#F4F5F8] border border-slate-200 rounded-full pl-9.5 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white shadow-xs"
          />
          <kbd className="absolute right-3.5 text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono pointer-events-none">
            /
          </kbd>
        </div>

        {/* Search Suggestions Dropdown */}
        {searchFocused && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-40 space-y-3">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-[10px] text-blue-500 hover:underline"
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
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#F4F5F8] hover:bg-[#EBF1FD] text-slate-600 hover:text-[#1E3A8A] border border-slate-200 transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="px-1 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Popular on Campus
              </div>
              <div className="space-y-1">
                {POPULAR_SUGGESTIONS.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuery(item)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-[#F4F5F8] flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>{item}</span>
                    <ArrowRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Persona Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Role Matrix Modal Button */}
        <button
          type="button"
          onClick={onOpenRoleMatrix}
          title="Open Role & Permission Matrix Guide"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Permission Matrix</span>
        </button>

        {/* Pending Approvals quick badge button (for Super Admin & Privileged Head) */}
        {canApprove && (
          <button
            type="button"
            onClick={onOpenPendingApprovals}
            title={`${pendingApprovalsCount} announcements pending approval`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              pendingApprovalsCount > 0
                ? 'bg-amber-50 border border-amber-300 text-amber-900 animate-pulse'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Approvals</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              pendingApprovalsCount > 0 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {pendingApprovalsCount}
            </span>
          </button>
        )}

        {/* AI Campus Assistant Trigger */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EBF1FD] border border-blue-100 text-[#1E3A8A] hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden md:inline">Ask AI</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notification Centre"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* 1-Click Persona Switcher Dropdown */}
        <div ref={personaContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Switch Test User Persona"
          >
            <div className="w-7 h-7 rounded-lg bg-[#181B20] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold leading-none text-slate-900">{profile.name.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 capitalize">{role.replace('_', ' ')}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {personaDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-76 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Test Persona
                </span>
                <span className="text-xs text-slate-500">
                  Select a persona to test the permission matrix live:
                </span>
              </div>

              <div className="p-1 space-y-1">
                {DEMO_PROFILES.map((p) => {
                  const isSelected = p.id === profile.id;
                  const pRole = p.role || 'student';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProfile(p);
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#181B20] text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{p.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : pRole === 'super_admin'
                                ? 'bg-indigo-100 text-indigo-900'
                                : pRole === 'head'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pRole.replace('_', ' ')}
                            {p.explicit_permissions?.can_approve_announcements && ' *'}
                          </span>
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {p.title || p.department}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPersonaDropdownOpen(false);
                    onOpenRoleMatrix();
                  }}
                  className="w-full py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>View Full Permission Matrix</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
