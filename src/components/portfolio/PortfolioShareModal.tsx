import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BusinessProfile } from '../../types';

interface PortfolioShareModalProps {
  business: BusinessProfile;
  isOpen?: boolean;
  onClose: () => void;
}

export const PortfolioShareModal: React.FC<PortfolioShareModalProps> = ({
  business,
  isOpen = true,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://storelly.com';
  const effectiveSlug = business.slug || business.id;
  const portfolioUrl = `${origin}/portfolio/${effectiveSlug}`;
  const shortUrl = `${origin}/p/${effectiveSlug}`;

  useEffect(() => {
    if (isOpen && effectiveSlug) {
      QRCode.toDataURL(portfolioUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, effectiveSlug, portfolioUrl]);

  if (!isOpen) return null;

  const handleCopy = (urlToCopy: string, isShort = false) => {
    navigator.clipboard.writeText(urlToCopy);
    if (isShort) {
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `${business.slug}-portfolio-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWhatsAppShare = () => {
    const text = `Check out my official work portfolio on Storelly: ${shortUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Portfolio Link</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-heading">
            Share Your Work Portfolio
          </h3>
          <p className="text-xs text-slate-500">
            Share this standalone link with prospective clients, on Instagram, or via WhatsApp.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-5 text-center">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 mb-3">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Portfolio QR Code"
                className="w-44 h-44 object-contain rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-300">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
          </div>
          <div className="text-xs font-bold text-slate-800">
            Scan to Open Portfolio Directly
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Perfect for visiting cards, banners, exhibitions, or resume PDFs
          </p>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Code (PNG)
          </button>
        </div>

        {/* Link Boxes */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Short Portfolio URL
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono font-medium text-slate-700 truncate flex-1 select-all">
                {shortUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(shortUrl, true)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
              >
                {copiedShort ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShort ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Full Portfolio URL
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono font-medium text-slate-700 truncate flex-1 select-all">
                {portfolioUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(portfolioUrl, false)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </button>
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" /> Open Portfolio
          </a>
        </div>
      </div>
    </div>
  );
};
