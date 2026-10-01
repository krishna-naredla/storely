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
  Star,
  Loader2,
  Zap,
  Ticket,
  Package,
} from 'lucide-react';
import { BusinessProfile, Notification, NotificationType } from '../../types';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from '../../services/firebaseService';
import { auth } from '../../config/firebase';
import { isCreatorProfile } from '../../utils/profileHelper';

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

  const isCreator = isCreatorProfile(business);
  const currentProfileType = isCreator ? 'creator' : 'vendor';

  useEffect(() => {
    if (!business?.id || !auth?.currentUser) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToNotifications(
      business.id,
      (data) => {
        setNotifications(data);
        setIsLoading(false);
      },
      currentProfileType
    );
    return () => unsubscribe();
  }, [business?.id, currentProfileType]);

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

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(business.id, notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleSendTest = async () => {
    try {
      setIsSendingTest(true);
      await createNotification(business.id, {
        title: isCreator ? '🔔 Creator Activity Test' : '🔔 Store Notification Test',
        message: `Real-time notification test successful for ${business.name}! Triggered at ${new Date().toLocaleTimeString()}.`,
        type: 'system',
      });
    } catch (err) {
      console.error('Error sending test notification:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleNotificationClick = (item: Notification) => {
    handleMarkAsRead(item.id);
    const modules = business?.modules || {};

    if (item.type === 'order' || item.type === 'digital_product') {
      setActiveTab('orders');
    } else if (item.type === 'booking' || item.type === 'consultation') {
      setActiveTab('bookings');
    } else if (item.type === 'quote') {
      if (modules.custom_quotes) setActiveTab('quotes');
      else setActiveTab(isCreator ? 'modules' : 'settings');
    } else if (item.type === 'event') {
      if (modules.events_tickets || modules.events_ticketing) setActiveTab('events');
      else setActiveTab(isCreator ? 'modules' : 'settings');
    } else if (item.type === 'review') {
      if (modules.reviews) setActiveTab('reviews');
      else setActiveTab(isCreator ? 'modules' : 'settings');
    } else if (item.type === 'payment') {
      if (item.entityType === 'quote' && modules.custom_quotes) {
        setActiveTab('quotes');
      } else if (item.entityType === 'event' && (modules.events_tickets || modules.events_ticketing)) {
        setActiveTab('events');
      } else if (item.entityType === 'booking') {
        setActiveTab('bookings');
      } else {
        setActiveTab('orders');
      }
    } else if (item.type === 'inquiry') {
      if (isCreator) {
        if (modules.custom_quotes) setActiveTab('quotes');
        else if (modules.work_portfolio || modules.portfolio) setActiveTab('portfolio');
        else setActiveTab('overview');
      } else {
        setActiveTab('orders');
      }
    } else if (item.link) {
      if (item.link.includes('orders')) setActiveTab('orders');
      else if (item.link.includes('bookings')) setActiveTab('bookings');
      else if (item.link.includes('quotes') && modules.custom_quotes) setActiveTab('quotes');
      else if (item.link.includes('events') && (modules.events_tickets || modules.events_ticketing)) setActiveTab('events');
      else if (item.link.includes('reviews') && modules.reviews) setActiveTab('reviews');
      else if (item.link.includes('portfolio')) setActiveTab('portfolio');
      else if (item.link.includes('catalog')) setActiveTab('catalog');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5" />;
      case 'digital_product':
        return <Package className="w-5 h-5" />;
      case 'booking':
      case 'consultation':
        return <CalendarCheck className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'quote':
        return <FileText className="w-5 h-5" />;
      case 'event':
        return <Ticket className="w-5 h-5" />;
      case 'review':
        return <Star className="w-5 h-5" />;
      case 'inquiry':
        return <MessageSquare className="w-5 h-5" />;
      case 'system':
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'digital_product':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'booking':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'consultation':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'payment':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'quote':
        return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'review':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'event':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'inquiry':
        return 'bg-cyan-50 text-cyan-600 border-cyan-100';
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
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
              isCreator ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
                <span>{isCreator ? 'Creator Activity & Alerts' : 'Notifications'}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isCreator ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isCreator ? 'Creator Feed' : 'Vendor Feed'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isCreator
                  ? 'Real-time alerts for digital sales, consultations, quotes, and workshops.'
                  : 'Real-time alerts for customer orders, bookings, quotes, and payments.'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTest}
            className={`px-3.5 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 ${
              isCreator ? 'bg-purple-600 hover:bg-purple-700 border border-purple-700' : 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-700'
            }`}
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
          <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isCreator ? 'text-purple-600' : 'text-indigo-600'}`} />
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
              {isCreator
                ? 'Real-time sales, consultation requests, and client inquiries will appear here automatically.'
                : 'Real-time customer orders, appointments, and payments will appear here automatically.'}
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
                  !item.read
                    ? isCreator
                      ? 'bg-purple-50/30 border-l-4 border-l-purple-600'
                      : 'bg-indigo-50/30 border-l-4 border-l-indigo-600'
                    : 'border-l-4 border-l-transparent'
                }`}
                onClick={() => handleNotificationClick(item)}
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
                        <span className={`w-2 h-2 rounded-full ${isCreator ? 'bg-purple-600' : 'bg-indigo-600'}`} title="Unread"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium shrink-0">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr} {timeStr}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-slate-300 hover:text-rose-500 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.message}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(item);
                      }}
                      className={`inline-flex items-center gap-1 text-xs font-bold transition ${
                        isCreator ? 'text-purple-600 hover:text-purple-700' : 'text-indigo-600 hover:text-indigo-700'
                      }`}
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
