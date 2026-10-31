# Campus Pulse — 8-Hour Buildathon Plan

> **Paste the chaos. Get a plan you can trust.**
> Solo dev · Google AI Studio (Build mode) · 8 hours · Assumed "today" in examples: **Sat 31 Oct 2026 (IST)**

**TL;DR:** Win on *trust* and *reliability*, not feature count. AI extracts; plain code decides urgency and conflicts; every field is verifiable against the original text. Stack: React + Tailwind, one tiny server route for Gemini (key stays server-side), localStorage for data. No auth, no DB.

**Hard rules**
- All P0 done and deployed by **hour 4**.
- **Feature freeze at hour 6.**
- **No code changes in the last 30 minutes.**
- Checkpoint (export/commit) after every hour.

---

## 1. Executive product recommendation

**Real problem:** campus info isn't missing, it's unstructured and scattered. The cost is the mental work of parsing "URGENT!! ... tomorrow ... link in group" and remembering it. Job to be done: *"Tell me what I must do, when, and let me trust that it's right."*

**Users:** college students (esp. first/second years) in 5–20 WhatsApp groups; class reps who forward notices all day.

**Pain points (ranked):**
1. Notices buried, deadlines missed.
2. Relative dates ("tomorrow", "this Friday") lose meaning after a day.
3. Incomplete details (no venue/time, link missing).
4. Duplicate forwards and clashing events.
5. No single "what do I do today?" view.

**Why it isn't a notice board:** a notice board is publisher-side (someone must post). Campus Pulse is student-side intake: admins keep posting on WhatsApp, students paste anything and get structure. No behavior change needed.

**The one idea:** a *verified paste-to-plan converter*: paste a mess, get structured cards, each field traceable to the original text, uncertainty flagged, deterministic urgency, digest built only from saved records.

**Deliberately NOT building:**
- Auth / multi-user shared boards
- WhatsApp/Telegram bot integration
- Push notifications
- Admin/moderation roles
- Image/OCR upload (P2 at best)
- RAG / vector search, analytics, native app, backend DB

---

## 2. Positioning and UVP

- **Name:** Campus Pulse
- **Tagline:** Your WhatsApp groups, turned into a calendar you can trust.
- **UVP:** Paste any messy notice, get a clean verified card in ~3 seconds. Urgent items surface automatically. One tap gives the week's digest. Original text always one click away.
- **Tone:** calm, utilitarian, student-first. Think Linear / Notion Calendar, not "futuristic AI dashboard".

---

## 3. Feature prioritization

### P0 — must work live (~4.3 h)

| Feature | Problem solved | Expected behavior | Complexity | Time |
|---|---|---|---|---|
| Smart paste + extraction | Messy text → structure | Paste → server route → Gemini structured JSON → validated → preview | High | 60m |
| Preview, edit & save (original preserved) | AI trust | Editable fields, original text side panel, Save/Discard | Med | 30m |
| Persistence | Data survives reload | localStorage behind a repository interface | Low | 20m |
| Priority engine (Urgent/Upcoming/Expired) | "What needs me now?" | Pure function of date/time/kind/now | Low–Med | 20m |
| Dashboard + "Needs attention today" | Single place to look | Today strip, stats, next 7 days by day, inline paste box | Med | 40m |
| All notices: search + filters | Finding things | Text search; category, status, date-range filters; list view | Med | 35m |
| Weekly digest | Catch-up | "What do I need to know this week?" → structured digest linking to cards | Med | 30m |
| Responsive + first-time UX | No instructions needed | Sidebar → bottom tabs, empty states, "Try an example" chips, loading/error states | Med | 25m |

### P1 — improves judging impression (~1.8 h, hard time-boxed)

| Feature | Problem solved | Behavior | Complexity | Time |
|---|---|---|---|---|
| Evidence highlighting + field confidence | "Can I trust this?" | Extracted values highlighted in original; amber "check this" on low confidence | Med | 30m |
| Batch paste splitting | Whole WhatsApp dump pasted at once | Model returns array → N cards to review | Low–Med | 25m |
| Conflict + duplicate detection | Clashes, repeat forwards | Client-side overlap + title/date similarity | Med | 35m |
| Month calendar view | "List or calendar" | Month grid with dots + day drawer | Med | 40m |
| Add to calendar (.ics) | Reminders outside the tab | One-click download | Low | 15m |

### P2 — only if time remains
- Personal profile (year/branch) to dim irrelevant notices
- Poster image upload via Gemini vision
- Mark done / pin
- Dark mode
- Shareable digest link

---

## 4. Technical architecture

