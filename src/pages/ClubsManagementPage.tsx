import React, { useState } from 'react';
import {
  Building2,
  Users,
  Calendar,
  Mail,
  Plus,
  Edit3,
  Search,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { ClubInfo, StudentProfile } from '../types';
import { StorageService } from '../lib/storage';
import { Permissions } from '../lib/permissions';

interface ClubsManagementPageProps {
  profile: StudentProfile;
  onNavigate: (view: string) => void;
}

export const ClubsManagementPage: React.FC<ClubsManagementPageProps> = ({
  profile,
  onNavigate,
}) => {
  const [clubs, setClubs] = useState<ClubInfo[]>(() => StorageService.getClubs());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingClub, setEditingClub] = useState<ClubInfo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const role = Permissions.getRole(profile);
  const { canManageAll, canManageOwn } = Permissions.canManageClubs(profile);
  const isSuperAdmin = Permissions.isSuperAdmin(profile);
  const isHead = Permissions.isHead(profile);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveClub = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const clubPayload: ClubInfo = {
      id: editingClub?.id || `club-${Date.now()}`,
      name: formData.get('name') as string,
      code: (formData.get('code') as string).toUpperCase(),
      category: formData.get('category') as any,
      description: formData.get('description') as string,
      lead_name: formData.get('lead_name') as string,
      lead_email: formData.get('lead_email') as string,
      member_count: editingClub ? editingClub.member_count : 0,
      meeting_schedule: formData.get('meeting_schedule') as string,
      created_at: editingClub?.created_at || new Date().toISOString(),
    };

    if (editingClub) {
      const updated = StorageService.updateClub(clubPayload);
      setClubs(updated);
      showToast(`Saved changes for ${clubPayload.name}`);
    } else {
      const updated = StorageService.addClub(clubPayload);
      setClubs(updated);
      showToast(`Created new student organization: ${clubPayload.name}`);
    }

    setEditingClub(null);
    setIsCreating(false);
  };

  const handleDeleteClub = (clubId: string, clubName: string) => {
    if (window.confirm(`Are you sure you want to archive or remove ${clubName}?`)) {
      const updated = StorageService.deleteClub(clubId);
      setClubs(updated);
      showToast(`Club ${clubName} removed.`);
    }
  };

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Academic', 'Social'];

  const filteredClubs = clubs.filter((c) => {
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.lead_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
              {isSuperAdmin ? 'Institutional Club Management' : isHead ? 'Club Profile & Leadership' : 'Campus Clubs Directory'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isSuperAdmin
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                : isHead
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-blue-100 text-blue-900'
            }`}>
              {isSuperAdmin ? 'Manage All' : isHead ? 'Manage Own Club' : 'Directory View'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isSuperAdmin
              ? 'Authorized to create clubs, configure society leadership, and monitor campus engagement.'
              : isHead
              ? `Manage profile and regular meeting schedule for ${profile.assigned_club_name || 'your assigned club'}.`
              : 'Discover registered student societies, technical chapters, and cultural clubs at MiT.'}
          </p>
        </div>

        {canManageAll && (
          <button
            type="button"
            onClick={() => {
              setEditingClub(null);
              setIsCreating(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Club</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#181B20] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs, codes, leads..."
            className="w-full bg-[#F4F5F8] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClubs.map((club) => {
          const isMyClub = profile.assigned_club_id === club.id;
          const canEditThisClub = canManageAll || (isHead && isMyClub);

          return (
            <div
              key={club.id}
              className={`p-5 bg-white rounded-3xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                isMyClub ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#F4F5F8] text-slate-700">
                    {club.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isMyClub && (
                      <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        My Club
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-slate-400">{club.code}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{club.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {club.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Lead: <strong>{club.lead_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-500 truncate">{club.lead_email}</span>
                  </div>
                  {club.meeting_schedule && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{club.meeting_schedule}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Members</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {canEditThisClub && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingClub(club)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {canManageAll && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClub(club.id, club.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Archive Club"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      {(editingClub || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClub ? `Edit ${editingClub.name}` : 'Add New Student Club'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingClub(null);
                  setIsCreating(false);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Club Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingClub?.name || ''}
                  required
                  placeholder="e.g. AI & Autonomous Systems Club"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingClub?.code || ''}
                    required
                    placeholder="e.g. AI-CLUB"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingClub?.category || 'Technical'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Description & Mission
                </label>
                <textarea
                  name="description"
                  defaultValue={editingClub?.description || ''}
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Club Lead Name
                  </label>
                  <input
                    type="text"
                    name="lead_name"
                    defaultValue={editingClub?.lead_name || profile.name}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Lead Email
                  </label>
                  <input
                    type="email"
                    name="lead_email"
                    defaultValue={editingClub?.lead_email || profile.email || 'lead@mitmoradabad.edu.in'}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Meeting Schedule & Venue
                </label>
                <input
                  type="text"
                  name="meeting_schedule"
                  defaultValue={editingClub?.meeting_schedule || 'Wednesdays 4:30 PM, Seminar Hall 2'}
                  placeholder="e.g. Every Friday 5:00 PM, Lab Block C"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClub(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 shadow-sm"
                >
                  Save Club Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
