import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Bookmark,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
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
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  announcement,
  profile,
  currentFolder,
  onClose,
  onUpdateFolder,
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
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#E4DFD5] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EFECE6] bg-[#FAF8F3]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#C96B35] tracking-wide uppercase">
              {announcement.category}
            </span>
            <span aria-hidden="true" className="text-[#C4C0B6]">·</span>
            <span className="text-xs text-[#787774] font-medium">{announcement.organizer}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-[#EFECE6] p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'details' ? 'bg-white text-[#292A28] shadow-xs' : 'text-[#787774] hover:text-[#292A28]'
                }`}
              >
                Intelligence
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('source')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'source' ? 'bg-white text-[#292A28] shadow-xs' : 'text-[#787774] hover:text-[#292A28]'
                }`}
              >
                Raw Source & Evidence
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#787774] hover:text-[#292A28] hover:bg-[#EFECE6] transition-colors"
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
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F3] border border-[#EAE6DF]">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E0DBD0] flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <span className="text-[11px] font-bold text-[#C96B35] tracking-wider leading-none">
                    {dateTile.month}
                  </span>
                  <span className="text-2xl font-black text-[#292A28] leading-tight font-mono tabular-nums">
                    {dateTile.day}
                  </span>
                  <span className="text-[10px] text-[#787774] font-semibold leading-none">
                    {dateTile.weekday}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md border border-[#F9D2CE] bg-[#FDECEA] text-[#B42318]">
                      {status.countdownText}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md border border-[#F8DCBA] bg-[#FDF3EB] text-[#C96B35]">
                      <Sparkles className="w-3.5 h-3.5" />
                      {relevance.score}% {relevance.tier}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#292A28] leading-snug">
                    {announcement.title}
                  </h2>
                </div>
              </div>

              {/* Relevance Insight Box */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E7B96C]/40">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C96B35] mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Why This Matches You ({profile.name} · {profile.department})</span>
                </div>
                <div className="space-y-1.5">
                  {relevance.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#4D4B47]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C96B35] shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Event Schedule */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-white">
                  <span className="text-[#8C8880] font-medium block mb-1">Event Date & Time</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#292A28]">
                    <Calendar className="w-4 h-4 text-[#C96B35]" />
                    <span>{announcement.event_date ? formatDate(announcement.event_date, true) : 'TBD'}</span>
                    {announcement.event_time && <span className="font-mono text-[#787774]">({announcement.event_time})</span>}
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-white">
                  <span className="text-[#8C8880] font-medium block mb-1">Registration Deadline</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#292A28]">
                    <Clock className="w-4 h-4 text-[#C96B35]" />
                    <span>{announcement.registration_deadline ? formatDate(announcement.registration_deadline, true) : 'No strict deadline / On spot'}</span>
                  </div>
                </div>

                {/* Venue */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-white">
                  <span className="text-[#8C8880] font-medium block mb-1">Venue / Location</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#292A28]">
                    <MapPin className="w-4 h-4 text-[#C96B35]" />
                    <span>{announcement.venue || 'Campus (Hall to be announced)'}</span>
                  </div>
                </div>

                {/* Eligibility */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-white">
                  <span className="text-[#8C8880] font-medium block mb-1">Eligibility</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#292A28]">
                    <UserCheck className="w-4 h-4 text-[#C96B35]" />
                    <span className="truncate">{announcement.eligibility || 'Open to all students'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-[#8C8880] uppercase tracking-wider mb-2">
                  Detailed Overview
                </h4>
                <p className="text-sm text-[#4D4B47] leading-relaxed whitespace-pre-line bg-[#FAF8F3] p-4 rounded-2xl border border-[#EFECE6]">
                  {announcement.description}
                </p>
              </div>

              {/* Action Required Callout */}
              {announcement.required_action && (
                <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DF] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C96B35]/10 text-[#C96B35] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#292A28]">Action Required</h5>
                    <p className="text-xs text-[#5C5A56] mt-0.5 leading-relaxed">
                      {announcement.required_action}
                    </p>
                  </div>
                </div>
              )}

              {/* Missing Fields or Ambiguity Warnings */}
              {(announcement.missing_fields?.length > 0 || announcement.warnings?.length > 0) && (
                <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#EAE6DF] space-y-1.5 text-xs text-[#787774]">
                  {announcement.warnings?.map((warn, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#9A6208]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{warn}</span>
                    </div>
                  ))}
                  {announcement.missing_fields?.length > 0 && (
                    <div className="text-[11px] text-[#8C8880]">
                      <span className="font-medium text-[#5C5A56]">Not mentioned in source: </span>
                      {announcement.missing_fields.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Source Text & Extraction Evidence View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#EAE6DF]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#292A28] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C96B35]" />
                    Original Communication Text (Stored Verbatim)
                  </h4>
                  <span className="text-[11px] text-[#787774] font-medium uppercase">
                    Source: {announcement.source}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E0DBD0] font-mono text-xs text-[#333] whitespace-pre-wrap leading-relaxed select-text">
                  {announcement.raw_text}
                </div>
              </div>

              {/* Verifiable Evidence Quotes */}
              <div>
                <h4 className="text-xs font-bold text-[#8C8880] uppercase tracking-wider mb-2">
                  Verified Quotes (Evidence Backing)
                </h4>
                {Object.keys(announcement.evidence || {}).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(announcement.evidence).map(([field, quote]) => (
                      <div key={field} className="p-3 rounded-xl bg-white border border-[#EFECE6]">
                        <span className="text-[11px] font-semibold text-[#C96B35] uppercase block mb-1">
                          {field.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[#333] italic">"{quote}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#787774]">No specific evidence quotes recorded.</p>
                )}
              </div>

              {/* Date Resolution Details */}
              {announcement.date_resolution && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#EFECE6] text-xs">
                  <h5 className="font-bold text-[#292A28] mb-1">Date Resolution Intelligence</h5>
                  <p className="text-[#5C5A56]">
                    Phrase <span className="font-semibold text-[#292A28]">"{announcement.date_resolution.phrase}"</span> resolved via {announcement.date_resolution.method} computation ({announcement.date_resolution.assumption}).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-[#EFECE6] bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-3">
          {/* Opportunity Folder Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#787774] font-medium mr-1 hidden sm:inline">Track:</span>
            {folderOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateFolder(announcement.id, currentFolder === opt.id ? null : opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  currentFolder === opt.id
                    ? 'bg-[#C96B35] text-white border-[#C96B35]'
                    : 'bg-white text-[#787774] border-[#E0DBD0] hover:border-[#C96B35]/40 hover:text-[#292A28]'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-[#E0DBD0] text-[#292A28] hover:bg-[#FAF8F3] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#787774]" />
              <span>Add to Calendar</span>
            </button>

            {announcement.registration_url && (
              <a
                href={announcement.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs"
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
