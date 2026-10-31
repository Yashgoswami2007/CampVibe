import React from 'react';
import { Bookmark, Calendar, Clock, ExternalLink, MapPin, Share2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { calculateAnnouncementStatus, downloadICS, getDateTile, getAnnouncementPriority } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface NoticeCardProps {
  announcement: CampusAnnouncement;
  profile: StudentProfile;
  currentFolder?: OpportunityFolder | null;
  onSelect: (announcement: CampusAnnouncement) => void;
  onToggleSave: (announcementId: string, folder: OpportunityFolder | null) => void;
  onShare?: (announcement: CampusAnnouncement) => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  announcement,
  profile,
  currentFolder,
  onSelect,
  onToggleSave,
  onShare,
}) => {
  const status = calculateAnnouncementStatus(announcement);
  const relevance = calculateRelevance(announcement, profile);
  const dateTile = getDateTile(announcement.event_date || announcement.registration_deadline);
  const priority = getAnnouncementPriority(announcement, currentFolder === 'completed');

  const isSaved = Boolean(currentFolder);

  const getPriorityBadgeStyle = () => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 bg-red-50 border-red-200 font-bold';
      case 'Urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Today':
        return 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
      case 'Upcoming':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Completed':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Expired':
        return 'text-slate-500 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-500 bg-[#F4F5F8] border-slate-200';
    }
  };

  const getRelevanceBadgeStyle = () => {
    if (relevance.tier === 'Strong Match') {
      return 'text-[#1E3A8A] bg-[#EBF1FD] border-blue-200 font-semibold';
    }
    if (relevance.tier === 'Good Match') {
      return 'text-amber-700 bg-[#FBF5E5] border-amber-200';
    }
    return 'text-slate-500 bg-[#F4F5F8] border-slate-200';
  };

  return (
    <div
      onClick={() => onSelect(announcement)}
      className="group relative bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
    >
      <div>
        {/* Top Header: Date Tile + Match Info + Save Button */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Calendar Date Tile */}
            <div className="w-13 h-13 rounded-xl bg-[#F4F5F8] border border-slate-200 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#1E3A8A] tracking-wider leading-none">
                {dateTile.month}
              </span>
              <span className="text-lg font-extrabold text-slate-900 leading-tight font-mono tabular-nums">
                {dateTile.day}
              </span>
              <span className="text-[9px] text-slate-400 font-medium leading-none">
                {dateTile.weekday}
              </span>
            </div>

            {/* Category and Organizer */}
            <div className="min-w-0">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700">{announcement.category}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="truncate max-w-[170px]">{announcement.organizer}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Priority Badge */}
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-md border ${getPriorityBadgeStyle()}`}>
                  {priority}
                </span>

                {/* Status Indicator */}
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border text-slate-500 bg-[#F4F5F8] border-slate-200">
                  {status.countdownText}
                </span>

                {/* Relevance Match Indicator */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border ${getRelevanceBadgeStyle()}`}>
                  <Sparkles className="w-3 h-3" />
                  <span className="font-mono tabular-nums">{relevance.score}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(announcement.id, isSaved ? null : 'saved');
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
            className={`p-2 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-[#181B20] text-white border-[#181B20]'
                : 'bg-[#F4F5F8] text-slate-400 border-slate-200 hover:text-[#1E3A8A] hover:border-blue-200'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug line-clamp-2 mb-2">
          {announcement.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {announcement.description}
        </p>

        {/* Why this matches you (Personalized explanation) */}
        {relevance.reasons.length > 0 && (
          <div className="bg-[#F4F5F8] border border-slate-200 rounded-xl px-3 py-2 mb-3.5 text-[11px] text-slate-500">
            <span className="font-semibold text-[#1E3A8A]">Why you: </span>
            <span>{relevance.reasons[0]}</span>
          </div>
        )}
      </div>

      {/* Footer Info: Venue & Deadlines */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 truncate">
          {announcement.venue ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-300" />
              <span className="truncate">{announcement.venue}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Campus</span>
            </span>
          )}

          {announcement.event_time && (
            <span className="inline-flex items-center gap-1 shrink-0 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              <span>{announcement.event_time}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(announcement);
              }}
              title="Share Announcement Card"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E3A8A] hover:bg-[#EBF1FD]"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadICS(announcement);
            }}
            title="Download .ics Calendar Event"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#F4F5F8]"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {announcement.registration_url && (
            <a
              href={announcement.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open Official Registration"
              className="p-1.5 rounded-lg text-[#1E3A8A] hover:bg-[#EBF1FD]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
