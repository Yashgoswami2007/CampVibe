import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Send,
  HelpCircle,
  Copy,
  PenTool,
} from 'lucide-react';
import { AnnouncementCategory, AnnouncementKind, CampusAnnouncement } from '../types';
import { checkConflictsAndDuplicates, ConflictNotice } from '../lib/conflicts';

interface AddAnnouncementProps {
  existingAnnouncements: CampusAnnouncement[];
  onAnnouncementCreated: (announcement: CampusAnnouncement) => void;
  onCancel: () => void;
}

const SAMPLE_CHIPS = [
  {
    label: 'E-Cell Bootcamp (Urgent Reg.)',
    text: 'Hey everyone! Our E-Cell is organizing an entrepreneurship bootcamp next Friday at 11 AM in Seminar Hall 2. Registrations close tomorrow night. Only 50 seats available. Open to all branches. Register ASAP at https://ecell.campusradar.edu/bootcamp26',
  },
  {
    label: '2nd Year Exam (Block B)',
    text: 'URGENT!! All 2nd year CSE students are informed that Mid-Term DBMS assessment will be conducted on 4th November at 10 AM in Block B. Bring your physical ID card. Attendance is 100% compulsory.',
  },
  {
    label: 'National AI Hackathon (Nov 1 Deadline)',
    text: 'URGENT REMINDER: Registrations for National AI Hackathon 2026 close tomorrow midnight (Nov 1)! Grand prize ₹2.5L. Venue: Campus Innovation Center, Block C. Open to 2nd-4th year CSE/IT/ECE. Register before slots fill up: https://hackathon.campusradar.edu/apply',
  },
  {
    label: 'Placement Mock Interviews',
    text: 'Final Year placement mock interviews tomorrow Sunday Nov 1 slotting ends at noon. Session on Monday Nov 2 at 2 PM in Aud 1. Formals mandatory. 2 resume copies needed.',
  },
];

const CATEGORIES: AnnouncementCategory[] = [
  'Technology',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Hackathons',
  'Internships',
  'Placements',
  'Entrepreneurship',
  'Cultural Activities',
  'Sports',
  'Research',
  'Workshops',
  'Academics',
  'Other',
];

