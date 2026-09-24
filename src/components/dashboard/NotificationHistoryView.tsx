import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShoppingBag,
  CalendarCheck,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Clock,
  MessageSquare,
  CreditCard,
  FileText,
  User,
  Star,
  Loader2,
  Zap,
} from 'lucide-react';
import { BusinessProfile, Notification } from '../../types';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from '../../services/firebaseService';
import { auth } from '../../config/firebase';

interface NotificationHistoryViewProps {
  business: BusinessProfile;
  setActiveTab: (tab: any) => void;
}

export const NotificationHistoryView: React.FC<NotificationHistoryViewProps> = ({
  business,
  setActiveTab,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (!business?.id || !auth?.currentUser) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToNotifications(business.id, (data) => {
      setNotifications(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [business?.id]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(business.id);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(business.id, notificationId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendTest = async () => {
    try {
      setIsSendingTest(true);
      await createNotification(business.id, {
        title: '🔔 System Test Notification',
        message: `Real-time notification test successful! Triggered at ${new Date().toLocaleTimeString()}.`,
        type: 'system',
      });
    } catch (err) {
      console.error('Error sending test notification:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5" />;
      case 'booking':
        return <CalendarCheck className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'quote':
        return <FileText className="w-5 h-5" />;
      case 'event':
        return <CalendarCheck className="w-5 h-5" />;
      case 'review':
        return <Star className="w-5 h-5" />;
      case 'system':
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'booking':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'payment':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'quote':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'review':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'event':
        return 'bg-teal-50 text-teal-600 border-teal-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                Notifications
              </h2>
              <p className="text-xs text-slate-500">
                Real-time alerts for orders, bookings, and payments.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTest}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
            <span>Send Test</span>
          </button>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-4">Syncing notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-200 flex items-center justify-center mx-auto border border-slate-100">
            <Bell className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 font-heading">Inbox Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time alerts from your customers will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
          {notifications.map((item) => {
            const dateObj = new Date(item.createdAt);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString();

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition hover:bg-slate-50/80 cursor-pointer ${
                  !item.read ? 'bg-indigo-50/30 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                }`}
                onClick={() => handleMarkAsRead(item.id)}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${getTypeStyles(item.type)}`}>
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" title="Unread"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr} {timeStr}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.message}
                  </p>

                  {item.link && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                          // Determine the tab based on the link or type
                          if (item.type === 'order') setActiveTab('orders');
                          else if (item.type === 'booking') setActiveTab('bookings');
                          else if (item.type === 'quote') setActiveTab('quotes');
                          else if (item.type === 'review') setActiveTab('reviews');
                          else if (item.type === 'event') setActiveTab('events');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
