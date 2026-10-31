import React, { useState } from 'react';
import { X, Bell, Clock, Calendar, Sparkles, Trash2, CheckCheck } from 'lucide-react';
import { CampusAnnouncement, CampusNotification } from '../types';

interface NotificationModalProps {
  notifications: CampusNotification[];
  announcements: CampusAnnouncement[];
  onClose: () => void;
  onSelectAnnouncement: (a: CampusAnnouncement) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  announcements,
  onClose,
  onSelectAnnouncement,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'deadline' | 'event'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'deadline') return n.type === 'deadline';
    if (filter === 'event') return n.type === 'event';
    return true;
  });

  const announcementMap = new Map<string, CampusAnnouncement>();
  announcements.forEach(a => announcementMap.set(a.id, a));

  const getIcon = (type: CampusNotification['type']) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#181B20] text-white flex items-center justify-center shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notification Centre
              </h3>
              <span className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-200/70 bg-white text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'deadline', label: 'Deadlines' },
            { id: 'event', label: 'Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#181B20] text-white shadow-2xs'
                  : 'bg-[#F8F9FA] text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F8F9FA]/40">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((notif) => {
              const ann = notif.announcement_id ? announcementMap.get(notif.announcement_id) : null;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkRead(notif.id);
                    if (ann) {
                      onSelectAnnouncement(ann);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    notif.read
                      ? 'bg-white border-slate-200/70 hover:border-slate-300'
                      : 'bg-white border-slate-300 ring-1 ring-slate-800/10 hover:border-slate-400 shadow-2xs'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    {ann && (
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-[#F8F9FA] border border-slate-200 font-medium text-slate-700">
                          {ann.category}
                        </span>
                        <span>Click to view details & act</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No notifications</p>
              <p className="text-[11px] text-slate-500">
                You're completely updated with all upcoming opportunities and reminders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
