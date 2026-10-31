import React from 'react';
import { X, CheckCircle, Shield, Award, User, Sparkles, Check, AlertCircle } from 'lucide-react';
import { StudentProfile } from '../types';
import { Permissions } from '../lib/permissions';
import { DEMO_PROFILES } from '../lib/seedData';

interface RoleMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: StudentProfile;
  onSelectProfile: (profile: StudentProfile) => void;
}

interface MatrixRow {
  feature: string;
  superAdmin: string;
  head: string;
  student: string;
  currentValue: (user: StudentProfile) => string;
}

const MATRIX_DATA: MatrixRow[] = [
  {
    feature: 'Dashboard',
    superAdmin: 'Full (Campus-wide metrics & queues)',
    head: 'Club-specific (Club metrics, notices & members)',
    student: 'Personal (Relevance match, personal pipeline)',
    currentValue: (u) => Permissions.getDashboardType(u) === 'full' ? 'Full' : Permissions.getDashboardType(u) === 'club_specific' ? 'Club-specific' : 'Personal',
  },
  {
    feature: 'View announcements',
    superAdmin: 'All (Draft, Pending, Published, Rejected)',
    head: 'All published + Own club drafts/pending',
    student: 'All published',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'All' : Permissions.isHead(u) ? 'All published + Own club' : 'All published',
  },
  {
    feature: 'Create announcements',
    superAdmin: 'Yes (Instant publish college-wide)',
    head: 'Assigned club (Pre-tagged, submit for review)',
    student: 'No (Restricted)',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'Yes' : Permissions.isHead(u) ? `Assigned (${u.assigned_club_name || 'Own Club'})` : 'No',
  },
  {
    feature: 'Edit announcements',
    superAdmin: 'All authorized (Campus-wide)',
    head: 'Own club (Restricted to club scope)',
    student: 'No',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'All authorized' : Permissions.isHead(u) ? 'Own club only' : 'No',
  },
  {
    feature: 'Approve announcements',
    superAdmin: 'Yes (1-click queue)',
    head: 'No* (Can be granted explicitly)',
    student: 'No',
    currentValue: (u) => {
      if (Permissions.isSuperAdmin(u)) return 'Yes';
      if (u.explicit_permissions?.can_approve_announcements) return 'Yes (Explicit Overridden *)';
      return 'No';
    },
  },
  {
    feature: 'Manage clubs',
    superAdmin: 'Yes (Create, archive, assign heads)',
    head: 'Own club (Profile, schedule, leadership)',
    student: 'No',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'Yes (All clubs)' : Permissions.isHead(u) ? 'Own club' : 'No',
  },
  {
    feature: 'Manage students',
    superAdmin: 'Yes (Campus-wide directory)',
    head: 'Club members* (Roster, roles, applicants)',
    student: 'No',
    currentValue: (u) => {
      if (Permissions.isSuperAdmin(u)) return 'Yes (Campus-wide)';
      if (u.explicit_permissions?.can_manage_all_students) return 'All Students (Override *)';
      if (Permissions.isHead(u)) return 'Club members only';
      return 'No';
    },
  },
  {
    feature: 'Manage users/roles',
    superAdmin: 'Yes (Assign roles, grant * overrides)',
    head: 'No',
    student: 'No',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'Yes' : 'No',
  },
  {
    feature: 'AI extraction',
    superAdmin: 'Yes (Bulk notices, circulars, auto-publish)',
    head: 'Yes (Club events pre-tagged)',
    student: 'Optional (Personal notes/circulars)',
    currentValue: () => 'Yes / Enabled',
  },
  {
    feature: 'Calendar',
    superAdmin: 'College-wide (All clubs & departments)',
    head: 'Club-specific (Club events prioritized)',
    student: 'Personal (Tracked opportunities & deadlines)',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'College-wide' : Permissions.isHead(u) ? 'Club-specific' : 'Personal',
  },
  {
    feature: 'Weekly briefing',
    superAdmin: 'Yes (Institutional Executive Digest)',
    head: 'Yes (Club Leadership & Clashes Digest)',
    student: 'Yes (Personalized Career & Academic Digest)',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'Executive' : Permissions.isHead(u) ? 'Club Leadership' : 'Personalized',
  },
  {
    feature: 'Recommendations',
    superAdmin: 'Yes (Optimal slot & clash intelligence)',
    head: 'Yes (Cross-club co-hosting & attendance)',
    student: 'Yes (Personal skill & career match)',
    currentValue: () => 'Yes',
  },
  {
    feature: 'Analytics',
    superAdmin: 'Institution-wide (Dept reach, club activity)',
    head: 'Club-specific (RSVP, views, member growth)',
    student: 'Personal (Applications, hours, match score)',
    currentValue: (u) => Permissions.isSuperAdmin(u) ? 'Institution-wide' : Permissions.isHead(u) ? 'Club-specific' : 'Personal',
  },
];

