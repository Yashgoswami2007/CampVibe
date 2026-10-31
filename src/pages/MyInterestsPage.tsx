import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  User,
  Briefcase,
  Layers,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { CampusAnnouncement, StudentProfile } from '../types';
import { calculateRelevance } from '../lib/scoring';

interface MyInterestsPageProps {
  profile: StudentProfile;
  announcements: CampusAnnouncement[];
  onSaveProfile: (updatedProfile: StudentProfile) => void;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
}

export const ALL_INTERESTS = [
  'Artificial Intelligence / ML',
  'Web Development',
  'App Development',
  'Data Science',
  'Cybersecurity',
  'Competitive Programming',
  'Hackathons',
  'Entrepreneurship',
  'Internships',
  'Placements',
  'Research',
  'Technical Workshops',
  'Sports',
  'Cultural Events',
  'Robotics',
  'Design',
];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Management & Business',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export const MyInterestsPage: React.FC<MyInterestsPageProps> = ({
  profile,
  announcements,
  onSaveProfile,
  onSelectAnnouncement,
}) => {
  const [name, setName] = useState(profile.name);
  const [college, setCollege] = useState(profile.college);
  const [department, setDepartment] = useState(profile.department);
  const [year, setYear] = useState(profile.academic_year);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [careerGoals, setCareerGoals] = useState<string[]>(profile.career_goals || []);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Toggle interest
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // Add career goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalInput.trim() && !careerGoals.includes(newGoalInput.trim())) {
      setCareerGoals([...careerGoals, newGoalInput.trim()]);
      setNewGoalInput('');
    }
  };

  // Remove career goal
  const handleRemoveGoal = (goal: string) => {
    setCareerGoals(careerGoals.filter(g => g !== goal));
  };

  // Draft profile for Live Recommendation Preview
  const draftProfile: StudentProfile = {
    ...profile,
    name,
    college,
    department,
    academic_year: year,
    interests,
    career_goals: careerGoals,
  };

  // Compute live match preview
  const liveMatches = [...announcements]
    .map(a => ({
      announcement: a,
      relevance: calculateRelevance(a, draftProfile),
    }))
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, 3);

  const handleSave = () => {
    onSaveProfile(draftProfile);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Profile & Personalization Radar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrate your academic interests and career targets to personalize recommendations at MiT.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {showSavedToast && (
        <div className="p-3 rounded-2xl bg-[#D4F5EC] border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in duration-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Preferences updated! Personalized recommendations recalculated across MiT dashboard.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Academic Profile */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-700" />
              <span>Academic Identity</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interests Multi-Select */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                Areas of Interest ({interests.length} selected)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">40% algorithm weight</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#181B20] text-white border-[#181B20] shadow-2xs'
                        : 'bg-[#F8F9FA] text-slate-700 border-slate-200/80 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Career Targets */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-700" />
              <span>Career Goals & Aspirations (20% weight)</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {careerGoals.map((goal) => (
                <span
                  key={goal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EBF1FD] text-blue-800 border border-blue-200/70 text-xs font-semibold"
                >
                  <span>{goal}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(goal)}
                    className="hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddGoal} className="flex gap-2">
              <input
                type="text"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                placeholder="Add career goal (e.g. AI Engineer, Quant Trader, Founder)..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#F8F9FA] border border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Add Goal
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Recommendation Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-[#F8F9FA] border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200/60">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#181B20] text-white uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              Live Matching Engine
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Instant Recommendation Preview
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Toggle interests on the left to watch match scores update in real time!
            </p>
          </div>

          <div className="space-y-3">
            {liveMatches.map(({ announcement: ann, relevance }) => (
              <div
                key={ann.id}
                onClick={() => onSelectAnnouncement(ann)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-400 transition-colors cursor-pointer shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 text-[11px]">{ann.category}</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#D4F5EC] text-emerald-900 font-mono">
                    {relevance.score}% {relevance.tier}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ann.title}</h4>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-medium text-slate-800">Why: </span>
                  {relevance.reasons[0] || 'Matches your profile'}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 text-[11px] text-slate-600 space-y-1 shadow-2xs">
            <span className="font-bold text-slate-900 block mb-1">Algorithm Calibration:</span>
            <div>• Interests: 40% (direct category & keyword correlation)</div>
            <div>• Career Goals: 20% (industry & role alignment)</div>
            <div>• Department Match: 15% (direct targeting vs penalties)</div>
            <div>• Academic Year: 15% (eligibility filtering)</div>
            <div>• Approaching Deadlines: 10% (urgency bonus)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