**Decisions (one each):**
- **Environment:** Google AI Studio Build mode.
- **Frontend:** React + TypeScript + Tailwind + `date-fns`.
- **Backend:** one tiny Express layer, 2 routes (`/api/extract`, `/api/digest`). Only job: keep the Gemini key out of the browser. In the first 15 min, check what your AI Studio template offers for server-side key handling; if it already proxies safely, use that. Otherwise ask for Express in Prompt 1.
- **AI:** current Flash-tier Gemini in your AI Studio dropdown (fast, cheap, JSON-schema structured output). Temperature 0–0.2.
- **Database: browser localStorage behind a `storage.ts` repository interface.**
  - Why: zero setup, no security rules, no auth, no network failure modes, works offline in front of judges.
  - Trade-off: no cross-device sync / shared board.
  - Judge answer: "Storage is behind one interface; swapping in Firestore for a shared board is a one-file change."
  - If localStorage misbehaves in the AI Studio preview iframe, test the deployed URL. If still broken, swap that one file to Firestore via the AI Studio integration.
- **Auth:** none (personal-first tool).
- **Deployment:** AI Studio built-in deploy (shareable URL). Test in hour 1, hour 4, hour 7.

### System architecture
```
Browser (React)
 ├─ UI: Dashboard · All Notices · Digest · Add Notice modal
 ├─ lib/status.ts    (deterministic urgency, client)
 ├─ lib/conflicts.ts (duplicates + overlaps, client)
 └─ lib/storage.ts   (localStorage repo)
        │  fetch (text + today + tz)
        ▼
Express server (holds GEMINI_API_KEY in env)
 ├─ POST /api/extract → Gemini (structured JSON) → validate → return
 └─ POST /api/digest  → Gemini (structured JSON) → validate ids → return
```

### Data flow (happy path)
paste → client sanity checks → `/api/extract` with `{text, today, weekday, tz}` → Gemini → server validation (schema, enums, date format, weekday check, evidence-substring check) → preview with highlights → user edits/saves → `storage.upsert` → store updates → dashboard re-renders with status recomputed from "now".

**Key rule:** the server never computes "today". Cloud Run runs UTC, so the client sends today's date and timezone (Asia/Kolkata). This prevents off-by-one-day bugs.

### API
| Endpoint | In | Out |
|---|---|---|
| `POST /api/extract` | `{ text, today, weekday, tz }` | `{ items: ExtractedNotice[] }` |
| `POST /api/digest` | `{ notices, rangeStart, rangeEnd, today }` | `{ headline, must_do[], days[], heads_up[] }` |

### Error handling
- Client pre-checks: empty, <15 chars, >8,000 chars (truncate + warn).
- Timeout 20s → "Taking longer than usual" with Retry and "Fill manually" (form prefilled with pasted text).
- Invalid JSON → one automatic repair retry, then manual form.
- 429/quota → friendly message + backoff retry.
- Not a notice → "This doesn't look like a campus notice" + "Save anyway as announcement".
- Corrupt localStorage → validate on load, quarantine bad records, never crash.

---

## 5. Database schema, AI pipeline and JSON schema

### Notice record (stored)
```
id, title, kind, category, date|null, end_date|null, time|null, end_time|null,
venue|null, audience|null, action_required|null, urgency_hint (high|normal),
summary, links[], raw_text (ALWAYS stored), source (whatsapp|email|poster|other),
evidence{field: quoted substring}, date_resolution{phrase, method, assumption},
confidence{date,time,venue,kind: high|medium|low}, missing[], warnings[],
fingerprint, created_at, updated_at, dismissed(bool)
```
- **status is never stored.** It's derived at read time from `now`, so it can't go stale.
- **kind:** `event | deadline | announcement | opportunity`
- **category:** `Academic | Exam | Placement | Hackathon/Tech | Cultural | Sports | Administrative | Club | Other`

### Extraction pipeline
1. **Input hygiene (client):** trim, length-check, strip zero-width characters.
2. **One structured call:** system instruction + pasted text inside delimiters (treated as data, which blunts prompt injection) + `today`, `weekday`, `tz`. Use `responseMimeType: application/json` with a `responseSchema`.
3. **Server validation:**
   - Enums valid; `date` is `YYYY-MM-DD`; `time` is `HH:mm`.
   - **Weekday check:** if the text names a weekday, the resolved date must fall on it, else null the date and warn.
   - **Evidence check:** every `evidence` string must appear in the raw text (normalized), else null that field and downgrade confidence.
   - Sanity range: date >~1 year away or in the past gets a warning.
4. **Client derives** status, duplicates, conflicts.
5. **Human review** in preview. Nothing is saved silently.

**Missing data:** null beats a guess. Never invent a venue, time or link. Missing fields go in `missing[]` and render as "Not mentioned" chips. A deadline with a date but no time shows "by end of day"; no time is fabricated.