export const RoleMatrixModal: React.FC<RoleMatrixModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onSelectProfile,
}) => {
  if (!isOpen) return null;

  const currentRole = activeProfile.role || 'student';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 bg-[#F8F9FA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181B20] text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Role & Permission Matrix
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#1E3A8A]">
                  MiT Governance Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Persona: <strong className="text-slate-800">{activeProfile.name}</strong> ({activeProfile.role?.toUpperCase() || 'STUDENT'})
                {activeProfile.assigned_club_name && ` · ${activeProfile.assigned_club_name}`}
                {activeProfile.explicit_permissions?.can_approve_announcements && (
                  <span className="ml-1 text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded-md">
                    *Override Active
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona Switcher Strip */}
        <div className="px-6 py-3 bg-[#EEF2F6] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
            Switch Test Persona:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_PROFILES.map((p) => {
              const isSelected = p.id === activeProfile.id;
              const roleColor =
                p.role === 'super_admin'
                  ? 'border-indigo-300 text-indigo-900'
                  : p.role === 'head'
                  ? 'border-emerald-300 text-emerald-900'
                  : 'border-blue-300 text-blue-900';

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProfile(p)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#181B20] text-white border-[#181B20] shadow-2xs'
                      : `bg-white ${roleColor} hover:bg-slate-50`
                  }`}
                >
                  <span>{p.name.split(' ')[0]}</span>
                  <span className="opacity-75 text-[10px]">({p.role?.toUpperCase()})</span>
                  {p.explicit_permissions?.can_approve_announcements && (
                    <span className="text-amber-400 font-black">*</span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-44">Feature</th>
                  <th
                    className={`py-3 px-4 transition-colors ${
                      currentRole === 'super_admin' ? 'bg-indigo-100/70 text-indigo-950 font-extrabold' : ''
                    }`}
                  >
                    Super Admin
                  </th>
                  <th
                    className={`py-3 px-4 transition-colors ${
                      currentRole === 'head' ? 'bg-emerald-100/70 text-emerald-950 font-extrabold' : ''
                    }`}
                  >
                    Head (Club Lead)
                  </th>
                  <th
                    className={`py-3 px-4 transition-colors ${
                      currentRole === 'student' ? 'bg-blue-100/70 text-blue-950 font-extrabold' : ''
                    }`}
                  >
                    Student
                  </th>
                  <th className="py-3 px-4 bg-slate-200/60 text-slate-900 w-44">
                    Active Persona Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MATRIX_DATA.map((row, idx) => {
                  const activeVal = row.currentValue(activeProfile);
                  const isOverridden = activeVal.includes('*');

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFC]'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {row.feature}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          currentRole === 'super_admin' ? 'bg-indigo-50/60 font-semibold text-indigo-950' : 'text-slate-600'
                        }`}
                      >
                        {row.superAdmin}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          currentRole === 'head' ? 'bg-emerald-50/60 font-semibold text-emerald-950' : 'text-slate-600'
                        }`}
                      >
                        {row.head}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          currentRole === 'student' ? 'bg-blue-50/60 font-semibold text-blue-950' : 'text-slate-600'
                        }`}
                      >
                        {row.student}
                      </td>
                      <td className="py-3 px-4 bg-slate-100/50">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                            isOverridden
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : activeVal === 'No'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {activeVal !== 'No' && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
                          <span>{activeVal}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footnote on Explicit Overrides */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>*Explicit Permission Overrides:</strong> As designated in the matrix, Club Heads default to <em>No</em> for announcement approval and <em>Club members</em> for student management. However, administrators can explicitly grant permissions (e.g. Priya Patel has <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">can_approve_announcements = true</code>).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-[#F8F9FA] flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Click any test persona above to immediately switch and observe real-time UI gating.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Matrix Guide
          </button>
        </div>
      </div>
    </div>
  );
};
