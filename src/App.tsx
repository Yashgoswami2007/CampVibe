/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ShareAnnouncementModal } from './components/ShareAnnouncementModal';
import { EditAnnouncementModal } from './components/EditAnnouncementModal';
import { NotificationModal } from './components/NotificationModal';
import { AiCampusAssistant } from './components/AiCampusAssistant';
import { RoleMatrixModal } from './components/RoleMatrixModal';
import { HomeDashboard } from './pages/HomeDashboard';
import { ExplorePage } from './pages/ExplorePage';
import { CalendarPage } from './pages/CalendarPage';
import { MyOpportunitiesPage } from './pages/MyOpportunitiesPage';
import { AddAnnouncement } from './pages/AddAnnouncement';
import { WeeklyBriefingPage } from './pages/WeeklyBriefingPage';
import { MyInterestsPage } from './pages/MyInterestsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ClubsManagementPage } from './pages/ClubsManagementPage';
import { StudentsManagementPage } from './pages/StudentsManagementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { CampusAnnouncement, CampusNotification, OpportunityFolder, StudentProfile } from './types';
import { StorageService } from './lib/storage';
import { DEMO_PROFILES } from './lib/seedData';
import { Permissions } from './lib/permissions';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [profile, setProfile] = useState<StudentProfile>(() => StorageService.getProfile());
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>(() => StorageService.getAnnouncements());
  const [opportunityStates, setOpportunityStates] = useState<Record<string, { folder: OpportunityFolder }>>(() =>
    StorageService.getOpportunityStates()
  );
  const [notifications, setNotifications] = useState<CampusNotification[]>(() => StorageService.getNotifications());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CampusAnnouncement | null>(null);
  const [sharingAnnouncement, setSharingAnnouncement] = useState<CampusAnnouncement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<CampusAnnouncement | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isRoleMatrixOpen, setIsRoleMatrixOpen] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => StorageService.isOnboarded());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingApprovalsCount = announcements.filter((a) => a.status === 'pending_approval').length;

  // Keyboard shortcut listener (Esc closes modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAnnouncement(null);
        setSharingAnnouncement(null);
        setEditingAnnouncement(null);
        setIsNotificationsOpen(false);
        setIsAssistantOpen(false);
        setIsRoleMatrixOpen(false);
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
    if (newAnnouncement.status === 'pending_approval') {
      setCurrentView('approvals');
    } else {
      setCurrentView('explore');
    }
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
    setNotifications(StorageService.getNotifications());
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

  const handleEditAnnouncement = (a: CampusAnnouncement) => {
    setEditingAnnouncement(a);
  };

  const handleSaveEditedAnnouncement = (updated: CampusAnnouncement) => {
    const updatedList = StorageService.updateAnnouncement(updated);
    setAnnouncements([...updatedList]);
    if (selectedAnnouncement?.id === updated.id) {
      setSelectedAnnouncement(updated);
    }
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id: string) => {
    const updatedList = StorageService.deleteAnnouncement(id);
    setAnnouncements([...updatedList]);
    if (selectedAnnouncement?.id === id) {
      setSelectedAnnouncement(null);
    }
    if (sharingAnnouncement?.id === id) {
      setSharingAnnouncement(null);
    }
    if (editingAnnouncement?.id === id) {
      setEditingAnnouncement(null);
    }
  };

  const handleApproveAnnouncement = (id: string) => {
    const updatedList = StorageService.approveAnnouncement(id, profile);
    setAnnouncements([...updatedList]);
    if (selectedAnnouncement?.id === id) {
      const target = updatedList.find((a) => a.id === id);
      if (target) setSelectedAnnouncement(target);
    }
  };

  const handleRejectAnnouncement = (id: string, reason?: string) => {
    const updatedList = StorageService.rejectAnnouncement(id, reason);
    setAnnouncements([...updatedList]);
    if (selectedAnnouncement?.id === id) {
      const target = updatedList.find((a) => a.id === id);
      if (target) setSelectedAnnouncement(target);
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    const next = StorageService.markNotificationRead(id);
    setNotifications([...next]);
  };

  const handleMarkAllNotificationsRead = () => {
    const next = StorageService.markAllNotificationsRead();
    setNotifications([...next]);
  };

  const handleClearNotifications = () => {
    const next = StorageService.clearNotifications();
    setNotifications([...next]);
  };

  const handleNavigate = (view: string) => {
    if (view === 'assistant') {
      setIsAssistantOpen(true);
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'home':
        return profile.role === 'super_admin' ? 'Campus Pulse' : profile.role === 'head' ? `${profile.assigned_club_name || 'Club'} Hub` : 'Dashboard';
      case 'explore':
        return 'Explore';
      case 'calendar':
        return 'Campus Calendar';
      case 'opportunities':
        return 'My Pipeline';
      case 'add':
        return profile.role === 'head' ? 'Post Club Notice' : 'Smart Add';
      case 'approvals':
        return 'Approvals Queue';
      case 'clubs':
        return profile.role === 'super_admin' ? 'Manage Clubs' : 'Club Profile';
      case 'students':
        return profile.role === 'super_admin' ? 'Student Directory' : 'Club Member Roster';
      case 'users':
        return 'Roles & Permissions';
      case 'briefing':
        return 'Weekly Briefing';
      case 'interests':
        return 'My Interest';
      case 'settings':
        return 'Help & Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-slate-800 p-3 md:p-6 flex items-start justify-center">
      {/* Outer window shell mirroring dashboard frame */}
      <div className="w-full max-w-[1580px] bg-[#FDFDFE] rounded-[36px] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200/70 min-h-[920px]">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            activeProfile={profile}
            onSelectProfile={handleProfileChange}
            savedCount={Object.keys(opportunityStates).length}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-[#FBFBFC] h-full shadow-2xl">
              <Sidebar
                currentView={currentView}
                onNavigate={(view) => {
                  handleNavigate(view);
                  setMobileMenuOpen(false);
                }}
                activeProfile={profile}
                onSelectProfile={(p) => {
                  handleProfileChange(p);
                  setMobileMenuOpen(false);
                }}
                savedCount={Object.keys(opportunityStates).length}
                pendingApprovalsCount={pendingApprovalsCount}
              />
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopNav
            title={getPageTitle()}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (currentView !== 'explore') setCurrentView('explore');
            }}
            onOpenAdd={() => setCurrentView('add')}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
            announcements={announcements}
            profile={profile}
            notifications={notifications}
            onSelectAnnouncement={handleSelectAnnouncement}
            onSelectProfile={handleProfileChange}
            onOpenRoleMatrix={() => setIsRoleMatrixOpen(true)}
            pendingApprovalsCount={pendingApprovalsCount}
            onOpenPendingApprovals={() => setCurrentView('approvals')}
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
                onShare={(a) => setSharingAnnouncement(a)}
                onNavigate={handleNavigate}
                onApprove={handleApproveAnnouncement}
                onReject={handleRejectAnnouncement}
              />
            )}

            {currentView === 'explore' && (
              <ExplorePage
                profile={profile}
                announcements={announcements}
                opportunityStates={opportunityStates}
                onSelectAnnouncement={handleSelectAnnouncement}
                onToggleSave={handleToggleSave}
                onShare={(a) => setSharingAnnouncement(a)}
                initialSearch={searchQuery}
              />
            )}

            {currentView === 'approvals' && (
              <ApprovalsPage
                profile={profile}
                announcements={announcements}
                onApprove={handleApproveAnnouncement}
                onReject={handleRejectAnnouncement}
                onSelectAnnouncement={handleSelectAnnouncement}
                onSwitchToApprover={() => handleProfileChange(DEMO_PROFILES[0])}
              />
            )}

            {currentView === 'clubs' && (
              <ClubsManagementPage
                profile={profile}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'students' && (
              <StudentsManagementPage
                profile={profile}
                onSwitchPersona={() => handleProfileChange(DEMO_PROFILES[1])}
              />
            )}

            {currentView === 'users' && (
              <UsersManagementPage
                profile={profile}
                onUpdateActiveProfile={handleProfileChange}
                onSwitchPersona={() => handleProfileChange(DEMO_PROFILES[0])}
              />
            )}

            {currentView === 'calendar' && (
              <CalendarPage
                profile={profile}
                announcements={announcements}
                opportunityStates={opportunityStates}
                onSelectAnnouncement={handleSelectAnnouncement}
                onToggleSave={handleToggleSave}
              />
            )}

            {currentView === 'opportunities' && (
              <MyOpportunitiesPage
                profile={profile}
                announcements={announcements}
                opportunityStates={opportunityStates}
                onSelectAnnouncement={handleSelectAnnouncement}
                onToggleSave={handleToggleSave}
                onShare={(a) => setSharingAnnouncement(a)}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'add' && (
              <AddAnnouncement
                profile={profile}
                existingAnnouncements={announcements}
                onAnnouncementCreated={handleAnnouncementCreated}
                onCancel={() => setCurrentView('home')}
                onSwitchPersona={() => handleProfileChange(DEMO_PROFILES[1])}
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
      </div>

      {/* Notice Detail Modal */}
      {selectedAnnouncement && (
        <NoticeDetailModal
          announcement={selectedAnnouncement}
          profile={profile}
          currentFolder={opportunityStates[selectedAnnouncement.id]?.folder || null}
          onClose={() => setSelectedAnnouncement(null)}
          onUpdateFolder={handleToggleSave}
          onEdit={handleEditAnnouncement}
          onDelete={handleDeleteAnnouncement}
          onShare={(a) => setSharingAnnouncement(a)}
          onApprove={handleApproveAnnouncement}
          onReject={handleRejectAnnouncement}
        />
      )}

      {/* Share Announcement Modal */}
      {sharingAnnouncement && (
        <ShareAnnouncementModal
          announcement={sharingAnnouncement}
          onClose={() => setSharingAnnouncement(null)}
        />
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <EditAnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onSave={handleSaveEditedAnnouncement}
          onDelete={handleDeleteAnnouncement}
        />
      )}

      {/* Notification Centre Modal */}
      {isNotificationsOpen && (
        <NotificationModal
          notifications={notifications}
          announcements={announcements}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onClearAll={handleClearNotifications}
          onSelectAnnouncement={(a) => {
            setIsNotificationsOpen(false);
            setSelectedAnnouncement(a);
          }}
        />
      )}

      {/* AI Campus Assistant Modal */}
      {isAssistantOpen && (
        <AiCampusAssistant
          profile={profile}
          announcements={announcements}
          onClose={() => setIsAssistantOpen(false)}
          onSelectAnnouncement={(a) => {
            setIsAssistantOpen(false);
            setSelectedAnnouncement(a);
          }}
        />
      )}

      {/* Role & Permission Matrix Guide Modal */}
      <RoleMatrixModal
        isOpen={isRoleMatrixOpen}
        onClose={() => setIsRoleMatrixOpen(false)}
        activeProfile={profile}
        onSelectProfile={handleProfileChange}
      />

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