**Distinguishing kinds:**
- *Deadline:* "last date", "register by", "submit by", "closes".
- *Event:* happens at a time and place ("will be conducted", "session on").
- *Opportunity:* invitation to apply/join (internship, scholarship, open registration) without a hard date.
- *Announcement:* information only, no required action or date.
- "Hackathon registration closes tomorrow" → `kind=deadline`, `category=Hackathon/Tech`.

**Relative dates:** the model resolves against the anchor date; the UI always shows the resolution (`"tomorrow" → Sun 1 Nov`) so the user verifies it.

| Phrase (today Sat 31 Oct 2026) | Resolves to |
|---|---|
| tomorrow | Sun 1 Nov |
| day after tomorrow | Mon 2 Nov |
| next Monday | Mon 2 Nov (first Monday strictly after anchor) |
| this Friday | Fri 6 Nov |
| 4/11 | 4 Nov (dd/mm, India) |
| "4th November" (no year) | nearest future occurrence, 2026 |
| "next week", "soon", "end of month" | date null + warning, medium confidence |

**Two details most teams miss:**
- If the paste contains a WhatsApp timestamp like `[28/10/26, 9:14 pm]`, use *that* as the anchor for "tomorrow", not today. A forward from 3 days ago saying "tomorrow" is already expired.
- If the anchor isn't today, show an "Assumed relative to message date" note.

**Anti-hallucination rules:**
- Null over guess.
- Mandatory evidence quotes, verified in code.
- Per-field confidence with a `needs_review` flag.
- Input treated as data, never instructions.
- Original always stored and shown beside the card.

**Invalid/ambiguous input:**
- `is_notice: false` with a `reason`.
- Multiple notices in one paste → multiple items.
- Ambiguity goes into `warnings[]`, never silently resolved.

### Extraction JSON — notice 1 (internal assessment)
```json
{
  "items": [{
    "is_notice": true,
    "title": "2nd Year CSE Internal Assessment",
    "kind": "event",
    "category": "Exam",
    "date": "2026-11-04",
    "end_date": null,
    "time": "10:00",
    "end_time": null,
    "venue": "Block B",
    "audience": "2nd year CSE",
    "action_required": "Bring your ID card. Attendance is compulsory.",
    "urgency_hint": "high",
    "summary": "Internal assessment for 2nd-year CSE on 4 Nov, 10:00 AM, Block B. ID card required; attendance compulsory.",
    "links": [],
    "evidence": {
      "date": "4th November",
      "time": "10 AM",
      "venue": "Block B",
      "kind": "will be conducted"
    },
    "date_resolution": {
      "phrase": "4th November",
      "method": "absolute",
      "assumption": "Year not stated; assumed 2026 (nearest future occurrence)"
    },
    "confidence": { "date": "high", "time": "high", "venue": "high", "kind": "high" },
    "missing": [],
    "warnings": [],
    "source_excerpt": "URGENT!! All 2nd year CSE students are informed that…"
  }]
}
```

### Extraction JSON — notice 2 (hackathon deadline)
```json
{
  "items": [{
    "is_notice": true,
    "title": "Hackathon registration deadline",
    "kind": "deadline",
    "category": "Hackathon/Tech",
    "date": "2026-11-01",
    "end_date": null,
    "time": null,
    "venue": null,
    "audience": null,
    "action_required": "Register using the link shared in the group",
    "urgency_hint": "high",
    "summary": "Last date to register for the hackathon is tomorrow (1 Nov). Registration link is in the group.",
    "links": [],
    "evidence": { "date": "tomorrow", "kind": "Last date for hackathon registration" },
    "date_resolution": {
      "phrase": "tomorrow",
      "method": "relative",
      "assumption": "No message timestamp; resolved against today (2026-10-31)"
    },
    "confidence": { "date": "medium", "time": "low", "venue": "low", "kind": "high" },
    "missing": ["time", "venue", "registration link"],
    "warnings": [
      "Link was mentioned but not included in the pasted text",
      "Hackathon name not stated"
    ],
    "source_excerpt": "Hey guys, reminder! Last date for hackathon registration is tomorrow…"
  }]
}
```

### Invalid input
```json
{ "items": [{ "is_notice": false, "reason": "Casual chat with no event, deadline or announcement" }] }
```

### Priority rules (deterministic, Asia/Kolkata)
- `due = date + (time ?? 23:59)`. Timed events expire at `end_time`, or start + 2h if none.
- **Expired:** `due < now`.
- **Urgent:** not expired AND (due within 48h, OR `kind=deadline` within 72h, OR `urgency_hint=high` within 5 days).
- **Upcoming:** everything else. Undated notices are Upcoming and auto-expire 14 days after `created_at`.
- **Needs attention today:** dated today, OR deadlines due today/tomorrow, OR urgent items.
- Every card shows a reason ("Deadline in 18 hours").

