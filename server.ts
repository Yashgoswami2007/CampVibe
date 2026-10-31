import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// JSON schema for Extraction
const extractionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    is_notice: { type: Type.BOOLEAN, description: 'Whether the text is a campus notice, event, or announcement' },
    not_a_notice_reason: { type: Type.STRING, description: 'Explanation if the text is not a campus notice' },
    items: {
      type: Type.ARRAY,
      description: 'Extracted campus announcements (1 or more if batch paste)',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Clear, concise title of the announcement' },
          description: { type: Type.STRING, description: 'Accurate summary of key details' },
          kind: {
            type: Type.STRING,
            enum: ['event', 'deadline', 'announcement', 'opportunity'],
            description: 'deadline = registration/submission cutoff; event = occurs at time/place; opportunity = application open; announcement = info only',
          },
          category: {
            type: Type.STRING,
            enum: [
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
              'Cultural Activities',
              'Workshops',
              'Academics',
              'Other',
            ],
          },
          organizer: { type: Type.STRING, description: 'Club, department, society, or faculty organizing this' },
          event_date: { type: Type.STRING, description: 'YYYY-MM-DD format if mentioned, null otherwise' },
          event_time: { type: Type.STRING, description: 'Time string (e.g. 10:00 AM or 14:00) if mentioned, null otherwise' },
          registration_deadline: { type: Type.STRING, description: 'YYYY-MM-DD or YYYY-MM-DD HH:mm if mentioned, null otherwise' },
          venue: { type: Type.STRING, description: 'Location, room, hall, or lab if stated, null otherwise' },
          eligibility: { type: Type.STRING, description: 'Eligible branches, CGPA, or batch years if stated, null otherwise' },
          target_departments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Explicitly mentioned branches/departments, or ["All"]',
          },
          target_years: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Explicitly mentioned years e.g. ["2nd Year", "3rd Year"], or ["All"]',
          },
          required_action: { type: Type.STRING, description: 'Concrete action student must take (register, bring ID, etc.)' },
          urgency_reason: { type: Type.STRING, description: 'Why this requires quick attention if applicable' },
          registration_url: { type: Type.STRING, description: 'Extracted URL if present in the text, null otherwise' },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 key topical tags',
          },
          evidence: {
            type: Type.OBJECT,
            properties: {
              event_date: { type: Type.STRING },
              event_time: { type: Type.STRING },
              registration_deadline: { type: Type.STRING },
              venue: { type: Type.STRING },
              eligibility: { type: Type.STRING },
              required_action: { type: Type.STRING },
            },
            description: 'Verbatim quoted substrings from original text substantiating each extracted field',
          },
          date_resolution: {
            type: Type.OBJECT,
            properties: {
              phrase: { type: Type.STRING, description: 'The original date phrase like "tomorrow" or "next Friday"' },
              method: { type: Type.STRING, enum: ['relative', 'absolute', 'inferred'] },
              assumption: { type: Type.STRING, description: 'Explanation of how the date was resolved' },
            },
          },
          missing_fields: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of important fields that were not mentioned (e.g. venue, registration deadline, organizer)',
          },
          warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Any ambiguities, date clashes, or missing links mentioned in text',
          },
          confidence: {
            type: Type.OBJECT,
            properties: {
              overall: { type: Type.NUMBER, description: '0 to 100 confidence score' },
              date: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              venue: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              required_action: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
            },
          },
        },
        required: ['title', 'description', 'kind', 'category', 'organizer'],
      },
    },
  },
  required: ['is_notice'],
};