export const AddAnnouncement: React.FC<AddAnnouncementProps> = ({
  existingAnnouncements,
  onAnnouncementCreated,
  onCancel,
}) => {
  const [inputText, setInputText] = useState('');
  const [sourceType, setSourceType] = useState<'whatsapp' | 'email' | 'instagram' | 'poster' | 'notice_board'>('whatsapp');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted item state for preview & editing
  const [extractedData, setExtractedData] = useState<CampusAnnouncement | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictNotice[]>([]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please paste announcement text before analyzing.');
      return;
    }

    setErrorMsg(null);
    setIsExtracting(true);
    setExtractionStep('Reading communication & tokenizing...');

    try {
      // Step 2 indicator
      setTimeout(() => setExtractionStep('Extracting structured dates, venue, and required actions...'), 700);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          today: '2026-10-31',
          weekday: 'Saturday',
          tz: 'Asia/Kolkata',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.error_message || 'Extraction failed');
      }

      const extractedItems = json.data?.items;
      if (!extractedItems || extractedItems.length === 0) {
        throw new Error(json.data?.not_a_notice_reason || 'This message did not contain a campus announcement or event.');
      }

      const primary = extractedItems[0];
      const newAnnouncement: CampusAnnouncement = {
        id: `ann-${Date.now()}`,
        title: primary.title || 'Untitled Campus Notice',
        description: primary.description || inputText.slice(0, 250),
        kind: primary.kind || 'event',
        category: primary.category || 'Academics',
        organizer: primary.organizer || 'Campus Committee',
        event_date: primary.event_date || null,
        event_time: primary.event_time || null,
        registration_deadline: primary.registration_deadline || null,
        venue: primary.venue || null,
        eligibility: primary.eligibility || 'Open to all students',
        target_departments: primary.target_departments || ['All'],
        target_years: primary.target_years || ['All'],
        required_action: primary.required_action || null,
        urgency_reason: primary.urgency_reason || null,
        registration_url: primary.registration_url || null,
        tags: primary.tags || [primary.category || 'Campus'],
        raw_text: inputText,
        source: sourceType,
        evidence: primary.evidence || {},
        date_resolution: primary.date_resolution || null,
        confidence: primary.confidence || { overall: 85, date: 'high', venue: 'high', required_action: 'high' },
        missing_fields: primary.missing_fields || [],
        warnings: primary.warnings || [],
        created_at: new Date().toISOString(),
      };

      // Check conflicts
      const clashList = checkConflictsAndDuplicates(newAnnouncement, existingAnnouncements);
      setConflicts(clashList);
      setExtractedData(newAnnouncement);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to parse notice. You can enter details manually.');
    } finally {
      setIsExtracting(false);
      setExtractionStep('');
    }
  };

  const handleStartManual = () => {
    setIsManualMode(true);
    setExtractedData({
      id: `ann-${Date.now()}`,
      title: '',
      description: '',
      kind: 'event',
      category: 'Workshops',
      organizer: '',
      event_date: '2026-11-05',
      event_time: '11:00 AM',
      registration_deadline: '2026-11-04',
      venue: '',
      eligibility: 'Open to all students',
      target_departments: ['All'],
      target_years: ['All'],
      required_action: '',
      urgency_reason: '',
      registration_url: '',
      tags: ['Campus'],
      raw_text: inputText || 'Manual Entry',
      source: 'manual',
      evidence: {},
      date_resolution: null,
      confidence: { overall: 100, date: 'high', venue: 'high', required_action: 'high' },
      missing_fields: [],
      warnings: [],
      created_at: new Date().toISOString(),
    });
  };

  const handleConfirmPublish = () => {
    if (!extractedData) return;
    if (!extractedData.title.trim()) {
      setErrorMsg('Please provide a title for the announcement.');
      return;
    }
    onAnnouncementCreated(extractedData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#292A28] tracking-tight">
          AI Announcement Ingestion Studio
        </h2>
        <p className="text-xs text-[#787774] mt-1">
          Paste messy forwards from WhatsApp, Instagram captions, or college notice boards. Campus Radar extracts dates, links, venues, and deadlines with evidence validation.
        </p>
      </div>

      {!extractedData ? (
        /* STEP 1: Input and Analysis */
        <div className="bg-white border border-[#E0DBD0] rounded-3xl p-6 shadow-xs space-y-5">
          {/* Source Selector & Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#292A28]">
                Select Source Channel
              </label>
              <span className="text-[11px] text-[#787774]">
                Resolves relative terms (e.g. "tomorrow") against Asia/Kolkata
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['whatsapp', 'email', 'instagram', 'poster', 'notice_board'] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceType(src)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                    sourceType === src
                      ? 'bg-[#292A28] text-white border-[#292A28]'
                      : 'bg-[#FAF8F3] text-[#787774] border-[#E8E5DF] hover:border-[#C96B35]/40'
                  }`}
                >
                  {src.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Sample Chips */}
          <div>
            <div className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider mb-2">
              Try an Example (Instant Hackathon Demo)
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {SAMPLE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(chip.text);
                    setErrorMsg(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#FDF3EB] text-[#C96B35] font-semibold border border-[#F8DCBA] hover:bg-[#FBE8DA] transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste unstructured announcement here... (e.g. 'Hey everyone! E-Cell is organizing bootcamp next Friday at 11 AM in Seminar Hall 2. Reg closes tomorrow night...')"
              className="w-full p-4 rounded-2xl bg-[#FAF8F3] border border-[#E0DBD0] text-sm text-[#292A28] placeholder-[#9B9890] focus:outline-none focus:border-[#C96B35] transition-colors leading-relaxed font-sans"
            />
            <div className="flex items-center justify-between mt-2 text-[11px] text-[#787774]">
              <span>Anchor reference date: <strong className="text-[#292A28]">Sat, 31 Oct 2026</strong></span>
              <span>{inputText.length} characters</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#FDECEA] border border-[#F9D2CE] text-xs text-[#B42318] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleStartManual}
                className="underline font-bold text-[#B42318] hover:text-[#911C13]"
              >
                Create Manually
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleStartManual}
              className="text-xs font-semibold text-[#787774] hover:text-[#292A28] flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Fill details manually</span>
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isExtracting || !inputText.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isExtracting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{extractionStep || 'Analyzing with Gemini...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Announcement</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Dual-Pane Review and Confirmation */
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Conflict Alert Banner */}
          {conflicts.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FEF9EE] border border-[#E7B96C] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A5A1C]">
                <AlertTriangle className="w-4 h-4 text-[#C96B35]" />
                <span>Notice Hygiene Alert ({conflicts.length} potential clash/duplicate)</span>
              </div>
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs text-[#5C4212] pl-6">
                  • {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Date Resolution Callout */}
          {extractedData.date_resolution && (
            <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E0DBD0] flex items-center gap-3 text-xs text-[#55524E]">
              <Calendar className="w-4 h-4 text-[#C96B35] shrink-0" />
              <span>
                <strong>Temporal Intelligence:</strong> Resolved relative phrase <em>"{extractedData.date_resolution.phrase}"</em> → {extractedData.event_date || extractedData.registration_deadline} ({extractedData.date_resolution.assumption})
              </span>
            </div>
          )}

          {/* Dual-Pane Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Editable Structured Intelligence (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E0DBD0] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
                <span className="text-xs font-bold text-[#292A28]">
                  Extracted Intelligence (Editable)
                </span>
                <span className="text-[11px] font-mono text-[#C96B35] font-semibold">
                  Confidence: {extractedData.confidence.overall}%
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={extractedData.title}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs font-bold text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                />
              </div>

              {/* Category and Kind */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value as AnnouncementCategory })}
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Kind
                  </label>
                  <select
                    value={extractedData.kind}
                    onChange={(e) => setExtractedData({ ...extractedData, kind: e.target.value as AnnouncementKind })}
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
                  >
                    <option value="event">Event (Time & Place)</option>
                    <option value="deadline">Deadline (Cutoff date)</option>
                    <option value="opportunity">Opportunity (Open call)</option>
                    <option value="announcement">Announcement (Info only)</option>
                  </select>
                </div>
              </div>

              {/* Organizer and Venue */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={extractedData.organizer}
                    onChange={(e) => setExtractedData({ ...extractedData, organizer: e.target.value })}
                    placeholder="e.g. E-Cell, GDSC"
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={extractedData.venue || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, venue: e.target.value || null })}
                    placeholder="e.g. Seminar Hall 2, Block B"
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={extractedData.event_date || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, event_date: e.target.value || null })}
                    className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Event Time
                  </label>
                  <input
                    type="text"
                    value={extractedData.event_time || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, event_time: e.target.value || null })}
                    placeholder="11:00 AM"
                    className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Reg. Deadline
                  </label>
                  <input
                    type="text"
                    value={extractedData.registration_deadline || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, registration_deadline: e.target.value || null })}
                    placeholder="2026-11-01 23:59"
                    className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Required Action & Registration Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Required Action
                  </label>
                  <input
                    type="text"
                    value={extractedData.required_action || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, required_action: e.target.value || null })}
                    placeholder="e.g. Bring physical ID, RSVP"
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                    Registration Link
                  </label>
                  <input
                    type="url"
                    value={extractedData.registration_url || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, registration_url: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Original Text & Evidence Side-by-Side (5 cols) */}
            <div className="lg:col-span-5 bg-[#FAF8F3] border border-[#E0DBD0] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] mb-3">
                  <span className="text-xs font-bold text-[#292A28] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C96B35]" />
                    Raw Communication & Quotes
                  </span>
                  <span className="text-[10px] text-[#787774] font-medium uppercase">
                    Channel: {extractedData.source}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#E0DBD0] font-mono text-xs text-[#333] leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap select-text mb-4">
                  {extractedData.raw_text}
                </div>

                {/* Evidence quotes */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block">
                    Verified Quotes
                  </span>
                  {Object.keys(extractedData.evidence || {}).length > 0 ? (
                    Object.entries(extractedData.evidence).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-white border border-[#E8E5DF] text-xs">
                        <span className="font-semibold text-[#C96B35] capitalize block text-[10px]">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="italic text-[#444]">"{val}"</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8C8880] italic">
                      No direct quotes attached.
                    </div>
                  )}
                </div>

                {/* Missing Fields list */}
                {extractedData.missing_fields?.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-[#E8E5DF] text-xs">
                    <span className="font-semibold text-[#8C8880] block text-[10px] uppercase">
                      Fields Missing in Raw Text:
                    </span>
                    <span className="text-[#666]">{extractedData.missing_fields.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EAE6DF] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#787774] hover:bg-[#EFECE6] transition-colors"
                >
                  Discard & Re-paste
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm and Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
