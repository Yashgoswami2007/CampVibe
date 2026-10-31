export type AnnouncementKind = 'event' | 'deadline' | 'announcement' | 'opportunity';

export type AnnouncementCategory =
  | 'Technology'
  | 'Artificial Intelligence'
  | 'Machine Learning'
  | 'Web Development'
  | 'Hackathons'
  | 'Internships'
  | 'Placements'
  | 'Entrepreneurship'
  | 'Cultural Activities'
  | 'Sports'
  | 'Research'
  | 'Workshops'
  | 'Academics'
  | 'Other';

export interface DateResolution {
  phrase: string;
  method: 'relative' | 'absolute' | 'inferred';
  assumption: string;
}

export interface FieldConfidence {
  overall: number; // 0-100
  date?: 'high' | 'medium' | 'low';
  time?: 'high' | 'medium' | 'low';
  venue?: 'high' | 'medium' | 'low';
  eligibility?: 'high' | 'medium' | 'low';
  required_action?: 'high' | 'medium' | 'low';
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  description: string;
  kind: AnnouncementKind;
  category: AnnouncementCategory;
  organizer: string;
  event_date: string | null; // YYYY-MM-DD
  event_time: string | null; // e.g. "11:00 AM" or "14:00"
  registration_deadline: string | null; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  venue: string | null;
  eligibility: string | null;
  target_departments: string[];
  target_years: string[];
  required_action: string | null;
  urgency_reason: string | null;
  registration_url: string | null;
  tags: string[];
  raw_text: string;
  source: 'whatsapp' | 'email' | 'instagram' | 'poster' | 'notice_board' | 'manual';
  evidence: Record<string, string>; // quoted verbatim substrings from source
  date_resolution: DateResolution | null;
  confidence: FieldConfidence;
  missing_fields: string[];
  warnings: string[];
  created_at: string;
  is_demo?: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  college: string;
  department: string;
  academic_year: string; // e.g. "3rd Year"
  interests: string[];
  career_goals: string[];
  notifications_enabled: boolean;
  avatar_url?: string;
  created_at: string;
}

export type OpportunityFolder = 'saved' | 'interested' | 'applied' | 'completed';

export interface UserOpportunityState {
  announcement_id: string;
  folder: OpportunityFolder;
  notes?: string;
  updated_at: string;
}

export type UrgencyLevel = 'urgent' | 'upcoming' | 'active' | 'expired';

export interface CalculatedStatus {
  urgency: UrgencyLevel;
  badgeLabel: string;
  countdownText: string;
  isRegistrationClosed: boolean;
  isEventPassed: boolean;
}

export interface RelevanceScoreResult {
  score: number; // 0-100
  tier: 'Strong Match' | 'Good Match' | 'Explore';
  reasons: string[];
  breakdown: {
    interestMatch: number;
    careerMatch: number;
    deptMatch: number;
    yearMatch: number;
    deadlineBonus: number;
  };
}

export interface WeeklyDigestItem {
  id: string;
  title: string;
  line: string;
  action?: string;
  deadline?: string;
}

export interface WeeklyDigestDayGroup {
  date: string;
  weekday: string;
  items: Array<{
    id: string;
    title: string;
    text: string;
    time?: string;
    venue?: string;
    category?: string;
  }>;
}

export interface WeeklyDigest {
  headline: string;
  summary: string;
  must_do: WeeklyDigestItem[];
  days: WeeklyDigestDayGroup[];
  heads_up: Array<{
    text: string;
    related_ids: string[];
  }>;
  generated_at: string;
  is_fallback?: boolean;
}