// JSON schema for Weekly Digest
const digestResponseSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'A sharp, motivational 1-sentence weekly headline for this student' },
    summary: { type: Type.STRING, description: '2-3 sentence executive summary of this week campus dynamics' },
    must_do: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The exact announcement ID' },
          title: { type: Type.STRING, description: 'Title of the announcement' },
          line: { type: Type.STRING, description: 'Action-oriented line explaining what to do and when' },
          deadline: { type: Type.STRING, description: 'Deadline date/time string' },
        },
        required: ['id', 'title', 'line'],
      },
    },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'YYYY-MM-DD' },
          weekday: { type: Type.STRING, description: 'Day name (e.g. Monday, Friday)' },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Exact announcement ID' },
                title: { type: Type.STRING },
                text: { type: Type.STRING },
                time: { type: Type.STRING },
                venue: { type: Type.STRING },
                category: { type: Type.STRING },
              },
              required: ['id', 'title', 'text'],
            },
          },
        },
        required: ['date', 'weekday', 'items'],
      },
    },
    heads_up: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: 'Heads-up note regarding upcoming deadlines or preparations' },
          related_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['text', 'related_ids'],
      },
    },
  },
  required: ['headline', 'summary', 'must_do', 'days', 'heads_up'],
};

// JSON schema for AI Campus Assistant
const assistantResponseSchema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: 'Accurate, clear, friendly answer to the student query based only on the provided campus announcements',
    },
    related_announcement_ids: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'IDs of announcements directly relevant to the answer',
    },
    suggested_followups: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 3 natural follow-up questions',
    },
  },
  required: ['answer', 'related_announcement_ids'],
};

// Fallback deterministic extraction when Gemini is unreachable or error occurs
function createFallbackExtraction(text: string, today: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0] ? lines[0].slice(0, 80) : 'Campus Announcement';
  
  // Extract URL if present
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  const registration_url = urlMatch ? urlMatch[0] : null;

  // Extract time if present
  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/);
  const event_time = timeMatch ? timeMatch[1] : null;

  // Basic category heuristic
  let category = 'Academics';
  const lower = text.toLowerCase();
  if (lower.includes('hackathon')) category = 'Hackathons';
  else if (lower.includes('internship') || lower.includes('stipend')) category = 'Internships';
  else if (lower.includes('placement') || lower.includes('interview')) category = 'Placements';
  else if (lower.includes('workshop') || lower.includes('hands-on')) category = 'Workshops';
  else if (lower.includes('ai') || lower.includes('machine learning')) category = 'Artificial Intelligence';
  else if (lower.includes('cricket') || lower.includes('sports')) category = 'Sports';
  else if (lower.includes('dance') || lower.includes('fest') || lower.includes('music')) category = 'Cultural Activities';
  else if (lower.includes('e-cell') || lower.includes('startup') || lower.includes('pitch')) category = 'Entrepreneurship';

  return {
    is_notice: true,
    items: [
      {
        title,
        description: text.slice(0, 300),
        kind: lower.includes('deadline') || lower.includes('last date') ? 'deadline' : 'event',
        category,
        organizer: 'Campus Organizer',
        event_date: today,
        event_time,
        registration_deadline: null,
        venue: null,
        eligibility: 'All students',
        target_departments: ['All'],
        target_years: ['All'],
        required_action: registration_url ? 'Register via link' : 'Check with organizer',
        urgency_reason: lower.includes('urgent') ? 'Marked urgent in original post' : null,
        registration_url,
        tags: [category, 'Campus'],
        evidence: {},
        date_resolution: {
          phrase: 'today',
          method: 'inferred',
          assumption: 'Extracted via fallback parser',
        },
        missing_fields: ['venue', 'registration_deadline'],
        warnings: ['Parsed with offline fallback parser. Please review and verify all fields.'],
        confidence: {
          overall: 70,
          date: 'medium',
          venue: 'low',
          required_action: 'medium',
        },
      },
    ],
  };
}