### Weekly digest design
- **Input:** only saved, non-expired records from today through +7 days, plus undated ones from the last 7 days. Model is told to use nothing else.
- **Output (structured, not free prose):**
  ```json
  { "headline": "...",
    "must_do": [{ "id": "...", "line": "..." }],
    "days": [{ "date": "2026-11-02", "lines": [{ "id": "...", "text": "..." }] }],
    "heads_up": [{ "text": "...", "ids": ["..."] }] }
  ```
- **Validation:** drop any line whose `id` isn't in the input. UI renders each line as a chip linking to its card.
- **Fallbacks:** zero records → don't call the AI. Call fails → deterministic template digest from records. Cache by hash of inputs.

---

## 6. UI/UX blueprint

### Design system
- **Look:** warm neutral bg `#F7F6F3`, white surfaces, 1px borders `#E4E2DC`, ink text `#1B1F2A`, 8px radius, no gradients, essentially no shadows.
- **Color only carries meaning:** Urgent red `#B42318` on `#FDECEA`; Upcoming blue `#1F5FBF` on `#E8F0FC`; Expired gray `#6B7280` on `#F1F1EF`. Categories are small neutral text, not a rainbow of chips.
- **Type:** Inter, tabular numerals for dates.
- **Signature element:** calendar-tile date block on every card (month above, big day number).
- **Navigation:** left sidebar on desktop (Dashboard, All notices, Weekly digest, "+ Add notice"); bottom tabs + floating add button on mobile.

### Screen 1 — Dashboard
- **Layout:** greeting + date; **"Needs attention today"** panel (most prominent); 3 stat tiles (Urgent / This week / Expired); left column "Next 7 days" grouped by day; right column quick-paste box, conflicts/duplicates alert, "Weekly digest" button.
- **Interactions:** tap a card → drawer with original text. Quick-paste goes straight into extraction.
- **Empty:** big paste box, "Paste a WhatsApp notice to get started", 3 "Try an example" chips.
- **Loading:** skeleton cards. **Error:** inline banner with Retry.

### Screen 2 — Smart input
- **Layout:** large textarea, source selector (WhatsApp / Email / Poster caption), "Extract" button, example chips.
- **Interactions:** char counter; Cmd/Ctrl+Enter submits.
- **Loading:** honest stepper: "Reading notice → Extracting details → Checking dates".
- **Error:** the specific cases from Section 4, each with a recovery action.

### Screen 3 — Preview and edit
- **Layout:** two panes. Left: editable card (title, kind, category, date, time, venue, action). Right: original text with extracted values highlighted.
- **Components:** amber "Check this" markers on low-confidence fields; "Resolved 'tomorrow' → Sun 1 Nov" chip; "Not mentioned" chips; duplicate/conflict banners.
- **Actions:** Save, Save & add another, Discard.
- **Mobile:** panes stack; original behind a "Show original" toggle.
- **Error:** invalid date blocks Save and marks the field.

### Screen 4 — All notices
- **Layout:** sticky filter bar above a list; List/Calendar toggle top right (Calendar is P1).
- **Row:** status badge, title, date tile, venue, category.
- **Empty:** "No notices match. Clear filters." **Loading:** skeleton rows.

### Screen 5 — Weekly digest
- **Layout:** date-range header ("Sat 31 Oct – Fri 6 Nov"), headline, "Must do", day-by-day lines, "Heads up" (conflicts, missing info).
- **Interactions:** each line chip opens its source card; Regenerate; Copy as text.
- **Empty:** "Nothing saved for this week yet" + Add notice.
- **Loading:** skeleton + "Reading your N saved notices…".
- **Error:** deterministic template digest + note that the AI summary is unavailable.

### Screen 6 — Search and filter
- **Controls:** search box (title, venue, summary, raw text); status segmented control; category multi-select; date presets (Today / This week / Next 7 days / Custom); "Clear all".
- **Behavior:** instant results, no submit button; active filters show as removable chips.

---

## 7. Differentiation strategy

Build these four, in order of judging value:

1. **Evidence-backed extraction + confidence flags (P1).** Others say "trust me"; this shows the quoted source and flags uncertainty.
2. **Deterministic urgency with the reason shown (P0).** Code decides, not the model: consistent and explainable.
3. **Conflict + duplicate detection (P1).** Cheap (client-side), visibly solves the "same notice in 4 groups" problem.
4. **Batch paste splitting (P1).** Pasting a whole group dump and getting 6 cards is the biggest wow for the least work.

