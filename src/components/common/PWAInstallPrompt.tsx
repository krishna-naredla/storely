import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  variant?: 'banner' | 'button' | 'badge';
  customTitle?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  variant = 'banner',
  customTitle = 'Install Storelly App',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed / in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Chrome / Android / Edge install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If already installed or dismissed, hide banner
  if (isStandalone || isDismissed) {
    return null;
  }

  // If not installable and not iOS, don't show prompt
  if (!isInstallable && !isIOS) {
    return null;
  }

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl text-white flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5 text-slate-950" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-extrabold text-white font-heading tracking-tight">
              {customTitle}
            </h4>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              Add to your home screen for quick 1-tap access and an app-like experience.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold font-heading">Install on iPhone / iPad</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-5 h-5 rounded-md bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 font-bold text-[10px]">
              1
            </div>
            <div>
              Tap the <strong className="text-white">Share</strong> icon{' '}
              <Share2 className="w-3.5 h-3.5 inline text-blue-400" /> at the bottom of Safari.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-5 h-5 rounded-md bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 font-bold text-[10px]">
              2
            </div>
            <div>
              Scroll down and tap{' '}
              <strong className="text-white">"Add to Home Screen"</strong>{' '}
              <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-5 h-5 rounded-md bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 font-bold text-[10px]">
              3
            </div>
            <div>
              Tap <strong className="text-white">"Add"</strong> in the top-right corner to finish.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