// Fallback deterministic digest generator
function createFallbackDigest(notices: any[], profile: any, todayStr: string) {
  const sorted = [...notices].sort((a, b) => {
    const da = a.registration_deadline || a.event_date || '9999';
    const db = b.registration_deadline || b.event_date || '9999';
    return da.localeCompare(db);
  });

  const must_do = sorted.slice(0, 3).map(n => ({
    id: n.id,
    title: n.title,
    line: n.required_action || `Review and act on ${n.title}`,
    deadline: n.registration_deadline || n.event_date || 'Upcoming',
  }));

  const dayMap: Record<string, any[]> = {};
  sorted.forEach(n => {
    const d = n.event_date || n.registration_deadline?.split(' ')[0] || todayStr;
    if (!dayMap[d]) dayMap[d] = [];
    dayMap[d].push({
      id: n.id,
      title: n.title,
      text: n.description?.slice(0, 100) || n.title,
      time: n.event_time || undefined,
      venue: n.venue || undefined,
      category: n.category,
    });
  });

  const days = Object.entries(dayMap).slice(0, 4).map(([date, items]) => {
    const dateObj = new Date(date);
    const weekday = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-US', { weekday: 'long' })
      : 'Upcoming';
    return { date, weekday, items };
  });

  return {
    headline: `Focus on ${sorted[0]?.title || 'upcoming deadlines'} this week, ${profile?.name?.split(' ')[0] || 'student'}.`,
    summary: `You have ${sorted.length} active opportunities tailored to your ${profile?.department || 'engineering'} track. Stay on top of your deadlines to avoid missing registrations.`,
    must_do,
    days,
    heads_up: [
      {
        text: 'Registrations are filling quickly for technical workshops and hackathons. Confirm your participation early.',
        related_ids: sorted.slice(0, 2).map(n => n.id),
      },
    ],
  };
}

// Fallback deterministic assistant when Gemini is unreachable or error occurs
function createFallbackAssistant(query: string, announcements: any[], profile: any, todayStr: string) {
  const q = (query || '').toLowerCase();
  const matched = announcements.filter(a => {
    const hay = `${a.title} ${a.category} ${a.description} ${(a.tags || []).join(' ')} ${a.organizer}`.toLowerCase();
    return q.split(/\s+/).some(term => term.length > 2 && hay.includes(term));
  });

  const picks = matched.length > 0 ? matched.slice(0, 4) : announcements.slice(0, 3);
  let answer = '';
  if (q.includes('today') || q.includes('happening')) {
    const todayItems = announcements.filter(a => a.event_date === todayStr);
    if (todayItems.length > 0) {
      answer = `Here is what is scheduled on campus for today (${todayStr}): ${todayItems.map(i => `"${i.title}" at ${i.venue || 'Campus'}${i.event_time ? ` (${i.event_time})` : ''}`).join(', ')}.`;
    } else {
      answer = `There are no events taking place on campus today (${todayStr}), but you have time-critical deadlines approaching shortly like "${picks[0]?.title}".`;
    }
  } else if (q.includes('deadline') || q.includes('urgent') || q.includes('close') || q.includes('closing')) {
    const deadlineItems = [...announcements].filter(a => a.registration_deadline).sort((a, b) => (a.registration_deadline || '').localeCompare(b.registration_deadline || ''));
    answer = `Here are the top approaching deadlines: ${deadlineItems.slice(0, 3).map(i => `"${i.title}" (cutoff: ${i.registration_deadline})`).join(', ')}.`;
  } else if (q.includes('intern') || q.includes('placement')) {
    const careerItems = announcements.filter(a => a.category === 'Internship' || a.category === 'Placement' || a.category === 'Internships' || a.category === 'Placements');
    answer = `Found ${careerItems.length} active career & placement drives: ${careerItems.map(c => `"${c.title}" organized by ${c.organizer}`).join('; ')}.`;
  } else {
    answer = `Based on current campus notices for ${profile?.name || 'you'} (${profile?.department || 'Engineering'}), I found ${picks.length} relevant items: ${picks.map(p => `"${p.title}"`).join(', ')}. Check out the linked cards below!`;
  }

  return {
    answer,
    related_announcement_ids: picks.map(p => p.id),
    suggested_followups: [
      'What deadlines are closing in the next 48 hours?',
      'Show me hackathons and workshops',
      `Find opportunities for ${profile?.department || 'my department'}`,
    ],
  };
}

