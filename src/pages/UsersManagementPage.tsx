import React, { useState } from 'react';
import {
  UserCog,
  Shield,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  User,
  Building2,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { StudentProfile, UserRole } from '../types';
import { StorageService } from '../lib/storage';
import { Permissions } from '../lib/permissions';
import { DEMO_PROFILES } from '../lib/seedData';

interface UsersManagementPageProps {
  profile: StudentProfile;
  onUpdateActiveProfile: (p: StudentProfile) => void;
  onSwitchPersona?: () => void;
}

export const UsersManagementPage: React.FC<UsersManagementPageProps> = ({
  profile,
  onUpdateActiveProfile,
  onSwitchPersona,
}) => {
  const [users, setUsers] = useState<StudentProfile[]>(() => StorageService.getUsers());
  const [clubs] = useState(() => StorageService.getClubs());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManageRoles = Permissions.canManageRoles(profile);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // If not super admin, restrict access per matrix
  if (!canManageRoles) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          User & Role Governance Restricted
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          According to the <strong>Role and Permission Matrix</strong>, User & Role Administration (<em>Manage users/roles: Super Admin: Yes, Head: No, Student: No</em>) is strictly confined to <strong>Super Admins</strong>.
        </p>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-xs mx-auto text-xs space-y-1">
          <div className="text-slate-500">Active Persona: <strong className="text-slate-900">{profile.name}</strong></div>
          <div className="text-slate-500">Role: <strong className="uppercase text-amber-800">{profile.role || 'STUDENT'}</strong></div>
        </div>

        {onSwitchPersona && (
          <button
            type="button"
            onClick={onSwitchPersona}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Switch to Dr. Rajesh Sharma (Super Admin)
          </button>
        )}
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    let assignedClubId = target.assigned_club_id;
    let assignedClubName = target.assigned_club_name;
    if (newRole === 'head' && !assignedClubId) {
      assignedClubId = 'club-gdsc';
      assignedClubName = 'Google Developer Student Club (GDSC)';
    }

    const updatedUser: StudentProfile = {
      ...target,
      role: newRole,
      assigned_club_id: assignedClubId,
      assigned_club_name: assignedClubName,
    };

    const nextUsers = StorageService.updateUser(updatedUser);
    setUsers(nextUsers);
    if (userId === profile.id) {
      onUpdateActiveProfile(updatedUser);
    }
    showToast(`Updated ${target.name}'s role to ${newRole.toUpperCase()}`);
  };

  const handleClubChange = (userId: string, newClubId: string) => {
    const target = users.find((u) => u.id === userId);
    const selectedClub = clubs.find((c) => c.id === newClubId);
    if (!target || !selectedClub) return;

    const updatedUser: StudentProfile = {
      ...target,
      assigned_club_id: selectedClub.id,
      assigned_club_name: selectedClub.name,
    };

    const nextUsers = StorageService.updateUser(updatedUser);
    setUsers(nextUsers);
    if (userId === profile.id) {
      onUpdateActiveProfile(updatedUser);
    }
    showToast(`Assigned ${target.name} as Head of ${selectedClub.name}`);
  };

  const handleToggleOverride = (
    userId: string,
    permissionKey: 'can_approve_announcements' | 'can_manage_all_students' | 'can_bypass_approval'
  ) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const currentOverrides = target.explicit_permissions || {};
    const updatedUser: StudentProfile = {
      ...target,
      explicit_permissions: {
        ...currentOverrides,
        [permissionKey]: !currentOverrides[permissionKey],
      },
    };

    const nextUsers = StorageService.updateUser(updatedUser);
    setUsers(nextUsers);
    if (userId === profile.id) {
      onUpdateActiveProfile(updatedUser);
    }
    showToast(`Toggled ${permissionKey.replace(/_/g, ' ')} for ${target.name}`);
  };

  const handleResetToSeeds = () => {
    if (window.confirm('Reset all users and permissions to initial factory demo seed?')) {
      StorageService.saveUsers(DEMO_PROFILES);
      setUsers(DEMO_PROFILES);
      onUpdateActiveProfile(DEMO_PROFILES[0]);
      showToast('Users restored to demo seed data.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Institutional User & Role Governance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">
              Super Admin Authority
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign user roles, bind Club Heads to societies, and grant <strong>Explicit Permission Overrides (<code className="font-mono bg-slate-100 px-1 py-0.2 rounded">*</code>)</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToSeeds}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Default Personas</span>
        </button>
      </div>

      {/* Overview Card on Explicit Permissions (*) */}
      <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900">How the Explicit Permission Matrix (*) Works:</h4>
          <p className="leading-relaxed opacity-90">
            By default in the matrix, Club Heads have <em>Approve announcements: No</em> and <em>Manage students: Club members</em>. As a Super Admin, you can check the explicit override boxes below to grant a Club Head elevated powers (like self-approving notices or managing all students across campus).
          </p>
        </div>
      </div>

      {/* Users Governance Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-5">User Persona</th>
                <th className="py-3.5 px-4">Role Selection</th>
                <th className="py-3.5 px-4">Assigned Club (For Heads)</th>
                <th className="py-3.5 px-5">Explicit Overrides (*)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const uRole = u.role || 'student';
                const isCurrentActive = u.id === profile.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#181B20] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                            {isCurrentActive && (
                              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.title || u.department}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={uRole}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`p-1.5 rounded-xl border font-bold text-xs cursor-pointer ${
                          uRole === 'super_admin'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                            : uRole === 'head'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-blue-50 border-blue-300 text-blue-950'
                        }`}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="head">Club Head</option>
                        <option value="student">Student</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      {uRole === 'head' ? (
                        <select
                          value={u.assigned_club_id || 'club-gdsc'}
                          onChange={(e) => handleClubChange(u.id, e.target.value)}
                          className="p-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 cursor-pointer font-medium max-w-xs"
                        >
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">N/A (Institution Scope)</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {uRole === 'head' ? (
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(u.explicit_permissions?.can_approve_announcements)}
                              onChange={() => handleToggleOverride(u.id, 'can_approve_announcements')}
                              className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              *Approve announcements (Direct publish)
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(u.explicit_permissions?.can_manage_all_students)}
                              onChange={() => handleToggleOverride(u.id, 'can_manage_all_students')}
                              className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              *Manage all campus students
                            </span>
                          </label>
                        </div>
                      ) : uRole === 'super_admin' ? (
                        <span className="text-indigo-700 font-bold text-xs flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Full Autonomous Permissions</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard Student Rights</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
