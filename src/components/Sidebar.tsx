import React, { useState } from 'react';
import {
  Compass,
  BookmarkCheck,
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
  Shield,
  ShieldCheck,
  Building2,
  UserCog,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { DEMO_PROFILES } from '../lib/seedData';
import { Permissions } from '../lib/permissions';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeProfile: StudentProfile;
  onSelectProfile: (profile: StudentProfile) => void;
  savedCount: number;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeProfile,
  onSelectProfile,
  savedCount,
  pendingApprovalsCount = 0,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const role = Permissions.getRole(activeProfile);
  const canApprove = Permissions.canApproveAnnouncement(activeProfile);
  const canCreate = Permissions.canCreateAnnouncement(activeProfile);
  const canManageRoles = Permissions.canManageRoles(activeProfile);

  // Build role-tailored nav items
  const navItems: Array<{
    id: string;
    label: string;
    icon: any;
    count: number | null;
    badgeColor?: string;
  }> = [
    {
      id: 'home',
      label: role === 'super_admin' ? 'Campus Pulse' : role === 'head' ? `${activeProfile.assigned_club_name?.split(' ')[0] || 'Club'} Hub` : 'Dashboard',
      icon: Home,
      count: null,
    },
    { id: 'explore', label: 'Explore', icon: Compass, count: null },
  ];

  // Smart Add / Create Announcement (Super Admin & Head only)
  if (canCreate) {
    navItems.push({
      id: 'add',
      label: role === 'head' ? 'Post Club Notice' : 'Smart Add',
      icon: Megaphone,
      count: null,
    });
  }

  // Pending Approvals (Super Admin & Head with explicit *)
  if (canApprove) {
    navItems.push({
      id: 'approvals',
      label: 'Approvals Queue',
      icon: ShieldCheck,
      count: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    });
  }

  // Clubs management (Super Admin & Head)
  if (role === 'super_admin' || role === 'head') {
    navItems.push({
      id: 'clubs',
      label: role === 'super_admin' ? 'Manage Clubs' : 'Club Profile',
      icon: Building2,
      count: null,
    });
  }

  // Students management (Super Admin & Head)
  if (role === 'super_admin' || role === 'head') {
    navItems.push({
      id: 'students',
      label: role === 'super_admin' ? 'Student Directory' : 'Club Roster',
      icon: Users,
      count: null,
    });
  }

  // Manage Users & Roles (Super Admin only)
  if (canManageRoles) {
    navItems.push({
      id: 'users',
      label: 'Roles & Permissions',
      icon: UserCog,
      count: null,
    });
  }

  // Common modules
  navItems.push({
    id: 'calendar',
    label: role === 'super_admin' ? 'College Calendar' : role === 'head' ? 'Club Calendar' : 'My Calendar',
    icon: Calendar,
    count: null,
  });

  navItems.push({
    id: 'briefing',
    label: role === 'super_admin' ? 'Exec Briefing' : 'Weekly Briefing',
    icon: Briefcase,
    count: null,
  });

  // Student specific items
  if (role === 'student') {
    navItems.push({ id: 'interests', label: 'My Interest', icon: Info, count: null });
    navItems.push({
      id: 'opportunities',
      label: 'My Opportunities',
      icon: BookmarkCheck,
      count: savedCount > 0 ? savedCount : null,
    });
  }

  navItems.push({ id: 'assistant', label: 'AI Assistant', icon: Bot, count: null });
  navItems.push({ id: 'settings', label: 'Help & Settings', icon: HelpCircle, count: null });

  return (
    <aside className="w-68 h-full min-h-[920px] bg-[#FBFBFC] border-r border-slate-200/80 flex flex-col justify-between p-6 select-none shrink-0">
      {/* Brand & Wordmark — MiT Branding */}
      <div>
        <div className="flex items-center justify-between pb-6 pt-1 px-1">
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
            className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-xs"
            type="button"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#181B20] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} strokeWidth={1.8} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-mono tabular-nums shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-200 text-slate-700'
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

      {/* Bottom Area: Role Context & Persona Switcher */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        {/* Role Scope Mini Card */}
        <div className={`p-3 rounded-2xl border text-xs ${
          role === 'super_admin'
            ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950'
            : role === 'head'
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
            : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
        }`}>
          <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider mb-1">
            <span>Current Role Scope</span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white/70">
              {role.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] opacity-80 leading-snug">
            {role === 'super_admin'
              ? 'Campus-wide institutional management and approval authority.'
              : role === 'head'
              ? `Authorized head for ${activeProfile.assigned_club_name || 'Assigned Club'}.${activeProfile.explicit_permissions?.can_approve_announcements ? ' *Direct approval enabled.' : ''}`
              : 'Personalized student discovery and opportunity pipeline.'}
          </p>
        </div>

        {/* Profile Switcher */}
        <div className="relative">
          {profileDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-2xl z-30 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Persona to Test
              </div>
              {DEMO_PROFILES.map((p) => {
                const isSelected = p.id === activeProfile.id;
                const pRole = p.role || 'student';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProfile(p);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#181B20] text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-[9px] font-mono opacity-80 uppercase">
                          ({pRole.replace('_', ' ')})
                        </span>
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {p.title || `${p.department} (${p.academic_year})`}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="p-2.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer flex items-center justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#181B20] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {activeProfile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                  {activeProfile.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {activeProfile.title || activeProfile.department}
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