async function callGeminiWithRetry(params: any, timeoutMs = 12000): Promise<any> {
  if (!ai) return null;
  const requestedModel = params.model || 'gemini-3.8-flash';
  // Fallback candidate chain: requested model, then gemini-3.1-flash-lite, then gemini-flash-latest
  const fallbackCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const modelsToTry = [requestedModel, ...fallbackCandidates.filter(m => m !== requestedModel)];

  let lastError: any = null;

  for (const model of modelsToTry) {
    let timer: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Model ${model} timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      const callPromise = ai.models.generateContent({
        ...params,
        model,
      });
      const result = await Promise.race([callPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);
      return result;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      lastError = err;
      console.warn(`[Gemini API] Call with model ${model} failed (${err?.message || err}). Trying next candidate...`);
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Campus Radar API',
      aiConfigured: Boolean(ai),
      model: 'gemini-3.8-flash / gemini-3.1-flash-lite',
      serverTime: new Date().toISOString(),
    });
  });

  // POST /api/extract
  app.post('/api/extract', async (req: Request, res: Response) => {
    try {
      const { text, image, today, weekday, tz } = req.body;

      if ((!text || typeof text !== 'string' || text.trim().length < 3) && !image) {
        return res.status(400).json({
          error: 'Please paste an announcement message or upload an event poster image.',
        });
      }

      const effectiveToday = today || '2026-10-31';
      const effectiveWeekday = weekday || 'Saturday';
      const effectiveTz = tz || 'Asia/Kolkata';

      if (!ai) {
        // Graceful fallback if no Gemini key configured
        const fallbackText = text || 'Campus Notice Event Poster';
        const fallback = createFallbackExtraction(fallbackText, effectiveToday);
        return res.json({
          success: true,
          data: fallback,
          is_fallback: true,
          notice: 'Extracted using local heuristic fallback (Gemini API key not configured).',
        });
      }

      const hasText = text && typeof text === 'string' && text.trim().length > 0 && text.trim() !== 'Extracted from uploaded campus event poster image';

      const promptText = `You are the lead intelligence parser for Campus Radar at an Indian university campus.
Extract verified, highly structured announcement data from the provided campus communication or event poster image.

ANCHOR TIME CONTEXT:
- Today's date: ${effectiveToday}
- Today's day of week: ${effectiveWeekday}
- Reference timezone: ${effectiveTz}

CRITICAL RULES:
1. Multimodal Poster Vision OCR:
   - Carefully inspect ALL text in the poster image: main title, headings, organizers, sponsor logos (e.g. Google for Developers, CSSS, Hack2skill), event date, event hours, venue, registration deadlines, prizes (e.g. ₹10k+), requirements (GitHub, deployment, laptop), and contact info.
   - For title: Extract the actual official event title from the poster (e.g., "PromptWars X CSSS: Build with AI 2026"). NEVER output generic placeholders like "Extracted from uploaded campus event poster image".
   - For organizer: Identify clubs, departments, or organizations mentioned (e.g., "CSSS (Computer Science Students Society) & Hack2skill").
   - For venue: Extract specific hall/auditorium/building (e.g., "D-Block Auditorium, MIT Moradabad").
   - For kind: Use "event" for hackathons, workshops, and buildathons; "deadline" for cutoff announcements; "opportunity" for open applications.
   - For category: Pick the closest category (e.g., "Hackathon", "Workshop", "Technology", "Artificial Intelligence").
2. Temporal Resolution:
   - Event Date: If stated as "31 October 2026", resolve to "2026-10-31".
   - Event Time: e.g. "9 AM - 5 PM".
   - Registration Deadline: If stated as "31st October 12:00 a.m.", resolve to "2026-10-31 00:00".
   - If relative (e.g. "today", "tomorrow"), resolve relative to ${effectiveToday}.
3. Verbatim Evidence Quotes:
   - For event_date, event_time, venue, registration_deadline, required_action: quote the exact text string as seen in the poster or message.
4. Confidence Score:
   - Return overall confidence as an integer between 0 and 100 (e.g., 95).

${hasText ? `ACCOMPANYING TEXT:\n<notice>\n${text.trim().slice(0, 8000)}\n</notice>` : 'NOTE: Extract all announcement details directly from the uploaded poster flyer image.'}`;

      const parts: any[] = [];
      if (image && image.data && image.mimeType) {
        if (image.mimeType === 'image/svg+xml') {
          try {
            const svgContent = Buffer.from(image.data, 'base64').toString('utf-8');
            parts.push({ text: `[EVENT POSTER SVG CONTENT]:\n${svgContent}` });
          } catch {
            parts.push({
              inlineData: {
                data: image.data,
                mimeType: image.mimeType,
              },
            });
          }
        } else {
          parts.push({
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          });
        }
      }
      parts.push({ text: promptText });

      const response = await callGeminiWithRetry(
        {
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: extractionResponseSchema,
          },
        },
        12000
      );

      const rawJson = (response?.text || '{}').trim();
      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (jsonErr) {
        console.warn('Could not parse Gemini JSON response:', jsonErr);
        throw new Error('Gemini response could not be parsed as valid announcement JSON.');
      }

      // Normalization and evidence verification pass
      if (parsed?.items && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map((item: any) => {
          // Normalize confidence overall to 0-100 scale if returned as decimal <= 1
          if (item.confidence?.overall && item.confidence.overall <= 1 && item.confidence.overall > 0) {
            item.confidence.overall = Math.round(item.confidence.overall * 100);
          }

          // If only text was provided (no image), verify evidence quotes exist in text
          if (!image && hasText && item.evidence && typeof item.evidence === 'object') {
            const verifiedEvidence: Record<string, string> = {};
            for (const [key, quote] of Object.entries(item.evidence)) {
              if (typeof quote === 'string' && text.toLowerCase().includes(quote.toLowerCase())) {
                verifiedEvidence[key] = quote;
              }
            }
            item.evidence = verifiedEvidence;
          }
          return item;
        });
      }

      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      console.warn('Extraction notice error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: `Vision OCR extraction encountered an issue: ${err?.message || 'Server error'}. Please try again or create the notice manually.`,
      });
    }
  });

  // POST /api/digest
  app.post('/api/digest', async (req: Request, res: Response) => {
    try {
      const { notices, profile, today } = req.body;
      const effectiveToday = today || '2026-10-31';

      if (!notices || !Array.isArray(notices) || notices.length === 0) {
        return res.status(400).json({
          error: 'No announcements provided to build weekly briefing.',
        });
      }

      if (!ai) {
        const fallback = createFallbackDigest(notices, profile, effectiveToday);
        return res.json({
          success: true,
          data: fallback,
          is_fallback: true,
        });
      }

      // Filter and compact notices for context window
      const compactNotices = notices.slice(0, 20).map((n: any) => ({
        id: n.id,
        title: n.title,
        category: n.category,
        kind: n.kind,
        organizer: n.organizer,
        event_date: n.event_date,
        event_time: n.event_time,
        registration_deadline: n.registration_deadline,
        venue: n.venue,
        eligibility: n.eligibility,
        required_action: n.required_action,
        urgency_reason: n.urgency_reason,
      }));

      const prompt = `You are the executive intelligence briefer for Campus Radar.
Create a personalized, prioritized "Campus This Week" intelligence briefing for a student.

STUDENT PROFILE:
- Name: ${profile?.name || 'Student'}
- Department: ${profile?.department || 'Engineering'}
- Year: ${profile?.academic_year || 'Undergraduate'}
- Key Interests: ${(profile?.interests || []).join(', ')}
- Career Goals: ${(profile?.career_goals || []).join(', ')}
- Today's date: ${effectiveToday}

RULES:
1. ONLY reference opportunities from the provided list. Do NOT invent events or deadlines.
2. Every item in 'must_do', 'days', and 'heads_up' MUST reference a valid 'id' from the provided notices.
3. Prioritize items where deadlines are approaching (within 48-72 hours) or event matches their interests.
4. Keep the prose crisp, direct, and actionable.

AVAILABLE CAMPUS NOTICES:
${JSON.stringify(compactNotices, null, 2)}`;

      const response = await callGeminiWithRetry(
        {
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: digestResponseSchema,
          },
        },
        12000
      );

      const rawJson = (response?.text || '{}').trim();
      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (jsonErr) {
        console.warn('Digest JSON parse note, using smart fallback');
        parsed = createFallbackDigest(notices, profile, effectiveToday);
      }

      // Validate returned notice IDs
      const validIds = new Set(compactNotices.map(n => n.id));
      if (parsed.must_do && Array.isArray(parsed.must_do)) {
        parsed.must_do = parsed.must_do.filter((item: any) => validIds.has(item.id));
      }

      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      console.warn('Digest notice:', err?.message || err);
      const fallback = createFallbackDigest(req.body?.notices || [], req.body?.profile || {}, req.body?.today || '2026-10-31');
      return res.json({
        success: true,
        data: fallback,
        is_fallback: true,
      });
    }
  });

  // POST /api/assistant - AI Campus Assistant Q&A
  app.post('/api/assistant', async (req: Request, res: Response) => {
    try {
      const { question, announcements, profile, today } = req.body;
      const effectiveToday = today || '2026-10-31';

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide a question.' });
      }

      if (!ai) {
        const fallback = createFallbackAssistant(question, announcements || [], profile, effectiveToday);
        return res.json({
          success: true,
          data: fallback,
          is_fallback: true,
        });
      }

      const compactList = (announcements || []).slice(0, 25).map((a: any) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        organizer: a.organizer,
        event_date: a.event_date,
        event_time: a.event_time,
        registration_deadline: a.registration_deadline,
        venue: a.venue,
        eligibility: a.eligibility,
        required_action: a.required_action,
        description: a.description?.slice(0, 150),
        registration_url: a.registration_url,
      }));

      const prompt = `You are the AI Campus Assistant for Campus Radar at an Indian engineering university.
A student is asking you a question about campus announcements, deadlines, hackathons, workshops, placements, or events.

STUDENT PROFILE:
- Name: ${profile?.name || 'Student'}
- Department: ${profile?.department || 'Engineering'}
- Year: ${profile?.academic_year || 'Undergraduate'}
- Key Interests: ${(profile?.interests || []).join(', ')}
- Today's date: ${effectiveToday}

QUESTION:
"${question}"

RULES:
1. Ground your answer strictly on the provided list of campus notices. Do NOT hallucinate events.
2. If the user asks what is happening today (${effectiveToday}), check event_date matching ${effectiveToday}.
3. If they ask about deadlines, focus on registration_deadline values closest to ${effectiveToday}.
4. Provide a conversational, concise, friendly answer (2-4 sentences max).
5. In 'related_announcement_ids', return the array of IDs of the notices relevant to your answer.

CAMPUS NOTICES AVAILABLE:
${JSON.stringify(compactList, null, 2)}`;

      const response = await callGeminiWithRetry(
        {
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: assistantResponseSchema,
          },
        },
        12000
      );

      const rawJson = (response?.text || '{}').trim();
      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (jsonErr) {
        parsed = createFallbackAssistant(question, announcements || [], profile, effectiveToday);
      }

      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      console.warn('Assistant notice:', err?.message || err);
      const fallback = createFallbackAssistant(req.body?.question || '', req.body?.announcements || [], req.body?.profile, req.body?.today || '2026-10-31');
      return res.json({
        success: true,
        data: fallback,
        is_fallback: true,
      });
    }
  });

  // Mount Vite or serve static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Campus Radar] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Campus Radar] Server failed to start:', err);
  process.exit(1);
});
