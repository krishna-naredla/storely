import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X, CheckCircle2, Database } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showCachedStatus, setShowCachedStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // If we were previously offline during this session, trigger the 'Store Data Cached' status indicator
      if (wasOffline || !navigator.onLine) {
        setShowCachedStatus(true);
        const timer = setTimeout(() => {
          setShowCachedStatus(false);
        }, 4500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setShow(true);
      setShowCachedStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // When back online and transitioned from offline: show "Store Data Cached"
  if (!isOffline && showCachedStatus) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div
          role="status"
          aria-live="polite"
          className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Back Online</h4>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  Store Data Cached
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Catalog & local modifications are safely cached and synced with Firestore.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowCachedStatus(false)}
            aria-label="Dismiss notification"
            className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!isOffline || !show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-none">You are currently offline</h4>
            <p className="text-[11px] text-slate-400 mt-1">Some features may not be available until you reconnect.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white cursor-pointer"
            title="Retry Connection"
            aria-label="Retry Connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={() => setShow(false)}
            aria-label="Dismiss offline banner"
            className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
