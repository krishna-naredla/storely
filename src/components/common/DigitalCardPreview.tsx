import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Phone,
  MapPin,
  Sparkles,
  Store,
  Printer
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { getStorefrontUrl } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { VerifiedBadge } from './VerifiedBadge';

interface DigitalCardPreviewProps {
  business: BusinessProfile;
  onOpenStore?: () => void;
}

export const DigitalCardPreview: React.FC<DigitalCardPreviewProps> = ({ business, onOpenStore }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [copiedRich, setCopiedRich] = useState(false);

  const storeUrl = getStorefrontUrl(business);
  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  useEffect(() => {
    QRCode.toDataURL(storeUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [storeUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const richShareText = 
    `🌟 *${business.name.toUpperCase()}* 🌟\n` +
    `${business.tagline || `Verified ${bizMeta.label} Storefront`}\n\n` +
    `🛒 *Explore Catalog & Place Orders / Bookings Instantly!*\n` +
    `${business.description ? `📝 _"${business.description}"_\n\n` : ''}` +
    `📍 Location: ${business.city || business.address || 'Online Store'}\n` +
    `📞 WhatsApp/Phone: ${business.whatsapp || business.phone}\n\n` +
    `👇 *VISIT STORE NOW (100% Secure & Fast)*:\n` +
    `🔗 ${storeUrl}\n\n` +
    `✨ _Tap the link above to browse products, check special offers, and order directly!_`;

  const handleCopyRichCard = () => {
    navigator.clipboard.writeText(richShareText);
    setCopiedRich(true);
    setTimeout(() => setCopiedRich(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(richShareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `${business.slug}-store-qr.png`;
    a.click();
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Digital Visiting Card Frame */}
      <div
        ref={cardRef}
        className="relative max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/10 border border-emerald-500/30 overflow-hidden"
      >
        {/* Dynamic Background Image Layer (Storelly4) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/storelly4.jpg.jpeg" 
            alt="Storelly Background Showcase" 
            className="w-full h-full object-cover object-center opacity-25 scale-105" 
          />
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px]"></div>
        </div>

        {/* Banner */}
        <div className="relative z-10 h-32 bg-linear-to-r from-emerald-600 to-teal-700 overflow-hidden">
          {business.banner ? (
            <img
              src={business.banner}
              alt="Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-radial from-teal-700 to-emerald-900 opacity-90">
              <Store className="w-12 h-12 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          
          {Boolean(business.name && (business.whatsapp || business.phone)) && (
            <div className="absolute top-3 right-3">
              <VerifiedBadge verified={true} size="sm" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="relative z-10 px-6 pt-0 pb-6">
          {/* Logo overlapping banner */}
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-emerald-50 text-emerald-700 font-bold text-2xl flex items-center justify-center rounded-xl">
                  {business.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {bizMeta.label}
            </span>
          </div>

          {/* Business Info */}
          <div className="space-y-1 mb-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{business.name}</h2>
            {business.tagline && (
              <p className="text-xs font-medium text-emerald-700">{business.tagline}</p>
            )}
            {business.description && (
              <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed pt-1">
                {business.description}
              </p>
            )}
          </div>

          {/* Contact Badges */}
          <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 mb-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <span className="truncate font-medium text-slate-700">{business.whatsapp || business.phone}</span>
            </div>
            {business.address && (
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{business.city || business.address}</span>
              </div>
            )}
          </div>

          {/* Centered QR Code Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center mb-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Scan with camera to visit instant storefront
            </p>
            <div className="inline-block bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Store QR Code" className="w-36 h-36 mx-auto" />
              ) : (
                <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-lg" />
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-600 font-mono break-all px-2">
              {storeUrl}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenStore}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Visit Public Storefront</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Sharing & Distribution Controls */}
      <div className="max-w-md mx-auto space-y-3">
        <div className="p-4 bg-linear-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Rich WhatsApp Store Card</span>
            </div>
            <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full">High Trust</span>
          </div>
          <p className="text-[11px] text-emerald-100 leading-relaxed">
            Share a rich store card message including your store logo preview, tagline, description, and "VISIT STORE NOW" CTA to build instant customer trust on WhatsApp!
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-slate-950" />
              <span>Share Rich Card on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyRichCard}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedRich ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRich ? 'Copied Rich Text' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Save QR</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
