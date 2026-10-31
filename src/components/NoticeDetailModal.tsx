import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Share2,
  Edit3,
  Trash2,
  Send,
  Download,
} from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { calculateAnnouncementStatus, downloadICS, formatDate, getDateTile } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface NoticeDetailModalProps {
  announcement: CampusAnnouncement | null;
  profile: StudentProfile;
  currentFolder?: OpportunityFolder | null;
  onClose: () => void;
  onUpdateFolder: (announcementId: string, folder: OpportunityFolder | null) => void;
  onEdit?: (announcement: CampusAnnouncement) => void;
  onDelete?: (id: string) => void;
  onShare?: (announcement: CampusAnnouncement) => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  announcement,
  profile,
  currentFolder,
  onClose,
  onUpdateFolder,
  onEdit,
  onDelete,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'source'>('details');

  if (!announcement) return null;

  const status = calculateAnnouncementStatus(announcement);
  const relevance = calculateRelevance(announcement, profile);
  const dateTile = getDateTile(announcement.event_date || announcement.registration_deadline);

  const folderOptions: Array<{ id: OpportunityFolder; label: string }> = [
    { id: 'saved', label: 'Saved' },
    { id: 'interested', label: 'Interested' },
    { id: 'applied', label: 'Applied' },
    { id: 'completed', label: 'Done' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              {announcement.category}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">{announcement.organizer}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'details' ? 'bg-[#181B20] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Intelligence
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('source')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'source' ? 'bg-[#181B20] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw Source
              </button>
            </div>

            {/* Management Actions */}
            {onShare && (
              <button
                type="button"
                onClick={() => onShare(announcement)}
                title="Share Announcement Card"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(announcement)}
                title="Edit Announcement"
                className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this announcement?')) {
                    onDelete(announcement.id);
                    onClose();
                  }
                }}
                title="Delete Announcement"
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' ? (
            <>
              {/* Top Banner Card: Date Tile + Title */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#F8F9FA] border border-slate-200/80">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-600 tracking-wider leading-none uppercase">
                    {dateTile.month}
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight font-mono tabular-nums">
                    {dateTile.day}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold leading-none">
                    {dateTile.weekday}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md border border-rose-200 bg-rose-50 text-rose-700">
                      {status.countdownText}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-800 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                      {relevance.score}% {relevance.tier}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 leading-snug">
                    {announcement.title}
                  </h2>
                </div>
              </div>

              {/* Relevance Insight Box */}
              <div className="p-4 rounded-2xl bg-[#EBF1FD]/50 border border-blue-200/70">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Why This Matches You ({profile.name} · {profile.department})</span>
                </div>
                <div className="space-y-1.5">
                  {relevance.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-blue-950">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Event Schedule */}
                <div className="p-3.5 rounded-xl border border-slate-200/70 bg-[#F8F9FA]">
                  <span className="text-slate-400 font-medium block mb-1">Event Date & Time</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Calendar className="w-4 h-4 text-slate-700" />
                    <span>{announcement.event_date ? formatDate(announcement.event_date, true) : 'TBD'}</span>
                    {announcement.event_time && <span className="font-mono text-slate-500">({announcement.event_time})</span>}
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="p-3.5 rounded-xl border border-slate-200/70 bg-[#F8F9FA]">
                  <span className="text-slate-400 font-medium block mb-1">Registration Deadline</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Clock className="w-4 h-4 text-slate-700" />
                    <span>{announcement.registration_deadline ? formatDate(announcement.registration_deadline, true) : 'No strict deadline / On spot'}</span>
                  </div>
                </div>

                {/* Venue */}
                <div className="p-3.5 rounded-xl border border-slate-200/70 bg-[#F8F9FA]">
                  <span className="text-slate-400 font-medium block mb-1">Venue / Location</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <span>{announcement.venue || 'Campus (Hall to be announced)'}</span>
                  </div>
                </div>

                {/* Eligibility */}
                <div className="p-3.5 rounded-xl border border-slate-200/70 bg-[#F8F9FA]">
                  <span className="text-slate-400 font-medium block mb-1">Eligibility</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <span className="truncate">{announcement.eligibility || 'Open to all students'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Detailed Overview
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/70">
                  {announcement.description}
                </p>
              </div>

              {/* Action Required Callout */}
              {announcement.required_action && (
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Action Required</h5>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {announcement.required_action}
                    </p>
                  </div>
                </div>
              )}

              {/* Missing Fields or Ambiguity Warnings */}
              {(announcement.missing_fields?.length > 0 || announcement.warnings?.length > 0) && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5 text-xs text-amber-900">
                  {announcement.warnings?.map((warn, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{warn}</span>
                    </div>
                  ))}
                  {announcement.missing_fields?.length > 0 && (
                    <div className="text-[11px] text-amber-800">
                      <span className="font-semibold">Not mentioned in notice: </span>
                      {announcement.missing_fields.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Source Text & Extraction Evidence View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Original Communication Text (Stored Verbatim)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Source: {announcement.source}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                  {announcement.raw_text}
                </div>
              </div>

              {/* Verifiable Evidence Quotes */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Verified Quotes (Evidence Backing)
                </h4>
                {Object.keys(announcement.evidence || {}).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(announcement.evidence).map(([field, quote]) => (
                      <div key={field} className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-700 uppercase block mb-1">
                          {field.replace(/_/g, ' ')}
                        </span>
                        <p className="text-slate-800 italic">"{quote}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No specific evidence quotes recorded.</p>
                )}
              </div>

              {/* Date Resolution Details */}
              {announcement.date_resolution && (
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-slate-200 text-xs">
                  <h5 className="font-bold text-slate-900 mb-1">Date Resolution Intelligence</h5>
                  <p className="text-slate-600">
                    Phrase <span className="font-semibold text-slate-900">"{announcement.date_resolution.phrase}"</span> resolved via {announcement.date_resolution.method} computation ({announcement.date_resolution.assumption}).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-[#F8F9FA] flex flex-wrap items-center justify-between gap-3">
          {/* Opportunity Folder Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Track:</span>
            {folderOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateFolder(announcement.id, currentFolder === opt.id ? null : opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  currentFolder === opt.id
                    ? 'bg-[#181B20] text-white border-[#181B20] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Download ICS and Open Link */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadICS(announcement)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Add to Calendar</span>
            </button>

            {announcement.registration_url && (
              <a
                href={announcement.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Register Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
