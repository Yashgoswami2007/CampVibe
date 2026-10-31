import React from 'react';
import { Bookmark, Calendar, Clock, ExternalLink, MapPin, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from '../types';
import { calculateAnnouncementStatus, downloadICS, getDateTile } from '../lib/dates';
import { calculateRelevance } from '../lib/scoring';

interface NoticeCardProps {
  announcement: CampusAnnouncement;
  profile: StudentProfile;
  currentFolder?: OpportunityFolder | null;
  onSelect: (announcement: CampusAnnouncement) => void;
  onToggleSave: (announcementId: string, folder: OpportunityFolder | null) => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  announcement,
  profile,
  currentFolder,
  onSelect,
  onToggleSave,
}) => {
  const status = calculateAnnouncementStatus(announcement);
  const relevance = calculateRelevance(announcement, profile);
  const dateTile = getDateTile(announcement.event_date || announcement.registration_deadline);

  const isSaved = Boolean(currentFolder);

  const getUrgencyBadgeStyle = () => {
    switch (status.urgency) {
      case 'urgent':
        return 'text-[#B42318] bg-[#FDECEA] border-[#F9D2CE]';
      case 'upcoming':
        return 'text-[#1F5FBF] bg-[#E8F0FC] border-[#CFE0FB]';
      case 'expired':
        return 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]';
      default:
        return 'text-[#2D6A4F] bg-[#EAF5EF] border-[#CDE8D8]';
    }
  };

  const getRelevanceBadgeStyle = () => {
    if (relevance.tier === 'Strong Match') {
      return 'text-[#C96B35] bg-[#FDF3EB] border-[#F8DCBA] font-semibold';
    }
    if (relevance.tier === 'Good Match') {
      return 'text-[#8A5A1C] bg-[#FEF9EE] border-[#FBEAC4]';
    }
    return 'text-[#5C6470] bg-[#F4F5F7] border-[#E2E5E9]';
  };

  return (
    <div
      onClick={() => onSelect(announcement)}
      className="group relative bg-white border border-[#E8E5DF] rounded-2xl p-5 hover:border-[#C96B35]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(201,107,53,0.06)]"
    >
      <div>
        {/* Top Header: Date Tile + Match Info + Save Button */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Calendar Date Tile */}
            <div className="w-13 h-13 rounded-xl bg-[#FAF8F3] border border-[#EAE6DF] flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#C96B35] tracking-wider leading-none">
                {dateTile.month}
              </span>
              <span className="text-lg font-extrabold text-[#292A28] leading-tight font-mono tabular-nums">
                {dateTile.day}
              </span>
              <span className="text-[9px] text-[#787774] font-medium leading-none">
                {dateTile.weekday}
              </span>
            </div>

            {/* Category and Organizer */}
            <div className="min-w-0">
              <div className="text-xs text-[#787774] flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[#292A28]">{announcement.category}</span>
                <span aria-hidden="true" className="text-[#C4C0B6]">·</span>
                <span className="truncate max-w-[170px]">{announcement.organizer}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Status Indicator */}
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${getUrgencyBadgeStyle()}`}>
                  {status.countdownText}
                </span>

                {/* Relevance Match Indicator */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border ${getRelevanceBadgeStyle()}`}>
                  <Sparkles className="w-3 h-3" />
                  <span className="font-mono tabular-nums">{relevance.score}%</span> {relevance.tier}
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
                ? 'bg-[#C96B35] text-white border-[#C96B35]'
                : 'bg-[#FAF8F3] text-[#787774] border-[#E8E5DF] hover:text-[#C96B35] hover:border-[#C96B35]/40'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#292A28] group-hover:text-[#C96B35] transition-colors leading-snug line-clamp-2 mb-2">
          {announcement.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[#5C5A56] line-clamp-2 leading-relaxed mb-3">
          {announcement.description}
        </p>

        {/* Why this matches you (Personalized explanation) */}
        {relevance.reasons.length > 0 && (
          <div className="bg-[#FAF8F3] border border-[#EFECE6] rounded-xl px-3 py-2 mb-3.5 text-[11px] text-[#55524E]">
            <span className="font-semibold text-[#C96B35]">Why you: </span>
            <span>{relevance.reasons[0]}</span>
          </div>
        )}
      </div>

      {/* Footer Info: Venue & Deadlines */}
      <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs text-[#787774]">
        <div className="flex items-center gap-3 truncate">
          {announcement.venue ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9B9890]" />
              <span className="truncate">{announcement.venue}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#9B9890]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Campus</span>
            </span>
          )}

          {announcement.event_time && (
            <span className="inline-flex items-center gap-1 shrink-0 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#9B9890]" />
              <span>{announcement.event_time}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadICS(announcement);
            }}
            title="Download .ics Calendar Event"
            className="p-1.5 rounded-lg text-[#787774] hover:text-[#292A28] hover:bg-[#FAF8F3]"
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
              className="p-1.5 rounded-lg text-[#C96B35] hover:bg-[#FDF3EB]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
