import React, { useState } from 'react';
import {
  Bookmark,
  Heart,
  Send,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { NoticeCard } from '../components/NoticeCard';
import { downloadICS } from '../lib/dates';

interface MyOpportunitiesPageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  opportunityStates: Record<string, { folder: OpportunityFolder }>;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onToggleSave: (id: string, folder: OpportunityFolder | null) => void;
  onShare?: (a: CampusAnnouncement) => void;
  onNavigate: (view: string) => void;
}

export const MyOpportunitiesPage: React.FC<MyOpportunitiesPageProps> = ({
  profile,
  announcements,
  opportunityStates,
  onSelectAnnouncement,
  onToggleSave,
  onShare,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<OpportunityFolder>('saved');

  const announcementsById = new Map<string, CampusAnnouncement>();
  announcements.forEach(a => announcementsById.set(a.id, a));

  const itemsInActiveFolder = Object.entries(opportunityStates)
    .filter(([_, state]) => state.folder === activeTab)
    .map(([id]) => announcementsById.get(id))
    .filter((a): a is CampusAnnouncement => Boolean(a));

  const folderCounts: Record<OpportunityFolder, number> = {
    saved: Object.values(opportunityStates).filter(s => s.folder === 'saved').length,
    interested: Object.values(opportunityStates).filter(s => s.folder === 'interested').length,
    applied: Object.values(opportunityStates).filter(s => s.folder === 'applied').length,
    completed: Object.values(opportunityStates).filter(s => s.folder === 'completed').length,
  };

  const tabs: Array<{ id: OpportunityFolder; label: string; icon: any }> = [
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'interested', label: 'Interested', icon: Heart },
    { id: 'applied', label: 'Applied / Registered', icon: Send },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Opportunity Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize bookmarks, track registrations, and monitor submissions across your academic timeline at MiT.
          </p>
        </div>

        {itemsInActiveFolder.length > 0 && (
          <button
            type="button"
            onClick={() => {
              itemsInActiveFolder.forEach(item => downloadICS(item));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200/80 text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
            <span>Export Folder (.ics)</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = folderCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#181B20] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Folder Content */}
      {itemsInActiveFolder.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsInActiveFolder.map((ann) => (
            <NoticeCard
              key={ann.id}
              announcement={ann}
              profile={profile}
              currentFolder={activeTab}
              onSelect={onSelectAnnouncement}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No opportunities in "{tabs.find(t => t.id === activeTab)?.label}"
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse campus notices and click the bookmark icon to save workshops, hackathons, and placement drives to this pipeline.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Explore Opportunities
          </button>
        </div>
      )}
    </div>
  );
};
