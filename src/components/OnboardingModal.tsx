import React, { useState } from 'react';
import { Radio, Sparkles, ArrowRight, Check, User, GraduationCap, FastForward } from 'lucide-react';
import { StudentProfile } from '../types';
import { DEMO_PROFILES } from '../lib/seedData';

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
  const [college, setCollege] = useState('Institute of Engineering & Technology');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Artificial Intelligence',
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
      college: college.trim() || 'University Campus',
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
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E0DBD0] space-y-6 animate-in zoom-in-95 duration-150">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C96B35] flex items-center justify-center text-white shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#292A28] leading-tight">
                Welcome to Campus Radar
              </h2>
              <span className="text-xs text-[#787774]">
                Don't Miss What Matters.
              </span>
            </div>
          </div>

          {/* Quick Demo Bypass for Judges */}
          <button
            type="button"
            onClick={onQuickDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FDF3EB] text-[#C96B35] border border-[#F8DCBA] hover:bg-[#FBE8DA] transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Judge Demo Mode</span>
          </button>
        </div>

        {step === 1 ? (
          /* Step 1: Academic Identity */
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#292A28]">
                1. Your Academic Profile
              </h3>
              <p className="text-xs text-[#787774]">
                Opportunities will be filtered and prioritized based on your department and batch year.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yash Goswami"
                  className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
                >
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C8880] uppercase tracking-wider block mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E0DBD0] text-xs text-[#292A28] focus:border-[#C96B35] focus:outline-none bg-white"
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
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Next: Select Your Interests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 2: Interests Selection */
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#292A28]">
                2. What opportunities interest you?
              </h3>
              <p className="text-xs text-[#787774]">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#C96B35] text-white border-[#C96B35] shadow-2xs'
                        : 'bg-[#FAF8F3] text-[#5C5A56] border-[#E8E5DF] hover:border-[#C96B35]/40'
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
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#787774] hover:bg-[#FAF8F3]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#C96B35] text-white hover:bg-[#B85E2B] transition-colors shadow-xs"
              >
                Launch Campus Radar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
