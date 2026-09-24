import React from 'react';
import {
  ShoppingBag,
  Link2,
  Briefcase,
  QrCode,
  MessageCircle,
  Phone,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { BusinessProfile } from '../../types';

interface PublicModuleUnavailableViewProps {
  business?: BusinessProfile | null;
  moduleType: 'store' | 'bio' | 'portfolio' | 'card' | 'general';
  title?: string;
  message?: string;
  isExplicitPreview?: boolean;
  onBackToDashboard?: () => void;
}

export const PublicModuleUnavailableView: React.FC<PublicModuleUnavailableViewProps> = ({
  business,
  moduleType,
  title,
  message,
  isExplicitPreview = false,
  onBackToDashboard,
}) => {
  const getIcon = () => {
    switch (moduleType) {
      case 'store':
        return <ShoppingBag className="w-8 h-8 text-emerald-400" />;
      case 'bio':
        return <Link2 className="w-8 h-8 text-indigo-400" />;
      case 'portfolio':
        return <Briefcase className="w-8 h-8 text-purple-400" />;
      case 'card':
        return <QrCode className="w-8 h-8 text-sky-400" />;
      default:
        return <AlertCircle className="w-8 h-8 text-amber-400" />;
    }
  };

  const getHeading = () => {
    if (title) return title;
    switch (moduleType) {
      case 'store':
        return 'Storefront Unavailable';
      case 'bio':
        return 'Bio Link Unavailable';
      case 'portfolio':
        return 'Portfolio Unavailable';
      case 'card':
        return 'Visiting Card Unavailable';
      default:
        return 'Page Unavailable';
    }
  };

  const getDescription = () => {
    if (message) return message;
    const name = business?.name || 'the creator';
    switch (moduleType) {
      case 'store':
        return `The digital store for ${name} is currently not published or is temporarily offline.`;
      case 'bio':
        return `The universal bio links page for ${name} is currently disabled or has not been published yet.`;
      case 'portfolio':
        return `The portfolio showcase for ${name} is currently private or disabled.`;
      case 'card':
        return `The digital trust card for ${name} is not currently active.`;
      default:
        return `This page is currently unavailable or has not been published.`;
    }
  };

  const logoUrl = business?.logo || business?.profileImage;
  const whatsappNumber = business?.whatsapp || business?.phone;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Explicit Owner Preview Warning Banner */}
      {isExplicitPreview && (
        <aside
          aria-label="Owner preview notice"
          className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">Owner Preview Mode:</span>
            <span className="hidden sm:inline text-amber-300/90">
              This module is unpublished. Public visitors see this exact unavailable screen.
            </span>
          </div>
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <main className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-sm space-y-6">
          {/* Business / Profile Header */}
          {business && (
            <div className="flex flex-col items-center gap-3">
              {logoUrl ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                  <img
                    src={logoUrl}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xl flex items-center justify-center shadow-inner">
                  {business.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-200">{business.name}</h2>
                  {business.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                {business.tagline && (
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{business.tagline}</p>
                )}
              </div>
            </div>
          )}

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto shadow-inner">
            {getIcon()}
          </div>

          {/* Heading and Message */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
              {getHeading()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              {getDescription()}
            </p>
          </div>

          {/* Public Contact Actions (if merchant configured public phone or WhatsApp, and not suspended) */}
          {whatsappNumber && business?.status !== 'suspended' && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <p className="text-[11px] text-slate-400">Need immediate assistance from this business?</p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
                {business?.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Powered by Storelly Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        <span>Powered by </span>
        <span className="font-bold text-slate-300">Storelly</span>
      </footer>
    </div>
  );
};
