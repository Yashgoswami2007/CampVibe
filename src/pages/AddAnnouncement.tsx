import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  PenTool,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { AnnouncementCategory, AnnouncementKind, CampusAnnouncement, StudentProfile } from '../types';
import { checkConflictsAndDuplicates, ConflictNotice } from '../lib/conflicts';
import { Permissions } from '../lib/permissions';

interface AddAnnouncementProps {
  profile: StudentProfile;
  existingAnnouncements: CampusAnnouncement[];
  onAnnouncementCreated: (announcement: CampusAnnouncement) => void;
  onCancel: () => void;
  onSwitchPersona?: () => void;
}

const SAMPLE_CHIPS = [
  {
    label: 'E-Cell Bootcamp (Urgent Reg.)',
    text: 'Hey everyone! Our E-Cell is organizing an entrepreneurship bootcamp next Friday at 11 AM in Seminar Hall 2. Registrations close tomorrow night. Only 50 seats available. Open to all branches. Register ASAP at https://ecell.mitmoradabad.edu/bootcamp26',
  },
  {
    label: '2nd Year Exam (Block B)',
    text: 'URGENT!! All 2nd year CSE students are informed that Mid-Term DBMS assessment will be conducted on 4th November at 10 AM in Block B. Bring your physical ID card. Attendance is 100% compulsory.',
  },
  {
    label: 'National AI Hackathon (Nov 1 Deadline)',
    text: 'URGENT REMINDER: Registrations for National AI Hackathon 2026 close tomorrow midnight (Nov 1)! Grand prize ₹2.5L. Venue: Campus Innovation Center, Block C. Open to 2nd-4th year CSE/IT/ECE. Register before slots fill up: https://hackathon.mitmoradabad.edu/apply',
  },
  {
    label: 'Placement Mock Interviews',
    text: 'Final Year placement mock interviews tomorrow Sunday Nov 1 slotting ends at noon. Session on Monday Nov 2 at 2 PM in Aud 1. Formals mandatory. 2 resume copies needed.',
  },
];

const CATEGORIES: AnnouncementCategory[] = [
  'Academic',
  'Examination',
  'Assignment',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Competition',
  'Internship',
  'Placement',
  'Cultural Event',
  'Sports',
  'Club Activity',
  'Research',
  'Scholarship',
  'General Notice',
  'Important Announcement',
  'Technology',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Entrepreneurship',
  'Other',
];

