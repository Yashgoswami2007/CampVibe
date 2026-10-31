import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Upload,
  User,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { DEMO_PROFILES } from '../lib/seedData';
import { StorageService } from '../lib/storage';

interface SettingsPageProps {
  activeProfile: StudentProfile;
  onSelectProfile: (profile: StudentProfile) => void;
  onResetData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  activeProfile,
  onSelectProfile,
  onResetData,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = () => {
    const jsonStr = StorageService.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mit_campus_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded successfully.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importJSON(content);
      if (success) {
        showToast('Application state restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast('Error: Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSeed = () => {
    StorageService.resetToDefaults();
    onResetData();
    showToast('Restored 12 realistic demonstration notices!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Application Settings & Demo Controls
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Control demo state, test persona switching, and backup local storage data for MiT Moradabad.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-2xl bg-[#D4F5EC] border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Switch Demo Profile */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-700" />
            Switch Active Persona (For Judges & Evaluators)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Switching profiles immediately recalibrates the recommendation engine, proving that different students see different opportunity priorities from the exact same announcements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_PROFILES.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProfile(p);
                  showToast(`Switched active profile to ${p.name}!`);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#F4F5F8] border-slate-800 shadow-2xs ring-1 ring-slate-800'
                    : 'bg-[#F8F9FA] border-slate-200/80 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{p.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#181B20] text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {p.department} ({p.academic_year})
                  </div>
                  <div className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                    <span className="font-semibold text-slate-900">Interests: </span>
                    {p.interests.slice(0, 3).join(', ')}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/70 text-[10px] text-slate-500">
                  Goal: {p.career_goals[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Data Persistence & Restore */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          Demo Data Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Reload 12 Seed Notices */}
          <button
            type="button"
            onClick={handleResetToSeed}
            className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 hover:border-slate-400 text-left transition-colors flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-5 h-5 text-slate-800" />
            <div>
              <div className="text-xs font-bold text-slate-900">Restore Seed Notices</div>
              <div className="text-[11px] text-slate-500">Reset to 12 realistic campus announcements</div>
            </div>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExport}
            className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 hover:border-slate-400 text-left transition-colors flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs font-bold text-slate-900">Export Backup JSON</div>
              <div className="text-[11px] text-slate-500">Download state to disk</div>
            </div>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 hover:border-slate-400 text-left transition-colors flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs">
            <Upload className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-slate-900">Import Backup JSON</div>
              <div className="text-[11px] text-slate-500">Load previous state file</div>
            </div>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* 3. Transparency & Disclaimers */}
      <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/70 text-xs text-slate-600 space-y-1 leading-relaxed">
        <span className="font-bold text-slate-900 block">Demonstration Transparency Note:</span>
        <p>
          All campus notices, organizers, and deadlines included in the demonstration data are realistic examples crafted for Moradabad Institute of Technology (MiT).
          Communications pasted into the AI Ingestion Studio are parsed securely via server-side Gemini 3.8 Flash, and stored locally in browser localStorage.
        </p>
      </div>
    </div>
  );
};
