import React, { useState } from 'react';
import { Wrench, Shield, LogIn } from 'lucide-react';
import { getAppLogo, getAppName } from '../../utils/branding';
import { MasterAdminLogin } from '../admin/MasterAdminLogin';

interface PlatformMaintenanceViewProps {
  supportEmail?: string;
  supportPhone?: string;
  onAdminLoginSuccess?: () => void;
}

export const PlatformMaintenanceView: React.FC<PlatformMaintenanceViewProps> = ({
  supportEmail = 'support@storelly.com',
  supportPhone = '+91 98765 43210',
  onAdminLoginSuccess,
}) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5 flex items-center justify-center">
            <img src={getAppLogo()} alt={getAppName()} className="w-full h-full object-contain" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight text-white">{getAppName()}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdminModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Admin Portal</span>
        </button>
      </header>

      {/* Center Maintenance Message */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20">
              System Maintenance in Progress
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
              Platform Temporarily Offline
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {getAppName()} is currently undergoing scheduled platform upgrades to optimize speed, security, and checkout reliability. All stores and merchant dashboards will resume normal service shortly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-left text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>Need Urgent Help?</span>
            </div>
            <p className="text-slate-400">
              Contact platform operations at{' '}
              <a href={`mailto:${supportEmail}`} className="text-emerald-400 font-semibold hover:underline">
                {supportEmail}
              </a>{' '}
              or call{' '}
              <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="text-emerald-400 font-semibold hover:underline">
                {supportPhone}
              </a>.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Administrator Sign In</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {getAppName()} Platform Operating System. All rights reserved.
      </footer>

      {/* Master Admin Login Modal if administrator needs to log in to disable maintenance mode */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <MasterAdminLogin
              onLoginSuccess={() => {
                setIsAdminModalOpen(false);
                if (onAdminLoginSuccess) onAdminLoginSuccess();
              }}
              onBack={() => setIsAdminModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
