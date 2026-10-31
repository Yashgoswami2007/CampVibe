import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
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
      `MiT MORADABAD — WEEKLY INTELLIGENCE BRIEFING`,
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF1FD] text-blue-700 border border-blue-200/60 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            SYNTHESIZED INTELLIGENCE
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Campus This Week
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalized intelligence summary from {announcements.length} active notices for {profile.name} ({profile.department}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchBriefing}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
          </button>

          {digest && (
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF1FD] text-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Synthesizing Your Weekly Campus Intelligence...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Scanning upcoming registration cutoffs, laboratory assessments, and workshops tailored to {profile.department}.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-[#181B20] animate-pulse" />
          </div>
        </div>
      ) : digest ? (
        /* Rendered Briefing */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Headline & Summary Card */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-[#F4F5F8] via-[#EBF1FD]/40 to-[#D4F5EC]/30 border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase block">
              Sat 31 Oct – Fri 6 Nov 2026
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              "{digest.headline}"
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {digest.summary}
            </p>
          </div>

          {/* Section 1: Must-Do Priorities */}
          {digest.must_do && digest.must_do.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
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
                      className="p-4 rounded-2xl bg-[#F8F9FA] hover:bg-slate-100/80 border border-slate-200/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                          {item.line}
                        </p>
                      </div>

                      {item.deadline && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-rose-600 shrink-0 self-start sm:self-auto font-mono shadow-2xs">
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
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Day-by-Day Schedule
                </h4>
              </div>

              <div className="space-y-4">
                {digest.days.map((dayGroup, idx) => (
                  <div key={idx} className="space-y-2 border-l-2 border-slate-200 pl-4 ml-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{dayGroup.weekday}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({dayGroup.date})</span>
                    </div>

                    <div className="space-y-2">
                      {dayGroup.items.map((item, itemIdx) => {
                        const ann = announcementMap.get(item.id);
                        return (
                          <div
                            key={itemIdx}
                            onClick={() => ann && onSelectAnnouncement(ann)}
                            className="p-3 rounded-xl bg-[#F8F9FA] hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors"
                          >
                            <div className="text-xs font-bold text-slate-900">{item.title}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{item.text}</div>
                            {(item.time || item.venue) && (
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                                {item.time && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {item.time}
                                  </span>
                                )}
                                {item.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
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
            <div className="p-5 rounded-2xl bg-[#FBF5E5]/60 border border-amber-200/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Heads-Up & Logistics Advisory</span>
              </div>
              <div className="space-y-2">
                {digest.heads_up.map((h, i) => (
                  <p key={i} className="text-xs text-amber-800 leading-relaxed pl-6">
                    • {h.text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <p className="text-xs text-slate-500">No briefing generated yet.</p>
          <button
            type="button"
            onClick={fetchBriefing}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Generate Briefing Now
          </button>
        </div>
      )}
    </div>
  );
};