export const AddAnnouncement: React.FC<AddAnnouncementProps> = ({
  profile,
  existingAnnouncements,
  onAnnouncementCreated,
  onCancel,
  onSwitchPersona,
}) => {
  const [inputText, setInputText] = useState('');
  const [sourceType, setSourceType] = useState<'whatsapp' | 'email' | 'instagram' | 'poster' | 'notice_board' | 'circular'>('whatsapp');
  const [posterImage, setPosterImage] = useState<{ data: string; mimeType: string; preview: string; name: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted item state for preview & editing
  const [extractedData, setExtractedData] = useState<CampusAnnouncement | null>(null);
  const [conflicts, setConflicts] = useState<ConflictNotice[]>([]);

  // Role Gate: Student cannot create announcements per matrix
  if (Permissions.isStudent(profile)) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Announcement Creation Restricted
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            According to the <strong>Role and Permission Matrix</strong>, Student accounts have read-only access to published campus notices (<em>Create Announcements: No</em>). Creation authority is reserved for <strong>Club Heads</strong> (for their assigned club) and <strong>Super Admins</strong>.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-sm mx-auto text-xs space-y-1.5">
          <div className="font-bold text-slate-800">Current Persona:</div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Name:</span>
            <span className="font-semibold">{profile.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Role:</span>
            <span className="font-semibold uppercase text-blue-700">Student</span>
          </div>
        </div>

        {onSwitchPersona && (
          <div>
            <button
              type="button"
              onClick={onSwitchPersona}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              Switch to Aarav Sen (Club Head) or Dr. Rajesh Sharma (Admin)
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || file.type;

      setPosterImage({
        data: base64,
        mimeType,
        preview: dataUrl,
        name: file.name,
      });
      setSourceType('poster');
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSamplePoster = () => {
    // Generate a clean demonstration flyer SVG
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#121620"/>
      <rect x="20" y="20" width="560" height="360" rx="20" fill="#FFFFFF" stroke="#ECEEF2" stroke-width="2"/>
      <text x="300" y="75" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="800" fill="#181B20" text-anchor="middle">ROBOTICS ROVER GRAND PRIX 2026</text>
      <text x="300" y="115" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" fill="#64748B" text-anchor="middle">Moradabad Institute of Technology · Robotics Society</text>
      <line x1="60" y1="135" x2="540" y2="135" stroke="#E2E8F0" stroke-width="1.5"/>
      <text x="70" y="175" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" fill="#0F172A">Event Date: November 14, 2026 at 9:00 AM</text>
      <text x="70" y="205" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" fill="#0F172A">Venue: Mechanical Workshop &amp; FabLab, Block D</text>
      <text x="70" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" fill="#E11D48">Registration Deadline: November 9, 2026 (6:00 PM)</text>
      <text x="70" y="268" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" fill="#475569">Eligibility: All 2nd, 3rd, and 4th year Mech, ECE &amp; CSE students</text>
      <text x="70" y="295" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" fill="#475569">Format: Team of 3. Microcontroller kits provided on site.</text>
      <rect x="70" y="318" width="460" height="36" rx="10" fill="#181B20"/>
      <text x="300" y="341" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle">Register: https://fablab.mitmoradabad.edu/robotics-sprint</text>
    </svg>`;

    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    setPosterImage({
      data: base64,
      mimeType: 'image/svg+xml',
      preview: dataUrl,
      name: 'robotics_rover_poster_2026.svg',
    });
    setSourceType('poster');
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !posterImage) {
      setErrorMsg('Please paste announcement text or upload an event poster image before analyzing.');
      return;
    }

    setErrorMsg(null);
    setIsExtracting(true);
    setExtractionStep(posterImage ? 'Scanning poster with Gemini Multimodal Vision...' : 'Reading communication & tokenizing...');

    try {
      setTimeout(() => setExtractionStep('Extracting structured dates, venue, and required actions...'), 700);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText || 'Extracted from uploaded campus event poster image',
          image: posterImage ? { data: posterImage.data, mimeType: posterImage.mimeType } : undefined,
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
        throw new Error(json.data?.not_a_notice_reason || 'This message or poster did not contain an actionable campus announcement.');
      }

      const primary = extractedItems[0];
      const newAnnouncement: CampusAnnouncement = {
        id: `ann-${Date.now()}`,
        title: primary.title || 'Untitled Campus Notice',
        description: primary.description || inputText.slice(0, 250) || 'Event extracted from poster image.',
        kind: primary.kind || 'event',
        category: primary.category || 'Academic',
        organizer: primary.organizer || 'MiT Committee',
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
        raw_text: inputText || `[Poster OCR Extract: ${posterImage?.name}]`,
        source: sourceType,
        evidence: primary.evidence || {},
        date_resolution: primary.date_resolution || null,
        confidence: primary.confidence || { overall: 90, date: 'high', venue: 'high', required_action: 'high' },
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
    setExtractedData({
      id: `ann-${Date.now()}`,
      title: '',
      description: '',
      kind: 'event',
      category: 'Workshop',
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

    const isHead = Permissions.isHead(profile);
    const canBypass = Boolean(profile.explicit_permissions?.can_bypass_approval);
    const status = isHead && !canBypass ? 'pending_approval' : 'published';

    const payload: CampusAnnouncement = {
      ...extractedData,
      status,
      club_id: isHead ? (profile.assigned_club_id || extractedData.club_id) : extractedData.club_id,
      created_by_user_id: profile.id,
      created_by_name: profile.name,
      created_by_role: profile.role || 'student',
      organizer: isHead && profile.assigned_club_name ? profile.assigned_club_name : (extractedData.organizer || 'MiT Campus'),
    };
    onAnnouncementCreated(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {Permissions.isHead(profile) ? `Post ${profile.assigned_club_name || 'Club'} Announcement` : 'AI Announcement Ingestion Studio'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              Permissions.isHead(profile)
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
            }`}>
              {Permissions.isHead(profile) ? 'Club Head Scope' : 'Super Admin Scope'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {Permissions.isHead(profile)
              ? `Authorized to submit notices on behalf of ${profile.assigned_club_name || 'your assigned club'}. Notices will go to the Approval Queue.`
              : 'Paste forwards from WhatsApp, circulars, or upload posters. MiT AI extracts verified dates, venue, and deadlines.'}
          </p>
        </div>
      </div>

      {!extractedData ? (
        /* STEP 1: Input and Analysis */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          {/* Source Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900">
                Select Source Channel
              </label>
              <span className="text-[11px] text-slate-400">
                Supports WhatsApp, emails, circulars, and event posters
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['whatsapp', 'email', 'instagram', 'poster', 'circular', 'notice_board'] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceType(src)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    sourceType === src
                      ? 'bg-[#181B20] text-white border-[#181B20] shadow-2xs'
                      : 'bg-[#F8F9FA] text-slate-600 border-slate-200/80 hover:border-slate-400'
                  }`}
                >
                  {src.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Poster Upload Dropzone / OCR Area */}
          <div className="p-4 rounded-2xl bg-[#F8F9FA] border-2 border-dashed border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ImageIcon className="w-4 h-4 text-slate-700" />
                <span>Upload Event Poster (Gemini Multimodal Vision OCR)</span>
              </div>
              <button
                type="button"
                onClick={handleLoadSamplePoster}
                className="text-[11px] font-semibold text-slate-800 hover:text-black px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 transition-colors shadow-2xs cursor-pointer"
              >
                Try Sample Poster Flyer
              </button>
            </div>

            {posterImage ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <img
                    src={posterImage.preview}
                    alt="Event Poster Preview"
                    className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                      {posterImage.name}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Poster loaded · Ready for vision OCR extraction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPosterImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Remove Poster"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-400 transition-colors cursor-pointer text-center space-y-1">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-bold text-slate-800">
                  Click to browse event flyer or drag & drop poster image
                </span>
                <span className="text-[10px] text-slate-400">
                  PNG, JPG, WebP supported. AI will extract title, dates, deadlines, and registration URLs.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Quick Sample Text Chips */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Or Try a Text Sample (Instant WhatsApp / Circular Demo)
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
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#F8F9FA] text-slate-700 font-medium border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste unstructured announcement message, circular text, email forward, or WhatsApp blast here..."
              className="w-full p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors leading-relaxed font-sans"
            />
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Anchor reference date: <strong className="text-slate-700">Sat, 31 Oct 2026</strong></span>
              <span>{inputText.length} characters</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleStartManual}
                className="underline font-bold text-rose-800 hover:text-rose-950 cursor-pointer"
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
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Fill details manually</span>
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isExtracting || (!inputText.trim() && !posterImage)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#181B20] text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{extractionStep || 'Analyzing with Gemini...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze {posterImage ? 'Poster & Message' : 'Announcement'}</span>
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
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice Hygiene Alert ({conflicts.length} potential clash/duplicate)</span>
              </div>
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs text-amber-800 pl-6">
                  • {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Date Resolution Callout */}
          {extractedData.date_resolution && (
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 flex items-center gap-3 text-xs text-slate-700">
              <Calendar className="w-4 h-4 text-slate-800 shrink-0" />
              <span>
                <strong>Temporal Intelligence:</strong> Resolved relative phrase <em>"{extractedData.date_resolution.phrase}"</em> → {extractedData.event_date || extractedData.registration_deadline} ({extractedData.date_resolution.assumption})
              </span>
            </div>
          )}

          {/* Dual-Pane Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Editable Structured Intelligence (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Extracted Intelligence (Editable)
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  Confidence: {extractedData.confidence.overall}%
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={extractedData.title}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
                />
              </div>

              {/* Category and Kind */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value as AnnouncementCategory })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kind
                  </label>
                  <select
                    value={extractedData.kind}
                    onChange={(e) => setExtractedData({ ...extractedData, kind: e.target.value as AnnouncementKind })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Organizer {Permissions.isHead(profile) && '(Locked to Assigned Club)'}
                  </label>
                  <input
                    type="text"
                    value={Permissions.isHead(profile) ? (profile.assigned_club_name || extractedData.organizer) : extractedData.organizer}
                    disabled={Permissions.isHead(profile)}
                    onChange={(e) => setExtractedData({ ...extractedData, organizer: e.target.value })}
                    placeholder="e.g. E-Cell, GDSC"
                    className={`w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none ${
                      Permissions.isHead(profile) ? 'bg-slate-100 cursor-not-allowed text-slate-600 font-semibold' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={extractedData.venue || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, venue: e.target.value || null })}
                    placeholder="e.g. Seminar Hall 2, Block B"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={extractedData.event_date || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, event_date: e.target.value || null })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Event Time
                  </label>
                  <input
                    type="text"
                    value={extractedData.event_time || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, event_time: e.target.value || null })}
                    placeholder="11:00 AM"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Reg. Deadline
                  </label>
                  <input
                    type="text"
                    value={extractedData.registration_deadline || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, registration_deadline: e.target.value || null })}
                    placeholder="2026-11-01 23:59"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Required Action & Registration Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Required Action
                  </label>
                  <input
                    type="text"
                    value={extractedData.required_action || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, required_action: e.target.value || null })}
                    placeholder="e.g. Bring physical ID, RSVP"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Registration Link
                  </label>
                  <input
                    type="url"
                    value={extractedData.registration_url || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, registration_url: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Original Text & Evidence Side-by-Side (5 cols) */}
            <div className="lg:col-span-5 bg-[#F8F9FA] border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    Raw Communication & Quotes
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase">
                    Channel: {extractedData.source}
                  </span>
                </div>

                {posterImage && (
                  <div className="mb-3 p-2 bg-white rounded-2xl border border-slate-200">
                    <img
                      src={posterImage.preview}
                      alt="Uploaded poster"
                      className="w-full max-h-48 object-contain rounded-xl bg-slate-100"
                    />
                    <div className="text-[10px] text-slate-500 text-center mt-1">
                      Poster Vision Input: {posterImage.name}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 font-mono text-xs text-slate-800 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-text mb-4">
                  {extractedData.raw_text}
                </div>

                {/* Evidence quotes */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verified Quotes
                  </span>
                  {Object.keys(extractedData.evidence || {}).length > 0 ? (
                    Object.entries(extractedData.evidence).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                        <span className="font-semibold text-slate-800 capitalize block text-[10px]">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="italic text-slate-600">"{val}"</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      No direct quotes attached.
                    </div>
                  )}
                </div>

                {/* Missing Fields list */}
                {extractedData.missing_fields?.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                      Fields Missing in Raw Text:
                    </span>
                    <span className="text-slate-600">{extractedData.missing_fields.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Discard & Re-paste
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {Permissions.isHead(profile) && !profile.explicit_permissions?.can_bypass_approval
                      ? 'Submit for Faculty Approval'
                      : 'Confirm & Publish College-Wide'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
