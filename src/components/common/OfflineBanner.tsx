import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            title="Retry Connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShow(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
