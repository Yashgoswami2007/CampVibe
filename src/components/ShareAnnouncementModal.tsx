import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageSquare, ExternalLink, Calendar, MapPin, Clock } from 'lucide-react';
import { CampusAnnouncement } from '../types';
import { formatDate } from '../lib/dates';

interface ShareAnnouncementModalProps {
  announcement: CampusAnnouncement;
  onClose: () => void;
}

export const ShareAnnouncementModal: React.FC<ShareAnnouncementModalProps> = ({
  announcement,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<'text' | 'link' | null>(null);

  const formattedShareMessage = `📢 *MiT CAMPUS ANNOUNCEMENT: ${announcement.title.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
🏛️ *Organizer:* ${announcement.organizer}
🏷️ *Category:* ${announcement.category}
📅 *Event Date:* ${announcement.event_date ? formatDate(announcement.event_date, true) : 'TBD'} ${announcement.event_time ? `(${announcement.event_time})` : ''}
⏰ *Registration Deadline:* ${announcement.registration_deadline ? formatDate(announcement.registration_deadline, true) : 'Open / Spot'}
📍 *Venue:* ${announcement.venue || 'Campus'}
👥 *Eligibility:* ${announcement.eligibility || 'All Students'}

📝 *Overview:*
${announcement.description}

${announcement.required_action ? `⚡ *Action Required:* ${announcement.required_action}\n` : ''}${announcement.registration_url ? `🔗 *Register Here:* ${announcement.registration_url}\n` : ''}
Shared via *MiT Campus Radar* — Moradabad Institute of Technology`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedShareMessage);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '?notice=' + announcement.id;
    navigator.clipboard.writeText(url);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: formattedShareMessage,
          url: announcement.registration_url || window.location.href,
        });
      } catch (err) {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Share Announcement
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Visual Shareable Card Preview */}
          <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="uppercase tracking-wider">{announcement.category}</span>
              <span className="font-normal text-slate-600">{announcement.organizer}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{announcement.event_date ? formatDate(announcement.event_date) : 'TBD'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{announcement.venue || 'Campus'}</span>
              </div>
            </div>
            {announcement.registration_deadline && (
              <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Reg. Deadline: {formatDate(announcement.registration_deadline, true)}</span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#25D366] text-white hover:bg-[#20BE5B] transition-colors shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Native Share</span>
            </button>
          </div>

          {/* Copy Options */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <span className="truncate">Copy formatted text message</span>
              {copiedType === 'text' ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <span className="truncate">Copy opportunity deep link</span>
              {copiedType === 'link' ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                </span>
              ) : (
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
