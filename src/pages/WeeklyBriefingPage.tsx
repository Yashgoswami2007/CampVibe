import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { CampusAnnouncement, StudentProfile, WeeklyDigest } from '../types';
import { StorageService } from '../lib/storage';

interface WeeklyBriefingPageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
}

export const WeeklyBriefingPage: React.FC<WeeklyBriefingPageProps> = ({
  profile,
  announcements,
  onSelectAnnouncement,
}) => {
  const [digest, setDigest] = useState<WeeklyDigest | null>(() => StorageService.getCachedDigest());
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const announcementMap = new Map<string, CampusAnnouncement>();
  announcements.forEach(a => announcementMap.set(a.id, a));

  const fetchBriefing = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notices: announcements,
          profile,
          today: '2026-10-31',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.error_message || 'Failed to generate weekly digest');
      }

      const generatedDigest: WeeklyDigest = {
        ...json.data,
        generated_at: new Date().toISOString(),
        is_fallback: json.is_fallback,
      };

      setDigest(generatedDigest);
      StorageService.saveDigest(generatedDigest);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to contact AI briefing service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no cached digest exists, generate one automatically
    if (!digest && announcements.length > 0) {
      fetchBriefing();
    }
  }, []);

  const handleCopyText = () => {
    if (!digest) return;
    const lines = [
      `CAMPUS RADAR — WEEKLY INTELLIGENCE BRIEFING`,
      `For: ${profile.name} (${profile.department})`,
      `Date: Sat, 31 Oct – Fri, 6 Nov 2026\n`,
      `HEADLINE: ${digest.headline}`,
      `SUMMARY: ${digest.summary}\n`,
      `MUST-DO PRIORITIES:`,
      ...digest.must_do.map(m => `• ${m.title}: ${m.line} (Deadline: ${m.deadline || 'Upcoming'})`),
      `\nDAY-BY-DAY SCHEDULE:`,
      ...digest.days.flatMap(d => [
        `[${d.weekday}, ${d.date}]`,
        ...d.items.map(i => `  - ${i.title}${i.time ? ` at ${i.time}` : ''}${i.venue ? ` in ${i.venue}` : ''}`),
      ]),
      `\nHEADS UP:`,
      ...digest.heads_up.map(h => `• ${h.text}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FDF3EB] text-[#C96B35] border border-[#F8DCBA] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            SYNTHESIZED INTELLIGENCE
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#292A28] tracking-tight">
            Your Campus This Week
          </h2>
          <p className="text-xs text-[#787774]">
            Synthesized by Gemini from {announcements.length} active announcements for {profile.name} ({profile.department}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchBriefing}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E0DBD0] text-[#292A28] hover:bg-[#FAF8F3] transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#787774] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
          </button>

          {digest && (
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E0DBD0] text-[#292A28] hover:bg-[#FAF8F3] transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#787774]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton */
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-8 shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF3EB] border border-[#F8DCBA] text-[#C96B35] flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#292A28]">
              Synthesizing Your Weekly Campus Intelligence...
            </h3>
            <p className="text-xs text-[#787774] max-w-md mx-auto">
              Scanning upcoming registration cutoffs, laboratory assessments, and workshops tailored to {profile.department}.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-[#FAF8F3] rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-[#C96B35] animate-pulse" />
          </div>
        </div>
      ) : digest ? (
        /* Rendered Briefing */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Headline & Summary Card */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-[#FDF3EB] via-white to-[#FEF9EE] border border-[#F8DCBA] shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-[#C96B35] tracking-wider uppercase block">
              Sat 31 Oct – Fri 6 Nov 2026
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#292A28] leading-snug">
              "{digest.headline}"
            </h3>
            <p className="text-xs sm:text-sm text-[#4D4B47] leading-relaxed">
              {digest.summary}
            </p>
          </div>

          {/* Section 1: Must-Do Priorities */}
          {digest.must_do && digest.must_do.length > 0 && (
            <div className="bg-white border border-[#E0DBD0] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B42318]" />
                <h4 className="text-sm font-bold text-[#292A28] uppercase tracking-wider">
                  Top Priority Action Items
                </h4>
              </div>

              <div className="space-y-3">
                {digest.must_do.map((item, idx) => {
                  const ann = announcementMap.get(item.id);
                  return (
                    <div
                      key={idx}
                      onClick={() => ann && onSelectAnnouncement(ann)}
                      className="p-4 rounded-2xl bg-[#FAF8F3] hover:bg-[#FDF3EB] border border-[#EFECE6] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C96B35] shrink-0" />
                          <h5 className="text-xs font-bold text-[#292A28] group-hover:text-[#C96B35] transition-colors">
                            {item.title}
                          </h5>
                        </div>
                        <p className="text-xs text-[#5C5A56] pl-6 leading-relaxed">
                          {item.line}
                        </p>
                      </div>

                      {item.deadline && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-[#E0DBD0] text-[#B42318] shrink-0 self-start sm:self-auto font-mono">
                          {item.deadline}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Day-by-Day Schedule */}
          {digest.days && digest.days.length > 0 && (
            <div className="bg-white border border-[#E0DBD0] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C96B35]" />
                <h4 className="text-sm font-bold text-[#292A28] uppercase tracking-wider">
                  Day-by-Day Schedule
                </h4>
              </div>

              <div className="space-y-4">
                {digest.days.map((dayGroup, idx) => (
                  <div key={idx} className="space-y-2 border-l-2 border-[#E0DBD0] pl-4 ml-1">
                    <div className="text-xs font-bold text-[#292A28] flex items-center gap-2">
                      <span>{dayGroup.weekday}</span>
                      <span className="text-[#8C8880] font-mono text-[11px]">({dayGroup.date})</span>
                    </div>

                    <div className="space-y-2">
                      {dayGroup.items.map((item, itemIdx) => {
                        const ann = announcementMap.get(item.id);
                        return (
                          <div
                            key={itemIdx}
                            onClick={() => ann && onSelectAnnouncement(ann)}
                            className="p-3 rounded-xl bg-[#FAF8F3] hover:bg-[#FDF3EB] border border-[#EFECE6] cursor-pointer transition-colors"
                          >
                            <div className="text-xs font-bold text-[#292A28]">{item.title}</div>
                            <div className="text-xs text-[#5C5A56] mt-0.5">{item.text}</div>
                            {(item.time || item.venue) && (
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#787774]">
                                {item.time && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-[#9B9890]" />
                                    {item.time}
                                  </span>
                                )}
                                {item.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#9B9890]" />
                                    {item.venue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Heads Up & Reminders */}
          {digest.heads_up && digest.heads_up.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E7B96C]/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A5A1C]">
                <AlertCircle className="w-4 h-4 text-[#C96B35]" />
                <span>Heads-Up & Logistics Advisory</span>
              </div>
              <div className="space-y-2">
                {digest.heads_up.map((h, i) => (
                  <p key={i} className="text-xs text-[#4D4B47] leading-relaxed pl-6">
                    • {h.text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E0DBD0] shadow-xs space-y-3">
          <p className="text-xs text-[#787774]">No briefing generated yet.</p>
          <button
            type="button"
            onClick={fetchBriefing}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B]"
          >
            Generate Briefing Now
          </button>
        </div>
      )}
    </div>
  );
};
