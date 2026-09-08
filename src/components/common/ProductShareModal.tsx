import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Send,
  Share,
  CheckCheck,
} from 'lucide-react';
import { BusinessProfile, CatalogItem } from '../../types';
import { getProductDeepUrl, getStorefrontUrl } from '../../services/firebaseService';
import { SafeImage } from './SafeImage';

interface ProductShareModalProps {
  business: BusinessProfile;
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductShareModal: React.FC<ProductShareModalProps> = ({
  business,
  item,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const qrSvgRef = useRef<SVGSVGElement>(null);

  if (!isOpen || !item) return null;

  const productUrl = getProductDeepUrl(business, item.id);
  const storeUrl = getStorefrontUrl(business);
  const currency = business.currencySymbol || '₹';
  const priceDisplay = item.isFree || item.price === 0 ? 'FREE' : `${currency}${item.salePrice || item.price}`;

  const isDigital = item.productType === 'digital_file';
  const isConsultation = item.productType === 'consultation_slot';

  const sharePitchText =
    `✨ *${item.name.toUpperCase()}*\n` +
    `🏪 *${business.name}*\n\n` +
    `💰 Price: *${priceDisplay}*${item.salePrice && item.salePrice < item.price ? ` ~(was ${currency}${item.price})~` : ''}\n` +
    `${item.shortDescription ? `📝 ${item.shortDescription}\n\n` : '\n'}` +
    `🛒 *BUY & ORDER INSTANTLY HERE:*\n` +
    `👉 ${productUrl}\n\n` +
    `📍 Store Catalog: ${storeUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(sharePitchText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(sharePitchText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const tweet = encodeURIComponent(`Check out ${item.name} (${priceDisplay}) at ${business.name}: ${productUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
  };

  const handleDownloadQR = () => {
    const svg = qrSvgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${item.slug || 'product'}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Share Product & Direct Buy Link</h3>
              <p className="text-[11px] text-slate-400">Customers can tap to open this item and purchase immediately</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Product Snapshot Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {item.images?.[0] ? (
                <SafeImage
                  src={item.images[0]}
                  alt={item.name}
                  fallbackType="product"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-7 h-7 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                  {isDigital ? 'Digital File' : isConsultation ? '1:1 Session' : 'Physical Product'}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</h4>
              <div className="text-xs font-black text-indigo-700">
                {priceDisplay}
                {item.unit && <span className="text-[10px] text-slate-400 font-normal"> / {item.unit}</span>}
              </div>
            </div>
          </div>

          {/* Direct Buy Link Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Direct Product Purchasing Link
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-2 gap-2">
              <input
                type="text"
                readOnly
                value={productUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent font-mono text-xs text-slate-800 font-semibold focus:outline-none select-all px-1"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Scannable Product QR Code & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <QRCodeSVG
                  ref={qrSvgRef}
                  value={productUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1.5">Scan to Buy Item</span>
            </div>

            <div className="sm:col-span-7 space-y-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(productUrl, '_blank')}
                  className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Test Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Formatted WhatsApp Promo Pitch Box */}
          <div className="p-3.5 bg-linear-to-r from-emerald-950 to-slate-900 text-white rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> WhatsApp Promo Text
              </span>
              <button
                type="button"
                onClick={handleCopyPitch}
                className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedPitch ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPitch ? 'Copied' : 'Copy Pitch'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-black/40 rounded-xl text-[11px] font-mono text-emerald-100 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed select-all">
              {sharePitchText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