Skipped on purpose: personalized briefing and poster OCR (P2), bot integrations (can't be made reliable in time).

---

## 8. Eight-hour execution timeline

| Hour | Objective | Working output | Test | Risk |
|---|---|---|---|---|
| **1** | Setup, design system, shell, server route, key security | Deployed shell with 3 pages; `/api/extract` returns real Gemini JSON for a hardcoded input | Grep built JS + Network tab for the key; persist a dummy record and reload | Template lacks a safe key path; cap at 20 min |
| **2** | Extraction pipeline, preview/edit, save | Paste → card preview → Save → reload shows it | Both brief examples; empty, short, garbage input | Schema/JSON failures; keep manual-form fallback |
| **3** | Priority engine, dashboard, All notices + search/filters | Status badges, "Needs attention today", working filters | Status unit tests incl. midnight and timezone edges | Status logic scattered in components; keep in `status.ts` |
| **4** | Weekly digest; first deploy; run 20-notice test set | **All P0 live on a public URL**; accuracy tally recorded | Digest vs saved data; open deployed URL on a phone | Digest inventing facts; verify id validation |
| **5** | P1: evidence highlighting, confidence flags, batch splitting | Highlights + amber flags; multi-notice paste gives N cards | Messy dump with 5+ notices | AI Studio rewriting unrelated files; use scoped prompts |
| **6** | P1: duplicate/conflict detection, calendar view (cut if behind) | Duplicate/clash banners; month view | Same notice twice; two events at the same time | Calendar overruns; hard stop at 40 min. **Feature freeze at end of hour.** |
| **7** | Hardening: responsive pass, empty/loading/error states, date edge cases, seed data, final deploy | Clean mobile + desktop; demo data loaded | Date table above; airplane-mode test; rate-limit behavior | Regressions; test only, no new features |
| **8** | Demo rehearsal, backup recording, final deploy check | 3-minute demo run twice + backup video | Run the exact demo path on the judging device and network | Last-minute edits; **no code changes in the last 30 min** |

---

## 9. Google AI Studio prompt sequence

**Prepend this to every prompt after #1:**
> Make targeted changes only. Do NOT regenerate or restructure the whole app. Modify only the files I list. Keep all existing functionality working. After changes, list which files you touched.

### Prompt 1 — Project initialization
```
Create a full-stack web app called "Campus Pulse" (React + TypeScript + Tailwind + a minimal Node/Express server).
Structure: src/types.ts, src/lib/{storage,status,dates,conflicts}.ts, src/components/, src/pages/{Dashboard,AllNotices,Digest}.tsx; server with POST /api/extract and POST /api/digest.
Requirements:
- The Gemini API key is read ONLY from a server environment variable and must never appear in client code or the browser bundle.
- Both routes call Gemini for real: /api/extract takes { text, today, weekday, tz } and returns JSON; /api/digest takes { notices, rangeStart, rangeEnd, today } and returns JSON. For now use a placeholder prompt.
- Define the Notice type: id, title, kind(event|deadline|announcement|opportunity), category, date|null, end_date|null, time|null, end_time|null, venue|null, audience|null, action_required|null, urgency_hint(high|normal), summary, links[], raw_text, source, evidence, date_resolution, confidence, missing[], warnings[], fingerprint, created_at, updated_at, dismissed.
- Three pages with client-side routing and an "Add notice" button (modal opens later).
Acceptance: app runs; three pages navigate; /api/extract returns real JSON for a sample text; searching the browser bundle and network responses finds no API key.
```

### Prompt 2 — UI and design system
```
Files: src/index.css (tokens), tailwind config, src/components/*, App shell.
Build a design system for a professional SaaS look: warm neutral background #F7F6F3, white surfaces, 1px borders #E4E2DC, ink text #1B1F2A, 8px radius, no gradients, no shadows except popovers. Font Inter with tabular numerals for dates.
Status colors only: Urgent red #B42318 on #FDECEA, Upcoming blue #1F5FBF on #E8F0FC, Expired gray #6B7280 on #F1F1EF.
Components: Button, StatusBadge, CategoryLabel (neutral text), DateTile (month above big day number), NoticeCard, EmptyState, Skeleton, Toast, Modal/Drawer.
Layout: left sidebar on desktop (Dashboard, All notices, Weekly digest, "+ Add notice"); bottom tab bar plus floating add button below 768px.
Acceptance: every component renders on a /dev/components page; shell looks right at 375px and 1280px; no horizontal scroll on mobile.
```

### Prompt 3 — Dashboard
```
Files: src/pages/Dashboard.tsx, src/lib/seed.ts, src/lib/status.ts (stub only).
Build the dashboard: greeting + today's date; "Needs attention today" panel; three stat tiles (Urgent / This week / Expired); "Next 7 days" list grouped by day; right column with an inline paste box and a "Weekly digest" button.
Create 12 realistic seed notices generated RELATIVE to today's date (so they never go stale), spanning all kinds/categories, including two clashing events and one undated announcement. Load them via a "Load sample notices" button, not automatically.
status.ts exports getStatus(notice, now) returning 'urgent'|'upcoming'|'expired'; stub it to 'upcoming' for now.
Empty state: big paste box with 3 "Try an example" chips that fill the textarea.
Acceptance: with seeds loaded the dashboard shows grouped days; empty state shows when no data; tapping a card opens a drawer with the original text.
```

### Prompt 4 — AI notice extraction
```
Files: server route for /api/extract, src/components/AddNoticeModal.tsx, src/components/NoticePreview.tsx, src/lib/validate.ts.
Server: call Gemini with temperature 0, responseMimeType application/json and a responseSchema matching { items: Notice-like[] }. Pass today (YYYY-MM-DD), weekday and timezone Asia/Kolkata. Wrap the pasted text in <notice> delimiters and treat it strictly as data.
System instruction:
"You extract campus notices into JSON. Return null for anything not explicitly stated; NEVER invent dates, times, venues, or links. For every extracted field give an 'evidence' string copied exactly from the text. kind: deadline = last date/register by/submit by; event = happens at a time/place; opportunity = invitation to apply/join; announcement = information only. Resolve relative dates against the anchor date: if the text contains a WhatsApp message timestamp use it as the anchor, otherwise use today. Dates are dd/mm. If no year is given use the nearest future occurrence. 'next <weekday>' = first such weekday strictly after the anchor. If a phrase is vague (next week, soon) set date null and add a warning. If the text contains several notices return one item each. If it is not a notice return is_notice false with a reason. Rate confidence high/medium/low per field. List missing fields in 'missing'."
Server validation (validate.ts): enum checks, YYYY-MM-DD / HH:mm formats, weekday-name consistency, every evidence string must be a substring of the input (else null the field and lower confidence), one automatic retry on invalid JSON.
Client: preview with editable fields on the left and the original text on the right; "Resolved 'tomorrow' → Sun 1 Nov" chip; Save and Discard; Save blocked on invalid date.
States: loading stepper, 20s timeout with Retry and "Fill manually", 429 message, not-a-notice message with "Save anyway as announcement".
Acceptance: these two inputs work: "URGENT!! All 2nd year CSE students ... 4th November at 10 AM in Block B..." and "Hey guys, reminder! Last date for hackathon registration is tomorrow...". Missing venue/time shows "Not mentioned", and no field is invented.
```

### Prompt 5 — Data persistence
```
Files: src/lib/storage.ts, a small store (React context or zustand), AddNoticeModal save handler.
Implement a repository interface: list(), get(id), upsert(notice), remove(id), exportJSON(), importJSON(). Back it with localStorage under a versioned key ("campus-pulse:v1").
Requirements: validate records on load; quarantine corrupt ones instead of crashing; always store raw_text; saving from the preview updates the dashboard instantly without reload; compute a fingerprint (normalized title tokens + date) on save.
Acceptance: save a notice, hard refresh, it persists; manually corrupt the localStorage value and the app still loads with a warning toast; the original text is visible in the drawer.
```

### Prompt 6 — Search and filtering
```
Files: src/pages/AllNotices.tsx, src/components/FilterBar.tsx.
Sticky filter bar: instant search (title, venue, summary, raw_text), status segmented control, category multi-select, date presets (Today / This week / Next 7 days / Custom range), removable active-filter chips, "Clear all".
Sort: by date ascending by default, undated last. Result count shown.
Acceptance: combining search + category + status works together; empty-result state with a "Clear filters" action; 200 seeded notices stay responsive.
```

### Prompt 7 — Priority detection
```
Files: src/lib/status.ts, src/lib/status.test.ts, Dashboard attention panel.
Implement getStatus(notice, now) in Asia/Kolkata:
- due = date + (time ?? 23:59). Events with a time expire at end_time, or start + 2h if no end.
- expired if due < now.
- urgent if not expired AND (due within 48h, OR kind=deadline within 72h, OR urgency_hint=high within 5 days).
- else upcoming. Undated notices are upcoming and auto-expire 14 days after created_at.
Also export getStatusReason(notice, now) returning text like "Deadline in 18 hours". Show it on cards.
"Needs attention today" = dated today, OR deadlines due today/tomorrow, OR urgent items.
Recompute every minute and at midnight.
Write unit tests for: today before/after the time, deadline at 23:59, midnight boundary, undated, high-urgency hint.
Acceptance: all tests pass; changing the system clock changes statuses without a reload.
```

### Prompt 8 — Weekly digest
```
Files: server /api/digest, src/pages/Digest.tsx, src/lib/digestFallback.ts.
Button "What do I need to know this week?" generates a digest for today through +7 days from SAVED notices only (plus undated from the last 7 days). Send only those records.
Instruct Gemini: use only the supplied notices; never add facts; return JSON { headline, must_do[{id,line}], days[{date,lines[{id,text}]}], heads_up[{text,ids[]}] }.
Server drops any line whose id isn't in the input. If there are zero records, don't call the AI and show an empty state. If the call fails, render a deterministic digest from the records via digestFallback.ts with a note. Cache by hash of inputs.
UI: date-range header, headline, Must do, day-by-day, Heads up. Each line is a chip that opens its source card. Regenerate and Copy as text buttons.
Acceptance: digest mentions only saved notices; with the network blocked the fallback digest appears.
```

### Prompt 9 — Testing and bug fixing
```
Files: src/dev/testNotices.ts, src/pages/DevTest.tsx (route /dev/test).
Add 20 messy test notices with expected fields (date, time, venue, kind): typo-heavy, Hinglish, all-caps, emoji, missing venue, relative dates (tomorrow, next Monday, this Friday), dd/mm dates, multi-notice dumps, a WhatsApp-timestamped forward, a non-notice, and one with an embedded "ignore previous instructions".
The page runs all through /api/extract and shows a pass/fail table per field, with an accuracy summary.
Then fix only the failures, touching only the files involved.
Acceptance: results table renders; every failure is either fixed or documented.
```

### Prompt 10 — Final polish
```
Targeted pass, no new features. Files: components only as needed.
1) Consistent empty, loading and error states on every page. 2) Responsive check at 375/768/1280px, no horizontal scroll, touch targets at least 44px. 3) Page title, favicon, meta tags. 4) Keyboard: Esc closes modals, Ctrl/Cmd+Enter submits, visible focus rings. 5) "Load sample notices" and "Clear all data" in a Settings menu. 6) Remove console logs and dead code. 7) Friendly copy everywhere (no raw error strings).
Acceptance: a first-time user can paste, save and find a notice without instructions.
```

### P1 add-on prompts (hours 5–6)
- **4B (evidence + batch):** "Highlight each extracted field's evidence string inside the original-text pane when the field is focused. Show amber 'Check this' markers for medium/low confidence fields. Make the preview handle N items from one paste with a stepper (1 of 4), a 'Save all' button and per-item discard."
- **6B (duplicates + conflicts):** "In conflicts.ts, flag a duplicate when fingerprints match or title-token Jaccard similarity is above 0.7 on the same date; flag a conflict when two timed events overlap. Show a banner in the preview ('Looks like a duplicate of …', 'Clashes with …') and a 'Heads up' alert on the dashboard. Never block saving."
- **6C (calendar):** "Add a Month view toggle on All notices: month grid, status-colored dots per day, tap a day to open a drawer listing that day's cards. Time-boxed; keep list view as the default."
- **.ics:** "Add an 'Add to calendar' button on the detail drawer that downloads an .ics for dated notices (all-day if no time)."

---

## 10. Three-minute demo script

**Before you start:** 8–10 seeded notices loaded, the 2 messy notices ready to paste, a screen recording as backup.

| Time | You do | Judges should notice |
|---|---|---|
| **0:00–0:20** | Open the dashboard: "Students get 50 notices a day across WhatsApp groups. Campus Pulse turns them into a plan." | Clean real-product feel; clear problem |
| **0:20–0:55** | Paste the CAPS internal-assessment notice, click Extract | Fast; stepper; structured card with **original text beside it** and field highlights |
| **0:55–1:15** | Point at evidence highlights and an amber flag, edit one field, Save | Review-before-save, confidence flags, **no blind trust in AI** |
| **1:15–1:45** | Paste the hackathon "tomorrow" notice. Point at "Resolved 'tomorrow' → Sun 1 Nov" and the "link not included" warning | Relative dates handled explicitly; honest warnings; nothing invented |
| **1:45–2:10** | Dashboard updates instantly; hackathon deadline appears under "Needs attention today" with "Deadline in 13 hours" | Deterministic urgency with reasons; instant update |
| **2:10–2:30** | All notices: search "block b", filter by Exam, switch status | Instant search/filter combos |
| **2:30–2:50** | Click "What do I need to know this week?"; tap a digest line to open its card | Digest from saved records only; each line verifiable |
| **2:50–3:00** | Close: "Paste the chaos, get a plan you can trust. Next: a shared campus board." | Vision and scalability story |

Bonus if time allows: swap the second paste for a multi-notice dump. It's the biggest wow moment.

---

## 11. Judge Q&A prep

1. **How do you stop hallucinations?** Null-over-guess rules, mandatory evidence quotes verified in code against the raw text, per-field confidence, a human review step, and the original always stored.
2. **How do you handle "tomorrow" / "next Monday"?** Client sends today, weekday and timezone. The model resolves, code checks the weekday, the UI shows the resolution so the user confirms. A message timestamp in the paste overrides today as the anchor.
3. **Why no database or login?** An 8-hour scope decision for reliability and a zero-setup demo. Storage sits behind one interface, so Firestore for a shared multi-user board is a one-file swap.
4. **Is the API key safe?** Only in server env vars. The browser calls our route, never Gemini directly, and we verified the key isn't in the bundle.
5. **What if the AI is wrong or down?** Wrong: review step + confidence flags. Down: manual entry form prefilled with the text, and a deterministic digest.
6. **Why not just ask ChatGPT?** One-off chat doesn't persist, compute urgency, detect clashes, or build a verified week view. This is a workflow, not a prompt.
7. **How does it scale to a whole college?** Shared board with roles via Firestore; email-forward address and Telegram/WhatsApp Business bot for ingestion; admin approval queue; per-department audience targeting.
8. **How did you measure accuracy?** The 20-notice test set at `/dev/test`. Quote your actual field-level numbers and be honest about weak spots.
9. **Privacy?** Notices stored locally in the browser; only the pasted text goes to the model. For production: a no-retention API tier and PII stripping.
10. **Prompt injection?** Input is delimiter-wrapped and treated as data, output is schema-constrained and validated, and the test set includes an injection case.
11. **Business viability?** B2B2C: sell to colleges as a notice-hygiene layer. Students adopt for free because it needs no behavior change.

---

## 12. Risk and fallback checklist

| # | Failure | Prevention | Fallback |
|---|---|---|---|
| 1 | **AI extraction wrong / malformed JSON** | Structured output, schema validation, auto-retry once, 20-notice test set | Manual form prefilled with the pasted text |
| 2 | **Wrong dates / timezone** (UTC server, "tomorrow") | Client sends today/tz, weekday check, visible resolution chip, status computed client-side | User edits the date in the preview; warning blocks silent bad saves |
| 3 | **API key exposure** | Key only in server env; grep bundle + Network tab in hour 1 and before final deploy | Rotate the key immediately if exposed |
| 4 | **Persistence broken** (iframe / deployed-URL storage) | Test reload on the deployed URL in hours 1 and 4; versioned key; corrupt-data guard | Swap `storage.ts` to Firestore; JSON export/import backup |
| 5 | **Slow AI / rate limits on demo day** | Flash model, truncated input, stepper UI, digest caching, warm up with the demo path early | Pre-extracted demo notices in seed data; recorded video |
| 6 | **AI Studio regressions** | Scoped prompts with the "targeted changes only" preamble; hourly checkpoints | Roll back to last checkpoint |
| 7 | **Deployment failure** | Deploy in hours 1, 4 and 7 | Run from the AI Studio preview or a local build on your laptop |
| 8 | **UI bugs on mobile/responsive** | Test at 375px after every UI prompt; dedicated hour-7 pass | Prioritize the demo path; hide broken secondary views |
| 9 | **Digest hallucination** | Records-only input, id validation, linked lines | Deterministic template digest |
| 10 | **Time overrun / untested demo path** | P0 live by hour 4; freeze at hour 6; calendar is the first cut | Drop P1 in this order: calendar, .ics, duplicates, batch splitting. Never touch P0 |

---

## Final recommended MVP scope

**Must be live and rehearsed (P0):**
- [ ] Paste → AI extraction → preview with original text → save → persists on reload
- [ ] Dashboard with "Needs attention today" and deterministic Urgent / Upcoming / Expired
- [ ] All notices with search + category/status/date filters
- [ ] Weekly digest from saved records, with a no-AI fallback
- [ ] Responsive layout, empty/loading/error states, "Try an example" chips

**Include if on schedule by hour 5 (P1, in this order):**
1. [ ] Evidence highlighting + confidence flags
2. [ ] Batch paste splitting
3. [ ] Duplicate and conflict warnings
4. [ ] Calendar view and .ics (only if ahead)

**Everything else is out of scope.** Show a "Next: shared campus board + WhatsApp ingestion" slide instead.

**Remember:** if hour 2 ends with paste → card → save → reload working, you win on reliability while others are still wiring up features.
