import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export const OfflineAlert: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineStatus(true);
      // Hide the "Back Online" message after 3 seconds
      const timer = setTimeout(() => {
        setShowOnlineStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <WifiOff className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold">You are offline</h4>
            <p className="text-[11px] text-slate-400">Please check your internet connection. Some features may be unavailable.</p>
          </div>
          <button 
            onClick={() => setIsOffline(false)}
            className="p-1.5 text-slate-500 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showOnlineStatus) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold">Back Online</h4>
            <p className="text-[11px] text-emerald-100">Connection restored. Your data will now sync.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
