import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Share2,
  Globe,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { PortfolioShareModal } from './PortfolioShareModal';

interface PortfolioUrlBannerProps {
  business: BusinessProfile;
  itemCount?: number;
}

export const PortfolioUrlBanner: React.FC<PortfolioUrlBannerProps> = ({
  business,
  itemCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://storelly.com';
  const portfolioPath = `/portfolio/${business.slug}`;
  const shortPath = `/p/${business.slug}`;
  const portfolioFullUrl = `${origin}${portfolioPath}`;
  const shortFullUrl = `${origin}${shortPath}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portfolioFullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPortfolio = () => {
    window.open(portfolioPath, '_blank');
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-5 sm:p-6 shadow-xl">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left info */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Standalone URL
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {itemCount} Work Sample{itemCount === 1 ? '' : 's'} Published
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                Your Public Work Portfolio Link
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                A dedicated, client-facing portfolio that showcases your work, media kit, and testimonials without the storefront catalog.
              </p>
            </div>

            {/* URL Input Box */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-2xl p-1.5 pr-2 w-full max-w-md">
              <Globe className="w-4 h-4 text-indigo-400 ml-2.5 shrink-0" />
              <input
                type="text"
                readOnly
                value={portfolioFullUrl}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-hidden w-full select-all px-1 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Right CTA Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenPortfolio}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 rounded-2xl text-xs font-bold shadow-lg transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Visit Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800/90 text-white rounded-2xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>QR Code & Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code & Share Modal */}
      <PortfolioShareModal
        business={business}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};
