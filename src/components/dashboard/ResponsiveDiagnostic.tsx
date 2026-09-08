import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, Activity, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

export interface DeviceInfo {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  pixelRatio: number;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      width: 1200,
      height: 800,
      deviceType: 'desktop',
      breakpoint: 'xl',
      pixelRatio: 1,
      isTouch: false,
      orientation: 'landscape',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const orientation = width >= height ? 'landscape' : 'portrait';

  let breakpoint: DeviceInfo['breakpoint'] = 'xs';
  let deviceType: DeviceInfo['deviceType'] = 'mobile';

  if (width < 420) {
    breakpoint = 'xs';
    deviceType = 'mobile';
  } else if (width < 640) {
    breakpoint = 'sm';
    deviceType = 'mobile';
  } else if (width < 768) {
    breakpoint = 'md';
    deviceType = 'tablet';
  } else if (width < 1024) {
    breakpoint = 'lg';
    deviceType = 'tablet';
  } else if (width < 1280) {
    breakpoint = 'xl';
    deviceType = 'desktop';
  } else {
    breakpoint = '2xl';
    deviceType = 'desktop';
  }

  return {
    width,
    height,
    deviceType,
    breakpoint,
    pixelRatio,
    isTouch,
    orientation,
  };
}

export const ResponsiveDiagnostic: React.FC<{ forceShow?: boolean }> = ({ forceShow = false }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (forceShow) return true;
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const isDev = Boolean((import.meta as Record<string, any>).env?.DEV);
    return urlParams.get('debug') === 'responsive' || isDev;
  });

  useEffect(() => {
    const handleResize = () => {
      const info = getDeviceInfo();
      setDeviceInfo(info);

      const isDev = Boolean((import.meta as Record<string, any>).env?.DEV);
      // Console diagnostic log for easy developer debugging
      if (isDev) {
        console.log(
          `[Viewport Diagnostic] ${info.width}x${info.height} (${info.breakpoint.toUpperCase()}) | ${info.deviceType} | ${info.orientation} | DPR: ${info.pixelRatio}x | Touch: ${info.isTouch}`
        );
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize(); // Initial log

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!isVisible) return null;

  const DeviceIcon = 
    deviceInfo.deviceType === 'mobile' 
      ? Smartphone 
      : deviceInfo.deviceType === 'tablet' 
      ? Tablet 
      : Monitor;

  return (
    <aside 
      aria-label="Viewport Diagnostic"
      className="fixed bottom-4 left-4 z-50 font-sans select-none print:hidden pointer-events-auto"
    >
      <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 transition-all max-w-xs sm:max-w-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition min-h-[44px] min-w-[44px] px-1"
          >
            <div className={`p-1.5 rounded-lg flex items-center justify-center ${
              deviceInfo.deviceType === 'mobile' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : deviceInfo.deviceType === 'tablet'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              <DeviceIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono tracking-tight">
                  {deviceInfo.width}×{deviceInfo.height}px
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {deviceInfo.breakpoint}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium capitalize">
                {deviceInfo.deviceType} • {deviceInfo.orientation}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={isExpanded ? 'Collapse diagnostic' : 'Expand diagnostic'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="p-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Close diagnostic widget"
            >
              ✕
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2 text-[11px] font-mono text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Viewport Scale:</span>
              <span className="text-white font-bold">{deviceInfo.pixelRatio}x (DPR)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Touch Interface:</span>
              <span className={`font-bold flex items-center gap-1 ${deviceInfo.isTouch ? 'text-emerald-400' : 'text-slate-400'}`}>
                {deviceInfo.isTouch ? <CheckCircle2 className="w-3 h-3" /> : null}
                {deviceInfo.isTouch ? 'Detected (Mobile/Touch)' : 'Mouse / Desktop'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Mobile Layout:</span>
              <span className={`font-bold ${deviceInfo.width < 768 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {deviceInfo.width < 768 ? 'Mobile-First (1 Col / Bottom Drawer)' : 'Desktop Multi-Col'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Min Touch Target:</span>
              <span className="text-emerald-400 font-bold">44×44px Compliant</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
