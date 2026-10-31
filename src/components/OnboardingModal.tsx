import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, FastForward, GraduationCap } from 'lucide-react';
import { StudentProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: StudentProfile) => void;
  onQuickDemo: () => void;
}

const INTEREST_OPTIONS = [
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

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onQuickDemo,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [college] = useState('Moradabad Institute of Technology');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Artificial Intelligence / ML',
    'Hackathons',
    'Web Development',
  ]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleFinish = () => {
    const newProfile: StudentProfile = {
      id: `profile-${Date.now()}`,
      name: name.trim() || 'Student',
      college: college.trim() || 'Moradabad Institute of Technology',
      department,
      academic_year: year,
      interests: selectedInterests,
      career_goals: ['Software Engineer', 'AI Research'],
      notifications_enabled: true,
      created_at: new Date().toISOString(),
    };
    onComplete(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181B20] flex items-center justify-center text-white shadow-2xs">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                Welcome to MiT Portal
              </h2>
              <span className="text-xs text-slate-500">
                Moradabad Institute of Technology
              </span>
            </div>
          </div>

          {/* Quick Demo Bypass */}
          <button
            type="button"
            onClick={onQuickDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F8F9FA] text-slate-800 border border-slate-200/80 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Judge Demo</span>
          </button>
        </div>

        {step === 1 ? (
          /* Step 1: Academic Identity */
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Your Academic Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Opportunities will be filtered and prioritized based on your department and batch year.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yash Goswami"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-slate-800 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Pre-Final)</option>
                  <option value="4th Year">4th Year (Final Year)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-2xs cursor-pointer"
            >
              <span>Next: Select Your Interests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 2: Interests Selection */
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. What opportunities interest you?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose categories to train your personalized recommendation radar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
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

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-[#181B20] text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                Launch MiT Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
