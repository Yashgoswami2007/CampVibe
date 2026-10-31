import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  UserPlus,
  Mail,
  GraduationCap,
  Building2,
  Shield,
  Filter,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import { ClubMember, StudentProfile } from '../types';
import { StorageService } from '../lib/storage';
import { Permissions } from '../lib/permissions';

interface StudentsManagementPageProps {
  profile: StudentProfile;
  onSwitchPersona?: () => void;
}

export const StudentsManagementPage: React.FC<StudentsManagementPageProps> = ({
  profile,
  onSwitchPersona,
}) => {
  const [members, setMembers] = useState<ClubMember[]>(() => StorageService.getClubMembers());
  const [users, setUsers] = useState<StudentProfile[]>(() => StorageService.getUsers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { canManageAll, canManageClubMembers } = Permissions.canManageStudents(profile);
  const isHead = Permissions.isHead(profile);
  const isSuperAdmin = Permissions.isSuperAdmin(profile);
  const hasExtendedAccess = Boolean(profile.explicit_permissions?.can_manage_all_students);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // If student tries to access, show permission denied banner
  if (!canManageClubMembers && !canManageAll) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Student Roster Management Restricted
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          According to the <strong>Role and Permission Matrix</strong>, Student accounts cannot manage student rosters (<em>Manage Students: No</em>). Roster access is granted to <strong>Club Heads</strong> (for club members) and <strong>Super Admins</strong> (institution-wide).
        </p>
        {onSwitchPersona && (
          <button
            type="button"
            onClick={onSwitchPersona}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Switch to Aarav Sen (Club Head) or Dr. Rajesh Sharma (Admin)
          </button>
        )}
      </div>
    );
  }

  // Filter roster by scope:
  // If Super Admin or Head with extended permission: can view all
  // If standard Head: view only their assigned club's members
  const clubScopeId = profile.assigned_club_id || 'club-gdsc';
  const displayedMembers = members.filter((m) => {
    const inScope = canManageAll || m.club_id === clubScopeId;
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      m.student_name.toLowerCase().includes(search.toLowerCase()) ||
      m.student_email.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase()) ||
      m.club_role.toLowerCase().includes(search.toLowerCase());
    return inScope && matchStatus && matchSearch;
  });

  const handleUpdateRole = (memberId: string, newRole: ClubMember['club_role']) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const updated = StorageService.updateClubMember({
      ...target,
      club_role: newRole,
      status: 'active',
    });
    setMembers(updated);
    showToast(`Updated ${target.student_name}'s role to ${newRole}`);
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (window.confirm(`Remove ${name} from club roster?`)) {
      const updated = StorageService.deleteClubMember(memberId);
      setMembers(updated);
      showToast(`Removed ${name} from roster.`);
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const newMember: ClubMember = {
      id: `cm-${Date.now()}`,
      club_id: isHead ? clubScopeId : (data.get('club_id') as string || 'club-gdsc'),
      student_id: `stu-${Date.now()}`,
      student_name: data.get('student_name') as string,
      student_email: data.get('student_email') as string,
      department: data.get('department') as string,
      academic_year: data.get('academic_year') as string,
      club_role: data.get('club_role') as any,
      joined_at: new Date().toISOString(),
      status: 'active',
    };

    const updated = StorageService.addClubMember(newMember);
    setMembers(updated);
    setIsAddingMember(false);
    showToast(`Added ${newMember.student_name} to roster!`);
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
              {canManageAll ? 'Institutional Student Directory & Roster' : `${profile.assigned_club_name || 'Club'} Member Roster`}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              canManageAll
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {canManageAll ? (hasExtendedAccess ? 'Head Extended Override (*)' : 'Super Admin Scope') : 'Club Members Scope'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canManageAll
              ? 'Institutional student enrollment overview across all engineering faculties.'
              : `Active members, core committee, and student applicants for ${profile.assigned_club_name || 'your assigned club'}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingMember(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Roster' },
            { id: 'active', label: 'Active Members' },
            { id: 'pending', label: 'Applicants' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#181B20] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students, departments, roles..."
            className="w-full bg-[#F4F5F8] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Members Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-4">Department & Year</th>
                <th className="py-3 px-4">Club Scope</th>
                <th className="py-3 px-4">Role / Designation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#181B20] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {member.student_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.student_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{member.student_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div>{member.department}</div>
                      <div className="text-[10px] text-slate-400">{member.academic_year}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-slate-700 uppercase font-semibold">
                        {member.club_id.replace('club-', '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={member.club_role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as any)}
                        className="p-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="Lead">Lead</option>
                        <option value="Vice Lead">Vice Lead</option>
                        <option value="Core Team">Core Team</option>
                        <option value="Member">Member</option>
                        <option value="Applicant">Applicant</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          member.status === 'active'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.student_name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Enroll Student to Club Roster
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  name="student_name"
                  required
                  placeholder="e.g. Rohit Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="student_email"
                  required
                  placeholder="e.g. rohit.k@mitmoradabad.edu.in"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <select name="department" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Academic Year
                  </label>
                  <select name="academic_year" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Club Designation / Role
                </label>
                <select name="club_role" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="Core Team">Core Team</option>
                  <option value="Member">Regular Member</option>
                  <option value="Vice Lead">Vice Lead</option>
                  <option value="Applicant">Applicant</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 shadow-sm"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
