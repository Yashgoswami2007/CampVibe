import React, { useState } from 'react';
import { X, Save, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { AnnouncementCategory, AnnouncementKind, CampusAnnouncement, PriorityOption } from '../types';

interface EditAnnouncementModalProps {
  announcement: CampusAnnouncement;
  onSave: (updated: CampusAnnouncement) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

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

const PRIORITY_OPTIONS: PriorityOption[] = [
  'Critical',
  'Urgent',
  'Upcoming',
  'Today',
  'Normal',
  'Expired',
  'Completed',
];

export const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({
  announcement,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(announcement.title);
  const [description, setDescription] = useState(announcement.description);
  const [category, setCategory] = useState<AnnouncementCategory>(announcement.category);
  const [kind, setKind] = useState<AnnouncementKind>(announcement.kind);
  const [organizer, setOrganizer] = useState(announcement.organizer);
  const [eventDate, setEventDate] = useState(announcement.event_date || '');
  const [eventTime, setEventTime] = useState(announcement.event_time || '');
  const [regDeadline, setRegDeadline] = useState(announcement.registration_deadline || '');
  const [venue, setVenue] = useState(announcement.venue || '');
  const [eligibility, setEligibility] = useState(announcement.eligibility || '');
  const [requiredAction, setRequiredAction] = useState(announcement.required_action || '');
  const [regUrl, setRegUrl] = useState(announcement.registration_url || '');
  const [priorityOverride, setPriorityOverride] = useState<PriorityOption | undefined>(announcement.priority_override);
  const [isCompleted, setIsCompleted] = useState<boolean>(Boolean(announcement.is_completed));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty.');
      return;
    }

    const updated: CampusAnnouncement = {
      ...announcement,
      title: title.trim(),
      description: description.trim(),
      category,
      kind,
      organizer: organizer.trim() || 'Campus Committee',
      event_date: eventDate || null,
      event_time: eventTime || null,
      registration_deadline: regDeadline || null,
      venue: venue.trim() || null,
      eligibility: eligibility.trim() || 'Open to all students',
      required_action: requiredAction.trim() || null,
      registration_url: regUrl.trim() || null,
      priority_override: priorityOverride,
      is_completed: isCompleted,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[#E0DBD0] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2EFE9] bg-[#FAF8F3]">
          <h3 className="text-sm font-bold text-[#292A28]">
            Edit Announcement Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#787774] hover:text-[#292A28] hover:bg-[#EFECE6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#F9D2CE] text-xs text-[#B42318] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs font-bold text-[#292A28] focus:border-[#C96B35] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Kind
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AnnouncementKind)}
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
              >
                <option value="event">Event</option>
                <option value="deadline">Deadline</option>
                <option value="opportunity">Opportunity</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Organizer
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Hall, Block, or Online"
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Event Time
              </label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Reg. Deadline
              </label>
              <input
                type="text"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full p-2 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Registration URL
              </label>
              <input
                type="url"
                value={regUrl}
                onChange={(e) => setRegUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                Priority Override
              </label>
              <select
                value={priorityOverride || ''}
                onChange={(e) => setPriorityOverride(e.target.value ? (e.target.value as PriorityOption) : undefined)}
                className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
              >
                <option value="">Auto-calculated</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_completed"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="rounded text-[#C96B35] focus:ring-[#C96B35]"
            />
            <label htmlFor="is_completed" className="text-xs font-semibold text-[#292A28]">
              Mark this event / milestone as completed
            </label>
          </div>

          <div className="pt-4 border-t border-[#F2EFE9] flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm?.('Are you sure you want to delete this announcement?') ?? true) {
                    onDelete(announcement.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#BA3C2A] hover:bg-[#BA3C2A]/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Notice</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#787774] hover:bg-[#FAF8F3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
