import React from 'react';
import {
  Globe,
  RefreshCw,
  Home,
  ArrowLeft,
  Store,
  Sparkles,
  Briefcase,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PublicAvailabilityStatus } from '../../utils/publicAvailability';
import { CanonicalPublicView } from '../../utils/publicRouteResolver';

interface PublicStatusViewProps {
  status: PublicAvailabilityStatus;
  title: string;
  message: string;
  helperNote?: string;
  requestedSlug?: string | null;
  targetView?: CanonicalPublicView;
  isExplicitPreview?: boolean;
  onBackToDashboard?: () => void;
  onRetry?: () => void;
  onGoToHome?: () => void;
}

export const PublicStatusView: React.FC<PublicStatusViewProps> = ({
  status,
  title,
  message,
  helperNote,
  requestedSlug,
  targetView,
  isExplicitPreview = false,
  onBackToDashboard,
  onRetry,
  onGoToHome,
}) => {
  const isNotFound = status === 'NOT_FOUND' || status === 'DELETED';

  const handleGoHome = () => {
    if (onGoToHome) {
      onGoToHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const renderIcon = () => {
    if (isNotFound) {
      if (targetView === 'bio') return <Sparkles className="w-8 h-8 text-slate-400" />;
      if (targetView === 'portfolio') return <Briefcase className="w-8 h-8 text-slate-400" />;
      return <Store className="w-8 h-8 text-slate-400" />;
    }
    return <Globe className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* Explicit Owner Preview Notice (rendered ONLY for verified authenticated owners in explicit preview mode) */}
      {isExplicitPreview && onBackToDashboard && (
        <aside
          aria-label="Owner preview notice"
          className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold">Owner Preview Mode:</span>
            <span className="hidden sm:inline text-amber-800">
              This page is currently unpublished or inactive. Public visitors see this neutral screen.
            </span>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </aside>
      )}

      {/* Main Content Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <main className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Neutral Status Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto shadow-inner">
            {renderIcon()}
          </div>

          {/* Heading & Neutral Description */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {/* Safe Neutral Context Box */}
          {helperNote && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Information</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {helperNote}
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleGoHome}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to Storelly</span>
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </main>
      </div>

      {/* Powered by Storelly Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        <span>Powered by </span>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleGoHome();
          }}
          className="font-bold text-slate-700 hover:text-emerald-600 transition"
        >
          Storelly
        </a>
      </footer>
    </div>
  );
};
