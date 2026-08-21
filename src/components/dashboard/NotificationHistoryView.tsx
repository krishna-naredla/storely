import React, { useState, useEffect } from 'react';
import { Bell, ShoppingBag, CalendarCheck, CheckCircle2, Trash2, ArrowRight, Clock } from 'lucide-react';
import { BusinessProfile } from '../../types';

export interface NotificationHistoryItem {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  body: string;
  type: 'order' | 'booking';
  timestamp: number;
  read: boolean;
}

interface NotificationHistoryViewProps {
  business: BusinessProfile;
  setActiveTab: (tab: any) => void;
}

export const NotificationHistoryView: React.FC<NotificationHistoryViewProps> = ({
  business,
  setActiveTab,
}) => {
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, [business.id]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(`storelly_notification_history_${business.id}`);
      if (stored) {
        const parsed: NotificationHistoryItem[] = JSON.parse(stored);
        setHistory(parsed.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch {
      setHistory([]);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(`storelly_notification_history_${business.id}`);
      setHistory([]);
    } catch {}
  };

  const markAllAsRead = () => {
    try {
      const updated = history.map((item) => ({ ...item, read: true }));
      setHistory(updated);
      localStorage.setItem(`storelly_notification_history_${business.id}`, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                Notification History
              </h2>
              <p className="text-xs text-slate-500">
                Review your last 20 received order & booking alerts, even when your browser was inactive.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
              <button
                type="button"
                onClick={clearHistory}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* List */}
      {history.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-heading">No Notification History Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers place new orders or request bookings on your storefront, real-time alerts will appear here and trigger system push notifications.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
          {history.map((item) => {
            const dateObj = new Date(item.timestamp);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString();

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition hover:bg-slate-50/80 ${
                  !item.read ? 'bg-emerald-50/30' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  item.type === 'order'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {item.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr} at {timeStr}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.body}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === 'order') setActiveTab('orders');
                        else setActiveTab('bookings');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                    >
                      <span>View in {item.type === 'order' ? 'Orders Manager' : 'Bookings Manager'}</span>
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
