/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeDashboard } from './pages/HomeDashboard';
import { ExplorePage } from './pages/ExplorePage';
import { MyOpportunitiesPage } from './pages/MyOpportunitiesPage';
import { AddAnnouncement } from './pages/AddAnnouncement';
import { WeeklyBriefingPage } from './pages/WeeklyBriefingPage';
import { MyInterestsPage } from './pages/MyInterestsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CampusAnnouncement, OpportunityFolder, StudentProfile } from './types';
import { StorageService } from './lib/storage';
import { DEMO_PROFILES } from './lib/seedData';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [profile, setProfile] = useState<StudentProfile>(() => StorageService.getProfile());
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>(() => StorageService.getAnnouncements());
  const [opportunityStates, setOpportunityStates] = useState<Record<string, { folder: OpportunityFolder }>>(() =>
    StorageService.getOpportunityStates()
  );
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CampusAnnouncement | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => StorageService.isOnboarded());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut listener (Esc closes modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAnnouncement(null);
        setMobileMenuOpen(false);
      }
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setCurrentView('explore');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSelectAnnouncement = (a: CampusAnnouncement) => {
    setSelectedAnnouncement(a);
  };

  const handleToggleSave = (announcementId: string, folder: OpportunityFolder | null) => {
    const updated = StorageService.setOpportunityFolder(announcementId, folder);
    setOpportunityStates({ ...updated });
  };

  const handleAnnouncementCreated = (newAnnouncement: CampusAnnouncement) => {
    const updatedList = StorageService.addAnnouncement(newAnnouncement);
    setAnnouncements([...updatedList]);
    setCurrentView('explore');
    setSelectedAnnouncement(newAnnouncement);
  };

  const handleProfileChange = (updatedProfile: StudentProfile) => {
    StorageService.saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleResetData = () => {
    setAnnouncements(StorageService.getAnnouncements());
    setProfile(StorageService.getProfile());
    setOpportunityStates(StorageService.getOpportunityStates());
  };

  const handleOnboardingComplete = (newProfile: StudentProfile) => {
    StorageService.saveProfile(newProfile);
    StorageService.setOnboarded(true);
    setProfile(newProfile);
    setIsOnboarded(true);
  };

  const handleQuickDemoBypass = () => {
    const demoProfile = DEMO_PROFILES[0];
    StorageService.saveProfile(demoProfile);
    StorageService.setOnboarded(true);
    setProfile(demoProfile);
    setIsOnboarded(true);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Campus Radar';
      case 'explore':
        return 'Opportunity Catalog';
      case 'opportunities':
        return 'My Pipeline';
      case 'add':
        return 'AI Ingestion Studio';
      case 'briefing':
        return 'Weekly Briefing';
      case 'interests':
        return 'Personalization Radar';
      case 'settings':
        return 'Settings & Demo Controls';
      default:
        return 'Campus Radar';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#292A28] flex flex-row">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeProfile={profile}
          onSelectProfile={handleProfileChange}
          savedCount={Object.keys(opportunityStates).length}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 bg-[#FAF8F3] h-full shadow-2xl">
            <Sidebar
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              activeProfile={profile}
              onSelectProfile={(p) => {
                handleProfileChange(p);
                setMobileMenuOpen(false);
              }}
              savedCount={Object.keys(opportunityStates).length}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          title={getPageTitle()}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentView !== 'explore') setCurrentView('explore');
          }}
          onOpenAdd={() => setCurrentView('add')}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          announcements={announcements}
          profile={profile}
          onSelectAnnouncement={handleSelectAnnouncement}
        />

        {/* Content Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {currentView === 'home' && (
            <HomeDashboard
              profile={profile}
              announcements={announcements}
              opportunityStates={opportunityStates}
              onSelectAnnouncement={handleSelectAnnouncement}
              onToggleSave={handleToggleSave}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'explore' && (
            <ExplorePage
              profile={profile}
              announcements={announcements}
              opportunityStates={opportunityStates}
              onSelectAnnouncement={handleSelectAnnouncement}
              onToggleSave={handleToggleSave}
              initialSearch={searchQuery}
            />
          )}

          {currentView === 'opportunities' && (
            <MyOpportunitiesPage
              profile={profile}
              announcements={announcements}
              opportunityStates={opportunityStates}
              onSelectAnnouncement={handleSelectAnnouncement}
              onToggleSave={handleToggleSave}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'add' && (
            <AddAnnouncement
              existingAnnouncements={announcements}
              onAnnouncementCreated={handleAnnouncementCreated}
              onCancel={() => setCurrentView('home')}
            />
          )}

          {currentView === 'briefing' && (
            <WeeklyBriefingPage
              profile={profile}
              announcements={announcements}
              onSelectAnnouncement={handleSelectAnnouncement}
            />
          )}

          {currentView === 'interests' && (
            <MyInterestsPage
              profile={profile}
              announcements={announcements}
              onSaveProfile={handleProfileChange}
              onSelectAnnouncement={handleSelectAnnouncement}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              activeProfile={profile}
              onSelectProfile={handleProfileChange}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Notice Detail Modal */}
      {selectedAnnouncement && (
        <NoticeDetailModal
          announcement={selectedAnnouncement}
          profile={profile}
          currentFolder={opportunityStates[selectedAnnouncement.id]?.folder || null}
          onClose={() => setSelectedAnnouncement(null)}
          onUpdateFolder={handleToggleSave}
        />
      )}

      {/* First-Time Onboarding Modal */}
      {!isOnboarded && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onQuickDemo={handleQuickDemoBypass}
        />
      )}
    </div>
  );
}
