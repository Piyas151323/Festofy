import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, CheckCheck, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../../services/notificationService';
import { StudentNotification } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const list = await getStudentNotifications(currentUser.uid);
      setNotifications(list);
    } catch (err) {
      console.warn('Notice loading notifications:', err);
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll notifications every 60s
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = async (notif: StudentNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setIsOpen(false);
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#9da3b4] hover:text-white hover:bg-[#191b20] transition-colors cursor-pointer"
        title="Event Recommendations & Alerts"
        aria-label="Event Recommendations & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff4f1a] ring-2 ring-[#121316] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#14161a] border border-[#2e3442] shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
          <div className="p-3.5 border-b border-[#242730] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff4f1a]" />
              <span className="font-heading font-bold text-xs text-white">
                Event Recommendations & Alerts
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#ff4f1a]/20 text-[#ff4f1a] font-mono text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#ff4f1a] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#242730]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-[#ff4f1a] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#9da3b4]">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2.5">
                <p className="text-xs text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifs}
                  className="px-3 py-1.5 rounded-lg bg-[#191b20] hover:bg-[#242730] text-xs font-semibold text-white border border-[#2e3442] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs text-[#9da3b4]">
                  No new notifications. We'll suggest competitions here when they match your profile interests!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-[#191b20] transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    !notif.read ? 'bg-[#ff4f1a]/5' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a] shrink-0" />
                      )}
                      <h4 className="font-semibold text-xs text-white truncate">
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#9da3b4] line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#656c80] font-mono">
                        {formatDateTime(notif.createdAt)}
                      </span>
                      {notif.actionUrl && (
                        <Link
                          to={notif.actionUrl}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(notif);
                          }}
                          className="text-[10px] text-[#ff4f1a] font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <span>Open Event</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, notif.id)}
                    className="text-[#656c80] hover:text-white p-1"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-[#242730] text-center bg-[#101114]">
            <Link
              to="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[#9da3b4] hover:text-white font-medium transition-colors"
            >
              Update your interests in Profile Settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
