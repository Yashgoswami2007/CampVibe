import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Building2,
  User,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { CampusAnnouncement, StudentProfile } from '../types';
import { Permissions } from '../lib/permissions';
import { formatDate } from '../lib/dates';

interface ApprovalsPageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onSwitchToApprover: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  profile,
  announcements,
  onApprove,
  onReject,
  onSelectAnnouncement,
  onSwitchToApprover,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'all' | 'published' | 'draft' | 'rejected'>('pending');
  const [search, setSearch] = useState('');

  const canApprove = Permissions.canApproveAnnouncement(profile);
  const isOverridden = Boolean(profile.explicit_permissions?.can_approve_announcements);

  // If user cannot approve, show access restricted view
  if (!canApprove) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Approval Authority Restricted
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            Under the MiT Governance Matrix, <strong>Super Admins</strong> hold college-wide approval authority, and <strong>Club Heads</strong> default to <em>No</em> unless explicitly granted override permission (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">*</code>).
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2">
          <div className="font-bold text-slate-900">Your Active Persona:</div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Name:</span>
            <span className="font-semibold">{profile.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Role:</span>
            <span className="font-semibold uppercase">{profile.role || 'STUDENT'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Approve Permission:</span>
            <span className="text-rose-600 font-bold">No</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={onSwitchToApprover}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
          >
            Switch to Dr. Rajesh Sharma (Super Admin) or Priya Patel (Head with *)
          </button>
        </div>
      </div>
    );
  }

  // Filter items
  const pendingItems = announcements.filter((a) => a.status === 'pending_approval');
  const publishedItems = announcements.filter((a) => !a.status || a.status === 'published');
  const draftItems = announcements.filter((a) => a.status === 'draft');
  const rejectedItems = announcements.filter((a) => a.status === 'rejected');

  let displayedList: CampusAnnouncement[] = [];
  if (filterTab === 'pending') displayedList = pendingItems;
  else if (filterTab === 'published') displayedList = publishedItems;
  else if (filterTab === 'draft') displayedList = draftItems;
  else if (filterTab === 'rejected') displayedList = rejectedItems;
  else displayedList = announcements;

  if (search.trim()) {
    const q = search.toLowerCase();
    displayedList = displayedList.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.organizer.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Announcement Approval Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
              {profile.role === 'super_admin' ? 'Super Admin Authority' : 'Special Head Override (*)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, authorize, or return campus notices and club activity submissions before publication.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-sm font-black leading-none">{pendingItems.length}</div>
              <div className="text-[10px] text-amber-700 font-semibold uppercase">Pending</div>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-sm font-black leading-none">{publishedItems.length}</div>
              <div className="text-[10px] text-emerald-700 font-semibold uppercase">Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingItems.length },
            { id: 'all', label: 'All Notices', count: announcements.length },
            { id: 'published', label: 'Published', count: publishedItems.length },
            { id: 'draft', label: 'Drafts', count: draftItems.length },
            { id: 'rejected', label: 'Rejected', count: rejectedItems.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? 'bg-[#181B20] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue..."
            className="w-full bg-[#F4F5F8] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Submissions List */}
      {displayedList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Queue is Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No announcements match this status filter. When student clubs submit proposals, they will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedList.map((ann) => {
            const isPending = ann.status === 'pending_approval';

            return (
              <div
                key={ann.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {ann.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ann.organizer}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                        ann.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : ann.status === 'draft'
                          ? 'bg-slate-100 text-slate-700'
                          : ann.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {ann.status ? ann.status.replace('_', ' ') : 'published'}
                    </span>

                    {ann.created_by_name && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                        <User className="w-3 h-3" />
                        Submitted by: {ann.created_by_name}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectAnnouncement(ann)}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors leading-snug line-clamp-1"
                  >
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {ann.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    {ann.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Event: {formatDate(ann.event_date)}
                      </span>
                    )}
                    {ann.venue && <span>Venue: {ann.venue}</span>}
                    {ann.rejection_reason && (
                      <span className="text-rose-600 font-semibold">
                        Rejection reason: {ann.rejection_reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectAnnouncement(ann)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F4F5F8] text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Preview
                  </button>

                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(ann.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const reason = window.prompt('Enter rejection reason / feedback for organizer:');
                          if (reason !== null) onReject(ann.id, reason);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
